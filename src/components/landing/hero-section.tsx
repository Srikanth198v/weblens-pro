import { Sparkles } from "lucide-react";

import { AmbientBackground } from "@/components/landing/ambient-background";
import { TrustIndicators } from "@/components/landing/trust-indicators";
import { UrlAnalyzeForm, type UrlAnalyzeFormHandle } from "@/components/landing/url-analyze-form";
import { Reveal } from "@/components/motion/reveal";

export function HeroSection({
  formRef,
  onAnalyze,
}: {
  formRef: { current: UrlAnalyzeFormHandle | null };
  onAnalyze?: (url: string) => void;
}) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24 pb-16 sm:pt-28">
      <AmbientBackground />

      <div className="relative mx-auto flex w-full max-w-[80rem] flex-col items-center gap-8 px-5 text-center sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-secondary-foreground shadow-soft transition-transform duration-(--motion-component) ease-(--motion-ease) hover:scale-[1.02] hover:shadow-card">
            <Sparkles aria-hidden="true" className="size-4 text-primary" />
            AI Powered Website Analysis
          </span>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mx-auto max-w-[20ch] text-balance text-4xl leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Analyze your website like a professional agency
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto max-w-[52ch] text-pretty text-base text-muted-foreground sm:text-lg">
            Paste your website address and receive beautiful, actionable insights — so you can
            improve with confidence.
          </p>
        </Reveal>

        <Reveal delay={240} className="flex w-full justify-center">
          <UrlAnalyzeForm formRef={formRef} onAnalyze={onAnalyze} />
        </Reveal>

        <Reveal delay={320}>
          <TrustIndicators />
        </Reveal>
      </div>
    </section>
  );
}
