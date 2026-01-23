import { motion } from "motion/react";
import { Upload, File, X, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../config/api";
import { GlassModal } from "./GlassModal";

interface UploadFilesProps {
  onBack: () => void;
  onGoDashboard: () => void;
}

export function UploadFiles({ onBack, onGoDashboard }: UploadFilesProps) {
  const [isDragging, setIsDragging] = useState(false);
  interface PreviewItem { id: string; file: File; name: string; size: number; type: string; previewUrl: string }
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [ownerCode, setOwnerCode] = useState<string>("");
  const [accessCode, setAccessCode] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Allow standard file selection - drag & drop will preserve folder structure via webkitRelativePath
    // Regular file picker allows users to select individual files or multiple files
    if (inputRef.current) {
      // Don't set directory attributes - they break regular file selection
    }
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
      folderInputRef.current.setAttribute("mozdirectory", "");
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSelectedFiles = (newFiles: File[]) => {
    if (!newFiles?.length) return;
    // Revoke previous previews before replacing
    setItems((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev;
    });
    const mapped: PreviewItem[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));
    setItems(mapped);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleSelectedFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files);
    handleSelectedFiles(list);
  };

  const removeFile = (index: number) => {
    setItems((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    return () => {
      // Revoke all object URLs on unmount
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, []);

  const handleUpload = async () => {
    if (!items.length) return;
    try {
      setIsUploading(true);
      setErrorMsg("");
      const formData = new FormData();
      for (const it of items) {
        const f: any = it.file as any;
        const filename = (f.webkitRelativePath as string) || it.file.name;
        formData.append("files", it.file, filename);
      }
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Upload failed");
      }
      setUploadComplete(true);
      const { data } = json;
      setOwnerCode(data?.owner_code || "");
      setAccessCode(data?.access_code || "");
      setSummaryOpen(true);
      // Revoke previews then clear
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
      setItems([]);
      setTimeout(() => setUploadComplete(false), 2000);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-5 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-lg text-gray-800 dark:text-white rounded-full font-semibold border border-white/20 shadow-lg"
          >
            ← Back
          </motion.button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Upload Files</h2>
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          className={`relative p-12 border-4 border-dashed rounded-3xl transition-all duration-300 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
              : "border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-white/5"
          } backdrop-blur-lg`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-upload"
          />
          
          <div className="text-center pointer-events-none">
            <motion.div
              animate={{
                y: isDragging ? -10 : [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mb-6 flex justify-center"
            >
              <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
                <Upload className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">or</p>
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              Browse Files
            </label>
          </div>
        </motion.div>

        <input
          ref={folderInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="folder-upload"
        />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            Browse Folder
          </button>
        </div>
        {/* Files List */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Selected Files ({items.length})
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(item.size / 1024).toFixed(2)} KB
                      </p>
                      <div className="mt-2">
                        {item.type?.startsWith("image/") && (
                          <img src={item.previewUrl} alt={item.name} className="max-h-28 rounded" />
                        )}
                        {item.type?.startsWith("video/") && (
                          <video src={item.previewUrl} className="max-h-28 rounded" controls muted />
                        )}
                        {(item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf")) && (
                          <iframe src={item.previewUrl} title="PDF Preview" className="w-full h-40 rounded" />
                        )}
                        {!item.type?.startsWith("image/") &&
                          !item.type?.startsWith("video/") &&
                          !(item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf")) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Preview not available</div>
                          )}
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={isUploading || uploadComplete}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadComplete ? (
                <>
                  <Check className="w-5 h-5" />
                  Upload Complete!
                </>
              ) : isUploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Files
                </>
              )}
            </motion.button>
            {errorMsg && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Post Upload Summary Modal */}
      <GlassModal open={summaryOpen} onClose={() => setSummaryOpen(false)} ariaLabel="Upload Ready">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Ready</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Your files are ready to share.</p>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner Code</div>
                <div className="font-mono text-lg text-gray-900 dark:text-white">{ownerCode || "—"}</div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(ownerCode)}
                className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg.white/5 border border-white/20 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Access Code</div>
                <div className="font-mono text-lg text-gray-900 dark:text-white">{accessCode || "—"}</div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(accessCode)}
                className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Share the Access Code with recipients. Keep the Owner Code private to manage or delete the upload.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setSummaryOpen(false)}
              className="px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 text-gray-800 dark:text-white border border-white/20"
            >
              Close
            </button>
            <button
              onClick={() => {
                setSummaryOpen(false);
                onGoDashboard();
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
