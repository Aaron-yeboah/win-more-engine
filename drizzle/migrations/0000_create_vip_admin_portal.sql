CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone_number text NOT NULL UNIQUE CHECK (phone_number ~ '^233[0-9]{9}$'),
  momo_number text NOT NULL CHECK (momo_number ~ '^233[0-9]{9}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.payment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  momo_name text NOT NULL CHECK (char_length(momo_name) BETWEEN 2 AND 100),
  momo_number text NOT NULL CHECK (momo_number ~ '^233[0-9]{9}$'),
  transaction_reference text NOT NULL CHECK (char_length(transaction_reference) BETWEEN 4 AND 80),
  amount numeric(10,2) NOT NULL DEFAULT 50 CHECK (amount = 50),
  status public.payment_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payment_confirmations TO authenticated;
GRANT ALL ON public.payment_confirmations TO service_role;
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;
CREATE INDEX payment_confirmations_user_id_idx ON public.payment_confirmations(user_id);
CREATE UNIQUE INDEX one_pending_payment_per_user_idx ON public.payment_confirmations(user_id) WHERE status = 'pending';

CREATE TABLE public.vip_memberships (
  user_id uuid PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  approved_by uuid NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_memberships TO authenticated;
GRANT ALL ON public.vip_memberships TO service_role;
ALTER TABLE public.vip_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vip_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL CHECK (char_length(image_path) BETWEEN 1 AND 500),
  bet_code text NOT NULL CHECK (char_length(bet_code) BETWEEN 2 AND 50),
  title text NOT NULL DEFAULT 'VIP Football Prediction' CHECK (char_length(title) BETWEEN 2 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_predictions TO authenticated;
GRANT ALL ON public.vip_predictions TO service_role;
ALTER TABLE public.vip_predictions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_vip_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vip_memberships
    WHERE user_id = _user_id AND active = true
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_vip_access(uuid) TO authenticated;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users submit own payments" ON public.payment_confirmations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Users read own payments" ON public.payment_confirmations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payments" ON public.payment_confirmations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own membership" ON public.vip_memberships FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage memberships" ON public.vip_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "VIP members read active predictions" ON public.vip_predictions FOR SELECT TO authenticated USING ((is_active AND public.has_vip_access(auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage predictions" ON public.vip_predictions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, momo_number)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), 'D’EXECUTIVE Member'),
    NEW.raw_user_meta_data ->> 'phone_number',
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'momo_number', ''), NEW.raw_user_meta_data ->> 'phone_number')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.approve_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_user uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT user_id INTO target_user FROM public.payment_confirmations WHERE id = _payment_id AND status = 'pending' FOR UPDATE;
  IF target_user IS NULL THEN RAISE EXCEPTION 'Pending payment not found'; END IF;
  UPDATE public.payment_confirmations SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _payment_id;
  INSERT INTO public.vip_memberships(user_id, active, approved_by, approved_at)
  VALUES (target_user, true, auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE SET active = true, approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_payment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.payment_confirmations SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _payment_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending payment not found'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.reject_payment(uuid) TO authenticated;

CREATE POLICY "Admins upload prediction images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vip-predictions' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "VIP members view prediction images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'vip-predictions' AND (public.has_vip_access(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Admins update prediction images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vip-predictions' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'vip-predictions' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete prediction images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vip-predictions' AND public.has_role(auth.uid(), 'admin'));