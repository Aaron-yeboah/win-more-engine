import { motion } from "framer-motion";
import { CheckCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const wonSlips = [
  { id: 1, matches: ["Arsenal 2-0 Chelsea", "Barcelona 3-1 Real Madrid"], odds: "3.18", date: "Mar 8" },
  { id: 2, matches: ["Man City 4-1 Liverpool", "Bayern 2-0 Dortmund"], odds: "2.96", date: "Mar 7" },
  { id: 3, matches: ["PSG 2-1 Lyon", "Juventus 1-0 Napoli"], odds: "3.45", date: "Mar 6" },
  { id: 4, matches: ["AC Milan 3-2 Inter", "Atletico 1-0 Sevilla"], odds: "4.12", date: "Mar 5" },
  { id: 5, matches: ["Tottenham 2-1 Man Utd", "Leipzig 3-0 Frankfurt"], odds: "2.80", date: "Mar 4" },
  { id: 6, matches: ["Roma 2-0 Lazio", "Real Madrid 1-0 Villarreal"], odds: "3.60", date: "Mar 3" },
];

const WinningHistory = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/20" id="history">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold font-display">Hall of Fame</h2>
          </div>
          <p className="text-muted-foreground">Recent winning bet slips from our expert analysts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wonSlips.map((slip, i) => (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-xl border border-primary/20 bg-card p-5 card-hover overflow-hidden"
            >
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground font-bold gap-1">
                  <CheckCircle className="h-3 w-3" /> WON
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{slip.date}</p>
              <div className="space-y-2 mb-4">
                {slip.matches.map((m) => (
                  <p key={m} className="text-sm font-medium">{m}</p>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Total Odds</span>
                <span className="text-lg font-bold font-display text-primary">{slip.odds}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WinningHistory;
