import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/components/bot-avatar";

const TURN_MS = 20000;
type Turn = { name: string; url: string };

async function fetchTurn(previous: string): Promise<Turn | null> {
  try {
    const res = await fetch("/api/public/bot-voice-turn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previous }) });
    if (!res.ok) return null;
    const name = decodeURIComponent(res.headers.get("X-Bot-Name") ?? "");
    return { name, url: URL.createObjectURL(await res.blob()) };
  } catch { return null; }
}

/** Voice-only room: bots take ~20s turns one after another; nothing they say is written. */
export function VoiceRoom({ avatars }: { avatars: Record<string, string> }) {
  const [speaker, setSpeaker] = useState("");
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    let failures = 0;
    (async () => {
      let next = fetchTurn("");
      let previous = "";
      while (alive) {
        const turn = await next;
        if (!alive) break;
        if (!turn) {
          failures++;
          await new Promise((r) => setTimeout(r, Math.min(30000, 3000 * 2 ** failures)));
          next = fetchTurn(previous);
          continue;
        }
        failures = 0;
        previous = turn.name;
        next = fetchTurn(previous); // prepare the next speaker while this one talks
        setSpeaker(turn.name); setWaiting(false);
        const audio = new Audio(turn.url);
        audioRef.current = audio;
        audio.muted = mutedRef.current;
        await new Promise<void>((done) => {
          const stop = setTimeout(() => { audio.pause(); done(); }, TURN_MS);
          audio.onended = () => { clearTimeout(stop); done(); };
          audio.onerror = () => { clearTimeout(stop); done(); };
          audio.play().catch(() => { clearTimeout(stop); done(); });
        });
        URL.revokeObjectURL(turn.url);
        if (alive) setWaiting(true);
      }
    })();
    return () => { alive = false; audioRef.current?.pause(); };
  }, []);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <h2 className="text-xl font-bold">الشات الصوتي</h2>
      <div className="flex flex-col items-center gap-3">
        <div className={`rounded-full border-4 border-primary p-1 ${!waiting ? "animate-pulse" : ""}`}>
          <div className="size-24 overflow-hidden rounded-full [&>*]:size-full">
            <BotAvatar name={speaker || "؟"} path={speaker ? avatars[speaker] : undefined} fallback={(speaker || "…").charAt(0)} />
          </div>
        </div>
        <p className="text-lg font-bold">{speaker || "…"}</p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {waiting ? <><Loader2 className="size-4 animate-spin" />يستعد المتحدث التالي…</> : <><Volume2 className="size-4" />يتكلم الآن</>}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setMuted((m) => !m)}>{muted ? <><VolumeX />تشغيل الصوت</> : <><Volume2 />كتم الصوت</>}</Button>
        <Button asChild><Link to="/">خروج</Link></Button>
      </div>
    </div>
  );
}
