import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PredictionFeed from "@/components/PredictionFeed";
import WinningHistory from "@/components/WinningHistory";
import VipPricing from "@/components/VipPricing";
import Footer from "@/components/Footer";
import FloatingTelegram from "@/components/FloatingTelegram";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PredictionFeed />
      <WinningHistory />
      <VipPricing />
      <Footer />
      <FloatingTelegram />
    </div>
  );
};

export default Index;
