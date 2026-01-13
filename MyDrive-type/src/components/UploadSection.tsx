import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Upload, X, FileText, Music, Film, Image, Check, AlertTriangle, Hourglass } from "lucide-react";

interface FilePreview {
  file: File;
  preview: string | null;
  type: "image" | "video" | "audio" | "other";
}

type FileStatus = "waiting" | "uploading" | "uploaded" | "failed";

interface UploadItem {
  id: string;
  file: File;
  type: FilePreview["type"];
  preview: string | null;
  size: number;
  status: FileStatus;
  error?: string;
  result?: {
    access_code: string;
    owner_code?: string;
    access_url: string;
    expires_in?: string;
    expires_at?: string;
  };
  relPath?: string; // for folder uploads
}

interface UploadSectionProps {
  onBack?: () => void;
}

const UploadSection = ({ onBack }: UploadSectionProps) => {
  const navigate = useNavigate();
  const [fileData, setFileData] = useState<FilePreview | null>(null); // retained for compatibility (single preview)
  const [folderFiles, setFolderFiles] = useState<File[]>([]); // retained but converted to items
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [accessInfo, setAccessInfo] = useState<{ access_code: string; access_url: string; expires_in?: string; expires_at?: string; owner_code?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [copyUrlBusy, setCopyUrlBusy] = useState(false);
  const [copyCodeBusy, setCopyCodeBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<null | {
    upload_id: string;
    access_code: string;
    owner_code?: string;
    access_url: string;
    expires_in?: string;
    files: { file_id: string; filename: string; size: number; mime_type: string }[];
  }>(null);

  const getFileType = (file: File): FilePreview["type"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
  };

  const handleCopyOwner = async () => {
    const text = (accessInfo?.owner_code || "").toString(); // copy raw code from backend
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("🔒 Owner code copied", { duration: 2000 });
      } catch {}
    }
  };

  // Format owner code for display only: take first 8 alnum chars in original order and insert a dash after 4
  const formatOwnerCode = (raw?: string): { formatted: string; ok: boolean } => {
    if (!raw) return { formatted: "", ok: false };
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length < 8) return { formatted: cleaned, ok: false };
    const eight = cleaned.slice(0, 8);
    return { formatted: `${eight.slice(0,4)}-${eight.slice(4,8)}`, ok: true };
  };

  const makeItem = (file: File, relPath?: string): UploadItem => {
    const type = getFileType(file);
    const preview = (type === "image" || type === "video") ? URL.createObjectURL(file) : null;
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2,8)}`,
      file,
      type,
      preview,
      size: file.size,
      status: "waiting",
      relPath,
    };
  };

  const handleFiles = useCallback((files: File[], relPaths?: (string | undefined)[]) => {
    const newItems = files.map((f, idx) => makeItem(f, relPaths?.[idx]));
    setItems(newItems);
    // For single-file UX, also set fileData to the first file for preview panel if only one selected
    if (newItems.length === 1) {
      const it = newItems[0];
      setFileData({ file: it.file, preview: it.preview, type: it.type });
    } else {
      setFileData(null);
    }
    setFolderFiles([]);
    setErrorMsg("");
    setAccessInfo(null as any);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const rels = files.map((f) => (f as any).webkitRelativePath || f.name);
    setFolderFiles(files);
    handleFiles(files, rels);
    console.log("[DEBUG] Selected folder files:", files.map(f => ({ name: f.name, rel: (f as any).webkitRelativePath, size: f.size })));
  };

  const handleUpload = async () => {
    setErrorMsg("");
    setAccessInfo(null);
    try {
      setUploading(true);
      setProgress(0);

      const list = items.length
        ? items
        : (fileData ? [makeItem(fileData.file)] : (folderFiles.length ? folderFiles.map((f) => makeItem(f)) : []));
      if (!list.length) {
        setErrorMsg("Please select a file or folder to upload");
        return;
      }

      // prepare statuses
      setItems((prev) => (list.length === prev.length ? prev.map((p) => ({ ...p, status: "waiting", error: undefined })) : list));

      // Single request for the whole session
      // Mark all items as uploading
      setItems((prev) => prev.map((p) => ({ ...p, status: "uploading", error: undefined })));

      const formData = new FormData();
      for (const it of list) {
        const name = it.relPath || it.file.name;
        formData.append("files", it.file, name);
      }

      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://127.0.0.1:5000/upload");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };
        const jsonPromise: Promise<any> = new Promise((resolve) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              let parsed: any = {};
              try { parsed = JSON.parse(xhr.responseText || "{}"); } catch {}
              resolve({ status: xhr.status, body: parsed });
            }
          };
        });
        xhr.send(formData);
        const { status, body } = await jsonPromise;

        if (status < 200 || status >= 300 || body.success === false) {
          const err = body.error || "Upload failed";
          setItems((prev) => prev.map((p) => ({ ...p, status: "failed", error: err })));
          toast(`⚠️ ${err}`, { duration: 4000 });
          return;
        }

        const data = body.data || body;
        let access_code = data.access_code as string | undefined;
        let access_url = data.access_url as string | undefined;
        const expires_in = data.expires_in as string | undefined;
        const owner_code = data.owner_code as string | undefined;
        const files = (data.files || []) as { file_id: string; filename: string; size: number; mime_type: string }[];

        if (!access_url && access_code) access_url = `/access/${access_code}`;
        if (access_url && access_url.startsWith("/")) access_url = `http://127.0.0.1:5000${access_url}`;

        if (!access_code || !access_url) {
          const err = "Upload succeeded but response was incomplete";
          setItems((prev) => prev.map((p) => ({ ...p, status: "failed", error: err })));
          toast(`⚠️ ${err}`, { duration: 4000 });
          return;
        }

        // Mark all items uploaded
        setItems((prev) => prev.map((p) => ({ ...p, status: "uploaded" })));
        setSessionInfo({
          upload_id: data.upload_id,
          access_code,
          owner_code,
          access_url,
          expires_in,
          files,
        });
        setBatchOpen(true);
        toast.success(`✅ ${files.length} file${files.length>1?"s":""} uploaded`);
      } catch (e) {
        const err = "Unexpected error during upload";
        setItems((prev) => prev.map((p) => ({ ...p, status: "failed", error: err })));
        toast(`⚠️ ${err}`, { duration: 4000 });
      }
    } catch (e) {
      console.error("[DEBUG] Upload error:", e);
      setErrorMsg("Unexpected error during upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCopyUrl = async () => {
    if (accessInfo?.access_url) {
      try {
        await navigator.clipboard.writeText(accessInfo.access_url);
        setSuccessMsg("Upload complete — ready to share");
        setTimeout(() => setSuccessMsg(""), 2500);
        setCopyUrlBusy(true);
        toast.success("🔗 Share link copied to clipboard", { duration: 2000 });
        setTimeout(() => setCopyUrlBusy(false), 500);
      } catch {}
    }
  };

  const handleCopyCode = async () => {
    if (accessInfo?.access_code) {
      try {
        await navigator.clipboard.writeText(accessInfo.access_code);
        setSuccessMsg("Upload complete — ready to share");
        setTimeout(() => setSuccessMsg(""), 2500);
        setCopyCodeBusy(true);
        toast.success("🔑 Access code copied to clipboard", { duration: 2000 });
        setTimeout(() => setCopyCodeBusy(false), 500);
      } catch {}
    }
  };

  const handleDelete = async () => {
    if (!accessInfo?.access_code) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`http://127.0.0.1:5000/delete/${accessInfo.access_code}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({} as any));
      console.log("[DEBUG] Delete response:", json);
      if (!res.ok || json.success === false) {
        setErrorMsg(json.error || "Delete failed");
        setIsDeleting(false);
        return;
      }
      // Clear UI state
      clearFile();
      setFolderFiles([]);
      setAccessInfo(null);
      toast.success("🗑 File deleted successfully", { duration: 2000 });
    } catch (e) {
      setErrorMsg("Unexpected error during delete");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  const clearFile = () => {
    if (fileData?.preview) URL.revokeObjectURL(fileData.preview);
    items.forEach(it => { if (it.preview) URL.revokeObjectURL(it.preview); });
    setItems([]);
    setFileData(null);
    setFolderFiles([]);
    setErrorMsg("");
    setAccessInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const FileIcon = ({ type }: { type?: FilePreview["type"] }) => {
    switch (type) {
      case "image": return <Image className="w-8 h-8 text-muted-foreground" />;
      case "video": return <Film className="w-8 h-8 text-muted-foreground" />;
      case "audio": return <Music className="w-8 h-8 text-muted-foreground" />;
      default: return <FileText className="w-8 h-8 text-muted-foreground" />;
    }
  };

  // Prevent closing/tab navigation during upload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploading]);

  const [batchOpen, setBatchOpen] = useState(false);

  const renderStatus = (s: FileStatus) => {
    if (s === "waiting") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Hourglass className="w-3 h-3"/>Waiting</span>;
    if (s === "uploading") return <span className="inline-flex items-center gap-1 text-xs text-blue-400"><Upload className="w-3 h-3"/>Uploading</span>;
    if (s === "uploaded") return <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Check className="w-3 h-3"/>Uploaded</span>;
    return <span className="inline-flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="w-3 h-3"/>Failed</span>;
  };

  return (
    <section className="section-padding">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => (onBack ? onBack() : navigate("/operate"))}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h2 className="text-section-title mb-8 animate-fade-up text-center md:text-left">
          Upload Files
        </h2>

        <div className="animate-fade-up-delay-1">
          {(items.length === 0) ? (
            <div
              className={`drop-zone w-full max-w-[94vw] md:max-w-2xl mx-auto px-6 py-8 md:p-12 ${isDragging ? "drop-zone-active" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-6 md:gap-10 text-center">
                <Upload className="w-14 h-14 md:w-20 md:h-20 text-muted-foreground" />
                <div>
                  <p className="text-base md:text-lg font-medium">
                    Drag & drop files or a folder here
                  </p>
                  <p className="text-muted-foreground mt-1">
                    or click to upload
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-pill w-full sm:w-auto px-6 py-3 text-base"
                >
                  Choose Files
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="btn-pill w-full sm:w-auto px-6 py-3 text-base"
                >
                  Choose Folder
                </button>
              </div>
            </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleInputChange}
              />
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                // @ts-ignore - vendor specific attribute supported by Chromium
                webkitdirectory="true"
                multiple
                onChange={handleFolderChange}
              />











              
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">{items.length} file{items.length>1?"s":""} selected</div>
                <button onClick={clearFile} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="divide-y divide-border/50">
                {items.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <FileIcon type={it.type} />
                      <div className="min-w-0">
                        <div className="truncate max-w-[280px] font-medium">{it.relPath || it.file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(it.size)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStatus(it.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center md:justify-end">
            <button
              onClick={handleUpload}
              disabled={(items.length === 0) || uploading}
              className="btn-pill w-full sm:w-auto px-6 py-3 text-base"
            >
              {uploading ? "Uploading..." : (items.length > 1 ? "Upload All" : "Upload File")}
            </button>
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="w-full h-2 bg-secondary rounded">
                <div
                  className="h-2 bg-primary rounded"
                  style={{ width: `${progress}%`, transition: 'width 0.2s ease' }}
                />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Uploading… {progress}%</div>
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 text-red-500 text-sm">{errorMsg}</div>
          )}
          {successMsg && !errorMsg && (
            <div className="mt-4 text-emerald-500 text-sm">✅ {successMsg}</div>
          )}

          {/* Single-file result modal (preserved) */}
          <AlertDialog open={!!accessInfo} onOpenChange={(o: boolean) => { if (!o) setAccessInfo(null); }}>
            <AlertDialogContent className="glass max-h-[80vh] overflow-y-auto no-scrollbar rounded-2xl">
              <button
                onClick={() => setAccessInfo(null)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
              <AlertDialogHeader>
                <AlertDialogTitle>Upload Ready</AlertDialogTitle>
                <AlertDialogDescription>Share or manage your upload below.</AlertDialogDescription>
              </AlertDialogHeader>

              {accessInfo && (
                <div className="space-y-5">
                  {/* Preview */}
                  {fileData?.preview && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      {fileData.type === 'image' ? (
                        <img src={fileData.preview} alt="preview" className="w-full max-h-80 object-contain bg-secondary" />
                      ) : fileData.type === 'video' ? (
                        <video src={fileData.preview} controls className="w-full max-h-80 bg-secondary" />
                      ) : (
                        <div className="p-6 text-sm text-muted-foreground">{fileData.file?.name}</div>
                      )}
                    </div>
                  )}

                  {/* Filename + size */}
                  <div>
                    <div className="text-base font-semibold">{fileData?.file?.name || "File"}</div>
                    <div className="text-xs text-muted-foreground">{fileData ? `${(fileData.file.size/1024/1024).toFixed(2)} MB` : ""}</div>
                  </div>

                  {/* OWNER CODE */}
                  {accessInfo.owner_code && (() => {
                    const fc = formatOwnerCode(accessInfo.owner_code);
                    return (
                      <div>
                        <div className="text-xs tracking-wider text-muted-foreground mb-1">OWNER CODE</div>
                        <div className="flex items-center justify-between gap-3 bg-secondary border border-border rounded-xl px-4 py-3">
                          <div className="text-lg font-mono">{fc.formatted}</div>
                          <button onClick={handleCopyOwner} className="btn-pill">Copy</button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ACCESS CODE */}
                  <div>
                    <div className="text-xs tracking-wider text-muted-foreground mb-1">ACCESS CODE</div>
                    <div className="flex items-center justify-between gap-3 bg-secondary border border-border rounded-xl px-4 py-3">
                      <div className="text-lg font-mono">{accessInfo.access_code}</div>
                      <button onClick={handleCopyCode} className="btn-pill">Copy</button>
                    </div>
                    {accessInfo.expires_in && (
                      <div className="mt-2 text-xs text-muted-foreground">⏳ Expires in {accessInfo.expires_in}</div>
                    )}
                    {accessInfo.expires_at && !accessInfo.expires_in && (
                      <div className="mt-2 text-xs text-muted-foreground">⏳ Expires at {accessInfo.expires_at}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleCopyUrl} className="btn-pill" disabled={copyUrlBusy}>{copyUrlBusy ? "Copied" : "Copy Share Link"}</button>
                    <button onClick={handleCopyCode} className="btn-pill" disabled={copyCodeBusy}>{copyCodeBusy ? "Copied" : "Copy Access Code"}</button>
                    <a
                      href={accessInfo.access_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-pill !bg-secondary !text-foreground"
                      onClick={() => toast("⬇️ Download started", { duration: 1500 })}
                    >
                      Download File
                    </a>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    🔒 Anyone with this link or access code can download the file until it expires.
                  </div>

                  {/* Delete (inside modal) */}
                  <div className="pt-2 flex justify-end">
                    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <button className="btn-pill !bg-transparent !text-red-500 !border !border-red-500">Delete (Permanent)</button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This file will be permanently deleted and can’t be recovered.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="!bg-red-600" disabled={isDeleting}>
                            {isDeleting ? "Deleting…" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </AlertDialogContent>
          </AlertDialog>

          {/* Session result modal (single access code with list of files) */}
          <AlertDialog open={batchOpen} onOpenChange={(o: boolean) => { if (!o) { setBatchOpen(false); setSessionInfo(null); } }}>
            <AlertDialogContent className="glass max-h-[80vh] overflow-y-auto no-scrollbar rounded-2xl">
              <button
                onClick={() => { setBatchOpen(false); setSessionInfo(null); }}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
              <AlertDialogHeader>
                <AlertDialogTitle>Upload Ready</AlertDialogTitle>
                <AlertDialogDescription>Share or manage your upload below.</AlertDialogDescription>
              </AlertDialogHeader>

              {sessionInfo && (
                <div className="space-y-5">
                  {/* Codes */}
                  {sessionInfo.owner_code && (
                    <div>
                      <div className="text-xs tracking-wider text-muted-foreground mb-1">OWNER CODE</div>
                      <div className="flex items-center justify-between gap-3 bg-secondary border border-border rounded-xl px-4 py-3">
                        <div className="text-sm font-mono">{sessionInfo.owner_code}</div>
                        <button onClick={async () => navigator.clipboard.writeText(sessionInfo.owner_code!)} className="btn-pill">Copy</button>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs tracking-wider text-muted-foreground mb-1">ACCESS CODE</div>
                    <div className="flex items-center justify-between gap-3 bg-secondary border border-border rounded-xl px-4 py-3">
                      <div className="text-sm font-mono">{sessionInfo.access_code}</div>
                      <button onClick={async () => navigator.clipboard.writeText(sessionInfo.access_code)} className="btn-pill">Copy</button>
                    </div>
                  </div>

                  {/* Files list */}
                  <div className="divide-y divide-border/50 rounded-xl border border-border">
                    {sessionInfo.files.map((f) => (
                      <div key={f.file_id} className="py-3 px-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[320px]">{f.filename}</div>
                          <div className="text-xs text-muted-foreground">{f.mime_type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`http://127.0.0.1:5000/download/${sessionInfo.access_code}/${f.file_id}`} target="_blank" rel="noreferrer" className="btn-pill !bg-secondary !text-foreground">Download</a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a href={sessionInfo.access_url} target="_blank" rel="noreferrer" className="btn-pill">Open Access Page</a>
                  </div>
                </div>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
};

export default UploadSection;
