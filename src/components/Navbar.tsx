import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import horizontalLogo from "@/assets/dexecutive-horizontal-logo.png.asset.json";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Free Tips", href: "#tips" },
  { label: "History", href: "#history" },
  { label: "VIP", href: "#vip" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <a href="/" className="flex min-w-0 items-center" aria-label="D’EXECUTIVE home">
          <img src={horizontalLogo.url} alt="D’EXECUTIVE — Football Analytics & Prediction" className="h-auto w-[230px] max-w-[70vw] object-contain sm:w-[270px]" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"><Link to="/access">VIP Access</Link></Button>
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
          <Button asChild size="sm" className="w-full bg-primary text-primary-foreground font-display"><Link to="/access" onClick={() => setOpen(false)}>VIP Access</Link></Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
