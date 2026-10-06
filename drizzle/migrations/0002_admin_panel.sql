CREATE TABLE public.site_settings (key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.private_settings (key text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.private_settings TO service_role;
ALTER TABLE public.private_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.custom_channels (
 id text PRIMARY KEY, name text NOT NULL, category text NOT NULL, stream_url text NOT NULL, logo text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.custom_channels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_channels TO authenticated;
GRANT ALL ON public.custom_channels TO service_role;
ALTER TABLE public.custom_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads custom channels" ON public.custom_channels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write custom channels" ON public.custom_channels FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.channel_overrides (channel_id text PRIMARY KEY, hidden boolean NOT NULL DEFAULT false, category text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.channel_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.channel_overrides TO authenticated;
GRANT ALL ON public.channel_overrides TO service_role;
ALTER TABLE public.channel_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads overrides" ON public.channel_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write overrides" ON public.channel_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.custom_movies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), youtube_id text NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.custom_movies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_movies TO authenticated;
GRANT ALL ON public.custom_movies TO service_role;
ALTER TABLE public.custom_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads custom movies" ON public.custom_movies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write custom movies" ON public.custom_movies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.hidden_movies (movie_id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.hidden_movies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hidden_movies TO authenticated;
GRANT ALL ON public.hidden_movies TO service_role;
ALTER TABLE public.hidden_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads hidden movies" ON public.hidden_movies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write hidden movies" ON public.hidden_movies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.profiles ADD COLUMN suspended boolean NOT NULL DEFAULT false;
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.unlock_member_library(p_pin text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_pin text;
BEGIN
 IF auth.uid() IS NULL OR auth.jwt()->>'session_id' IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 PERFORM pg_sleep(0.4);
 IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND suspended) THEN RETURN false; END IF;
 SELECT value INTO v_pin FROM public.private_settings WHERE key='library_pin';
 IF p_pin <> coalesce(v_pin,'0550') THEN RETURN false; END IF;
 INSERT INTO public.member_library_sessions(session_id,user_id,unlocked,entered_at) VALUES (auth.jwt()->>'session_id',auth.uid(),true,now()) ON CONFLICT (session_id) DO UPDATE SET unlocked=true, entered_at=now();
 RETURN true;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_set_library_pin(p_pin text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF p_pin !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'Invalid pin'; END IF;
 INSERT INTO public.private_settings(key,value) VALUES('library_pin',p_pin) ON CONFLICT (key) DO UPDATE SET value=excluded.value;
 UPDATE public.member_library_sessions SET unlocked=false WHERE unlocked;
 RETURN true;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_set_member_suspended(p_user uuid, p_suspended boolean)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 UPDATE public.profiles SET suspended=p_suspended WHERE user_id=p_user;
 IF p_suspended THEN UPDATE public.member_library_sessions SET unlocked=false WHERE user_id=p_user; END IF;
 RETURN true;
END; $function$;