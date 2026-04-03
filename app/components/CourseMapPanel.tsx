"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { positionAtDistanceKm } from "../lib/courseGeometry";
import type { AidStation, CourseGeometry, EventDetails, TimelineItem } from "../lib/types";
import { ElevationProfileChart } from "./ElevationProfileChart";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

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
};

export type CourseMapPanelProps = {
  event: EventDetails;
  geometry: CourseGeometry;
  timeline?: TimelineItem[];
};

export default function CourseMapPanel({ event, geometry, timeline }: CourseMapPanelProps) {
  const mapRef = useRef<MapRef>(null);

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
      out.push({
        key: `fuel-${i}-${item.timeMin}`,
        lng,
        lat,
        kind: "fuel",
        label: item.product,
        sub: `${Math.round(km * 10) / 10} km · ${item.timeMin} min`,
      });
    });

    return out;
  }, [event, geometry, timeline]);

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
          {markers.map((m) => (
            <Marker
              key={m.key}
              longitude={m.lng}
              latitude={m.lat}
              anchor="center"
            >
              <div
                title={`${m.label}${m.sub ? ` · ${m.sub}` : ""}`}
                style={{
                  width: m.kind === "aid" ? 22 : 18,
                  height: m.kind === "aid" ? 22 : 18,
                  borderRadius: m.kind === "aid" ? 6 : 99,
                  background: m.kind === "aid" ? "#3b82f6" : "var(--color-accent, #22c55e)",
                  border: "2px solid #fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                }}
              />
            </Marker>
          ))}
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
        <ElevationProfileChart geometry={geometry} highlightKm={highlightKm} />
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
                borderRadius: 2,
                background: "#3b82f6",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Ravitos
          </span>
        </div>
      </div>
    </div>
  );
}
