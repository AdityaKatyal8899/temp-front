import { useEffect, useState } from "react";

type ServerState = "online" | "waking" | "offline";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string | undefined;

export default function ServerStatusIndicator() {
  const [status, setStatus] = useState<ServerState>("waking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      const start = performance.now();

      try {
        // Normalize backend base URL
        let base = (BACKEND_URL || "http://127.0.0.1:5000").trim();
        // Ensure absolute http(s) URL; if not, default to localhost
        if (!/^https?:\/\//i.test(base)) {
          base = "http://127.0.0.1:5000";
        }
        // Build absolute health URL without duplicate slashes
        const healthUrl = `${base.replace(/\/+$/, "")}/health`;

        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(healthUrl, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });
        clearTimeout(t);

        const end = performance.now();
        const ms = Math.round(end - start);

        if (cancelled) return;

        setLatency(ms);

        const ctype = res.headers.get("content-type") || "";
        let healthy = false;

        if (res.ok && /application\/json/i.test(ctype)) {
          try {
            const data = await res.json();
            // Accept a few common shapes from health.py
            // { status: "ok" } or { ok: true } or { healthy: true }
            healthy = (
              data?.status?.toString().toLowerCase() === "ok" ||
              data?.ok === true ||
              data?.healthy === true
            );
          } catch {
            healthy = false;
          }
        }

        if (healthy) {
          setStatus(ms > 1500 ? "waking" : "online");
        } else if (res.ok) {
          // Got a 2xx but not a JSON health response (likely HTML from dev server) -> treat as offline
          setStatus("offline");
        } else {
          setStatus("offline");
        }

      } catch {
        if (!cancelled) {
          setStatus("offline");
          setLatency(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30_000); // every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statusConfig = {
    online: {
      label: "Server Online",
      color: "bg-green-500",
      pulse: true,
    },
    waking: {
      label: "Server Waking Up",
      color: "bg-yellow-500",
      pulse: true,
    },
    offline: {
      label: "Server Offline",
      color: "bg-red-500",
      pulse: false,
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="server-status flex items-center gap-2 text-sm text-white/80">
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${cfg.color}`}
      >
        {cfg.pulse && (
          <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75 bg-blue-400" />
        )}
      </span>

      <span>{cfg.label}</span>

      {latency !== null && status !== "offline" && (
        <span className="text-xs text-white/50">
          ({latency} ms)
        </span>
      )}
    </div>
  );
}
