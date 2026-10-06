CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE OR REPLACE FUNCTION public.claim_owner_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF lower(coalesce(auth.jwt()->>'email','')) = 'a0552525337@gmail.com' AND coalesce((auth.jwt()->'user_metadata'->>'email_verified')::boolean, true) THEN
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(),'admin') ON CONFLICT DO NOTHING;
 END IF;
 RETURN public.has_role(auth.uid(),'admin');
END; $$;
CREATE TABLE public.channel_schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), channel_id text NOT NULL, title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX channel_schedules_channel_idx ON public.channel_schedules(channel_id, starts_at);
GRANT SELECT ON public.channel_schedules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.channel_schedules TO authenticated;
GRANT ALL ON public.channel_schedules TO service_role;
ALTER TABLE public.channel_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads schedules" ON public.channel_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert schedules" ON public.channel_schedules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update schedules" ON public.channel_schedules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete schedules" ON public.channel_schedules FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));