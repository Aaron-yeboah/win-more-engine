import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Check, Clock3, ImagePlus, LoaderCircle, LogOut, Shield, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Payment = { id: string; user_id: string; momo_name: string; momo_number: string; transaction_reference: string; amount: number; status: "pending" | "approved" | "rejected"; created_at: string; customerName?: string };
type Prediction = { id: string; title: string; bet_code: string; image_path: string; is_active: boolean; created_at: string; imageUrl?: string };

export default function AdminPortal() {
  const { user, signOut } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("VIP Football Prediction");
  const [betCode, setBetCode] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: paymentRows }, { data: predictionRows }] = await Promise.all([
      supabase.from("payment_confirmations").select("*").order("created_at", { ascending: false }),
      supabase.from("vip_predictions").select("*").order("created_at", { ascending: false }),
    ]);
    const userIds = [...new Set((paymentRows ?? []).map((item) => item.user_id))];
    const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id,full_name").in("id", userIds) : { data: [] };
    const nameMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    setPayments((paymentRows ?? []).map((row) => ({ ...row, customerName: nameMap.get(row.user_id) })) as Payment[]);
    const withUrls = await Promise.all((predictionRows ?? []).map(async (item) => {
      const { data: signed } = await supabase.storage.from("vip-predictions").createSignedUrl(item.image_path, 3600);
      return { ...item, imageUrl: signed?.signedUrl };
    }));
    setPredictions(withUrls as Prediction[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const reviewPayment = async (paymentId: string, action: "approve" | "reject") => {
    setBusyId(paymentId);
    const { error } = await supabase.rpc(action === "approve" ? "approve_payment" : "reject_payment", { _payment_id: paymentId });
    setBusyId(null);
    if (error) return toast.error("The payment could not be updated");
    toast.success(action === "approve" ? "VIP access granted" : "Payment rejected");
    void load();
  };

  const uploadPrediction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !image) return toast.error("Choose a prediction picture");
    const valid = z.object({ title: z.string().trim().min(2).max(100), betCode: z.string().trim().min(2).max(50) }).safeParse({ title, betCode });
    if (!valid.success) return toast.error("Enter a title and valid BET code");
    if (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024) return toast.error("Choose a JPG, PNG, or WEBP image under 5MB");
    setUploading(true);
    const extension = image.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("vip-predictions").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) { setUploading(false); return toast.error("Picture upload failed"); }
    const { error } = await supabase.from("vip_predictions").insert({ title: valid.data.title, bet_code: valid.data.betCode.toUpperCase(), image_path: path, created_by: user.id });
    if (error) {
      await supabase.storage.from("vip-predictions").remove([path]);
      setUploading(false);
      return toast.error("Prediction could not be published");
    }
    setUploading(false);
    setBetCode(""); setImage(null);
    const fileInput = document.getElementById("prediction-image") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
    toast.success("VIP prediction published");
    void load();
  };

  const removePrediction = async (prediction: Prediction) => {
    setBusyId(prediction.id);
    const { error } = await supabase.from("vip_predictions").delete().eq("id", prediction.id);
    if (!error) await supabase.storage.from("vip-predictions").remove([prediction.image_path]);
    setBusyId(null);
    if (error) return toast.error("Prediction could not be removed");
    toast.success("Prediction removed");
    void load();
  };

  const pendingCount = payments.filter((item) => item.status === "pending").length;

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-card/70"><div className="container flex min-h-16 items-center justify-between gap-3 py-3"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="font-display font-bold">D’EXECUTIVE Admin</span></div><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign out</span></Button></div></header><div className="container max-w-6xl py-10"><div className="mb-8"><Badge className="mb-3 bg-primary/15 text-primary">Secure portal</Badge><h1 className="text-3xl font-bold md:text-4xl">VIP control room</h1><p className="mt-2 text-muted-foreground">Confirm payments and publish the latest football prediction.</p></div><Tabs defaultValue="payments"><TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="payments">Payments {pendingCount > 0 && `(${pendingCount})`}</TabsTrigger><TabsTrigger value="predictions">Predictions</TabsTrigger></TabsList><TabsContent value="payments" className="mt-6"><div className="overflow-hidden rounded-lg border border-border bg-card">{loading ? <Loading /> : payments.length === 0 ? <Empty text="No payment confirmations yet." /> : <div className="divide-y divide-border">{payments.map((payment) => <div key={payment.id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"><div><p className="font-semibold">{payment.customerName || payment.momo_name}</p><p className="text-sm text-muted-foreground">MoMo name: {payment.momo_name}</p></div><div><p className="text-sm font-medium">{payment.momo_number}</p><p className="text-xs text-muted-foreground">Reference: {payment.transaction_reference}</p></div><div><p className="font-bold text-accent">GH₵{Number(payment.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</p></div><div>{payment.status === "pending" ? <div className="flex gap-2"><Button size="icon" aria-label="Approve payment" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment.id, "approve")}><Check className="h-4 w-4" /></Button><Button size="icon" variant="destructive" aria-label="Reject payment" disabled={busyId === payment.id} onClick={() => void reviewPayment(payment.id, "reject")}><X className="h-4 w-4" /></Button></div> : <Badge variant="outline" className={payment.status === "approved" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>{payment.status}</Badge>}</div></div>)}</div>}</div></TabsContent><TabsContent value="predictions" className="mt-6"><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={uploadPrediction} className="space-y-5 rounded-lg border border-border bg-card p-6"><div><h2 className="text-xl font-bold">Publish prediction</h2><p className="mt-1 text-sm text-muted-foreground">Visible only to approved VIP members.</p></div><div className="space-y-2"><Label htmlFor="prediction-title">Title</Label><Input id="prediction-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="bet-code">BET code</Label><Input id="bet-code" maxLength={50} value={betCode} onChange={(e) => setBetCode(e.target.value)} placeholder="Enter booking code" required /></div><div className="space-y-2"><Label htmlFor="prediction-image">Prediction picture</Label><Input id="prediction-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} required /></div><Button className="w-full" disabled={uploading}>{uploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}Publish to VIP</Button></form><div>{loading ? <Loading /> : predictions.length === 0 ? <Empty text="No VIP predictions published yet." /> : <div className="grid gap-4 sm:grid-cols-2">{predictions.map((prediction) => <article key={prediction.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="aspect-[4/3] bg-secondary">{prediction.imageUrl && <img src={prediction.imageUrl} alt={prediction.title} className="h-full w-full object-contain" />}</div><div className="flex items-end justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate font-bold">{prediction.title}</h3><p className="text-sm font-semibold text-primary">{prediction.bet_code}</p></div><Button size="icon" variant="ghost" aria-label="Remove prediction" disabled={busyId === prediction.id} onClick={() => void removePrediction(prediction)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></article>)}</div>}</div></div></TabsContent></Tabs></div></main>;
}

function Loading() { return <div className="grid min-h-56 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-primary" /></div>; }
function Empty({ text }: { text: string }) { return <div className="grid min-h-56 place-items-center p-8 text-center text-sm text-muted-foreground"><div><Clock3 className="mx-auto mb-3 h-7 w-7" />{text}</div></div>; }
