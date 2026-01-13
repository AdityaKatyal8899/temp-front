import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BackButton from "../components/BackButton";
import { Trash2, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = "https://tempshare-webserver.onrender.com";

function humanSize(bytes?: number) {
  if (bytes === undefined) return "";
  const MB = 1024 * 1024;
  const GB = 1024 * MB;
  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  return bytes + " B";
}

export default function OwnerDashboard() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const cleaned = (code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const res = await fetch(`${API_BASE}/owner/${encodeURIComponent(cleaned)}`);
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || json.success === false) {
          setError(json.error || "Not found");
          return;
        }
        if (active) setInfo(json.data || json);
      } catch (e) {
        setError("Failed to load owner data");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [code]);

  // Initialize previewIndex based on backend-provided preview_file_id
  useEffect(() => {
    if (!info?.files) return;
    const files = info.files as Array<any>;
    const pf = info.preview_file_id;
    if (!pf || !Array.isArray(files) || files.length === 0) {
      setPreviewIndex(0);
      return;
    }
    const idx = files.findIndex((f) => f?.file_id === pf);
    setPreviewIndex(idx >= 0 ? idx : 0);
  }, [info]);

  const toggleSelect = (fileId: string) => {
    setSelected((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const clearSelection = () => setSelected({});

  const onDownloadSelected = async () => {
    const ids = files.filter(f => selected[f.file_id]).map(f => f.file_id);
    if (ids.length === 0) return;
    if (ids.length === 1) {
      const url = `${API_BASE}/download/${info.access_code}/${ids[0]}`;
      window.location.href = url;
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/download/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: info.access_code, file_ids: ids }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.success === false || !json.archive_url) {
        toast("Failed to create archive", { duration: 2000 });
        return;
      }
      window.location.href = json.archive_url;
    } catch (e) {
      toast("Failed to download selection", { duration: 2000 });
    }
  };

  const copyLink = async () => {
    if (!info?.access_code) return;
    const url = `${API_BASE}/access/${info.access_code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("🔗 Share link copied to clipboard", { duration: 2000 });
    } catch {}
  };

  const doDelete = async () => {
    try {
      setDeleting(true);
      const cleaned = (code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const res = await fetch(`${API_BASE}/owner/${encodeURIComponent(cleaned)}/delete`, { method: "DELETE" });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.success === false) {
        toast.error(json.error || "Delete failed");
        setDeleting(false);
        return;
      }
      toast.success("🗑 File deleted successfully", { duration: 2000 });
      navigate("/manage");
    } catch (e) {
      toast.error("Unexpected error during delete");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <div className="section-padding"><div className="max-w-5xl mx-auto text-sm text-muted-foreground">Loading…</div></div>;
  if (error) return <div className="section-padding"><div className="max-w-5xl mx-auto text-sm text-red-500">{error}</div></div>;
  if (!info) return null;

  const isExpired = info.status === "expired";
  const downloadUrl = `${API_BASE}/download/${info.access_code}`;
  const files: Array<any> = Array.isArray(info.files) ? info.files : [];
  const fileCount = files.length;
  const current = fileCount > 0 ? files[((previewIndex % fileCount) + fileCount) % fileCount] : null;
  const previewUrl = current ? `${API_BASE}/preview/${info.access_code}/${current.file_id}` : "";

  return (
    <section className="section-padding">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl mono-display font-semibold animate-blur-up">Owner Dashboard</h1>
          <BackButton to="/manage" ariaLabel="Back" />
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Information + Files Panel */}
            <div className="space-y-6 order-2 lg:order-1">
              <div>
                <div className="text-xs tracking-wider text-muted-foreground mb-2 mono-display">FILE DETAILS</div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl mono-display font-semibold">{info.filename || "File"}</div>
                    <div className="text-sm text-muted-foreground">{humanSize(info.size)} {info.type ? `• ${info.type}` : ""}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{isExpired ? 'Expired' : 'Active'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mono-display">UPLOADED</div>
                  <div>{new Date((info.uploaded_at || 0) * 1000).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mono-display">EXPIRES</div>
                  <div>{new Date((info.expires_at || 0) * 1000).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mono-display">DOWNLOADS</div>
                  <div>{info.download_count ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mono-display">ACCESS CODE</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-base select-all">{info.access_code}</div>
                    <button
                      type="button"
                      title="Copy access code"
                      aria-label="Copy access code"
                      onClick={async () => { try { await navigator.clipboard.writeText(String(info.access_code||"")); toast.success("Access code copied", { duration: 1500 }); } catch(e) { toast("Copy failed"); } }}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary/60 border border-border hover:bg-secondary/80 transition-colors"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Files list with selection */}
              {fileCount > 0 && (
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
              )}
            </div>

            {/* Right: Preview Panel */}
            <div className="order-1 lg:order-2">
              <div className="relative rounded-xl overflow-hidden border border-border/60 bg-secondary/30">
                {current ? (
                  <div key={current.file_id} className="w-full h-64">
                    {(() => {
                      const mt = String(current.mime_type || "").toLowerCase();
                      const isImg = mt.startsWith("image/");
                      const isVideo = mt.startsWith("video/");
                      if (isImg) {
                        return (
                          <img
                            src={previewUrl}
                            alt="preview"
                            className="block w-full h-full object-cover transition-opacity duration-700 ease-out"
                          />
                        );
                      }
                      if (isVideo) {
                        return (
                          <video
                            src={previewUrl}
                            controls
                            className="block w-full h-full object-cover transition-opacity duration-700 ease-out"
                          />
                        );
                      }
                      const isPdf = mt.includes("pdf");
                      if (isPdf) {
                        return (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <div className="text-4xl">📄</div>
                              <div className="text-sm mt-2">Preview unavailable — download to view</div>
                            </div>
                          </div>
                        );
                      }
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
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
            <button onClick={copyLink} className="btn-pill w-full sm:w-auto px-6 py-3 text-base">Copy Share Link</button>
            <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn-pill-secondary w-full sm:w-auto px-6 py-3 text-base">Download File</a>
          </div>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <button title="Delete permanently" aria-label="Delete permanently" className="btn-danger-circle">
                <Trash2 className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                <AlertDialogDescription>
                  This file will be permanently deleted and can’t be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={doDelete} className="!bg-red-600" disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-muted-foreground">
          🔒 Keep your owner code safe. Anyone with this code can manage this upload.
        </div>

        {/* Advantage cards below dashboard */}
        {/* <FeatureCards />*/}
      </div>
    </section>
  );
}
