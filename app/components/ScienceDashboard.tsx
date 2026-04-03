"use client";

import { useMemo, useState } from "react";
import type { AthleteProfile, EventDetails, FuelPlan } from "../lib/types";
import {
  computeScienceMetrics,
  SCIENCE_SOURCES,
  type ScienceMetricId,
  type ScienceMetricsResult,
} from "../lib/scienceMetrics";

const NAV: { id: ScienceMetricId; label: string; hint: string }[] = [
  { id: "fuel-score", label: "Fuel Score", hint: "Optimalité globale du plan" },
  { id: "glycogen-balance", label: "Équilibre glycogène", hint: "Jauge fin de course" },
  { id: "glycogen-curve", label: "Déplétion glycogène", hint: "Courbe sur la durée" },
  { id: "energy-split", label: "Énergie CHO vs lipides", hint: "Répartition métabolique" },
  { id: "cho-rate", label: "Apport CHO/h", hint: "Charge glucidique du plan" },
  { id: "hydration", label: "Hydratation", hint: "Eau vs pertes estimées" },
  { id: "sodium", label: "Sodium", hint: "Na⁺ / contexte" },
];

function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function GlycogenGauge({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 52;
  const cx = 60;
  const cy = 58;
  const start = Math.PI;
  const sweep = Math.PI;
  const angle = start + (sweep * p) / 100;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const large = p > 50 ? 1 : 0;
  const color =
    p >= 45 ? "var(--color-accent)" : p >= 22 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox="0 0 120 72" style={{ width: "100%", maxWidth: 220, display: "block" }}>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${x} ${y}`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight={800} fill="var(--color-text)">
        {Math.round(p)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
        résiduel modélisé
      </text>
    </svg>
  );
}

function EnergyBars({ choPct, fatPct }: { choPct: number; fatPct: number }) {
  const h = 112;
  const wCho = (choPct / 100) * h;
  const wFat = (fatPct / 100) * h;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 28, height: 140 }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: h,
            borderRadius: 8,
            background: "var(--color-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: wCho,
              background: "var(--color-accent)",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--color-text)" }}>
          Glucides
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{choPct}%</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: h,
            borderRadius: 8,
            background: "var(--color-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <div style={{ height: wFat, background: "#94a3b8", borderRadius: "0 0 8px 8px" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--color-text)" }}>
          Lipides
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{fatPct}%</div>
      </div>
    </div>
  );
}

function GlycogenCurveChart({ series, durationMin }: { series: ScienceMetricsResult["glycogenSeries"]; durationMin: number }) {
  const W = 400;
  const H = 120;
  const PL = 36;
  const PR = 12;
  const PT = 10;
  const PB = 22;
  const gW = W - PL - PR;
  const gH = H - PT - PB;
  if (series.length === 0) return null;
  const maxG = Math.max(...series.map((s) => s.glycogenG), 1);
  const tx = (m: number) => PL + (m / durationMin) * gW;
  const ty = (gVal: number) => PT + gH - (gVal / maxG) * gH;
  const d = series
    .map((s, i) => `${i === 0 ? "M" : "L"}${tx(s.timeMin).toFixed(1)},${ty(s.glycogenG).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <line x1={PL} x2={PL} y1={PT} y2={PT + gH} stroke="var(--color-border)" strokeWidth={1} />
      <line x1={PL} x2={W - PR} y1={PT + gH} y2={PT + gH} stroke="var(--color-border)" strokeWidth={1} />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2.2} strokeLinejoin="round" />
      <text x={PL} y={H - 4} fontSize={9} fill="var(--color-text-muted)">
        0
      </text>
      <text x={W - PR} y={H - 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">
        {formatHours(durationMin)}
      </text>
      <text x={PL - 4} y={ty(maxG) + 3} textAnchor="end" fontSize={8} fill="var(--color-text-muted)">
        {Math.round(maxG)} g
      </text>
      <text x={PL - 4} y={PT + gH + 3} textAnchor="end" fontSize={8} fill="var(--color-text-muted)">
        0
      </text>
    </svg>
  );
}

function FormulaBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: "12px 0",
        padding: "12px 14px",
        borderRadius: 8,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        fontFamily: "ui-monospace, monospace",
        color: "var(--color-text)",
      }}
    >
      {children}
    </pre>
  );
}

function SourceList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12, lineHeight: 1.55, color: "var(--color-text-muted)" }}>
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 24)}`} style={{ marginBottom: 6 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

function buildMetricPanel(
  id: ScienceMetricId,
  plan: FuelPlan,
  profile: AthleteProfile,
  event: EventDetails,
  m: ScienceMetricsResult
): { title: string; value: string; explain: string; formula: string; sources: string[] } {
  const durH = event.targetTime;
  const totalCho = plan.timeline.reduce((s, it) => s + it.cho, 0);

  switch (id) {
    case "fuel-score":
      return {
        title: "Fuel Score",
        value: `${m.fuelScore} / 100`,
        explain:
          "Synthèse pédagogique (pas un diagnostic) : le plan est comparé à des repères usuels d’endurance — apport glucidique, eau par rapport à ta sudation estimée, sodium selon la météo, et une trajectoire de glycogène modélisée. Un score élevé indique une meilleure cohérence avec ces repères.",
        formula: `FuelScore ≈ 100 × (
  w₁·f(CHO/h) + w₂·f(eau / besoin sueur) +
  w₃·f(glycogène résiduel %) + w₄·f(Na⁺ / cible)
)\nw₁=0,34 · w₂=0,22 · w₃=0,28 · w₄=0,16`,
        sources: [SCIENCE_SOURCES.jeukendrupCHO, SCIENCE_SOURCES.acsmFluid, SCIENCE_SOURCES.burkeGlycogen],
      };
    case "glycogen-balance":
      return {
        title: "Équilibre glycogène (modèle simplifié)",
        value: `${Math.round(m.glycogenEndG)} g restants (~${Math.round(m.glycogenEndPct)} % du départ)`,
        explain:
          "On estime des réserves musculaires de départ dans une fourchette physiologique classique, puis on soustrait chaque quart d’heure une oxydation liée à l’intensité relative (allure + dénivelé), atténuée par les glucides consommés sur la timeline. La jauge montre le pourcentage résiduel : plus il est bas, plus le modèle prédit une déplétion marquante si l’effort réel suit ces hypothèses.",
        formula: `À chaque pas Δt = 15 min :\n  burn = (oxydation_horaire / 4) × (G / G₀)^0,35\n  épargne = min(1, CHO_ingéré / 22 g) × 0,88\n  G ← max(0, G − burn × (1 − épargne))\n\nG₀ ≈ clamp(10×masse + 40, 320, 620) g`,
        sources: [SCIENCE_SOURCES.burkeGlycogen, SCIENCE_SOURCES.jeukendrupCHO],
      };
    case "glycogen-curve":
      return {
        title: "Courbe de déplétion",
        value: `${m.glycogenSeries.length} points · pas 15 min`,
        explain:
          "La courbe relie les stocks modélisés au fil du temps. Elle sert à visualiser si les prises de la timeline « remontent » suffisamment la courbe (épargne du glycogène) ou si la pente reste forte (risque relatif de bonking dans ce scénario).",
        formula: "Abscisse : temps (min). Ordonnée : glycogène musculaire modélisé (g). Même récurrence que pour l’équilibre glycogène.",
        sources: [SCIENCE_SOURCES.burkeGlycogen],
      };
    case "energy-split":
      return {
        title: "Énergie : CHO vs lipides",
        value: `${m.energySplitChoPct} % CHO · ${m.energySplitFatPct} % lipides (oxydation estimée)`,
        explain:
          "À l’effort prolongé, la part des glucides oxydés augmente avec l’intensité (idée de « crossover »). Ici l’intensité est dérivée de la vitesse moyenne (sport + dénivelé), pas de la VO₂ mesurée : c’est une illustration pédagogique, pas une mesure calorimétrique.",
        formula: `%CHO ≈ 100 × clamp(0,38 + 0,5×intensité_relative, 0,38, 0,92)\n%lipides = 100 − %CHO\n\nintensité_relative ∈ scale(allure, D+, discipline)`,
        sources: [SCIENCE_SOURCES.vanLoonSubstrate, SCIENCE_SOURCES.burkeGlycogen],
      };
    case "cho-rate":
      return {
        title: "Apport glucidique moyen",
        value: `${plan.choPerHour} g CHO / h`,
        explain:
          "Moyenne des glucides ingérés sur la timeline, sur la durée prévue. Les recommandations pour l’endurance longue vont typiquement de ~30 g/h (tolérance faible) à 90 g/h (entraînement intestinal + mélange de glucides), selon la durée et l’intensité.",
        formula: `CHO/h = (Σ glucides timeline) / durée_heures\n≈ ${Math.round(totalCho)} g / ${durH} h ≈ ${plan.choPerHour} g/h`,
        sources: [SCIENCE_SOURCES.jeukendrupCHO, SCIENCE_SOURCES.burkeGlycogen],
      };
    case "hydration":
      return {
        title: "Hydratation vs sudation",
        value: `${plan.waterPerHour} ml/h · ratio ${m.hydrationAdequacyRatio.toFixed(2)} × besoin estimé`,
        explain:
          "Ton profil indique une sudation (L/h). On en déduit un besoin liquide de premier ordre et on compare au volume moyen du plan. En pratique, la soif, le sel, la météo et le profil de course modulent fortement le besoin réel.",
        formula: `besoin_liquide ≈ max(400 ml/h, sweatRate × 1000 ml/h)\nratio = eau_plan / besoin_liquide`,
        sources: [SCIENCE_SOURCES.acsmFluid],
      };
    case "sodium":
      return {
        title: "Sodium",
        value: `${plan.sodiumPerHour} mg Na⁺ / h`,
        explain:
          "Le plan est comparé à une cible indicative plus élevée par temps chaud (pertes sudorales) que par temps tempéré. Les besoins individuels varient : certains coureurs perdent beaucoup de sel dans la sueur.",
        formula: `cible_indicative ≈ ${event.weather.includes("Chaud") || event.weather.includes("chaud") ? "700" : "450"} mg/h (ordre de grandeur)\nScore Vue Science = f(Na⁺ plan / cible)`,
        sources: [SCIENCE_SOURCES.acsmFluid],
      };
    default:
      return { title: "", value: "", explain: "", formula: "", sources: [] };
  }
}

export function ScienceDashboard({
  plan,
  profile,
  event,
}: {
  plan: FuelPlan;
  profile: AthleteProfile;
  event: EventDetails;
}) {
  const [active, setActive] = useState<ScienceMetricId>("fuel-score");
  const metrics = useMemo(() => computeScienceMetrics(profile, event, plan), [profile, event, plan]);
  const panel = buildMetricPanel(active, plan, profile, event, metrics);
  const durationMin = Math.max(15, event.targetTime * 60);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        alignItems: "flex-start",
      }}
    >
      <nav
        aria-label="Métriques scientifiques"
        style={{
          position: "sticky",
          top: 8,
          flex: "1 1 200px",
          maxWidth: 260,
          minWidth: 180,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "4px 0",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          VUE SCIENCE
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${active === item.id ? "var(--color-accent)" : "var(--color-border)"}`,
              background: active === item.id ? "rgba(34,197,94,0.12)" : "var(--color-bg-card)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontWeight: active === item.id ? 700 : 500,
              fontSize: 13,
            }}
          >
            <div>{item.label}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, fontWeight: 400 }}>
              {item.hint}
            </div>
          </button>
        ))}
      </nav>

      <div style={{ flex: "3 1 320px", minWidth: 0 }}>
        <div
          style={{
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-card)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
            Transparence scientifique — modèles explicites à vocation pédagogique
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>{panel.title}</h3>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-accent)", marginTop: 10 }}>
            {panel.value}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text)", marginTop: 14, marginBottom: 0 }}>
            {panel.explain}
          </p>
          <div style={{ marginTop: 18, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>
            Formule (simplifiée)
          </div>
          <FormulaBlock>{panel.formula}</FormulaBlock>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>Sources</div>
          <SourceList items={panel.sources} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-card)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Fuel Score</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>
              {metrics.fuelScore}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>sur 100</div>
            <ul style={{ margin: "14px 0 0", paddingLeft: 16, fontSize: 11, color: "var(--color-text-muted)" }}>
              {metrics.fuelScoreBreakdown.map((b) => (
                <li key={b.label} style={{ marginBottom: 4 }}>
                  {b.label}: {b.score} (poids {Math.round(b.weight * 100)}%)
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-card)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, alignSelf: "start" }}>
              Jauge — glycogène fin de course
            </div>
            <GlycogenGauge pct={metrics.glycogenEndPct} />
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-card)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Oxydation estimée CHO / lipides</div>
            <EnergyBars choPct={metrics.energySplitChoPct} fatPct={metrics.energySplitFatPct} />
          </div>
        </div>

        <div
          style={{
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-card)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Déplétion glycogène sur {formatHours(durationMin)}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 12 }}>
            Stock initial modélisé ≈ {Math.round(metrics.glycogenInitialG)} g — intensité relative (proxy) ≈{" "}
            {(metrics.relativeIntensity * 100).toFixed(0)} %
          </div>
          <GlycogenCurveChart series={metrics.glycogenSeries} durationMin={durationMin} />
        </div>
      </div>
    </div>
  );
}
