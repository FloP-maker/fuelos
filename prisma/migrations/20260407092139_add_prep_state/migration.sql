-- CreateTable
CREATE TABLE "prep_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prep_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prep_states_user_id_key" ON "prep_states"("user_id");

-- AddForeignKey
ALTER TABLE "prep_states" ADD CONSTRAINT "prep_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
