CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE normalized_phone text;
BEGIN
  normalized_phone := split_part(NEW.email, '@', 1);
  IF NEW.email !~ '^[0-9]{12}@dexecutive[.]local$' OR normalized_phone <> NEW.raw_user_meta_data ->> 'phone_number' THEN
    RAISE EXCEPTION 'Invalid mobile account details';
  END IF;
  INSERT INTO public.profiles (id, full_name, phone_number, momo_number)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), 'D’EXECUTIVE Member'),
    normalized_phone,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'momo_number', ''), normalized_phone)
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins may update all predictions" ON public.vip_predictions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins may delete all predictions" ON public.vip_predictions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));