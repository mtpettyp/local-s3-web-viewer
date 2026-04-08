import { useState, useCallback } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import { useS3Buckets } from "./hooks/useS3Buckets";
import { ViewState, ToastMessage } from "./types";

export default function App() {
  const { buckets, loading, error, refresh, createBucket, deleteBucket } =
    useS3Buckets();

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [viewState, setViewState] = useState<ViewState>({ type: "list" });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: "error" | "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const handleSelectBucket = useCallback((name: string) => {
    setSelectedBucket(name);
    setPrefix("");
    setViewState({ type: "list" });
  }, []);

  const handleCreateBucket = useCallback(async () => {
    const name = prompt("Bucket name:");
    if (!name) return;
    try {
      await createBucket(name);
      addToast(`Bucket "${name}" created`, "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to create bucket",
        "error"
      );
    }
  }, [createBucket, addToast]);

  const handleDeleteBucket = useCallback(
    async (name: string) => {
      if (!confirm(`Delete bucket "${name}" and all its contents?`)) return;
      try {
        await deleteBucket(name);
        if (selectedBucket === name) {
          setSelectedBucket(null);
          setPrefix("");
        }
        addToast(`Bucket "${name}" deleted`, "success");
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Failed to delete bucket",
          "error"
        );
      }
    },
    [deleteBucket, selectedBucket, addToast]
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
      <TopBar connected={!loading && !error} error={error} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelectBucket={handleSelectBucket}
          onDeleteBucket={handleDeleteBucket}
          onCreateBucket={handleCreateBucket}
        />
        <div className="flex-1 flex items-center justify-center text-slate-500">
          {selectedBucket
            ? "File list coming in next task..."
            : "Select a bucket to browse"}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded shadow-lg text-sm ${
              toast.type === "error"
                ? "bg-red-900/90 text-red-200"
                : "bg-green-900/90 text-green-200"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
