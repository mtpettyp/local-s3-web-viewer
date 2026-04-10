import { useState, useEffect } from "react";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../s3Client";

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "svg",
]);

const PDF_EXTENSIONS = new Set(["pdf"]);

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "xml", "yaml", "yml", "csv", "tsv",
  "html", "htm", "css", "js", "ts", "tsx", "jsx",
  "py", "rb", "go", "rs", "java", "kt", "scala",
  "c", "cpp", "h", "hpp", "cs", "swift",
  "sh", "bash", "zsh", "fish",
  "sql", "graphql", "gql",
  "toml", "ini", "cfg", "conf", "properties",
  "env", "gitignore", "dockerignore",
  "log", "diff", "patch",
  "svg",
  "tf", "hcl",
  "proto",
  "makefile", "dockerfile",
]);

export function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

export function isPdfFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return PDF_EXTENSIONS.has(ext);
}

export function isTextFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const baseName = fileName.toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(baseName);
}

function getLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", rb: "ruby", go: "go", rs: "rust",
    java: "java", kt: "kotlin", scala: "scala",
    c: "c", cpp: "cpp", h: "c", hpp: "cpp", cs: "csharp", swift: "swift",
    json: "json", xml: "xml", yaml: "yaml", yml: "yaml",
    html: "html", htm: "html", css: "css",
    sh: "bash", bash: "bash", zsh: "bash",
    sql: "sql", graphql: "graphql",
    toml: "toml", ini: "ini",
    md: "markdown", svg: "xml",
    tf: "hcl", hcl: "hcl",
    proto: "protobuf",
    dockerfile: "dockerfile",
    makefile: "makefile",
  };
  return map[ext] ?? map[fileName.toLowerCase()] ?? "text";
}

export function useS3Content(
  bucket: string | null,
  key: string | null,
  fileName: string
) {
  const [content, setContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const language = getLanguage(fileName);
  const isText = isTextFile(fileName);
  const isImage = isImageFile(fileName);
  const isPdf = isPdfFile(fileName);
  const isBlobPreview = isImage || isPdf;

  useEffect(() => {
    if (!bucket || !key || (!isText && !isBlobPreview)) {
      setContent(null);
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await s3Client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        if (isBlobPreview) {
          const blob = await new Response(
            response.Body as ReadableStream
          ).blob();
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setBlobUrl(objectUrl);
        } else {
          const text = await new Response(
            response.Body as ReadableStream
          ).text();
          if (!cancelled) setContent(text);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load file content"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bucket, key, isText, isBlobPreview]);

  return { content, blobUrl, loading, error, language, isText, isImage, isPdf };
}
