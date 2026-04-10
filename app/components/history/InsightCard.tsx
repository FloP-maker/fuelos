'use client';

export type HistoryInsightCardProps = {
  text: string;
};

export function InsightCard({ text }: HistoryInsightCardProps) {
  return (
    <div
      className="flex gap-3 rounded-[var(--radius-md)] border border-amber-200/80 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/35"
      style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 35%, var(--color-border))' }}
    >
      <span className="shrink-0 text-[18px]" aria-hidden>
        💡
      </span>
      <p className="text-[13px] font-medium leading-relaxed text-[var(--color-text)]">{text}</p>
    </div>
  );
}
