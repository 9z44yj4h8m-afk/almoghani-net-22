import { createFileRoute } from "@tanstack/react-router";

// Temporary cleanup route: removes the uploaded voice-recording files. Deleted after use.
export const Route = createFileRoute("/api/public/tmp-delete-recordings")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const names: string[] = [];
        for (const p of ["welcome-", "dialogue-"]) {
          let offset = 0;
          for (;;) {
            const { data } = await supabaseAdmin.storage.from("chat-recordings").list("recordings", { limit: 100, offset, search: p });
            if (!data || data.length === 0) break;
            for (const f of data) if (f.name.startsWith(p)) names.push(`recordings/${f.name}`);
            offset += 100;
            if (data.length < 100) break;
          }
        }
        if (names.length) {
          const { error } = await supabaseAdmin.storage.from("chat-recordings").remove(names);
          if (error) return Response.json({ error: error.message, found: names.length }, { status: 500 });
        }
        return Response.json({ deleted: names });
      },
    },
  },
});
