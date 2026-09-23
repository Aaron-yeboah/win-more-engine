import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Check, Clock3, Copy, Crown, LoaderCircle, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Payment = { id: string; status: "pending" | "approved" | "rejected"; created_at: string };
type Prediction = { id: string; title: string; bet_code: string; image_path: string; created_at: string; imageUrl?: string };
type Details = { momo_name: string; momo_number: string; network: string; amount: number; instructions: string };

const nameSchema = z.string().trim().min(2, "Enter the Mobile Money name you paid with").max(100);

export default function VipPortal() {
  const { user, isVip, isAdmin, refreshAccess, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [details, setDetails] = useState<Details | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [momoName, setMomoName] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [approvedAt, setApprovedAt] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    await refreshAccess();
    const [{ data: payments }, { data: paymentDetails }, { data: membership }] = await Promise.all([
      supabase.from("payment_confirmations").select("id,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("payment_details").select("momo_name,momo_number,network,amount,instructions").maybeSingle(),
      supabase.from("vip_memberships").select("approved_at").eq("user_id", user.id).maybeSingle(),
    ]);
    setPayment((payments?.[0] as Payment | undefined) ?? null);
    setDetails(paymentDetails ? ({ ...paymentDetails, amount: Number(paymentDetails.amount) } as Details) : null);
    setApprovedAt(membership?.approved_at ?? null);

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
    const parsed = nameSchema.safeParse(momoName);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message);

    // Use user's own phone number from their profile metadata as the momo_number
    const userMomoNumber: string =
      (user.user_metadata?.momo_number as string | undefined) ||
      (user.user_metadata?.phone_number as string | undefined) ||
      "000000000000";

    setSending(true);
    const { error } = await supabase.from("payment_confirmations").insert({
      user_id: user.id,
      momo_name: parsed.data,
      momo_number: userMomoNumber,
      transaction_reference: "I HAVE PAID",
      amount: details?.amount ?? 50,
    });
    setSending(false);
    if (error) {
      console.error("Payment submission error:", error);
      if (error.code === "23505") return toast.error("You already have a payment awaiting review. Please wait for admin approval.");
      if (error.code === "23514") return toast.error("Submission failed: your account profile is incomplete. Please contact support.");
      return toast.error(`Could not send confirmation: ${error.message}`);
    }
    toast.success("Payment sent ✅ — please wait for admin approval");
    void load();
  };

  const copyValue = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const amount = details?.amount ?? 50;
  const cedis = `GH₵${amount.toFixed(0)}`;

  // Calculate remaining time in minutes
  const remainingMins = approvedAt
    ? Math.max(0, Math.ceil((new Date(approvedAt).getTime() + 60 * 60 * 1000 - Date.now()) / (60 * 1000)))
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70"><div className="container flex min-h-16 items-center justify-between gap-3 py-3"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link><div className="flex items-center gap-2"><Crown className="h-5 w-5 text-accent" /><span className="font-display font-bold">D’EXECUTIVE VIP</span></div><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign out</span></Button></div></header>
      <div className="container max-w-5xl py-10 md:py-16">
        {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div> : isVip || isAdmin ? (
          <section>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3 bg-primary/15 text-primary"><ShieldCheck className="mr-1 h-3 w-3" /> 1-Hour VIP Access Active{!isAdmin && remainingMins > 0 ? ` (${remainingMins}m remaining)` : ""}</Badge><h1 className="text-3xl font-bold md:text-4xl">VIP football predictions</h1><p className="mt-2 text-muted-foreground">Your latest paid selections and BET codes.</p></div>{isAdmin && <Button asChild variant="outline"><Link to="/admin">Open admin portal</Link></Button>}</div>
            {predictions.length === 0 ? <div className="border-y border-border py-16 text-center"><Clock3 className="mx-auto mb-3 h-8 w-8 text-accent" /><h2 className="text-xl font-semibold">Next prediction coming soon</h2><p className="mt-2 text-sm text-muted-foreground">You have access. Check back for the next upload.</p></div> : <div className="grid gap-6 md:grid-cols-2">{predictions.map((item) => <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="aspect-[4/3] bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />}</div><div className="p-5"><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("en-GH", { dateStyle: "medium" })}</p><h2 className="mt-1 text-xl font-bold">{item.title}</h2><div className="mt-4 flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3"><div><p className="text-xs uppercase text-muted-foreground">BET code</p><p className="text-lg font-bold text-primary">{item.bet_code}</p></div><Button size="icon" variant="ghost" aria-label="Copy BET code" onClick={() => void copyValue(item.id, item.bet_code)}>{copied === item.id ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}</Button></div></div></article>)}</div>}
          </section>
        ) : payment?.status === "pending" ? (
          <section className="mx-auto max-w-xl text-center">
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-8"><Clock3 className="mx-auto mb-3 h-8 w-8 text-accent" /><h1 className="text-2xl font-bold">Waiting for admin approval</h1><p className="mt-2 text-sm text-muted-foreground">We received your payment confirmation. As soon as the admin approves it, the prediction picture and BET code will appear here.</p><Button variant="outline" className="mt-6" onClick={() => void load()}>Check again</Button></div>
          </section>
        ) : !showPayment ? (
          <section className="mx-auto max-w-xl text-center">
            <Badge className="mb-4 bg-accent/15 text-accent">{cedis} VIP access</Badge>
            <h1 className="text-3xl font-bold md:text-4xl">Unlock VIP predictions</h1>
            <p className="mt-3 text-muted-foreground">Pay {cedis} by Mobile Money to get 1 hour of full access to daily predictions and BET codes.</p>
            {payment?.status === "approved" && !isVip && (
              <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500 font-medium">
                ⏰ Your 1-hour VIP pass has expired. Pay {cedis} by Mobile Money to unlock VIP predictions for another hour!
              </p>
            )}
            {payment?.status === "rejected" && <p className="mt-4 text-sm text-destructive">Your last confirmation was not verified. Please pay again and resubmit.</p>}
            <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => setShowPayment(true)}>Pay {cedis} — Unlock VIP (1 Hour)</Button>
          </section>
        ) : (
          <section className="mx-auto max-w-xl">
            <button onClick={() => setShowPayment(false)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
            <Badge className="mb-4 bg-accent/15 text-accent">Step 1 — Send {cedis}</Badge>
            <h1 className="text-2xl font-bold md:text-3xl">Payment details</h1>
            {details?.momo_number ? (
              <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
                <DetailRow label="Mobile Money name" value={details.momo_name} />
                <div className="flex items-end justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-4 py-3">
                  <div><p className="text-xs uppercase text-muted-foreground">Mobile Money number ({details.network})</p><p className="text-lg font-bold text-primary">{details.momo_number}</p></div>
                  <Button size="icon" variant="ghost" aria-label="Copy Mobile Money number" onClick={() => void copyValue("momo", details.momo_number)}>{copied === "momo" ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}</Button>
                </div>
                <DetailRow label="Network" value={details.network} />
                <DetailRow label="Amount" value={`GH₵${amount.toFixed(2)}`} />
                {details.instructions && <p className="text-sm text-muted-foreground">{details.instructions}</p>}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground"><Smartphone className="mb-3 h-6 w-6 text-accent" />The payment number has not been added yet. Please check back shortly.</div>
            )}
            <form onSubmit={submitPayment} className="mt-6 space-y-5 rounded-lg border border-border bg-card p-6">
              <Badge className="bg-primary/15 text-primary">Step 2 — Confirm</Badge>
              <div className="space-y-2"><Label>Your Mobile Money name</Label><Input maxLength={100} placeholder="Name on the account you paid from" value={momoName} onChange={(e) => setMomoName(e.target.value)} required /></div>
              <Button className="w-full" disabled={sending}>{sending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}I have paid</Button>
              <p className="text-xs text-muted-foreground">After you submit, wait for the admin to approve your payment.</p>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="font-semibold">{value || "—"}</span></div>;
}
