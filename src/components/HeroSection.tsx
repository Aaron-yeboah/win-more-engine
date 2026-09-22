import { motion } from "framer-motion";
import { TrendingUp, Target, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Target, label: "Accuracy", value: "92%", sub: "This Week" },
  { icon: Trophy, label: "Wins", value: "1,247", sub: "Total Tips Won" },
  { icon: Zap, label: "Streak", value: "14", sub: "Win Streak" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-primary">Live Predictions Active</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight mb-6">
            Win More with{" "}
            <span className="text-gradient-success">D’EXECUTIVE</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Expert football predictions backed by data analytics. Get free daily tips or unlock our premium VIP picks for maximum returns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="https://t.me/ogodds1" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-8 py-6 font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-success">
                <TrendingUp className="mr-2 h-5 w-5" />
                Join Telegram
              </Button>
            </a>
            <a href="/access">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-display font-semibold border-accent text-accent hover:bg-accent/10 glow-gold">
                <Trophy className="mr-2 h-5 w-5" />
                Go VIP — GH₵50
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border"
            >
              <stat.icon className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold font-display text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.sub}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
