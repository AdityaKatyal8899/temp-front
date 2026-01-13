import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ChoiceSection from "@/components/ChoiceSection";
import UploadSectionDefault from "@/components/UploadSection";
import AccessSectionDefault from "@/components/AccessSection";
import type { ComponentType } from "react";

const UploadSection = UploadSectionDefault as ComponentType<{ onBack?: () => void }>;
const AccessSection = AccessSectionDefault as ComponentType<{ onBack?: () => void }>;

type Screen = "home" | "upload" | "access";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTransition = (newScreen: Screen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScreen(newScreen);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  };

  const handleGetStarted = () => {
    const choiceSection = document.getElementById("choice-section");
    choiceSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChoice = (choice: "upload" | "access") => {
    handleTransition(choice);
  };

  const handleBack = () => {
    handleTransition("home");
  };

  return (
    <main 
      className={`min-h-screen transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {screen === "home" && (
        <>
          <HeroSection onGetStarted={handleGetStarted} />
          <AboutSection />
          <div id="choice-section">
            <ChoiceSection onChoice={handleChoice} />
          </div>
        </>
      )}

      {screen === "upload" && <UploadSection onBack={handleBack} />}
      
      {screen === "access" && <AccessSection onBack={handleBack} />}
    </main>
  );
};

export default Index;
