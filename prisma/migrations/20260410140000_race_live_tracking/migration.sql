-- Enums
CREATE TYPE "RaceSessionStatus" AS ENUM ('active', 'paused', 'finished');

CREATE TYPE "PlannedIntakeStatus" AS ENUM ('pending', 'taken', 'skipped', 'modified', 'vomited', 'delayed');

-- race_sessions
CREATE TABLE "race_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "race_event_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "status" "RaceSessionStatus" NOT NULL,
    "current_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_min" INTEGER NOT NULL DEFAULT 0,
    "live_stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "race_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "race_sessions_user_id_idx" ON "race_sessions"("user_id");

CREATE INDEX "race_sessions_race_event_id_idx" ON "race_sessions"("race_event_id");

-- planned_intakes
CREATE TABLE "planned_intakes" (
    "id" TEXT NOT NULL,
    "race_session_id" TEXT NOT NULL,
    "race_event_id" TEXT,
    "sort_index" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at_min" INTEGER NOT NULL,
    "scheduled_at_km" DOUBLE PRECISION NOT NULL,
    "product" JSONB NOT NULL,
    "cho_g" DOUBLE PRECISION NOT NULL,
    "sodium_mg" DOUBLE PRECISION NOT NULL,
    "fluid_ml" DOUBLE PRECISION NOT NULL,
    "intake_type" TEXT NOT NULL,
    "status" "PlannedIntakeStatus" NOT NULL DEFAULT 'pending',
    "actual_intake" JSONB,

    CONSTRAINT "planned_intakes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "planned_intakes_race_session_id_idx" ON "planned_intakes"("race_session_id");

CREATE INDEX "planned_intakes_race_event_id_idx" ON "planned_intakes"("race_event_id");

-- intake_actions
CREATE TABLE "intake_actions" (
    "id" TEXT NOT NULL,
    "race_session_id" TEXT NOT NULL,
    "planned_intake_id" TEXT,
    "action" TEXT NOT NULL,
    "actual_intake" JSONB,
    "client_timestamp" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "intake_actions_race_session_id_synced_idx" ON "intake_actions"("race_session_id", "synced");

-- Foreign keys
ALTER TABLE "race_sessions" ADD CONSTRAINT "race_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "race_sessions" ADD CONSTRAINT "race_sessions_race_event_id_fkey" FOREIGN KEY ("race_event_id") REFERENCES "race_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "planned_intakes" ADD CONSTRAINT "planned_intakes_race_session_id_fkey" FOREIGN KEY ("race_session_id") REFERENCES "race_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "planned_intakes" ADD CONSTRAINT "planned_intakes_race_event_id_fkey" FOREIGN KEY ("race_event_id") REFERENCES "race_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "intake_actions" ADD CONSTRAINT "intake_actions_race_session_id_fkey" FOREIGN KEY ("race_session_id") REFERENCES "race_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "intake_actions" ADD CONSTRAINT "intake_actions_planned_intake_id_fkey" FOREIGN KEY ("planned_intake_id") REFERENCES "planned_intakes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
