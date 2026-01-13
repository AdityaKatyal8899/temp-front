import { useNavigate } from "react-router-dom";

export default function OperatePage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen section-padding">
      <div className="max-w-3xl mx-auto text-center">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-section-title mb-8">What do you want to do?</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button onClick={() => navigate('/operate/upload')} className="btn-pill w-full sm:w-auto">Upload</button>
          <button onClick={() => navigate('/operate/access')} className="btn-pill-secondary w-full sm:w-auto">Access</button>
        </div>
      </div>
    </main>
  );
}
