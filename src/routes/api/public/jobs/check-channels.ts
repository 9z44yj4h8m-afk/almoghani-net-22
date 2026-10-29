import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'

// Every playlist the site serves. Private subscription servers block our edge, so skip them.
const PLAYLISTS = ['aa.m3u', 'c.m3u', 's.m3u', 'ar.m3u', 'b.m3u', 'j.m3u', 'k.m3u', 'w.m3u', 'channels-iptv.m3u']
const SKIP_HOSTS = ['youtube.com', 'youtu.be', 'ebh48.top', 'alf554562.online']
const SLOTS = 12 // runs every 5 minutes → full catalog checked once an hour

function parse(text: string) {
  const out: { name: string; url: string }[] = []
  let name = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('#EXTINF')) name = line.slice(line.lastIndexOf(',') + 1).trim()
    else if (/^https?:\/\//.test(line)) { out.push({ name, url: line }); name = '' }
  }
  return out
}

function slotOf(url: string) {
  let h = 0
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0
  return h % SLOTS
}

async function probe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return `خطأ ${res.status}`
    if (/\.m3u8?(\?|$)/i.test(url)) {
      const body = (await res.text()).slice(0, 200)
      if (!body.includes('#EXTM3U')) return 'رد غير صالح'
    } else res.body?.cancel()
    return null
  } catch {
    return 'لا يستجيب'
  }
}

export const Route = createFileRoute('/api/public/jobs/check-channels')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request)
        if (authFailure) return authFailure

        const origin = new URL(request.url).origin
        const all = new Map<string, string>()
        await Promise.all(PLAYLISTS.map(async (p) => {
          try {
            const r = await fetch(`${origin}/${p}`)
            if (r.ok) for (const c of parse(await r.text())) if (!all.has(c.url)) all.set(c.url, c.name)
          } catch { /* ignore */ }
        }))

        const slot = Math.floor(new Date().getUTCMinutes() / 5) % SLOTS
        const batch = [...all].filter(([url]) => {
          const host = new URL(url).hostname
          return !SKIP_HOSTS.some((s) => host.endsWith(s)) && slotOf(url) === slot
        })

        const results = await Promise.all(batch.map(async ([url, name]) => ({ url, name, err: await probe(url) })))

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: prev } = await supabaseAdmin.from('channel_health').select('url, fail_count, alerted').in('url', batch.map(([u]) => u))
        const prevMap = new Map((prev ?? []).map((r) => [r.url, r]))

        const newlyBroken: { name: string; status: string }[] = []
        const rows = results.map(({ url, name, err }) => {
          const p = prevMap.get(url)
          const fail = err ? (p?.fail_count ?? 0) + 1 : 0
          let alerted = err ? (p?.alerted ?? false) : false
          // Two failed checks in a row (two hours) before alerting, to avoid false alarms.
          if (err && fail >= 2 && !alerted) { alerted = true; newlyBroken.push({ name: name || url, status: err }) }
          return { url, name, fail_count: fail, alerted, last_status: err ?? 'ok', checked_at: new Date().toISOString() }
        })
        if (rows.length) await supabaseAdmin.from('channel_health').upsert(rows)

        if (newlyBroken.length) {
          const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
          const checkedAt = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })
          await sendTemplateEmail('broken-channels', 'a0552525337@gmail.com', {
            templateData: { channels: newlyBroken, checkedAt },
            idempotencyKey: `broken-channels-${new Date().toISOString().slice(0, 16)}`,
          })
        }

        return Response.json({ slot, checked: rows.length, alerted: newlyBroken.length })
      },
    },
  },
})
