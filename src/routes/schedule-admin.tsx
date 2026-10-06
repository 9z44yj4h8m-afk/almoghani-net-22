import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/schedule-admin")({
  beforeLoad: () => { throw redirect({ to: "/admin", search: { tab: "schedule" } }); },
});
