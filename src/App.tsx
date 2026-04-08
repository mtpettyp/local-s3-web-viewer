import { useState, useCallback } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import BreadcrumbBar from "./components/BreadcrumbBar";
import FileList from "./components/FileList";
import FileViewer from "./components/FileViewer";
import MoveDialog from "./components/MoveDialog";
import { useS3Buckets } from "./hooks/useS3Buckets";
import { useS3Objects } from "./hooks/useS3Objects";
import { ViewState, ToastMessage, S3Object } from "./types";

export default function App() {
  const { buckets, loading, error, createBucket, deleteBucket } =
    useS3Buckets();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [viewState, setViewState] = useState<ViewState>({ type: "list" });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [moveTarget, setMoveTarget] = useState<S3Object | null>(null);

  const {
    objects,
    loading: objectsLoading,
    uploadFile,
    createFolder,
    deleteObject,
    deleteFolder,
    renameObject,
    renameFolder,
    downloadObject,
    moveObject,
    moveFolder,
  } = useS3Objects(selectedBucket, prefix);

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

  const handleNavigate = useCallback((newPrefix: string) => {
    setPrefix(newPrefix);
    setViewState({ type: "list" });
  }, []);

  const handleCreateBucket = useCallback(async () => {
    const name = prompt("Bucket name:");
    if (!name) return;
    try {
      await createBucket(name);
      addToast(`Bucket "${name}" created`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create bucket", "error");
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
        addToast(err instanceof Error ? err.message : "Failed to delete bucket", "error");
      }
    },
    [deleteBucket, selectedBucket, addToast]
  );

  const handleCreateFolder = useCallback(async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    try {
      await createFolder(name);
      addToast(`Folder "${name}" created`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create folder", "error");
    }
  }, [createFolder, addToast]);

  const handleUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        try {
          await uploadFile(file, prefix);
          addToast(`Uploaded "${file.name}"`, "success");
        } catch (err) {
          addToast(err instanceof Error ? err.message : `Failed to upload "${file.name}"`, "error");
        }
      }
    };
    input.click();
  }, [uploadFile, prefix, addToast]);

  const handleViewFile = useCallback(
    (obj: S3Object) => {
      setViewState({
        type: "file",
        bucket: selectedBucket!,
        key: obj.key,
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
      });
    },
    [selectedBucket]
  );

  const handleDownload = useCallback(
    async (obj: S3Object) => {
      try {
        await downloadObject(obj.key, obj.name);
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to download", "error");
      }
    },
    [downloadObject, addToast]
  );

  const handleRename = useCallback(
    async (obj: S3Object) => {
      const newName = prompt("New name:", obj.name);
      if (!newName || newName === obj.name) return;
      try {
        if (obj.isFolder) {
          const oldPrefix = obj.key;
          const parentPrefix = oldPrefix.slice(0, oldPrefix.lastIndexOf("/", oldPrefix.length - 2) + 1);
          const newPrefix = parentPrefix + newName + "/";
          await renameFolder(oldPrefix, newPrefix);
        } else {
          const parentPrefix = obj.key.slice(0, obj.key.lastIndexOf("/") + 1);
          await renameObject(obj.key, parentPrefix + newName);
        }
        addToast(`Renamed to "${newName}"`, "success");
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to rename", "error");
      }
    },
    [renameObject, renameFolder, addToast]
  );

  const handleDelete = useCallback(
    async (obj: S3Object) => {
      const msg = obj.isFolder
        ? `Delete folder "${obj.name}" and all its contents?`
        : `Delete "${obj.name}"?`;
      if (!confirm(msg)) return;
      try {
        if (obj.isFolder) {
          await deleteFolder(obj.key);
        } else {
          await deleteObject(obj.key);
        }
        addToast(`Deleted "${obj.name}"`, "success");
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to delete", "error");
      }
    },
    [deleteObject, deleteFolder, addToast]
  );

  const handleMove = useCallback((obj: S3Object) => {
    setMoveTarget(obj);
  }, []);

  const handleMoveConfirm = useCallback(
    async (newPrefix: string) => {
      if (!moveTarget) return;
      try {
        if (moveTarget.isFolder) {
          const newFolderPrefix = newPrefix + moveTarget.name + "/";
          await moveFolder(moveTarget.key, newFolderPrefix);
        } else {
          const newKey = newPrefix + moveTarget.name;
          await moveObject(moveTarget.key, newKey);
        }
        addToast(`Moved "${moveTarget.name}"`, "success");
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to move", "error");
      }
      setMoveTarget(null);
    },
    [moveTarget, moveObject, moveFolder, addToast]
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedBucket ? (
            <>
              <BreadcrumbBar
                bucket={selectedBucket}
                prefix={prefix}
                onNavigate={handleNavigate}
                onCreateFolder={handleCreateFolder}
                onUpload={handleUpload}
              />
              {viewState.type === "list" ? (
                <FileList
                  objects={objects}
                  loading={objectsLoading}
                  onNavigateFolder={handleNavigate}
                  onViewFile={handleViewFile}
                  onDownload={handleDownload}
                  onRename={handleRename}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ) : (
                <FileViewer
                  bucket={viewState.bucket}
                  fileKey={viewState.key}
                  fileName={viewState.name}
                  size={viewState.size}
                  lastModified={viewState.lastModified}
                  onBack={() => setViewState({ type: "list" })}
                  onDownload={() =>
                    downloadObject(viewState.key, viewState.name).catch((err) =>
                      addToast(
                        err instanceof Error ? err.message : "Failed to download",
                        "error"
                      )
                    )
                  }
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a bucket to browse
            </div>
          )}
        </div>
      </div>

      {moveTarget && selectedBucket && (
        <MoveDialog
          bucket={selectedBucket}
          currentKey={moveTarget.key}
          isFolder={moveTarget.isFolder}
          onMove={handleMoveConfirm}
          onCancel={() => setMoveTarget(null)}
        />
      )}

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
