import { MessageCircle } from "lucide-react";

const FloatingTelegram = () => {
  return (
    <a
      href="https://t.me/dexecu"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold shadow-lg glow-success hover:scale-105 transition-transform"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">D’EXECUTIVE Telegram</span>
    </a>
  );
};

export default FloatingTelegram;
