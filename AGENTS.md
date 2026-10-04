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

- Keep channel metadata in one typed array in src/lib/channels.ts so the player, AI search and AI chat share one catalog; deep links use /live?channel=<id> and /channels/live (the only valid section slug since categories were collapsed into one "البث" section).
- Keep AI channel search server-side and validate returned IDs against the supplied catalog so generated channels can never enter the player.
- Keep the AI chat streaming through the /api/chat server route with history stored only in the visitor's browser, so no login or database is needed.
