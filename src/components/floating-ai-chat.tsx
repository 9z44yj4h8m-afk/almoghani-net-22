import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (path === "/chat") return null;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button size="icon" aria-label="فتح دردشة ALMOGHANI AI" title="ALMOGHANI AI" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-40 h-14 w-14 rounded-full border-2 border-sky bg-primary text-primary-foreground shadow-live hover:bg-primary/90 sm:bottom-6 sm:left-6">
        <MessagesSquare className="h-6 w-6" />
      </Button>
    </DialogTrigger>
    <DialogContent dir="rtl" className="flex h-[min(680px,85dvh)] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-lg border-sky bg-background p-0 sm:left-6 sm:top-auto sm:bottom-6 sm:translate-x-0 sm:translate-y-0">
      <div className="border-b border-border px-5 py-4 pr-12">
        <DialogTitle>ALMOGHANI AI</DialogTitle>
        <DialogDescription className="sr-only">دردشة المساعد الذكي</DialogDescription>
      </div>
      {open && <iframe src="/chat?floating=1" title="محادثة ALMOGHANI AI" className="min-h-0 w-full flex-1 border-0" allow="clipboard-write" />}
    </DialogContent>
  </Dialog>;
}