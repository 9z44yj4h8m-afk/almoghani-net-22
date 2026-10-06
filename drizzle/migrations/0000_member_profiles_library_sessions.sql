CREATE TABLE public.profiles (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.member_library_sessions (session_id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, unlocked boolean NOT NULL DEFAULT false, entered_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.member_library_sessions TO authenticated;
GRANT ALL ON public.member_library_sessions TO service_role;
ALTER TABLE public.member_library_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read current library session" ON public.member_library_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id AND session_id = (auth.jwt()->>'session_id'));
CREATE POLICY "Members lock current session" ON public.member_library_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id AND session_id = (auth.jwt()->>'session_id')) WITH CHECK (auth.uid() = user_id AND session_id = (auth.jwt()->>'session_id') AND unlocked = false);
CREATE FUNCTION public.unlock_member_library(p_pin text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR auth.jwt()->>'session_id' IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 PERFORM pg_sleep(0.4);
 IF p_pin <> '0550' THEN RETURN false; END IF;
 INSERT INTO public.member_library_sessions(session_id,user_id,unlocked,entered_at) VALUES (auth.jwt()->>'session_id',auth.uid(),true,now()) ON CONFLICT (session_id) DO UPDATE SET unlocked=true, entered_at=now();
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.unlock_member_library(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_member_library(text) TO authenticated;
CREATE FUNCTION public.ensure_member_profile() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 INSERT INTO public.profiles(user_id,display_name,last_login_at) VALUES(auth.uid(),left(coalesce(auth.jwt()->'user_metadata'->>'display_name',auth.jwt()->'user_metadata'->>'full_name','عضو ALMOGHANI'),80),now()) ON CONFLICT (user_id) DO UPDATE SET last_login_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.ensure_member_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_member_profile() TO authenticated;