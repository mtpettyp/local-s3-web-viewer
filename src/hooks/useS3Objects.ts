import { useState, useEffect, useCallback } from "react";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../s3Client";
import type { S3Object } from "../types";

export function useS3Objects(bucket: string | null, prefix: string) {
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!bucket) {
      setObjects([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix || undefined,
          Delimiter: "/",
        })
      );

      const folders: S3Object[] = (response.CommonPrefixes ?? []).map((cp) => {
        const fullPrefix = cp.Prefix!;
        const name = fullPrefix.slice(prefix.length).replace(/\/$/, "");
        return {
          key: fullPrefix,
          name,
          size: 0,
          isFolder: true,
        };
      });

      const files: S3Object[] = (response.Contents ?? [])
        .filter((obj) => obj.Key !== prefix)
        .map((obj) => ({
          key: obj.Key!,
          name: obj.Key!.slice(prefix.length),
          size: obj.Size ?? 0,
          lastModified: obj.LastModified,
          etag: obj.ETag,
          isFolder: false,
        }));

      setObjects([...folders, ...files]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list objects");
    } finally {
      setLoading(false);
    }
  }, [bucket, prefix]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadFile = useCallback(
    async (file: File, targetPrefix: string) => {
      const key = targetPrefix + file.name;
      const arrayBuffer = await file.arrayBuffer();
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket!,
          Key: key,
          Body: new Uint8Array(arrayBuffer),
          ContentType: file.type || "application/octet-stream",
        })
      );
      await refresh();
    },
    [bucket, refresh]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const key = prefix + name + "/";
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket!,
          Key: key,
          Body: new Uint8Array(0),
        })
      );
      await refresh();
    },
    [bucket, prefix, refresh]
  );

  const deleteObject = useCallback(
    async (key: string) => {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: bucket!, Key: key })
      );
      await refresh();
    },
    [bucket, refresh]
  );

  const deleteFolder = useCallback(
    async (folderPrefix: string) => {
      let continuationToken: string | undefined;
      do {
        const list = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket!,
            Prefix: folderPrefix,
            ContinuationToken: continuationToken,
          })
        );
        if (list.Contents && list.Contents.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucket!,
              Delete: {
                Objects: list.Contents.map((o) => ({ Key: o.Key })),
              },
            })
          );
        }
        continuationToken = list.NextContinuationToken;
      } while (continuationToken);
      await refresh();
    },
    [bucket, refresh]
  );

  const renameObject = useCallback(
    async (oldKey: string, newKey: string) => {
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket!,
          CopySource: `${bucket}/${oldKey}`,
          Key: newKey,
        })
      );
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: bucket!, Key: oldKey })
      );
      await refresh();
    },
    [bucket, refresh]
  );

  const renameFolder = useCallback(
    async (oldPrefix: string, newPrefix: string) => {
      let continuationToken: string | undefined;
      do {
        const list = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket!,
            Prefix: oldPrefix,
            ContinuationToken: continuationToken,
          })
        );
        for (const obj of list.Contents ?? []) {
          const newKey = newPrefix + obj.Key!.slice(oldPrefix.length);
          await s3Client.send(
            new CopyObjectCommand({
              Bucket: bucket!,
              CopySource: `${bucket}/${obj.Key}`,
              Key: newKey,
            })
          );
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucket!, Key: obj.Key! })
          );
        }
        continuationToken = list.NextContinuationToken;
      } while (continuationToken);
      await refresh();
    },
    [bucket, refresh]
  );

  const moveObject = useCallback(
    async (oldKey: string, newKey: string) => {
      await renameObject(oldKey, newKey);
    },
    [renameObject]
  );

  const moveFolder = useCallback(
    async (oldPrefix: string, newPrefix: string) => {
      await renameFolder(oldPrefix, newPrefix);
    },
    [renameFolder]
  );

  const downloadObject = useCallback(
    async (key: string, fileName: string) => {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket!, Key: key })
      );
      const blob = await new Response(
        response.Body as ReadableStream
      ).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    [bucket]
  );

  return {
    objects,
    loading,
    error,
    refresh,
    uploadFile,
    createFolder,
    deleteObject,
    deleteFolder,
    renameObject,
    renameFolder,
    moveObject,
    moveFolder,
    downloadObject,
  };
}
