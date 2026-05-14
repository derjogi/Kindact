-- AlterTable
ALTER TABLE "ai_summaries" ADD COLUMN     "references" JSONB;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "quote_end" INTEGER,
ADD COLUMN     "quote_start" INTEGER,
ADD COLUMN     "quoted_text" TEXT,
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "source_type" TEXT;
