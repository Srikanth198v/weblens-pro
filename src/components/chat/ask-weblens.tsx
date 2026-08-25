import { MessageSquareText, Send, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { askUsage, askWebLens } from "@/lib/chat/ask.functions";
import { FREE_MESSAGE_LIMIT, STARTER_QUESTIONS, type AskMessage } from "@/lib/chat/ask.shared";
import { buildAskContext } from "@/lib/chat/context";
import type { DashboardReport } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

/**
 * Ask WebLens AI — a chat that answers only from this report's measured data.
 * Usage is counted on the server; the count shown here is what the server sent.
 */
export function AskWebLens({ report }: { report: DashboardReport }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const context = useMemo(() => buildAskContext(report), [report]);
  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - used);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void askUsage()
      .then((usage) => {
        if (!active) return;
        setUsed(usage.used);
        setLimitReached(usage.remaining === 0);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const clamp = useCallback((x: number, y: number) => {
    const el = launcherRef.current;
    const width = el?.offsetWidth ?? 160;
    const height = el?.offsetHeight ?? 48;
    const pad = 8;
    return {
      x: Math.min(Math.max(x, pad), Math.max(pad, window.innerWidth - width - pad)),
      y: Math.min(Math.max(y, pad), Math.max(pad, window.innerHeight - height - pad)),
    };
  }, []);

  // Restore this session's position and keep the widget on screen on resize.
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("weblens-ask-position");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clamp(parsed.x, parsed.y));
        }
      } catch {
        /* ignore malformed stored position */
      }
    }
    function onResize() {
      setPosition((current) => (current ? clamp(current.x, current.y) : current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const state = dragState.current;
    if (!state) return;
    const next = clamp(event.clientX - state.dx, event.clientY - state.dy);
    const rect = event.currentTarget.getBoundingClientRect();
    if (!state.moved && Math.hypot(next.x - rect.left, next.y - rect.top) < 6) return;
    state.moved = true;
    setPosition(next);
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const state = dragState.current;
    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state?.moved) {
      setPosition((current) => {
        if (current) {
          sessionStorage.setItem("weblens-ask-position", JSON.stringify(current));
        }
        return current;
      });
      return;
    }
    setOpen(true);
  }

  async function send(question: string) {
    const text = question.trim();
    if (!text || pending || limitReached) return;

    const next: AskMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const result = await askWebLens({ data: { context, messages: next } });

      if (result.ok) {
        setMessages([...next, { role: "assistant", content: result.answer }]);
        setUsed(result.used);
        setLimitReached(result.remaining === 0);
      } else if (result.reason === "limit") {
        setUsed(FREE_MESSAGE_LIMIT);
        setLimitReached(true);
        setMessages(messages);
      } else {
        setError(result.message);
        setUsed(result.used);
        setMessages(messages);
        setInput(text);
      }
    } catch {
      setError("WebLens AI could not answer just now. Your question is still here — try again.");
      setMessages(messages);
      setInput(text);
    } finally {
      setPending(false);
    }
  }

  // Rendered into <body> so no transformed ancestor can turn `fixed` into a
  // scroll-bound element: the widget stays put at any scroll position.
  const launcher = (
    <button
      ref={launcherRef}
      type="button"
      aria-label="Ask WebLens AI — drag to move"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={
        position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined
      }
      className="fixed right-5 bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-50 inline-flex h-12 touch-none items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-shadow duration-(--motion-micro) hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none select-none sm:bottom-5 print:hidden"
    >
      <MessageSquareText className="size-4" aria-hidden />
      Ask WebLens AI
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {mounted ? createPortal(launcher, document.body) : null}




      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display text-base">
            <BrandMark className="size-6" />
            Ask WebLens AI
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Answers come from this analysis of {report.siteName} — measured evidence only.
          </p>
          <p className="text-xs font-medium text-primary">
            {remaining} of {FREE_MESSAGE_LIMIT} free questions remaining
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask anything about this report. Try one of these:
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={pending || limitReached}
                    onClick={() => void send(question)}
                    className="rounded-full border border-border px-3 py-2 text-left text-xs font-medium text-foreground transition-colors duration-(--motion-micro) hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {message.role === "assistant" ? (
                <Markdown content={message.content} className="space-y-2 [&_li]:leading-relaxed [&_ul:first-child]:mt-0 [&_ol:first-child]:mt-0" />
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
            </div>
          ))}

          {pending ? (
            <p className="text-sm text-muted-foreground">WebLens AI is reading the report…</p>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}

          {limitReached ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Lock className="size-4 text-primary" aria-hidden />
                You've used all {FREE_MESSAGE_LIMIT} free questions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade to keep asking WebLens AI about this and future reports. Your report stays
                available in full.
              </p>
              <Button asChild className="mt-3 w-full">
                <a href="/#pricing">See plans</a>
              </Button>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <form
          className="border-t border-border px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              disabled={pending || limitReached}
              rows={2}
              aria-label="Ask a question about this report"
              placeholder={
                limitReached ? "Free questions used up" : "Ask about this report…"
              }
              className="min-h-11 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={pending || limitReached || !input.trim()}
              aria-label="Send question"
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
