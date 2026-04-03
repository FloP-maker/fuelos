"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  elevationAtDistanceKm,
  nearestPointOnCourse,
  positionAtDistanceKm,
} from "../lib/courseGeometry";
import type { AidStation, CourseGeometry, EventDetails, TimelineItem } from "../lib/types";
import { ElevationProfileChart } from "./ElevationProfileChart";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Au-delà de cette distance au tracé (km), le survol carte n’affiche pas de curseur synchronisé. */
const HOVER_MAX_DIST_KM = 2.8;

function boundsFromCoords(coords: [number, number][]) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLng, maxLng, minLat, maxLat };
}

function kmFromTimelineItem(timeMin: number, event: EventDetails): number {
  if (event.targetTime <= 0 || event.distance <= 0) return 0;
  return (timeMin / 60 / event.targetTime) * event.distance;
}

type MapMarker = {
  key: string;
  lng: number;
  lat: number;
  label: string;
  kind: "fuel" | "aid";
  sub?: string;
  selected?: boolean;
};

export type CourseMapPanelProps = {
  event: EventDetails;
  geometry: CourseGeometry;
  timeline?: TimelineItem[];
  /** Index dans `timeline` de la prise sélectionnée (liste plan, pas triée). */
  selectedFuelOrigIdx?: number | null;
};

export default function CourseMapPanel({
  event,
  geometry,
  timeline,
  selectedFuelOrigIdx = null,
}: CourseMapPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverKm, setHoverKm] = useState<number | null>(null);

  const markers = useMemo(() => {
    const out: MapMarker[] = [];
    const coords = geometry.coordinates;
    if (coords.length < 2) return out;

    event.aidStations?.forEach((a: AidStation, i) => {
      const [lng, lat] = positionAtDistanceKm(geometry, a.distanceKm);
      out.push({
        key: `aid-${i}`,
        lng,
        lat,
        kind: "aid",
        label: a.name || `Ravito ${i + 1}`,
        sub: `${a.distanceKm} km`,
      });
    });

    timeline?.forEach((item, i) => {
      const km = kmFromTimelineItem(item.timeMin, event);
      const [lng, lat] = positionAtDistanceKm(geometry, km);
      const selected = selectedFuelOrigIdx === i;
      out.push({
        key: `fuel-${i}-${item.timeMin}`,
        lng,
        lat,
        kind: "fuel",
        label: item.product,
        sub: `${Math.round(km * 10) / 10} km · ${item.timeMin} min`,
        selected,
      });
    });

    return out;
  }, [event, geometry, timeline, selectedFuelOrigIdx]);

  const selectedKm = useMemo(() => {
    if (
      selectedFuelOrigIdx == null ||
      !timeline ||
      selectedFuelOrigIdx < 0 ||
      selectedFuelOrigIdx >= timeline.length
    ) {
      return null;
    }
    return kmFromTimelineItem(timeline[selectedFuelOrigIdx]!.timeMin, event);
  }, [selectedFuelOrigIdx, timeline, event]);

  const flyTokenRef = useRef(0);
  useEffect(() => {
    if (selectedKm == null || geometry.coordinates.length < 2) return;
    const [lng, lat] = positionAtDistanceKm(geometry, selectedKm);
    const map = mapRef.current?.getMap();
    if (!map) return;
    const token = ++flyTokenRef.current;
    const run = () => {
      if (token !== flyTokenRef.current) return;
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 13.2),
        duration: 700,
        essential: true,
      });
    };
    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [selectedKm, geometry]);

  const hoverLngLat = useMemo((): [number, number] | null => {
    if (hoverKm == null || geometry.coordinates.length < 2) return null;
    const maxKm = geometry.cumulativeKm[geometry.cumulativeKm.length - 1] ?? 0;
    if (maxKm <= 0) return null;
    return positionAtDistanceKm(geometry, hoverKm);
  }, [geometry, hoverKm]);

  const startEnd = useMemo(() => {
    const c = geometry.coordinates;
    if (c.length < 2) return null;
    const maxKm = geometry.cumulativeKm[geometry.cumulativeKm.length - 1] ?? 0;
    return {
      start: c[0]!,
      end: c[c.length - 1]!,
      distanceKm: maxKm,
    };
  }, [geometry]);

  const lineFeature = useMemo(
    () =>
      ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: geometry.coordinates,
        },
      }) as const,
    [geometry.coordinates]
  );

  const highlightKm = useMemo(() => {
    const hs: number[] = [];
    event.aidStations?.forEach((a) => hs.push(a.distanceKm));
    timeline?.forEach((t) => hs.push(kmFromTimelineItem(t.timeMin, event)));
    return hs;
  }, [event, timeline]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || geometry.coordinates.length < 2) return;
    const b = boundsFromCoords(geometry.coordinates);
    const w = b.maxLng - b.minLng;
    const h = b.maxLat - b.minLat;
    if (w < 1e-6 && h < 1e-6) {
      map.jumpTo({ center: [b.minLng, b.minLat], zoom: 13 });
      return;
    }
    map.fitBounds(
      [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ],
      { padding: 56, maxZoom: 14, duration: 0 }
    );
  }, [geometry.coordinates]);

  const center = geometry.coordinates[0] ?? [2.3522, 48.8566];

  return (
    <div
      onMouseLeave={() => setHoverKm(null)}
      style={{
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        background: "var(--color-bg-card)",
      }}
    >
      <div style={{ height: 320, width: "100%", position: "relative" }}>
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude: center[0],
            latitude: center[1],
            zoom: 12,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          onMouseMove={(e) => {
            const { lng, lat } = e.lngLat;
            const { km, distanceKm } = nearestPointOnCourse(geometry, lng, lat);
            if (distanceKm <= HOVER_MAX_DIST_KM) setHoverKm(km);
            else setHoverKm(null);
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="course-line" type="geojson" data={lineFeature}>
            <Layer
              id="course-line-layer"
              type="line"
              paint={{
                "line-color": "#22c55e",
                "line-width": 4,
                "line-opacity": 0.9,
              }}
            />
          </Source>
          {markers.map((m) => {
            const fuelSel = m.kind === "fuel" && m.selected;
            const w = m.kind === "aid" ? 22 : fuelSel ? 26 : 18;
            const h = m.kind === "aid" ? 22 : fuelSel ? 26 : 18;
            const bg =
              m.kind === "aid" ? "#3b82f6" : fuelSel ? "#fbbf24" : "var(--color-accent, #22c55e)";
            return (
              <Marker key={m.key} longitude={m.lng} latitude={m.lat} anchor="center">
                <div
                  title={`${m.label}${m.sub ? ` · ${m.sub}` : ""}`}
                  style={{
                    width: w,
                    height: h,
                    borderRadius: m.kind === "aid" ? 6 : 99,
                    background: bg,
                    border: fuelSel ? "3px solid #fff" : "2px solid #fff",
                    boxShadow: fuelSel
                      ? "0 0 0 3px rgba(251,191,36,0.55), 0 4px 14px rgba(0,0,0,0.4)"
                      : "0 1px 4px rgba(0,0,0,0.35)",
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                />
              </Marker>
            );
          })}
          {startEnd ? (
            <>
              <Marker longitude={startEnd.start[0]} latitude={startEnd.start[1]} anchor="center">
                <div
                  title={`Départ · 0 km`}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 8,
                    background: "#15803d",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                    transform: "translate(-50%, calc(-100% - 10px))",
                  }}
                >
                  Départ
                </div>
              </Marker>
              <Marker longitude={startEnd.end[0]} latitude={startEnd.end[1]} anchor="center">
                <div
                  title={`Arrivée · ${startEnd.distanceKm.toFixed(1)} km`}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 8,
                    background: "#b45309",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                    transform: "translate(-50%, calc(-100% - 10px))",
                  }}
                >
                  Arrivée
                </div>
              </Marker>
            </>
          ) : null}
          {hoverLngLat ? (
            <Marker longitude={hoverLngLat[0]} latitude={hoverLngLat[1]} anchor="center">
              <div
                title={`${hoverKm != null ? `${hoverKm.toFixed(2)} km` : ""}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 99,
                  background: "rgba(6,182,212,0.35)",
                  border: "3px solid #06b6d4",
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.9)",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
            </Marker>
          ) : null}
        </Map>
      </div>
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--color-border)" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.6px",
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          PROFIL D’ÉLÉVATION
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            margin: "0 0 8px",
            lineHeight: 1.45,
          }}
        >
          Survol de la trace ou du profil : position liée (km / altitude).
        </p>
        {hoverKm != null ? (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#06b6d4",
              margin: "0 0 8px",
              letterSpacing: "0.02em",
            }}
          >
            {hoverKm.toFixed(2)} km · {Math.round(elevationAtDistanceKm(geometry, hoverKm))} m
          </div>
        ) : null}
        <ElevationProfileChart
          geometry={geometry}
          highlightKm={highlightKm}
          selectedKm={selectedKm}
          hoverKm={hoverKm}
          onProfileHoverKm={setHoverKm}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 10,
            fontSize: 11,
            color: "var(--color-text-muted)",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 99,
                background: "var(--color-accent, #22c55e)",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Prises (plan)
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 99,
                background: "#fbbf24",
                marginRight: 6,
                verticalAlign: "middle",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
              }}
            />
            Sélection (timeline)
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "#3b82f6",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Ravitos
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "#15803d",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Départ
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "#b45309",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Arrivée
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 99,
                background: "#06b6d4",
                marginRight: 6,
                verticalAlign: "middle",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
              }}
            />
            Survol
          </span>
        </div>
      </div>
    </div>
  );
}
