import { motion } from "motion/react";
import { Link, Key, ArrowRight } from "lucide-react";
import { useState } from "react";
import { API_BASE } from "../../config/api";

interface AccessFilesProps {
  onBack: () => void;
}

export function AccessFiles({ onBack }: AccessFilesProps) {
  const [accessMethod, setAccessMethod] = useState<"url" | "code" | null>(null);
  const [input, setInput] = useState("");
  const [isAccessing, setIsAccessing] = useState(false);
  const [accessCode, setAccessCode] = useState<string>("");
  const [files, setFiles] = useState<Array<{ file_id: string; filename: string; mime_type: string }>>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const extractCodeFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      // Expect .../access/<code>
      const idx = parts.findIndex((p) => p === "access");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].toUpperCase();
      // Fallback: last segment
      return parts[parts.length - 1]?.toUpperCase() || "";
    } catch {
      return "";
    }
  };

  const handleAccess = async () => {
    try {
      setIsAccessing(true);
      setErrorMsg("");
      const code = (accessMethod === "url" ? extractCodeFromUrl(input) : input).trim().toUpperCase();
      if (!code) throw new Error("Invalid access code");
      const res = await fetch(`${API_BASE}/access/${code}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to fetch session");
      const data = json.data;
      setAccessCode(data.access_code || code);
      setFiles((data.files || []).map((f: any) => ({ file_id: f.file_id, filename: f.filename, mime_type: f.mime_type })));
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to access files");
    } finally {
      setIsAccessing(false);
    }
  };

  const download = (fid: string) => {
    if (!accessCode) return;
    window.location.href = `${API_BASE}/download/${accessCode}/${fid}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 bg-white/60 dark:bg-white/10 backdrop-blur-lg text-gray-800 dark:text-white rounded-full font-semibold border border-white/20 shadow-lg"
          >
            ← Back
          </motion.button>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Access Files</h2>
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Access Method Selection */}
        {!accessMethod && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAccessMethod("url")}
              className="p-8 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="mb-6 flex justify-center">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full">
                  <Link className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Access via URL
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the shareable link to access your files
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAccessMethod("code")}
              className="p-8 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="mb-6 flex justify-center">
                <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full">
                  <Key className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Access via Code
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the access code provided by the sender
              </p>
            </motion.button>
          </motion.div>
        )}

        {/* Input Form */}
        {accessMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAccessMethod(null)}
              className="mb-6 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              ← Change method
            </motion.button>

            <div className="mb-8 flex justify-center">
              <div className={`p-6 bg-gradient-to-br ${
                accessMethod === "url"
                  ? "from-blue-500 to-cyan-600"
                  : "from-purple-500 to-pink-600"
              } rounded-full`}>
                {accessMethod === "url" ? (
                  <Link className="w-12 h-12 text-white" />
                ) : (
                  <Key className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              {accessMethod === "url" ? "Enter File URL" : "Enter Access Code"}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  accessMethod === "url"
                    ? "https://tempshare.com/..."
                    : "Enter 6-digit code"
                }
                className="w-full px-6 py-4 bg-white/50 dark:bg-white/10 border border-white/20 rounded-2xl text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccess}
                disabled={!input || isAccessing}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAccessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Accessing...
                  </>
                ) : (
                  <>
                    Access Files
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              {errorMsg && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</div>
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 <strong>Tip:</strong> {accessMethod === "url" 
                  ? "Make sure you have the complete URL including the protocol (https://)"
                  : "The code is case-sensitive and usually contains 6 characters"}
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                {files.map((f) => (
                  <div key={f.file_id} className="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 dark:text-white">{f.filename}</div>
                        {f.mime_type?.startsWith("image/") && (
                          <img src={`${API_BASE}/preview/${accessCode}/${f.file_id}`} alt={f.filename} className="mt-2 max-h-48 rounded" />
                        )}
                        {f.mime_type?.startsWith("video/") && (
                          <video controls src={`${API_BASE}/preview/${accessCode}/${f.file_id}`} className="mt-2 max-h-60 rounded" />
                        )}
                        {(
                          f.mime_type === "application/pdf" || f.filename.toLowerCase().endsWith(".pdf")
                        ) && (
                          <iframe
                            src={`${API_BASE}/preview/${accessCode}/${f.file_id}`}
                            className="mt-2 w-full h-72 rounded"
                            title="PDF Preview"
                          />
                        )}
                        {!f.mime_type?.startsWith("image/") &&
                          !f.mime_type?.startsWith("video/") &&
                          !(f.mime_type === "application/pdf" || f.filename.toLowerCase().endsWith(".pdf")) && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Preview not available</div>
                          )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => download(f.file_id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                      >
                        Download
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
