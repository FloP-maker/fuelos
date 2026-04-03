"use client";

import type { CourseGeometry } from "../lib/types";

type Props = {
  geometry: CourseGeometry;
  highlightKm?: number[];
};

export function ElevationProfileChart({ geometry, highlightKm = [] }: Props) {
  const kms = geometry.cumulativeKm;
  const eles = geometry.elevationM;
  if (kms.length < 2) return null;

  const w = 640;
  const h = 120;
  const padL = 36;
  const padR = 10;
  const padY = 10;
  const innerW = w - padL - padR;
  const innerH = h - padY * 2;

  const maxKm = kms[kms.length - 1] || 1;
  const minEl = Math.min(...eles);
  const maxEl = Math.max(...eles);
  const elSpan = Math.max(50, maxEl - minEl);

  const xAt = (km: number) => padL + (km / maxKm) * innerW;
  const yAt = (el: number) => padY + innerH - ((el - minEl) / elSpan) * innerH;

  const d = kms
    .map((km, i) => `${i === 0 ? "M" : "L"} ${xAt(km).toFixed(1)} ${yAt(eles[i]!).toFixed(1)}`)
    .join(" ");

  const closeArea = `${d} L ${xAt(maxKm).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${padL} ${(padY + innerH).toFixed(1)} Z`;

  const vMarks = highlightKm
    .filter((km) => km >= 0 && km <= maxKm)
    .map((km, i) => (
      <line
        key={i}
        x1={xAt(km)}
        x2={xAt(km)}
        y1={padY}
        y2={padY + innerH}
        stroke="var(--color-accent, #22c55e)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.7}
      />
    ));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        role="img"
        aria-label="Profil d’élévation du parcours"
      >
        <defs>
          <linearGradient id="elGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
          </linearGradient>
        </defs>
        <path d={closeArea} fill="url(#elGrad)" stroke="none" />
        <path
          d={d}
          fill="none"
          stroke="var(--color-accent, #22c55e)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {vMarks}
        <text x={4} y={padY + 12} fontSize={10} fill="var(--color-text-muted, #888)">
          {Math.round(maxEl)} m
        </text>
        <text x={4} y={padY + innerH} fontSize={10} fill="var(--color-text-muted, #888)">
          {Math.round(minEl)} m
        </text>
        <text
          x={padL + innerW / 2}
          y={h - 2}
          fontSize={10}
          textAnchor="middle"
          fill="var(--color-text-muted, #888)"
        >
          {maxKm.toFixed(1)} km
        </text>
      </svg>
    </div>
  );
}
