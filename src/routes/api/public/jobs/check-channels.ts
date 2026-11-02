import { createFileRoute } from '@tanstack/react-router'

// Automatic channel checking has been disabled by the site owner.
// The existing background scheduler may still call this endpoint,
// but no channel is probed, changed, or emailed from here.
// Manual checks remain available to authenticated administrators.
export const Route = createFileRoute('/api/public/jobs/check-channels')({
  server: {
    handlers: {
      POST: async () => Response.json(
        { disabled: true, message: 'Automatic channel checks are disabled. Use manual channel checks in /admin.' },
        { status: 410 },
      ),
    },
  },
})
