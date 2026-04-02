'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const DEBRIEFS_STORAGE_KEY = 'fuelos_debriefs';

type StoredDebrief = { finishedAt?: string; [key: string]: unknown };

async function syncLocalDebriefsToCloud(): Promise<void> {
  let local: StoredDebrief[];
  try {
    const raw = localStorage.getItem(DEBRIEFS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    local = Array.isArray(parsed) ? (parsed as StoredDebrief[]) : [];
  } catch {
    return;
  }
  if (local.length === 0) return;

  const listRes = await fetch('/api/user/debriefs?limit=500', { credentials: 'include' });
  if (!listRes.ok) return;
  const j = (await listRes.json()) as { debriefs?: { finishedAt: string }[] };
  const cloudTimes = new Set(
    (j.debriefs ?? []).map((row) => new Date(row.finishedAt).getTime())
  );

  for (const item of local) {
    const fin = item?.finishedAt;
    if (typeof fin !== 'string') continue;
    const t = new Date(fin).getTime();
    if (Number.isNaN(t) || cloudTimes.has(t)) continue;

    const post = await fetch('/api/user/debriefs', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: item, finishedAt: fin }),
    });
    if (post.ok) cloudTimes.add(t);
  }
}

/**
 * Après la première connexion, pousse les debriefs présents uniquement en localStorage
 * vers la base (idempotent : repose sur finishedAt pour éviter les doublons).
 */
export function DebriefCloudMigration() {
  const { data: session, status } = useSession();
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      lastUserRef.current = null;
      return;
    }
    const uid = session.user.id;
    if (lastUserRef.current === uid) return;
    lastUserRef.current = uid;

    void syncLocalDebriefsToCloud().catch(() => {
      /* sync best-effort */
    });
  }, [status, session?.user?.id]);

  return null;
}
