interface TopBarProps {
  connected: boolean;
  error: string | null;
}

export default function TopBar({ connected, error }: TopBarProps) {
  return (
    <div className="h-12 flex items-center px-4 border-b border-slate-800 text-sm shrink-0">
      <span className="font-semibold text-sky-400">S3 Browser</span>
      <span className="ml-auto">
        {error ? (
          <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-xs">
            Error
          </span>
        ) : connected ? (
          <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-xs">
            Connected
          </span>
        ) : (
          <span className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded text-xs">
            Connecting...
          </span>
        )}
      </span>
    </div>
  );
}
