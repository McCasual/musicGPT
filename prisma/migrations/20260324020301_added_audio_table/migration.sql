-- CreateTable
CREATE TABLE "audios" (
    "id" UUID NOT NULL,
    "prompt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audios_prompt_id_created_at_idx" ON "audios"("prompt_id", "created_at");

-- CreateIndex
CREATE INDEX "audios_user_id_created_at_idx" ON "audios"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
