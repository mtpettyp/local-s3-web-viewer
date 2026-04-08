import { useState } from "react";
import type { S3Bucket } from "../types";

interface SidebarProps {
  buckets: S3Bucket[];
  selectedBucket: string | null;
  onSelectBucket: (name: string) => void;
  onDeleteBucket: (name: string) => void;
  onCreateBucket: () => void;
}

export default function Sidebar({
  buckets,
  selectedBucket,
  onSelectBucket,
  onDeleteBucket,
  onCreateBucket,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    bucket: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div
      className="w-60 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto"
      onClick={() => setContextMenu(null)}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Buckets
        </span>
        <button
          onClick={onCreateBucket}
          className="text-xs text-sky-400 hover:text-sky-300"
          title="Create bucket"
        >
          + New
        </button>
      </div>
      <div className="flex-1 py-1">
        {buckets.map((bucket) => (
          <div
            key={bucket.name}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm hover:bg-slate-800 ${
              selectedBucket === bucket.name
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400"
            }`}
            onClick={() => onSelectBucket(bucket.name)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ bucket: bucket.name, x: e.clientX, y: e.clientY });
            }}
          >
            <span className="text-amber-400 text-base">📦</span>
            <span className="truncate">{bucket.name}</span>
          </div>
        ))}
        {buckets.length === 0 && (
          <div className="px-3 py-4 text-xs text-slate-600 text-center">
            No buckets found
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-slate-800 border border-slate-700 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-1.5 text-left text-sm text-red-400 hover:bg-slate-700"
            onClick={() => {
              onDeleteBucket(contextMenu.bucket);
              setContextMenu(null);
            }}
          >
            Delete bucket
          </button>
        </div>
      )}
    </div>
  );
}
