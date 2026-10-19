CREATE OR REPLACE FUNCTION public.open_member_library_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
 IF auth.uid() IS NULL OR nullif(auth.jwt()->>'session_id','') IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND suspended) THEN RETURN false; END IF;
 INSERT INTO public.member_library_sessions(session_id,user_id,unlocked,entered_at)
 VALUES (auth.jwt()->>'session_id',auth.uid(),true,now())
 ON CONFLICT (session_id) DO UPDATE SET unlocked=true;
 RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.open_member_library_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_member_library_session() TO authenticated, service_role;