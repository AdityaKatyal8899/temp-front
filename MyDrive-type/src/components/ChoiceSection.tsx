import { Upload, KeyRound } from "lucide-react";

type Choice = "upload" | "access";

interface ChoiceSectionProps {
  onChoice: (choice: Choice) => void;
  onBack?: () => void;
}

const ChoiceSection = ({ onChoice, onBack }: ChoiceSectionProps) => {
  return (
    <section className="section-padding">
      {onBack && (
        <button 
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
        >
          ← Back
        </button>
      )}
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-section-title mb-12 animate-fade-up">
          What do you have?
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-8 justify-center animate-fade-up-delay-1">
          <button 
            onClick={() => onChoice("upload")}
            className="btn-pill flex items-center gap-3"
          >
            <Upload className="w-8 h-10" />
            Upload a File
          </button>
          
          <button 
            onClick={() => onChoice("access")}
            className="btn-pill-secondary flex items-center gap-3"
          >
            <KeyRound className="w-5 h-8" />
            I Have an Access Code / URL
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChoiceSection;
