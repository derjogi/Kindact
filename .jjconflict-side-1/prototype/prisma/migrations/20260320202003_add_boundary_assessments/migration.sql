-- CreateTable
CREATE TABLE "boundary_assessments" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "delta" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boundary_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boundary_assessments_issue_id_idx" ON "boundary_assessments"("issue_id");

-- AddForeignKey
ALTER TABLE "boundary_assessments" ADD CONSTRAINT "boundary_assessments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
