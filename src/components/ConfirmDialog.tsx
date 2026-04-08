interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-96">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>

        <div className="px-4 py-4">
          <p className="text-sm text-slate-300">{message}</p>
        </div>

        <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-white rounded text-sm ${
              destructive
                ? "bg-red-700 hover:bg-red-600"
                : "bg-blue-700 hover:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
