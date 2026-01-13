import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ManagePage() {
  const [ownerCode, setOwnerCode] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = ownerCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase().trim();
    if (!code) return;
    navigate(`/owner/${encodeURIComponent(code)}`);
  };

  return (
    <main className="min-h-screen section-padding">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-section-title mb-6">Manage Your Upload</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your owner code to open the dashboard and manage your upload.
        </p>

        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={ownerCode}
            onChange={(e) => setOwnerCode(e.target.value.toUpperCase())}
            placeholder="Enter Owner Code"
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 font-mono"
          />
          <button
            type="submit"
            disabled={!ownerCode.trim()}
            className="btn-pill"
          >
            Open Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
