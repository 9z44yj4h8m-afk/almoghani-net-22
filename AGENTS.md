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
- Resolve voice profile IDs to supported provider IDs centrally; share preview/chat delivery prompts for compatibility.
- Keep /admin-chat open and /admin-voices viewport-height, ending with the play control and one send menu, no save button; extra tools stay in a dialog, owner guards and writes protected. Crop voice artwork; never flatten controls into images.
- Store performers and named clips in private chat-recordings with admin-only storage and normalized voice_chat settings; public playback serves only enabled configured paths to prevent arbitrary private-file access.
- Render the chat transcript and roster above one full-width composer; use container-bounded appearance sizing so saved owner dimensions never overflow the chat window.
- Merge per-series YouTube metadata into one ordered drama catalog at /bedouin-drama; never mix public videos with private IPTV or claim a live channel.
- Admin password-only login authenticates the fixed owner account server-side through Cloud Auth and checks user_roles before returning a session; never bypass RLS with a shared PIN.

- Share src/lib/channels.ts across player and AI; synchronize additions to public/channels.m3u preserving BOM and group order. Links: /live?channel=<id> and /channels/<section-slug>, with section slugs defined in portal-page.
- Keep AI channel search server-side and validate returned IDs against the supplied catalog so generated channels can never enter the player.
- Resolve each YouTube channel's current live video server-side (resolveYoutubeLive, using youtubeChannelId) and embed by video ID, because YouTube's embed/live_stream?channel= URL shows "video unavailable".
- Keep homepage member/chat entry artwork separate from the shared MemberPlatforms destinations on /auth; preserve private access gates so moving cards never exposes streams.
- Ship the site as an installable web app via public/manifest.webmanifest (start_url /vip) with no service worker, so installs never serve stale cached files.
- Relay streams whose CDN demands a specific Referer through /api/public/hls (host allow-list, playlists rewritten), because browsers cannot set Referer.
- Build the featured-movies list server-side from official YouTube channel searches (getFeaturedMovies, 1h cache, full-length filter) with the hand-picked list in src/lib/movies.ts as fallback.
- Keep the private IPTV library as one responsive Smarters-style interface with server-side search and external-player actions; group series episodes by series title and live channels by stream group before listing individual items, and support movie group/search deep links from homepage collections.

- Persist member names in profiles and gate all private stream reads with authenticated, JWT-session-scoped unlock rows; a separate public Smarters catalog exposes only channel names and groups, never URLs, provider IDs or credential-bearing logos.
- Keep featured subscription metadata separate from public streams and resolve library matches server-side; detail pages must never substitute unrelated channels or fabricate schedules.
- Owner-editable site data (texts, contacts, design colors, extra/hidden channels and movies) lives in admin-only-write tables and is merged client-side via src/lib/site-config.ts on top of the static catalogs, so the code catalogs stay the fallback.

- Share shell, wordmark, footer and four-item nav; preserve guards. Keep artwork browser-safe, separate from streams; owner images win.
- Admin content manager uses existing admin-RLS tables for bulk channels and schedules; validate streams before insertion and invalidate schedule queries after saves.
- Store default/custom cards, edits, placement, order and recoverable deletion in section-content; shared helpers merge them across home, sections and members, preserving destination gates and channel IDs.
- Subdirectories have their own AGENTS.md; read it before changing files there.
- Manage chat rooms via create_chat_room and admin-RLS deletion; the general room has no deletable row.
- Persist per-card font and size overrides alongside section content and render them through bounded, allow-listed scoped SectionCardStyle rules; preserve existing styles when no override is saved.
- /100 edits site_settings("voice_panel") (panel texts, colors, hidden/custom voices); custom voices store only a built-in provider ID plus delivery prompt.

- Home/channel routes share IPTV workspace, LivePlayer and ChannelSchedule; installed app shares shell/navigation without changing gates.
