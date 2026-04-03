"use client";

import { useCallback, useId } from "react";
import { elevationAtDistanceKm } from "../lib/courseGeometry";
import type { CourseGeometry } from "../lib/types";

type Props = {
  geometry: CourseGeometry;
  highlightKm?: number[];
  /** Mise en avant d’une prise timeline (km le long du parcours). */
  selectedKm?: number | null;
  /** Survol synchronisé carte ↔ profil (km). */
  hoverKm?: number | null;
  /** Notifie le km sous le curseur sur le profil (null si on sort du SVG sans que le parent gère). */
  onProfileHoverKm?: (km: number | null) => void;
  /** Affiche départ / arrivée sur l’axe du profil. */
  showStartEnd?: boolean;
};

const W = 640;
const H = 120;
const PAD_L = 36;
const PAD_R = 10;
const PAD_Y = 10;

export function ElevationProfileChart({
  geometry,
  highlightKm = [],
  selectedKm = null,
  hoverKm = null,
  onProfileHoverKm,
  showStartEnd = true,
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const kms = geometry.cumulativeKm;
  const eles = geometry.elevationM;
  if (kms.length < 2) return null;

  const padL = PAD_L;
  const padR = PAD_R;
  const padY = PAD_Y;
  const innerW = W - padL - padR;
  const innerH = H - padY * 2;

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

  const selKm =
    selectedKm != null && selectedKm >= 0 && selectedKm <= maxKm ? selectedKm : null;
  const selEl = selKm != null ? elevationAtDistanceKm(geometry, selKm) : null;

  const hovKm =
    hoverKm != null && hoverKm >= 0 && hoverKm <= maxKm ? hoverKm : null;
  const hovEl = hovKm != null ? elevationAtDistanceKm(geometry, hovKm) : null;

  const vMarks = highlightKm
    .filter((km) => km >= 0 && km <= maxKm)
    .filter((km) => selKm == null || Math.abs(km - selKm) > 0.08)
    .filter((km) => hovKm == null || Math.abs(km - hovKm) > 0.06)
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

  const selectedMark =
    selKm != null && selEl != null ? (
      <g>
        <line
          x1={xAt(selKm)}
          x2={xAt(selKm)}
          y1={padY}
          y2={padY + innerH}
          stroke="#fbbf24"
          strokeWidth={2.5}
          opacity={0.95}
        />
        <circle
          cx={xAt(selKm)}
          cy={yAt(selEl)}
          r={6}
          fill="#fbbf24"
          stroke="#fff"
          strokeWidth={2}
        />
      </g>
    ) : null;

  const hoverMark =
    hovKm != null && hovEl != null ? (
      <g style={{ pointerEvents: "none" }}>
        <line
          x1={xAt(hovKm)}
          x2={xAt(hovKm)}
          y1={padY}
          y2={padY + innerH}
          stroke="#06b6d4"
          strokeWidth={1.75}
          opacity={0.92}
        />
        <circle
          cx={xAt(hovKm)}
          cy={yAt(hovEl)}
          r={5}
          fill="#06b6d4"
          stroke="#fff"
          strokeWidth={2}
        />
      </g>
    ) : null;

  const handleSvgMouse = useCallback(
    (clientX: number, rect: DOMRect) => {
      if (!onProfileHoverKm) return;
      const scale = W / rect.width;
      const svgX = (clientX - rect.left) * scale;
      if (svgX < padL || svgX > padL + innerW) {
        onProfileHoverKm(null);
        return;
      }
      const km = ((svgX - padL) / innerW) * maxKm;
      onProfileHoverKm(Math.max(0, Math.min(maxKm, km)));
    },
    [onProfileHoverKm, padL, innerW, maxKm]
  );

  const startEndMarks = showStartEnd ? (
    <g>
      <line
        x1={xAt(0)}
        x2={xAt(0)}
        y1={padY + innerH - 8}
        y2={padY + innerH}
        stroke="#15803d"
        strokeWidth={2.5}
      />
      <text
        x={xAt(0) + 2}
        y={H - 2}
        fontSize={9}
        fontWeight={700}
        fill="#15803d"
      >
        Départ
      </text>
      <line
        x1={xAt(maxKm)}
        x2={xAt(maxKm)}
        y1={padY + innerH - 8}
        y2={padY + innerH}
        stroke="#b45309"
        strokeWidth={2.5}
      />
      <text
        x={xAt(maxKm) - 2}
        y={H - 2}
        fontSize={9}
        fontWeight={700}
        textAnchor="end"
        fill="#b45309"
      >
        Arrivée
      </text>
    </g>
  ) : null;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", cursor: onProfileHoverKm ? "crosshair" : "default" }}
        role="img"
        aria-label="Profil d’élévation du parcours"
        onMouseMove={(e) => {
          if (!onProfileHoverKm) return;
          const rect = e.currentTarget.getBoundingClientRect();
          handleSvgMouse(e.clientX, rect);
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
          </linearGradient>
        </defs>
        <path d={closeArea} fill={`url(#${gradId})`} stroke="none" />
        <path
          d={d}
          fill="none"
          stroke="var(--color-accent, #22c55e)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {startEndMarks}
        {vMarks}
        {selectedMark}
        {hoverMark}
        <text x={4} y={padY + 12} fontSize={10} fill="var(--color-text-muted, #888)">
          {Math.round(maxEl)} m
        </text>
        <text x={4} y={padY + innerH} fontSize={10} fill="var(--color-text-muted, #888)">
          {Math.round(minEl)} m
        </text>
        <text
          x={padL + innerW / 2}
          y={H - 2}
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
