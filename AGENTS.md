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
- Group existing chat administration tools into focused tabs with appearance dimensions first; keep owner authentication and admin-only writes unchanged so easier access never widens permissions.
- Store performer recordings in private chat-recordings with admin-only storage policies and voice_chat settings; the public voice endpoint serves only configured paths, so visitors cannot access arbitrary private files.
- Render the chat transcript and roster above one full-width composer; use container-bounded appearance sizing so saved owner dimensions never overflow the chat window.
- Keep public YouTube dramas in per-series metadata modules merged by one typed catalog with ordered episodes and a public /bedouin-drama page; never mix these videos with private IPTV streams or claim they are a live channel.
- Keep optional series cover artwork separate from episode thumbnails in the typed drama catalog; render cover banners intact without duplicate overlays so episode imagery stays unchanged.
- Admin password-only login authenticates the fixed owner account server-side through Cloud Auth and checks user_roles before returning a session; never bypass RLS with a shared PIN.

- Keep channel metadata in one typed array in src/lib/channels.ts so the player, AI search and AI chat share one catalog; deep links use /live?channel=<id> and /channels/<section-slug> (slugs defined once in the sections array in portal-page).
- Keep AI channel search server-side and validate returned IDs against the supplied catalog so generated channels can never enter the player.
- Resolve each YouTube channel's current live video server-side (resolveYoutubeLive, using youtubeChannelId) and embed by video ID, because YouTube's embed/live_stream?channel= URL shows "video unavailable".
- Keep player behaviour (volume, quality, auto-reconnect with backoff, settings in localStorage) in src/components/live-player.tsx so every page shares one player.
- Keep homepage member/chat entry artwork separate from the shared MemberPlatforms destinations on /auth; preserve private access gates so moving cards never exposes streams.
- Keep the homepage player explicit-start and public category/live players active on entry; public movie pages choose a language-matched random film after hydration and autoplay muted to respect browser policies.
- Ship the site as an installable web app via public/manifest.webmanifest (start_url /vip) with no service worker, so installs never serve stale cached files.
- Relay streams whose CDN demands a specific Referer through /api/public/hls (host allow-list, playlists rewritten), because browsers cannot set Referer.
- Build the featured-movies list server-side from official YouTube channel searches (getFeaturedMovies, 1h cache, full-length filter) with the hand-picked list in src/lib/movies.ts as fallback.
- Keep the private IPTV library as one responsive Smarters-style interface with server-side search and external-player actions; group series episodes by series title and live channels by stream group before listing individual items, and support movie group/search deep links from homepage collections.

- Persist member names in profiles and gate all private stream reads with authenticated, JWT-session-scoped unlock rows; a separate public Smarters catalog exposes only channel names and groups, never URLs, provider IDs or credential-bearing logos.
- Keep featured subscription metadata separate from public streams and resolve library matches server-side; detail pages must never substitute unrelated channels or fabricate schedules.
- Owner-editable site data (texts, contacts, design colors, extra/hidden channels and movies) lives in admin-only-write tables and is merged client-side via src/lib/site-config.ts on top of the static catalogs, so the code catalogs stay the fallback.

- Keep the broadcast visual shell, wordmark, footer and four-item navigation in shared root components; page-specific content retains its existing routes and access guards so restyling never changes membership rules.
- Keep bulk channel creation and editable broadcast schedules in the admin content manager using existing admin-RLS tables; validate streams before batch insertion and invalidate shared schedule queries after saves so public schedules stay current.
- Store editable destination-card images, copy and allow-listed page destinations in site_settings with static defaults in section-content; keep category IDs unchanged when labels change so edits never alter stream grouping or access guards.
- Persist per-card font and size overrides alongside section content and render them through bounded, allow-listed scoped SectionCardStyle rules; preserve existing styles when no override is saved.
- Keep Smarters banner presentation in a shared catalog component using featured-channel metadata; live banners filter public names and VOD links retain the existing member gate so artwork never exposes private streams.
