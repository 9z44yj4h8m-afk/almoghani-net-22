CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL CHECK (char_length(account_name) BETWEEN 1 AND 80),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 3 AND 30),
  duration text NOT NULL CHECK (duration IN ('m1','m2','m3')),
  payment text NOT NULL DEFAULT 'bank' CHECK (char_length(payment) <= 20),
  receipt_name text NOT NULL DEFAULT '' CHECK (char_length(receipt_name) <= 200),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.subscription_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.subscription_requests TO authenticated;
GRANT ALL ON public.subscription_requests TO service_role;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits pending request" ON public.subscription_requests FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND amount IS NULL);
CREATE POLICY "Admins read requests" ON public.subscription_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update requests" ON public.subscription_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete requests" ON public.subscription_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));