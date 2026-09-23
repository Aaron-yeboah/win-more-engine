import { useState } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, LoaderCircle, LockKeyhole, Phone, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeGhanaPhone, phoneEmail } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(100);

type LocationState = { from?: string };

export default function Access() {
  const { user, isAdmin, loading, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const requested = (location.state as LocationState | null)?.from;

  if (!loading && user) return <Navigate to={isAdmin ? "/admin" : requested || "/vip"} replace />;

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeGhanaPhone(phone);
    const validPassword = passwordSchema.safeParse(password);
    if (!normalized || !validPassword.success) {
      toast.error(!normalized ? "Enter a valid Ghana mobile number" : validPassword.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: phoneEmail(normalized), password });
    setBusy(false);
    if (error) return toast.error("Phone number or password is incorrect");
    const access = await refreshAccess(data.user.id);
    navigate(access.isAdmin ? "/admin" : requested || "/vip", { replace: true });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeGhanaPhone(phone);
    const validName = nameSchema.safeParse(name);
    const validPassword = passwordSchema.safeParse(password);
    if (!validName.success || !normalized || !validPassword.success) {
      toast.error(validName.error?.issues[0]?.message || (!normalized ? "Enter a valid Ghana mobile number" : validPassword.error?.issues[0]?.message));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: phoneEmail(normalized),
      password,
      options: { data: { full_name: validName.data, phone_number: normalized, momo_number: normalized } },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("email rate")) {
        return toast.error("Too many attempts. Please wait a few minutes and try again, or contact support.");
      }
      if (error.message.toLowerCase().includes("already")) {
        return toast.error("This phone number already has an account. Try signing in instead.");
      }
      return toast.error(error.message);
    }
    toast.success("Account created! Welcome to D'EXECUTIVE VIP 🎉");
    navigate("/vip", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-16">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg border border-primary/30 bg-primary/10"><LockKeyhole className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold">D’EXECUTIVE Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to view your VIP predictions.</p>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Create account</TabsTrigger></TabsList>
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={signIn} className="space-y-5 rounded-lg border border-border bg-card p-6">
              <Field label="Mobile number" icon={<Phone className="h-4 w-4" />}><Input inputMode="tel" autoComplete="tel" placeholder="059 425 2615" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
              <Field label="Password" icon={<LockKeyhole className="h-4 w-4" />}><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
              <Button className="w-full" disabled={busy}>{busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={signUp} className="space-y-4 rounded-lg border border-border bg-card p-6">
              <Field label="Full name" icon={<UserRound className="h-4 w-4" />}><Input autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Mobile number" icon={<Phone className="h-4 w-4" />}><Input inputMode="tel" autoComplete="tel" placeholder="024 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
              <Field label="Password" icon={<LockKeyhole className="h-4 w-4" />}><Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
              <Button className="w-full" disabled={busy}>{busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="flex items-center gap-2">{icon}{label}</Label>{children}</div>;
}
