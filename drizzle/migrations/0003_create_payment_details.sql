CREATE TABLE public.payment_details (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  momo_name text NOT NULL DEFAULT '',
  momo_number text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT 'MTN',
  amount numeric NOT NULL DEFAULT 500,
  instructions text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_details TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_details TO authenticated;
GRANT ALL ON public.payment_details TO service_role;

ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payment details" ON public.payment_details FOR SELECT USING (true);
CREATE POLICY "Admins insert payment details" ON public.payment_details FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payment details" ON public.payment_details FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.payment_details (id, momo_name, momo_number, network) VALUES (true, '', '', 'MTN') ON CONFLICT (id) DO NOTHING;
