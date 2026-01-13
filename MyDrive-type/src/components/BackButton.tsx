import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function BackButton({ to, onClick, ariaLabel = "Back", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const handle = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
    navigate(-1);
  };
  return (
    <button
      onClick={handle}
      aria-label={ariaLabel}
      className={`group relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary/60 border border-border backdrop-blur transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-secondary/80 ${className}`}
    >
      <ArrowRight className="absolute h-5 w-5 text-white/80 opacity-100 transition-opacity duration-200 group-hover:opacity-0" />
      <ArrowUpRight className="h-5 w-5 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}
