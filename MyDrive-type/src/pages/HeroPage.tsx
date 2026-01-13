import HeroSection from "../components/HeroSection";
import FeatureCards from "../components/FeatureCards";
import SiteFooter from "../components/SiteFooter";

export default function HeroPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <HeroSection />
      <FeatureCards />
      <SiteFooter />
    </main>
  );
}
