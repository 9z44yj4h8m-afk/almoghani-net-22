import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { channels as baseChannels } from "@/lib/channels";
import { useSiteConfig, siteConfigKey, mergeChannels } from "@/lib/site-config";
import {
  CHANNEL_BACKUP_FORMAT, parseChannelM3u, parseChannelBackup,
  serializeChannelM3u, type TransferChannel,
} from "@/lib/channel-transfer";

function download(text: string, filename: string, mime: string) {
  const uri = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(uri), 2000);
}

export function ChannelTransferManager() {
  const { data, isPending } = useSiteConfig();
  const client = useQueryClient();
  const [staged, setStaged] = useState<TransferChannel[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function selectFile(file?: File) {
    setStaged([]);
    setName("");
    setMessage("");
    if (!file) return;
    if (file.size > 4_000_000) return setMessage("الملف أكبر من 4 ميجابايت؛ جزّئ قائمة القنوات أولًا.");
    try {
      const raw = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? parseChannelBackup(raw) : parseChannelM3u(raw);
      if (parsed.length > 5000) return setMessage("الحد الأقصى 5000 قناة في كل عملية. قسّم الملف إلى قوائم أصغر.");
      setStaged(parsed);
      setName(file.name);
      setMessage("تمت قراءة القائمة. راجع المعاينة واضغط استيراد يدويًا للحفظ.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "تعذّر قراءة الملف.");
    }
  }

  async function importChannels() {
    if (!data || !staged.length || busy) return;
    const known = new Set([
      ...data.customChannels.map((c) => c.stream_url.trim().toLowerCase()),
      ...baseChannels.map((c) => (c.streamUrl ?? "").trim().toLowerCase()),
    ]);
    const unique = staged.filter((c) => {
      const key = c.url.toLowerCase();
      if (known.has(key)) return false;
      known.add(key);
      return true;
    });
    if (!unique.length) return setMessage("جميع روابط القنوات موجودة بالفعل؛ لم يتم استبدال أي قناة.");
    if (!window.confirm("هل تريد إضافة " + unique.length + " قناة جديدة؟ القنوات الموجودة لن تتغير.")) return;
    setBusy(true);
    setMessage("جارٍ حفظ القنوات الجديدة…");
    let saved = 0;
    try {
      for (let i = 0; i < unique.length; i += 100) {
        const rows = unique.slice(i, i + 100).map((c) => ({
          id: "c-" + crypto.randomUUID(),
          name: c.name,
          category: c.category,
          stream_url: c.url,
          logo: c.logo,
          description: "",
        }));
        const { error } = await supabase.from("custom_channels").insert(rows);
        if (error) throw error;
        saved += rows.length;
      }
      setStaged([]);
      setName("");
      setMessage("تم حفظ " + saved + " قناة ✓ وتم تخطي " + (staged.length - saved) + " رابطًا مكررًا.");
    } catch {
      setMessage("حدث خطأ بعد حفظ " + saved + " قناة. يمكنك إعادة استيراد الملف: التكرارات ستُتخطى.");
    } finally {
      await client.invalidateQueries({ queryKey: siteConfigKey });
      setBusy(false);
    }
  }

  function exportChannels() {
    if (!data) return;
    const all = mergeChannels(data)
      .map((c) => ({
        name: c.name,
        category: c.category,
        url: c.streamUrl ?? (c.youtubeId ? "https://www.youtube.com/watch?v=" + c.youtubeId : ""),
        logo: c.thumbnail?.startsWith("https://") ? c.thumbnail : "",
      }))
      .filter((c) => !!c.url);
    download(serializeChannelM3u(all), "ALMOGHANI-LIVE-channels.m3u", "audio/x-mpegurl;charset=utf-8");
    setMessage("تم إعداد ملف M3U للقنوات الظاهرة.");
  }

  function exportBackup() {
    if (!data) return;
    const channels: TransferChannel[] = data.customChannels.map((c) => ({
      name: c.name, category: c.category, url: c.stream_url, logo: c.logo,
    }));
    download(JSON.stringify({
      format: CHANNEL_BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      channels,
    }, null, 2), "ALMOGHANI-LIVE-backup.json", "application/json;charset=utf-8");
    setMessage("تم إعداد نسخة JSON من القنوات المضافة يدويًا.");
  }

  return <div className="space-y-5">
    <div className="rounded-xl border border-amber-400/20 bg-card/60 p-4">
      <h3 className="mb-3 text-lg font-black">استيراد قوائم القنوات يدويًا</h3>
      <p className="mb-3 text-sm text-muted-foreground">اختر ملف M3U أو نسخة JSON سبق تصديرها من هذه اللوحة. لا يوجد استيراد تلقائي، ولن تُحذف القنوات القديمة.</p>
      <label className="block space-y-2 text-sm font-bold">
        <span>ملف القنوات</span>
        <input aria-label="اختر ملف M3U أو JSON" type="file" accept=".m3u,.m3u8,.json" disabled={busy}
          className="block w-full rounded-lg border border-border bg-background p-3 text-sm" onChange={(e) => { void selectFile(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {name && <p className="mt-3 text-sm">{name} — {staged.length.toLocaleString("en-US")} قناة</p>}
      {staged.length > 0 && <div className="mt-3 max-h-52 overflow-auto rounded-lg border border-border">
        {staged.slice(0, 15).map((c, index) => <p key={index} className="border-b border-border px-3 py-2 text-sm">
          {c.name} <span className="text-muted-foreground">• {c.category}</span>
        </p>)}
        {staged.length > 15 && <p className="px-3 py-2 text-xs text-muted-foreground">و{staged.length - 15} قناة أخرى…</p>}
      </div>}
      <Button type="button" className="mt-4 w-full sm:w-auto" disabled={busy || isPending || !staged.length} onClick={() => void importChannels()}>
        {busy ? "جارٍ الحفظ…" : <><Save /> حفظ القنوات المستوردة</>}
      </Button>
    </div>
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <h3 className="mb-3 text-lg font-black">التصدير والنسخ الاحتياطي</h3>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!data || busy} onClick={exportChannels}><Download /> تصدير القنوات الظاهرة M3U</Button>
        <Button type="button" variant="outline" disabled={!data || busy} onClick={exportBackup}><FileUp /> نسخة JSON للقنوات المضافة</Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">نسخة JSON تحفظ القنوات المضافة فقط، ولا تشمل بيانات الدخول أو الاشتراكات أو إعدادات الموقع. ملفات M3U قد تتضمن روابط خاصة؛ احتفظ بها لنفسك.</p>
    </div>
    {message && <p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>}
  </div>;
}
