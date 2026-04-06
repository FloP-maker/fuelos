-- Strava OAuth (import d'activités), lié à User

CREATE TABLE "strava_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "strava_connections_user_id_key" ON "strava_connections"("user_id");

ALTER TABLE "strava_connections" ADD CONSTRAINT "strava_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
