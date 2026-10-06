<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- Keep channel metadata in one typed array in src/lib/channels.ts so the player, AI search and AI chat share one catalog; deep links use /live?channel=<id> and /channels/<section-slug> (slugs defined once in the sections array in portal-page).
- Keep AI channel search server-side and validate returned IDs against the supplied catalog so generated channels can never enter the player.
- Keep the AI chat streaming through the /api/chat server route with history stored only in the visitor's browser, so no login or database is needed.
- Resolve each YouTube channel's current live video server-side (resolveYoutubeLive, using youtubeChannelId) and embed by video ID, because YouTube's embed/live_stream?channel= URL shows "video unavailable".
- Keep player behaviour (volume, quality, auto-reconnect with backoff, settings in localStorage) in src/components/live-player.tsx so every page shares one player.
- Ship the site as an installable web app via public/manifest.webmanifest (start_url /vip) with no service worker, so installs never serve stale cached files.
- Relay streams whose CDN demands a specific Referer through /api/public/hls (host allow-list, playlists rewritten), because browsers cannot set Referer.
- Build the featured-movies list server-side from official YouTube channel searches (getFeaturedMovies, 1h cache, full-length filter) with the hand-picked list in src/lib/movies.ts as fallback.
- Keep the private IPTV library as one responsive Smarters-style interface with server-side search and external-player actions; group series episodes by series title and live channels by stream group before listing individual items, and support movie group/search deep links from homepage collections.

- Persist member names in profiles and gate all private library reads with authenticated, JWT-session-scoped unlock rows; shared PIN alone must never expose private content.
- Keep featured subscription metadata separate from public streams and resolve library matches server-side; detail pages must never substitute unrelated channels or fabricate schedules.
