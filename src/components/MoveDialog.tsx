import { useState, useEffect, useCallback } from "react";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client } from "../s3Client";

interface MoveDialogProps {
  bucket: string;
  currentKey: string;
  isFolder: boolean;
  onMove: (newPrefix: string) => void;
  onCancel: () => void;
}

export default function MoveDialog({
  bucket,
  currentKey,
  isFolder: _isFolder,
  onMove,
  onCancel,
}: MoveDialogProps) {
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [browsePrefix, setBrowsePrefix] = useState("");
  const [loading, setLoading] = useState(false);

  const loadFolders = useCallback(
    async (prefix: string) => {
      setLoading(true);
      try {
        const response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix || undefined,
            Delimiter: "/",
          })
        );
        const folderList = (response.CommonPrefixes ?? [])
          .map((cp) => cp.Prefix!)
          .filter((p) => p !== currentKey);
        setFolders(folderList);
      } catch {
        setFolders([]);
      } finally {
        setLoading(false);
      }
    },
    [bucket, currentKey]
  );

  useEffect(() => {
    loadFolders(browsePrefix);
  }, [browsePrefix, loadFolders]);

  const browseParts = browsePrefix.split("/").filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-96 max-h-[60vh] flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold">Move to...</h3>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 border-b border-slate-800 text-xs flex items-center gap-1">
          <button
            onClick={() => {
              setBrowsePrefix("");
              setSelectedPrefix("");
            }}
            className="text-sky-400 hover:text-sky-300"
          >
            {bucket}
          </button>
          {browseParts.map((part, i) => {
            const partPrefix = browseParts.slice(0, i + 1).join("/") + "/";
            return (
              <span key={partPrefix} className="flex items-center gap-1">
                <span className="text-slate-600">/</span>
                <button
                  onClick={() => {
                    setBrowsePrefix(partPrefix);
                    setSelectedPrefix(partPrefix);
                  }}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {part}
                </button>
              </span>
            );
          })}
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-auto py-1">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Loading...</div>
          ) : folders.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No subfolders</div>
          ) : (
            folders.map((folder) => {
              const name = folder
                .slice(browsePrefix.length)
                .replace(/\/$/, "");
              return (
                <div
                  key={folder}
                  className={`flex items-center gap-2 px-4 py-1.5 cursor-pointer text-sm hover:bg-slate-800 ${
                    selectedPrefix === folder
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400"
                  }`}
                  onClick={() => setSelectedPrefix(folder)}
                  onDoubleClick={() => {
                    setBrowsePrefix(folder);
                    setSelectedPrefix(folder);
                  }}
                >
                  <span>📁</span>
                  {name}
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 truncate mr-2">
            Destination: {selectedPrefix || "(bucket root)"}
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onMove(selectedPrefix)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm"
            >
              Move here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
