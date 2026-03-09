import { motion } from "framer-motion";
import { Check, Crown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "VIP Access",
    price: "GH₵50",
    period: "",
    icon: Crown,
    features: ["All VIP tips", "Booking codes included", "Telegram VIP group", "Priority support", "Early access to picks"],
    accent: true,
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
          <p className="text-muted-foreground">Pay GH₵50 to unlock all VIP tips</p>
        </div>

        <div className="flex justify-center max-w-md mx-auto">
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
                className="w-full font-display font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Pay GH₵50 — Unlock VIP
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
