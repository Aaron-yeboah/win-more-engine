import { motion } from "framer-motion";
import { Check, Crown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Daily Pass",
    price: "$5",
    period: "/day",
    icon: Zap,
    features: ["All VIP tips for 24hrs", "Booking codes included", "Telegram access"],
    accent: false,
  },
  {
    name: "Weekly Gold",
    price: "$25",
    period: "/week",
    icon: Crown,
    features: ["All VIP tips for 7 days", "Priority support", "Booking codes included", "Telegram VIP group"],
    accent: true,
  },
  {
    name: "Monthly Platinum",
    price: "$75",
    period: "/month",
    icon: Star,
    features: ["Unlimited VIP tips", "1-on-1 support", "Early access to picks", "Telegram VIP group", "Bankroll management tips"],
    accent: false,
  },
];

const VipPricing = () => {
  return (
    <section className="py-16 md:py-24" id="vip">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            Unlock <span className="text-gradient-gold">VIP Access</span>
          </h2>
          <p className="text-muted-foreground">Choose the plan that fits your game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-6 border card-hover ${
                plan.accent
                  ? "border-accent bg-gradient-to-b from-accent/10 to-card glow-gold"
                  : "border-border bg-card"
              }`}
            >
              {plan.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground font-bold text-xs">MOST POPULAR</Badge>
                </div>
              )}
              <plan.icon className={`h-8 w-8 mb-4 ${plan.accent ? "text-accent" : "text-primary"}`} />
              <h3 className="text-xl font-bold font-display mb-1">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold font-display">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 ${plan.accent ? "text-accent" : "text-primary"}`} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-display font-semibold ${
                  plan.accent
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Get {plan.name}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Need Badge for the "MOST POPULAR" tag
import { Badge } from "@/components/ui/badge";

export default VipPricing;
