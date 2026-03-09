import { useState } from "react";
import { Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Free Tips", href: "#tips" },
  { label: "History", href: "#history" },
  { label: "VIP", href: "#vip" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>OG</span>
          <span className="text-primary">ODDS</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">
            Go VIP
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">
              {l.label}
            </a>
          ))}
          <Button size="sm" className="w-full bg-primary text-primary-foreground font-display">Go VIP</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
