import { useState, useEffect, useCallback } from "react";
import {
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../s3Client";
import { S3Bucket } from "../types";

export function useS3Buckets() {
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await s3Client.send(new ListBucketsCommand({}));
      setBuckets(
        (response.Buckets ?? []).map((b) => ({
          name: b.Name!,
          creationDate: b.CreationDate,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list buckets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createBucket = useCallback(
    async (name: string) => {
      await s3Client.send(new CreateBucketCommand({ Bucket: name }));
      await refresh();
    },
    [refresh]
  );

  const deleteBucket = useCallback(
    async (name: string) => {
      let continuationToken: string | undefined;
      do {
        const list = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: name,
            ContinuationToken: continuationToken,
          })
        );
        if (list.Contents && list.Contents.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: name,
              Delete: {
                Objects: list.Contents.map((o) => ({ Key: o.Key })),
              },
            })
          );
        }
        continuationToken = list.NextContinuationToken;
      } while (continuationToken);

      await s3Client.send(new DeleteBucketCommand({ Bucket: name }));
      await refresh();
    },
    [refresh]
  );

  return { buckets, loading, error, refresh, createBucket, deleteBucket };
}
