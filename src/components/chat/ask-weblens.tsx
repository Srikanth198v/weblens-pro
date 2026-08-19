import { MessageSquareText, Send, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
      }
    } catch {
      setError("WebLens AI could not answer just now. Your question is still here — try again.");
      setMessages(messages);
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed right-5 bottom-5 z-40 h-12 gap-2 rounded-full px-5 shadow-lg print:hidden"
        >
          <MessageSquareText className="size-4" aria-hidden />
          Ask WebLens AI
        </Button>
      </SheetTrigger>

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
                "text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {message.content}
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
