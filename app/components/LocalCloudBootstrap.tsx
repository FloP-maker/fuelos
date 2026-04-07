'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const ACTIVE_PLAN_KEY = 'fuelos_active_plan';
const ATHLETE_PROFILE_KEY = 'athlete-profile';

type LocalActivePlan = {
  fuelPlan?: unknown;
  plan?: unknown;
  event?: { sport?: string; distance?: number };
  [key: string]: unknown;
};

async function migrateLocalStateToCloud(): Promise<void> {
  const localPlanRaw = localStorage.getItem(ACTIVE_PLAN_KEY);
  if (localPlanRaw) {
    try {
      const localPlan = JSON.parse(localPlanRaw) as LocalActivePlan;
      const hasTimeline =
        localPlan &&
        typeof localPlan === 'object' &&
        ((localPlan.fuelPlan as { timeline?: unknown[] } | undefined)?.timeline?.length ||
          (localPlan.plan as { timeline?: unknown[] } | undefined)?.timeline?.length);

      if (hasTimeline) {
        const activeRes = await fetch('/api/user/plans/active', { credentials: 'include' });
        if (activeRes.ok) {
          const activeBody = (await activeRes.json()) as { snapshot?: unknown | null };
          if (!activeBody.snapshot) {
            const title =
              localPlan.event?.sport && typeof localPlan.event.distance === 'number'
                ? `${localPlan.event.sport} — ${localPlan.event.distance} km`
                : 'Plan importé';
            await fetch('/api/user/plans', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payload: localPlan, title, setActive: true }),
            });
          }
        }
      }
    } catch {
      /* ignore invalid local json */
    }
  }

  const localProfileRaw = localStorage.getItem(ATHLETE_PROFILE_KEY);
  if (localProfileRaw) {
    try {
      const localProfile = JSON.parse(localProfileRaw) as unknown;
      if (localProfile && typeof localProfile === 'object') {
        const cloudProfilesRes = await fetch('/api/user/athlete-profiles', { credentials: 'include' });
        if (cloudProfilesRes.ok) {
          const cloudProfiles = (await cloudProfilesRes.json()) as { profiles?: unknown[] };
          if (!Array.isArray(cloudProfiles.profiles) || cloudProfiles.profiles.length === 0) {
            await fetch('/api/user/athlete-profiles', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'Profil principal',
                data: localProfile,
                isDefault: true,
              }),
            });
          }
        }
      }
    } catch {
      /* ignore invalid local json */
    }
  }
}

export function LocalCloudBootstrap() {
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

    void migrateLocalStateToCloud().catch(() => {
      /* best-effort migration */
    });
  }, [status, session?.user?.id]);

  return null;
}
