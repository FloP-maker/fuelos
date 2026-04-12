import type { LucideIcon } from "lucide-react";
import { Bike, Footprints, Flag, Mountain, Waves } from "lucide-react";

export type RaceSportVisual = {
  Icon: LucideIcon;
  /** Pastille discrète (fond + texte) */
  pillClass: string;
};

/** Repère visuel par discipline — icônes Lucide, tons doux. */
export function raceSportVisual(sport: string): RaceSportVisual {
  const s = sport.toLowerCase();
  if (s.includes("ultra") || (s.includes("trail") && s.includes("ultra"))) {
    return {
      Icon: Mountain,
      pillClass:
        "bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
    };
  }
  if (s.includes("trail")) {
    return {
      Icon: Mountain,
      pillClass:
        "bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-[var(--color-text)] ring-1 ring-[var(--color-border-subtle)]",
    };
  }
  if (s.includes("tri")) {
    return {
      Icon: Waves,
      pillClass:
        "bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,#8b5cf6_20%,transparent)] dark:bg-[color-mix(in_srgb,#a78bfa_10%,transparent)]",
    };
  }
  if (s.includes("vélo") || s.includes("velo") || s.includes("cycl") || s.includes("vtt")) {
    return {
      Icon: Bike,
      pillClass:
        "bg-[color-mix(in_srgb,#3b82f6_10%,transparent)] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,#3b82f6_18%,transparent)] dark:bg-[color-mix(in_srgb,#60a5fa_8%,transparent)]",
    };
  }
  if (s.includes("route") || s.includes("marathon") || s.includes("running") || s.includes("course")) {
    return {
      Icon: Footprints,
      pillClass:
        "bg-[color-mix(in_srgb,#0ea5e9_10%,transparent)] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,#0ea5e9_18%,transparent)] dark:bg-[color-mix(in_srgb,#38bdf8_8%,transparent)]",
    };
  }
  return {
    Icon: Flag,
    pillClass: "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-subtle)]",
  };
}

/** Pastille 6px sous une case jour (couleur par sport). Trail → rouge. */
export function raceSportDotClass(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes("ultra") || (s.includes("trail") && s.includes("ultra"))) {
    return "bg-[#b91c1c]";
  }
  if (s.includes("trail")) {
    return "bg-[#dc2626]";
  }
  if (s.includes("tri")) {
    return "bg-[#7c3aed]";
  }
  if (s.includes("vélo") || s.includes("velo") || s.includes("cycl") || s.includes("vtt")) {
    return "bg-[#2563eb]";
  }
  if (s.includes("route") || s.includes("marathon") || s.includes("running") || s.includes("course")) {
    return "bg-[#0ea5e9]";
  }
  return "bg-[#2d6a4f]";
}
