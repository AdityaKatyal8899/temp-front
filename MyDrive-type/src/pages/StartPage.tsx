import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen section-padding flex items-center justify-center">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-section-title mb-8">What do you want to do?</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button onClick={() => navigate('/upload')} className="btn-pill w-full sm:w-auto">Upload</button>
          <button onClick={() => navigate('/access')} className="btn-pill-secondary w-full sm:w-auto">Access</button>
        </div>
      </div>
    </main>
  );
}
