import { useState } from "react";
import { S3Object } from "../types";

interface FileListProps {
  objects: S3Object[];
  loading: boolean;
  onNavigateFolder: (prefix: string) => void;
  onViewFile: (obj: S3Object) => void;
  onDownload: (obj: S3Object) => void;
  onRename: (obj: S3Object) => void;
  onMove: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
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

export default function FileList({
  objects,
  loading,
  onNavigateFolder,
  onViewFile,
  onDownload,
  onRename,
  onMove,
  onDelete,
}: FileListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        This folder is empty
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" onClick={() => setOpenMenu(null)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <th className="text-left px-4 py-2 font-semibold">Name</th>
            <th className="text-right px-4 py-2 font-semibold w-24">Size</th>
            <th className="text-right px-4 py-2 font-semibold w-36">Modified</th>
            <th className="text-right px-4 py-2 font-semibold w-16"></th>
          </tr>
        </thead>
        <tbody>
          {objects.map((obj) => (
            <tr
              key={obj.key}
              className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer"
              onClick={() =>
                obj.isFolder
                  ? onNavigateFolder(obj.key)
                  : onViewFile(obj)
              }
            >
              <td className="px-4 py-2">
                <span className="mr-2">{obj.isFolder ? "📁" : "📄"}</span>
                {obj.name}
                {obj.isFolder && "/"}
              </td>
              <td className="text-right px-4 py-2 text-slate-500">
                {obj.isFolder ? "—" : formatSize(obj.size)}
              </td>
              <td className="text-right px-4 py-2 text-slate-500">
                {formatDate(obj.lastModified)}
              </td>
              <td className="text-right px-4 py-2 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === obj.key ? null : obj.key);
                  }}
                  className="text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-slate-700 rounded text-xs"
                >
                  ⋯
                </button>
                {openMenu === obj.key && (
                  <div className="absolute right-4 top-8 bg-slate-800 border border-slate-700 rounded shadow-lg py-1 z-10 min-w-[140px]">
                    {!obj.isFolder && (
                      <button
                        className="w-full px-4 py-1.5 text-left text-sm hover:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(obj);
                          setOpenMenu(null);
                        }}
                      >
                        Download
                      </button>
                    )}
                    <button
                      className="w-full px-4 py-1.5 text-left text-sm hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(obj);
                        setOpenMenu(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="w-full px-4 py-1.5 text-left text-sm hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(obj);
                        setOpenMenu(null);
                      }}
                    >
                      Move to...
                    </button>
                    <button
                      className="w-full px-4 py-1.5 text-left text-sm text-red-400 hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(obj);
                        setOpenMenu(null);
                      }}
                    >
                      Delete{obj.isFolder ? " (recursive)" : ""}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
