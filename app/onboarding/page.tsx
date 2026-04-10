"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuickStartWizard } from "../components/QuickStartWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const skipped = localStorage.getItem("fuelos_quickstart_skipped") === "1";
      const isNew =
        !skipped &&
        localStorage.getItem("fuelos_onboarding_profile_done") === null &&
        localStorage.getItem("athlete-profile") === null;
      if (!isNew) {
        router.replace("/");
        return;
      }
    } catch {
      router.replace("/");
      return;
    }
    queueMicrotask(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#fff",
        }}
        aria-busy
      />
    );
  }

  return (
    <QuickStartWizard
      onSkip={() => {
        try {
          localStorage.setItem("fuelos_quickstart_skipped", "1");
        } catch {
          /* ignore */
        }
        router.replace("/");
      }}
      onComplete={() => {
        router.replace("/plan?step=plan");
      }}
    />
  );
}
