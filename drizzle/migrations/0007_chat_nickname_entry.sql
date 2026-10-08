CREATE OR REPLACE FUNCTION public.chat_set_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_name text;
BEGIN
 NEW.user_id := auth.uid();
 NEW.created_at := now();
 IF auth.uid() IS NOT NULL THEN
  v_name := (SELECT nullif(display_name,'') FROM public.profiles WHERE user_id = auth.uid());
  IF EXISTS (SELECT 1 FROM public.chat_messages WHERE user_id = auth.uid() AND created_at > now() - interval '3 seconds') THEN RAISE EXCEPTION 'slow down'; END IF;
 ELSE
  IF (SELECT count(*) FROM public.chat_messages WHERE user_id IS NULL AND created_at > now() - interval '1 minute') >= 30 THEN RAISE EXCEPTION 'slow down'; END IF;
 END IF;
 NEW.display_name := left(coalesce(nullif(btrim(NEW.display_name),''), v_name, 'زائر'), 30);
 RETURN NEW;
END;
$function$;