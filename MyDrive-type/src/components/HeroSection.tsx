 import { useNavigate } from "react-router-dom";

 interface HeroProps {
  onGetStarted?: () => void;
 }

 const HeroSection = ({ onGetStarted }: HeroProps) => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    if (onGetStarted) return onGetStarted();
    navigate('/operate');
  };
  return (
    <section className="min-h-[80vh] flex items-center">
      <div className="w-full section-padding text-left">
        <div className="max-w-3xl">
          <h1 className="text-hero animate-blur-up">
            Temp <span className="text-gradient-accent accent-breathe">Share</span>
          </h1>

          <p className="mt-6 text-white/85 text-xl md:text-2xl leading-relaxed md:leading-8 animate-fade-up-delay-1">
            Share files temporarily with anyone. No accounts, no hassle. Your files
            disappear when you want them to.
          </p>

          <div className="mt-10 animate-fade-up-delay-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3">
            <button
              onClick={handleGetStarted}
              className="btn-pill btn-breathe w-full sm:w-auto px-6 py-3 text-base"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/manage')}
              className="btn-pill-secondary w-full sm:w-auto px-6 py-3 text-base"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
    </section>
  );
 };

 export default HeroSection;
