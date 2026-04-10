-- OAuth tokens for activity providers
CREATE TABLE "provider_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT,
  "oauth_token_secret" TEXT,
  "expires_at" TIMESTAMP(3),
  "athlete_id" TEXT,
  "athlete_name" TEXT,
  "scope" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_tokens_provider_check" CHECK ("provider" IN ('strava', 'garmin', 'wahoo'))
);

CREATE UNIQUE INDEX "provider_tokens_user_id_provider_key" ON "provider_tokens"("user_id", "provider");
CREATE INDEX "provider_tokens_provider_idx" ON "provider_tokens"("provider");

ALTER TABLE "provider_tokens"
  ADD CONSTRAINT "provider_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Cached provider activities to reduce API calls and rate-limit pressure
CREATE TABLE "cached_activities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_activity_id" TEXT NOT NULL,
  "summary" JSONB NOT NULL,
  "detail" JSONB,
  "gpx_track" JSONB,
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cached_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cached_activities_provider_check" CHECK ("provider" IN ('strava', 'garmin', 'wahoo'))
);

CREATE UNIQUE INDEX "cached_activities_user_id_provider_provider_activity_id_key"
  ON "cached_activities"("user_id", "provider", "provider_activity_id");
CREATE INDEX "cached_activities_user_id_provider_fetched_at_idx"
  ON "cached_activities"("user_id", "provider", "fetched_at");

ALTER TABLE "cached_activities"
  ADD CONSTRAINT "cached_activities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
