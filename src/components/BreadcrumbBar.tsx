interface BreadcrumbBarProps {
  bucket: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
  onCreateFolder: () => void;
  onUpload: () => void;
}

export default function BreadcrumbBar({
  bucket,
  prefix,
  onNavigate,
  onCreateFolder,
  onUpload,
}: BreadcrumbBarProps) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <div className="h-10 flex items-center px-4 border-b border-slate-800 text-sm shrink-0">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <button
          onClick={() => onNavigate("")}
          className="text-sky-400 hover:text-sky-300 shrink-0"
        >
          {bucket}
        </button>
        {parts.map((part, i) => {
          const partPrefix = parts.slice(0, i + 1).join("/") + "/";
          const isLast = i === parts.length - 1;
          return (
            <span key={partPrefix} className="flex items-center gap-1">
              <span className="text-slate-600">/</span>
              {isLast ? (
                <span className="text-slate-200">{part}</span>
              ) : (
                <button
                  onClick={() => onNavigate(partPrefix)}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {part}
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="flex gap-2 ml-4 shrink-0">
        <button
          onClick={onCreateFolder}
          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
        >
          + Folder
        </button>
        <button
          onClick={onUpload}
          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
