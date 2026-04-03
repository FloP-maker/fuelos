import { downsampleCourseGeometry } from "./courseGeometry";
import type { EventDetails } from "./types";

/** Limite les points du tracé dans les URLs de partage (longueur). */
const MAX_SHARE_TRACK_POINTS = 64;

export function toShareableEvent(event: EventDetails): EventDetails {
  if (!event.courseGeometry) return event;
  return {
    ...event,
    courseGeometry: downsampleCourseGeometry(event.courseGeometry, MAX_SHARE_TRACK_POINTS),
  };
}
