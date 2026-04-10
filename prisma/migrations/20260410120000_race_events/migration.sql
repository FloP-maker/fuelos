-- CreateTable
CREATE TABLE "race_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "race_date" TIMESTAMP(3) NOT NULL,
    "nutrition_score" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "race_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "race_events_user_id_race_date_idx" ON "race_events"("user_id", "race_date" DESC);

-- AddForeignKey
ALTER TABLE "race_events" ADD CONSTRAINT "race_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase / PostgreSQL : activer RLS et restreindre par utilisateur (nom du JWT claim à adapter si besoin).
-- Ce projet authentifie via Auth.js ; en accès direct Supabase avec `auth.uid()` = `user_id`, décommenter :
-- ALTER TABLE "race_events" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "race_events_select_own" ON "race_events" FOR SELECT USING (auth.uid()::text = "user_id");
-- CREATE POLICY "race_events_insert_own" ON "race_events" FOR INSERT WITH CHECK (auth.uid()::text = "user_id");
-- CREATE POLICY "race_events_update_own" ON "race_events" FOR UPDATE USING (auth.uid()::text = "user_id");
-- CREATE POLICY "race_events_delete_own" ON "race_events" FOR DELETE USING (auth.uid()::text = "user_id");
