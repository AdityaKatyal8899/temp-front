import React, { useEffect } from "react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function GlassModal({ open, onClose, children, ariaLabel }: GlassModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      aria-modal
      role="dialog"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xl opacity-100 transition-opacity"
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="relative max-w-lg w-[92%] sm:w-[520px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 bg-white/20 dark:bg-white/10
                   bg-gradient-to-br from-white/20 to-white/10 dark:from-white/10 dark:to-white/5
                   animate-[modalIn_150ms_ease-out]"
        style={{
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes modalIn {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
