/** Style visuel des pastilles « type Nolio » selon le sport (texte libre). */

export type RaceSportChip = {
  icon: string;
  /** Classes Tailwind pour la pastille */
  pillClass: string;
};

export function raceSportChip(sport: string): RaceSportChip {
  const s = sport.toLowerCase();
  if (s.includes("ultra") || (s.includes("trail") && s.includes("ultra"))) {
    return {
      icon: "⛰",
      pillClass:
        "border border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
    };
  }
  if (s.includes("trail")) {
    return {
      icon: "🥾",
      pillClass: "border border-emerald-600/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    };
  }
  if (s.includes("tri")) {
    return {
      icon: "🔷",
      pillClass: "border border-violet-500/25 bg-violet-500/12 text-violet-900 dark:text-violet-100",
    };
  }
  if (s.includes("vélo") || s.includes("velo") || s.includes("cycl") || s.includes("vtt")) {
    return {
      icon: "🚴",
      pillClass: "border border-blue-500/25 bg-blue-500/12 text-blue-900 dark:text-blue-100",
    };
  }
  if (s.includes("route") || s.includes("marathon") || s.includes("running") || s.includes("course")) {
    return {
      icon: "🏃",
      pillClass: "border border-sky-500/25 bg-sky-500/12 text-sky-900 dark:text-sky-100",
    };
  }
  return {
    icon: "🏁",
    pillClass: "border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)]",
  };
}
