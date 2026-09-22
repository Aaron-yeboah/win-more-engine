import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Check, Clock3, Copy, Crown, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeGhanaPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Payment = { id: string; status: "pending" | "approved" | "rejected"; created_at: string };
type Prediction = { id: string; title: string; bet_code: string; image_path: string; created_at: string; imageUrl?: string };

const paymentSchema = z.object({
  momoName: z.string().trim().min(2).max(100),
  momoNumber: z.string().transform(normalizeGhanaPhone).refine(Boolean, "Enter a valid Ghana mobile number"),
  reference: z.string().trim().min(4).max(80),
});

export default function VipPortal() {
  const { user, isVip, isAdmin, refreshAccess, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [momoName, setMomoName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    await refreshAccess();
    const { data: payments } = await supabase.from("payment_confirmations").select("id,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
    setPayment((payments?.[0] as Payment | undefined) ?? null);
    if (isVip || isAdmin) {
      const { data } = await supabase.from("vip_predictions").select("id,title,bet_code,image_path,created_at").eq("is_active", true).order("created_at", { ascending: false });
      const withUrls = await Promise.all((data ?? []).map(async (item) => {
        const { data: signed } = await supabase.storage.from("vip-predictions").createSignedUrl(item.image_path, 3600);
        return { ...item, imageUrl: signed?.signedUrl };
      }));
      setPredictions(withUrls);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.id, isVip, isAdmin]);

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const parsed = paymentSchema.safeParse({ momoName, momoNumber, reference });
    if (!parsed.success || !parsed.data.momoNumber) return toast.error(parsed.error?.issues[0]?.message || "Check your payment details");
    setSending(true);
    const { error } = await supabase.from("payment_confirmations").insert({
      user_id: user.id,
      momo_name: parsed.data.momoName,
      momo_number: parsed.data.momoNumber,
      transaction_reference: parsed.data.reference,
    });
    setSending(false);
    if (error) return toast.error(error.code === "23505" ? "You already have a payment awaiting review" : "Payment confirmation could not be sent");
    toast.success("Payment submitted for confirmation");
    void load();
  };

  const copyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70"><div className="container flex min-h-16 items-center justify-between gap-3 py-3"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link><div className="flex items-center gap-2"><Crown className="h-5 w-5 text-accent" /><span className="font-display font-bold">D’EXECUTIVE VIP</span></div><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign out</span></Button></div></header>
      <div className="container max-w-5xl py-10 md:py-16">
        {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div> : isVip || isAdmin ? (
          <section>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3 bg-primary/15 text-primary"><ShieldCheck className="mr-1 h-3 w-3" /> Access confirmed</Badge><h1 className="text-3xl font-bold md:text-4xl">VIP football predictions</h1><p className="mt-2 text-muted-foreground">Your latest paid selections and BET codes.</p></div>{isAdmin && <Button asChild variant="outline"><Link to="/admin">Open admin portal</Link></Button>}</div>
            {predictions.length === 0 ? <div className="border-y border-border py-16 text-center"><Clock3 className="mx-auto mb-3 h-8 w-8 text-accent" /><h2 className="text-xl font-semibold">Next prediction coming soon</h2><p className="mt-2 text-sm text-muted-foreground">You have access. Check back for the next upload.</p></div> : <div className="grid gap-6 md:grid-cols-2">{predictions.map((item) => <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="aspect-[4/3] bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />}</div><div className="p-5"><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("en-GH", { dateStyle: "medium" })}</p><h2 className="mt-1 text-xl font-bold">{item.title}</h2><div className="mt-4 flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3"><div><p className="text-xs uppercase text-muted-foreground">BET code</p><p className="text-lg font-bold text-primary">{item.bet_code}</p></div><Button size="icon" variant="ghost" aria-label="Copy BET code" onClick={() => void copyCode(item.id, item.bet_code)}>{copied === item.id ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}</Button></div></div></article>)}</div>}
          </section>
        ) : (
          <section className="mx-auto max-w-xl">
            <Badge className="mb-4 bg-accent/15 text-accent">GH₵50 VIP access</Badge>
            <h1 className="text-3xl font-bold md:text-4xl">Confirm your Mobile Money payment</h1>
            <p className="mt-3 text-muted-foreground">After paying GH₵50, submit the payer details below. The admin will verify the transaction and unlock this page.</p>
            {payment?.status === "pending" ? <div className="mt-8 rounded-lg border border-accent/30 bg-accent/10 p-6"><Clock3 className="mb-3 h-7 w-7 text-accent" /><h2 className="text-xl font-bold">Confirmation pending</h2><p className="mt-2 text-sm text-muted-foreground">Your payment details are with the admin. Access will appear here after approval.</p></div> : <form onSubmit={submitPayment} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-6"><div className="space-y-2"><Label>Mobile Money account name</Label><Input maxLength={100} value={momoName} onChange={(e) => setMomoName(e.target.value)} required /></div><div className="space-y-2"><Label>Mobile Money number used</Label><Input inputMode="tel" placeholder="024 000 0000" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} required /></div><div className="space-y-2"><Label>Transaction reference</Label><Input maxLength={80} value={reference} onChange={(e) => setReference(e.target.value)} required /></div>{payment?.status === "rejected" && <p className="text-sm text-destructive">The previous confirmation was not verified. Check the details and submit again.</p>}<Button className="w-full" disabled={sending}>{sending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Submit for confirmation</Button></form>}
          </section>
        )}
      </div>
    </main>
  );
}
