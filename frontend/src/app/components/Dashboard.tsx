import { motion } from "motion/react";
import { File, Download, Trash2, Share2, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../config/api";
import { GlassModal } from "./GlassModal";

interface DashboardProps {
  onBack: () => void;
}

interface FileItem {
  file_id: string;
  filename: string;
  size: number;
  mime_type: string;
  download_count: number;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [accessCode, setAccessCode] = useState<string>("");
  const [ownerCode, setOwnerCode] = useState<string>("");
  const [downloadTotal, setDownloadTotal] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [expiresHuman, setExpiresHuman] = useState<string>("");
  const [ownerModalOpen, setOwnerModalOpen] = useState<boolean>(true);
  const [ownerInput, setOwnerInput] = useState<string>("");
  const [ownerLoading, setOwnerLoading] = useState<boolean>(false);
  const [ownerError, setOwnerError] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ownerModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [ownerModalOpen]);

  const fetchOwner = async (oc: string) => {
    setOwnerLoading(true);
    setOwnerError("");
    try {
      const res = await fetch(`${API_BASE}/owner/${oc}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load owner session");
      const data = json.data;
      setFiles(data.files || []);
      setAccessCode(data.access_code || "");
      setDownloadTotal(data.download_count || 0);
      if (typeof data.expires_at === "number") setExpiresAt(data.expires_at);
      if (typeof data.expires_human === "string") setExpiresHuman(data.expires_human);
      setOwnerCode(oc);
      setOwnerModalOpen(false);
    } catch (e: any) {
      setOwnerError(e?.message || "Failed to load owner session");
    } finally {
      setOwnerLoading(false);
    }
  };

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, Math.floor(expiresAt - nowSec));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setExpiresHuman(`${m} minute${m !== 1 ? 's' : ''} ${s} sec remaining`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const copyAccessCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doDelete = async () => {
    if (!ownerCode) return;
    try {
      let res = await fetch(`${API_BASE}/owner/${ownerCode}/delete`, { method: "DELETE" });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/owner/delete/${ownerCode}`, { method: "DELETE" });
      }
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Delete failed");
      setFiles([]);
      setDeleteOpen(false);
    } catch (e: any) {
      // Inline error could be displayed via a small banner if needed
      setDeleteOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-5 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-lg text-gray-800 dark:text-white rounded-full font-semibold border border-white/20 shadow-lg"
          >
            ← Back
          </motion.button>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">File Dashboard</h2>
          <div className="w-17" /> {/* Spacer */}
        </div>
        {expiresHuman && (
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">Expires in {expiresHuman}</div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-500 rounded-xl">
                <File className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Files</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{files.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-500 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{downloadTotal}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Links</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{files.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Files List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Your Files</h3>

          <div className="space-y-4">
            {files.map((file, index) => (
              <motion.div
                key={file.file_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <File className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {file.filename}
                      </h4>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{(file.size / 1024).toFixed(2)} KB</span>
                        <span>• {file.mime_type}</span>
                        <span>• {file.download_count} downloads</span>
                      </div>
                      {accessCode && file.mime_type?.startsWith("image/") && (
                        <img
                          src={`${API_BASE}/preview/${accessCode}/${file.file_id}`}
                          alt={file.filename}
                          className="mt-3 max-h-40 rounded-md"
                        />
                      )}
                      {accessCode && file.mime_type?.startsWith("video/") && (
                        <video
                          controls
                          src={`${API_BASE}/preview/${accessCode}/${file.file_id}`}
                          className="mt-3 max-h-48 rounded-md"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyAccessCode(accessCode)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      {copied ? "Copied" : accessCode || "COPY CODE"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteOpen(true)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
      {/* Owner Code Modal */}
      <GlassModal open={ownerModalOpen} onClose={() => setOwnerModalOpen(false)} ariaLabel="Manage Upload">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Upload</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Enter your owner code to continue</p>
          <input
            ref={inputRef}
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchOwner(ownerInput.trim());
            }}
            placeholder="OWNER-CODE"
            className="w-full px-4 py-3 rounded-xl font-mono tracking-widest bg-white/60 dark:bg-white/10 border border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {ownerError && <div className="text-sm text-red-600 dark:text-red-400">{ownerError}</div>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setOwnerModalOpen(false)}
              className="px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 text-gray-800 dark:text-white border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={() => fetchOwner(ownerInput.trim())}
              disabled={ownerLoading}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-60"
            >
              {ownerLoading ? "Loading..." : "Continue"}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassModal open={deleteOpen} onClose={() => setDeleteOpen(false)} ariaLabel="Delete Upload">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Upload?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDeleteOpen(false)}
              className="px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 text-gray-800 dark:text-white border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={doDelete}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
