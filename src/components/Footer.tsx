import { TrendingUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-bold">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>OG<span className="text-primary">ODDS</span></span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          © 2026 OGODDS. For entertainment purposes only. Gamble responsibly.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
