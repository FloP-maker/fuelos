import type { ActivityProvider, ActivityProviderName } from "@/types/integrations";
import { garminProvider } from "@/lib/integrations/garmin";
import { stravaProvider } from "@/lib/integrations/strava";
import { wahooProvider } from "@/lib/integrations/wahoo";

export const providers: Record<ActivityProviderName, ActivityProvider> = {
  strava: stravaProvider,
  garmin: garminProvider,
  wahoo: wahooProvider,
};
