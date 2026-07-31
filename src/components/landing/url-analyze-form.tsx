import { ArrowRight, Globe } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { validateUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export type UrlAnalyzeFormHandle = { focus: () => void };

type UrlAnalyzeFormProps = {
  /** Called with the normalized URL once the input passes validation. */
  onAnalyze?: (url: string) => void;
  formRef?: { current: UrlAnalyzeFormHandle | null };
};

const HELPER_TEXT = "Paste any public website address to begin — no account needed.";

export function UrlAnalyzeForm({ onAnalyze, formRef }: UrlAnalyzeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!formRef) return;
    formRef.current = {
      focus: () => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      },
    };
    return () => {
      formRef.current = null;
    };
  }, [formRef]);

  useEffect(() => {
    if (!shake) return;
    const timer = window.setTimeout(() => setShake(false), 500);
    return () => window.clearTimeout(timer);
  }, [shake]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateUrl(value);

    if (result.status === "valid") {
      setError(null);
      onAnalyze?.(result.url);
      return;
    }

    setError(
      result.status === "empty"
        ? "Add a website address first, then we'll take it from there."
        : result.message,
    );
    setShake(true);
    inputRef.current?.focus();
  }

  return (
    <div className="w-full max-w-[43.75rem]">
      <form
        onSubmit={handleSubmit}
        noValidate
        className={cn(
          "flex w-full flex-col gap-2 rounded-2xl border bg-card p-2.5 shadow-card transition-[border-color,box-shadow] duration-(--motion-component) ease-(--motion-ease) sm:flex-row sm:items-center sm:rounded-full sm:pl-6",
          error ? "border-destructive/50" : "border-border focus-within:border-primary/60 focus-within:shadow-lifted",
          shake && "motion-shake",
        )}
      >
        <label htmlFor="website-url" className="sr-only">
          Website address
        </label>
        <div className="flex flex-1 items-center gap-3 px-3 sm:px-0">
          <Globe aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <input
            id="website-url"
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="https://yourwebsite.com"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "website-url-error" : "website-url-helper"}
            className="min-h-13 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:min-h-14"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="min-h-13 gap-2 rounded-xl px-7 text-[0.95rem] font-semibold shadow-glow-soft transition-[transform,box-shadow,filter] duration-(--motion-component) ease-(--motion-ease) hover:-translate-y-0.5 hover:shadow-glow hover:brightness-[1.03] active:translate-y-0 active:scale-[0.97] sm:min-h-14 sm:rounded-full"
        >
          Analyze Website
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </form>

      <p
        id={error ? "website-url-error" : "website-url-helper"}
        role={error ? "alert" : undefined}
        className={cn(
          "mt-3 text-sm transition-colors duration-(--motion-micro)",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ?? HELPER_TEXT}
      </p>
    </div>
  );
}
