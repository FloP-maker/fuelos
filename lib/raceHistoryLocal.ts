export const RACE_HISTORY_DRAFT_KEY = "fuelos_race_history_draft_v1";
export const RACE_HISTORY_OUTBOX_KEY = "fuelos_race_history_outbox_v1";

export type OutboxItem = {
  id: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
};

export function loadRaceHistoryDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RACE_HISTORY_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveRaceHistoryDraft<T>(draft: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RACE_HISTORY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearRaceHistoryDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RACE_HISTORY_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function readOutbox(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RACE_HISTORY_OUTBOX_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RACE_HISTORY_OUTBOX_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function enqueueRaceHistorySave(payload: unknown): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `rq_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const items = readOutbox();
  items.push({
    id,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  writeOutbox(items);
  return id;
}

export async function flushRaceHistoryOutbox(
  postFn: (payload: unknown) => Promise<boolean>
): Promise<number> {
  const items = readOutbox();
  if (items.length === 0) return 0;
  const remaining: OutboxItem[] = [];
  let flushed = 0;
  for (const item of items) {
    const ok = await postFn(item.payload).catch(() => false);
    if (ok) {
      flushed += 1;
    } else {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }
  writeOutbox(remaining);
  return flushed;
}
