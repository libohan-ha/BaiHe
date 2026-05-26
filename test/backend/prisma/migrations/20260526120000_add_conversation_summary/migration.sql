ALTER TABLE "Conversation" ADD COLUMN "summary" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "summaryMessageCount" INTEGER NOT NULL DEFAULT 0;
