import { Reveal } from "@/components/motion/reveal";

/** Executive summary — at most three plain-language paragraphs. */
export function ExecutiveSummary({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="space-y-4">
        {paragraphs.slice(0, 3).map((paragraph, index) => (
          <Reveal key={paragraph.slice(0, 24)} delay={index * 100}>
            <p className="max-w-3xl text-sm leading-relaxed text-foreground/85 sm:text-base">
              {paragraph}
            </p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
