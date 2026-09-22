import horizontalLogo from "@/assets/dexecutive-horizontal-logo.png.asset.json";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <a href="/" aria-label="D’EXECUTIVE home" className="shrink-0">
          <img src={horizontalLogo.url} alt="D’EXECUTIVE — Football Analytics & Prediction" className="h-auto w-56 object-contain" />
        </a>
        <p className="text-sm text-muted-foreground text-center">
          © 2026 D’EXECUTIVE. For entertainment purposes only. Gamble responsibly.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
