import { useState, useRef, useEffect } from "react";

interface InputDialogProps {
  title: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export default function InputDialog({
  title,
  label,
  defaultValue = "",
  placeholder,
  onSubmit,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-96">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>

        <div className="px-4 py-4">
          <label className="block text-sm text-slate-400 mb-2">{label}</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onCancel();
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-700 text-white rounded text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
