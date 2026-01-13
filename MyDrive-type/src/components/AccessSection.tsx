import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, KeyRound, ChevronLeft, ChevronRight } from "lucide-react";

type AccessMode = "url" | "code";
interface AccessSectionProps {
  onBack?: () => void;
}

const AccessSection = ({ onBack }: AccessSectionProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AccessMode>("url");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Removed obsolete single-file meta state in favor of session model
  const [session, setSession] = useState<any | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  

  const humanSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    const MB = 1024 * 1024;
    const GB = 1024 * MB;
    if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
    if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
    return bytes + " B";
  };

  const handleAccess = async () => {
    setError("");
    // reset prior state
    setSession(null);
    setSelected({});
    setPreviewIndex(0);
    const raw = inputValue.trim();
    if (!raw) return;

    // Derive code from URL or use as-is
    let code = raw;
    if (mode === "url" && /^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        const parts = u.pathname.split("/").filter(Boolean);
        const idx = parts.indexOf("access");
        if (idx >= 0 && parts[idx + 1]) {
          code = decodeURIComponent(parts[idx + 1]);
        }
      } catch {}
    }

    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/access/${encodeURIComponent(code)}`);
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.success === false) {
        if (res.status === 404) setError("Not found");
        else if (res.status === 410) setError("Expired");
        else setError(json.error || "Unable to access session");
        return;
      }
      const data = json.data || json;
      setSession(data);
      // Initialize preview index based on preview_file_id
      const files = Array.isArray(data.files) ? data.files : [];
      if (files.length > 0) {
        const pf = data.preview_file_id;
        const idx = pf ? files.findIndex((f: any) => f?.file_id === pf) : 0;
        setPreviewIndex(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      setError("Network error during access");
    } finally {
      setLoading(false);
    }
  };

  const files = Array.isArray(session?.files) ? session.files : [];
  const fileCount = files.length;
  const current = fileCount > 0 ? files[((previewIndex % fileCount) + fileCount) % fileCount] : null;
  const previewUrl = current ? `http://127.0.0.1:5000/preview/${session.access_code}/${current.file_id}` : "";

  const toggleSelect = (fileId: string) => setSelected((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  const clearSelection = () => setSelected({});
  const onDownloadSelected = async () => {
    const ids = files.filter((f: any) => selected[f.file_id]).map((f: any) => f.file_id);
    if (!session?.access_code || ids.length === 0) return;
    if (ids.length === 1) {
      window.location.href = `http://127.0.0.1:5000/download/${session.access_code}/${ids[0]}`;
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:5000/download/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: session.access_code, file_ids: ids }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.success === false || !json.archive_url) return;
      window.location.href = json.archive_url;
    } catch {}
  };

  return (
    <section className="section-padding py-20">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => (onBack ? onBack() : navigate("/operate"))}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h2 className="text-section-title mb-8 animate-fade-up">
          Access Files
        </h2>

        <div className="animate-fade-up-delay-1">
          {/* Toggle */}
          <div className="flex bg-secondary rounded-full p-1 mb-8">
            <button
              onClick={() => setMode("url")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full transition-all duration-300 ${
                mode === "url" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link2 className="w-4 h-4" />
              Access via URL
            </button>
            <button
              onClick={() => setMode("code")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full transition-all duration-300 ${
                mode === "code" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Access via Code
            </button>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={mode === "url" ? "Paste the share URL here..." : "Enter your access code..."}
              className="w-full bg-secondary border border-border rounded-xl px-6 py-4 text-lg
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 
                         focus:ring-primary focus:border-transparent transition-all duration-300"
            />

            <div className="flex justify-end">
              <button
                onClick={handleAccess}
                disabled={!inputValue.trim()}
                className="btn-pill"
              >
                Access File
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-4 text-sm text-muted-foreground">Loading metadata…</div>
          )}
          {error && (
            <div className="mt-4 text-sm text-red-500">{error}</div>
          )}
          {session && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Files and selection */}
              <div>
                <div className="text-xs tracking-wider text-muted-foreground mb-2 mono-display">FILES</div>
                <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                  {files.map((f: any, idx: number) => (
                    <div key={f.file_id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={!!selected[f.file_id]}
                          onChange={() => toggleSelect(f.file_id)}
                          aria-label={`Select ${f.filename}`}
                        />
                        <button
                          className="text-left min-w-0"
                          onClick={() => setPreviewIndex(idx)}
                          title={f.filename}
                        >
                          <div className="truncate max-w-[240px] font-medium">{f.filename}</div>
                          <div className="text-xs text-muted-foreground">{humanSize(f.size)} {f.mime_type ? `• ${f.mime_type}` : ""}</div>
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{idx+1}/{fileCount}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={onDownloadSelected}
                    disabled={files.every((f: any) => !selected[f.file_id])}
                    className="btn-pill px-6 py-3 text-base"
                  >
                    Download Selected
                  </button>
                  <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>

              {/* Right: Preview */}
              <div>
                <div className="relative rounded-xl overflow-hidden border border-border/60 bg-secondary/30">
                  {current ? (
                    <div key={current.file_id} className="w-full h-64">
                      {(() => {
                        const mt = String(current.mime_type || "").toLowerCase();
                        const isImg = mt.startsWith("image/");
                        const isVideo = mt.startsWith("video/");
                        if (isImg) return <img src={previewUrl} alt="preview" className="block w-full h-full object-cover transition-opacity duration-700 ease-out" />;
                        if (isVideo) return <video src={previewUrl} controls className="block w-full h-full object-cover transition-opacity duration-700 ease-out" />;
                        const isPdf = mt.includes("pdf");
                        if (isPdf) return (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <div className="text-4xl">📄</div>
                              <div className="text-sm mt-2">Preview unavailable — download to view</div>
                            </div>
                          </div>
                        );
                        return (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <div className="text-4xl">📦</div>
                              <div className="text-sm mt-2">No preview available</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-4xl">📦</div>
                        <div className="text-sm mt-2">No preview available</div>
                      </div>
                    </div>
                  )}

                  {fileCount > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous preview"
                        title="Previous"
                        onClick={() => setPreviewIndex((i) => (i - 1 + fileCount) % fileCount)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur border border-white/20 text-white grid place-items-center hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next preview"
                        title="Next"
                        onClick={() => setPreviewIndex((i) => (i + 1) % fileCount)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur border border-white/20 text-white grid place-items-center hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </section>
  );
};

export default AccessSection;
