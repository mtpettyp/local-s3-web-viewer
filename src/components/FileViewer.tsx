import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useS3Content } from "../hooks/useS3Content";

interface FileViewerProps {
  bucket: string;
  fileKey: string;
  fileName: string;
  size: number;
  lastModified?: Date;
  onBack: () => void;
  onDownload: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(date?: Date): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FileViewer({
  bucket,
  fileKey,
  fileName,
  size,
  lastModified,
  onBack,
  onDownload,
}: FileViewerProps) {
  const { content, blobUrl, loading, error, language, isText, isImage, isPdf } = useS3Content(
    bucket,
    fileKey,
    fileName
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center px-4 border-b border-slate-800 text-sm shrink-0">
        <button
          onClick={onBack}
          className="text-sky-400 hover:text-sky-300 mr-3"
        >
          ← Back
        </button>
        <span className="text-slate-500 mr-1">|</span>
        <span className="text-slate-400 truncate">{fileKey}</span>
        <div className="ml-auto shrink-0">
          <button
            onClick={onDownload}
            className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
          >
            Download
          </button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-slate-800 text-xs text-slate-500 shrink-0">
        <span>{formatSize(size)}</span>
        <span>Modified: {formatDate(lastModified)}</span>
        {isText && <span>Language: {language}</span>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400">
            {error}
          </div>
        ) : isImage && blobUrl ? (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={blobUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : isPdf && blobUrl ? (
          <iframe
            src={blobUrl}
            title={fileName}
            className="w-full h-full border-0"
          />
        ) : !isText && !isImage && !isPdf ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <span>Binary file — no preview available</span>
            <button
              onClick={onDownload}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm"
            >
              Download file
            </button>
          </div>
        ) : (
          <SyntaxHighlighter
            language={language}
            style={atomOneDark}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: "12px 0",
              background: "transparent",
              fontSize: "13px",
              minHeight: "100%",
            }}
            lineNumberStyle={{
              minWidth: "3em",
              paddingRight: "1em",
              color: "#475569",
              userSelect: "none",
            }}
          >
            {content ?? ""}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
