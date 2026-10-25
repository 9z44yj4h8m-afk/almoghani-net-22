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
- Resolve voice IDs/prompts centrally; cancel previews, ignore late results and reuse four local clips keyed by settings.
- Keep /admin-chat open and /admin-voices viewport-height, ending with the play control and one send menu, no save button; extra tools stay in a dialog, owner guards and writes protected. Crop voice artwork; never flatten controls into images.
- Store performers and named clips in private chat-recordings with admin-only storage and normalized voice_chat settings; public playback serves only enabled configured paths to prevent arbitrary private-file access.
- Render the chat transcript and roster above one full-width composer; use container-bounded appearance sizing so saved owner dimensions never overflow the chat window.
- Merge per-series YouTube metadata into one ordered drama catalog at /bedouin-drama; never mix public videos with private IPTV or claim a live channel.
- Admin password-only login authenticates the fixed owner account server-side through Cloud Auth and checks user_roles before returning a session; never bypass RLS with a shared PIN.

- Share channels.ts across player/AI; sync channels.m3u with BOM/group order and channels-iptv.m3u with only direct HLS, no BOM, CRLF, same order; retain per-entry verified playback header directives in both exports because Referer-locked sources require them. Links: /live?channel=<id>, /channels/<section-slug> (portal-page).
- Keep AI channel search server-side and validate returned IDs against the supplied catalog so generated channels can never enter the player.
- Resolve YouTube live server-side (resolveYoutubeLive, youtubeChannelId); embed video IDs, not the broken embed/live_stream?channel= URL.
- Keep homepage member/chat entry artwork separate from the shared MemberPlatforms destinations on /auth; preserve private access gates so moving cards never exposes streams.
- PWA starts /vip without service-worker caching; voices-only Android uses net.almoghani.voices and /22, preserving account guards.
- Relay Referer-locked CDNs via /api/public/hls (allow-list); Smarters relay follows redirects manually via <ip>.sslip.io, since the edge refuses bare-IP fetches.
- Build the featured-movies list server-side from official YouTube channel searches (getFeaturedMovies, 1h cache, full-length filter) with the hand-picked list in src/lib/movies.ts as fallback.
- Keep the private IPTV library as one responsive Smarters-style interface with server-side search and external-player actions; group series episodes by series title and live channels by stream group before listing individual items, and support movie group/search deep links from homepage collections.

- Open private member sessions via open_member_library_session without a PIN; keep authenticated JWT-scoped stream reads, suspension checks and admin guards. Public catalog metadata never exposes URLs, provider IDs or private logos.
- Keep featured subscription metadata separate from public streams and resolve library matches server-side; detail pages must never substitute unrelated channels or fabricate schedules.
- Owner-editable site data (texts, contacts, design colors, extra/hidden channels and movies) lives in admin-only-write tables and is merged client-side via src/lib/site-config.ts on top of the static catalogs, so the code catalogs stay the fallback.

- Share shell and wordmark through the sidebar rail only; the contact footer strip and the four-item bottom nav were removed at the owner's request (19 Oct 2026) and must not come back, so every destination stays reachable from the rail. Preserve guards. Keep artwork browser-safe, separate from streams; owner images win.
- Admin content manager uses existing admin-RLS tables for bulk channels and schedules; validate streams before insertion and invalidate schedule queries after saves.
- Store default/custom cards, edits, placement, order and recoverable deletion in section-content; shared helpers merge them across home, sections and members, preserving destination gates and channel IDs.
- Read subdirectories' AGENTS.md before editing there.
- Manage chat rooms via create_chat_room and admin-RLS deletion; the general room has no deletable row.
- Persist per-card font and size overrides alongside section content and render them through bounded, allow-listed scoped SectionCardStyle rules; preserve existing styles when no override is saved.
- /100 edits site_settings("voice_panel") (panel texts, colors, hidden/custom voices); custom voices store only a built-in provider ID plus delivery prompt.

- Home/channel share workspace/player/schedule; in-page editors reuse admin tools and RLS.
- Share smarters-config genre schema, filters and ordering across admin/library to keep saved classifications consistent.

- PortalPage and /vip share mergeLiveChannels ordering and one list/search/player; sports reorder without losing channels or moving non-sports. Opaque IDs and VOD remain member-gated.
- Keep Smarters failure detection and manual retry in SmartersPlayer, shared by homepage and library, without persistent stream caching so access gates and source ownership remain unchanged.
- Keep verified public bulk-channel additions in a browser-safe static catalog merged through channels.ts; synchronize all public playlists and bound mounted channel rows while searching the full catalog to keep large imports usable without changing member gates.
