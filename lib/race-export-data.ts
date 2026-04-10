import { loadRaces } from '@/lib/races';
import type { RaceEntry } from '@/lib/types/race';

/**
 * Récupère une course pour l’export (fiche imprimable).
 * Aujourd’hui : localStorage via `loadRaces`.
 * Futur : remplacer par un fetch serveur / `GET /api/user/races/[id]` sans changer l’UI (`RaceExportView`).
 */
export function getRaceEntryForExport(raceId: string): RaceEntry | null {
  if (!raceId.trim()) return null;
  return loadRaces().find((r) => r.id === raceId) ?? null;
}

export type { RaceEntry };
