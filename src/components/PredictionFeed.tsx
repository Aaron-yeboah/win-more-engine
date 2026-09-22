import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Filter, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Prediction = {
  id: number;
  time: string;
  league: string;
  flag: string;
  teamA: string;
  teamB: string;
  prediction: string;
  odds: string;
  status: "pending" | "won" | "lost";
  isVip: boolean;
  bookingCode?: string;
};

const mockPredictions: Prediction[] = [
  { id: 1, time: "15:00", league: "EPL", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", teamA: "Arsenal", teamB: "Chelsea", prediction: "Home Win", odds: "1.85", status: "pending", isVip: false, bookingCode: "SP4829X" },
  { id: 2, time: "17:30", league: "La Liga", flag: "🇪🇸", teamA: "Barcelona", teamB: "Real Madrid", prediction: "Over 2.5", odds: "1.72", status: "pending", isVip: false, bookingCode: "SP9182Y" },
  { id: 3, time: "19:00", league: "Serie A", flag: "🇮🇹", teamA: "AC Milan", teamB: "Inter Milan", prediction: "BTTS", odds: "1.65", status: "pending", isVip: false, bookingCode: "SP3847Z" },
  { id: 4, time: "20:45", league: "Bundesliga", flag: "🇩🇪", teamA: "Bayern Munich", teamB: "Dortmund", prediction: "Over 3.5", odds: "2.10", status: "pending", isVip: false },
  { id: 5, time: "21:00", league: "Ligue 1", flag: "🇫🇷", teamA: "PSG", teamB: "Lyon", prediction: "Home -1.5", odds: "1.95", status: "pending", isVip: true },
  { id: 6, time: "21:00", league: "UCL", flag: "🇪🇺", teamA: "Man City", teamB: "Napoli", prediction: "Home Win", odds: "1.60", status: "pending", isVip: true },
];

const filters = ["All", "EPL", "La Liga", "Serie A", "Bundesliga", "UCL"];

const PredictionFeed = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = activeFilter === "All"
    ? mockPredictions
    : mockPredictions.filter((p) => p.league === activeFilter);

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="py-16 md:py-24" id="tips">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
              Today's Free Tips
            </h2>
            <p className="text-muted-foreground">Expert picks updated daily. VIP tips unlock with a subscription.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={activeFilter === f ? "default" : "secondary"}
                onClick={() => setActiveFilter(f)}
                className={activeFilter === f ? "bg-primary text-primary-foreground" : ""}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">League</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Match</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Prediction</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Odds</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {p.time}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span>{p.flag} {p.league}</span>
                  </td>
                  <td className="px-4 py-4 font-medium">
                    {p.isVip ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4 text-accent" /> VIP Only
                      </span>
                    ) : (
                      `${p.teamA} vs ${p.teamB}`
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {p.isVip ? (
                      <Badge variant="outline" className="border-accent text-accent">Locked</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-0">{p.prediction}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {p.isVip ? "—" : p.odds}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.bookingCode && !p.isVip ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => p.bookingCode && handleCopy(p.id, p.bookingCode)}
                        className="text-xs"
                      >
                        {copiedId === p.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              {p.isVip ? (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Lock className="h-5 w-5 text-accent" />
                  <span className="font-medium text-accent">VIP Only — Unlock to View</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{p.flag} {p.league}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.time}
                    </span>
                  </div>
                  <p className="font-bold font-display text-lg mb-2">{p.teamA} vs {p.teamB}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/15 text-primary border-0">{p.prediction}</Badge>
                    <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {p.odds}
                    </span>
                    {p.bookingCode && (
                      <Button size="sm" variant="ghost" onClick={() => p.bookingCode && handleCopy(p.id, p.bookingCode)} className="text-xs">
                        {copiedId === p.id ? <Check className="h-4 w-4 text-primary" /> : <><Copy className="h-4 w-4 mr-1" /> Code</>}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PredictionFeed;
