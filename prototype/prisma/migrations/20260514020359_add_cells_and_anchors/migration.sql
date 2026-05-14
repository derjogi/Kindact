-- CreateEnum
CREATE TYPE "CellTier" AS ENUM ('canonical', 'promoted', 'uncurated');

-- CreateEnum
CREATE TYPE "CellLifecycle" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "CellMembershipKind" AS ENUM ('member', 'guest');

-- CreateEnum
CREATE TYPE "AnchorKind" AS ENUM ('topic', 'location', 'event', 'cell');

-- CreateEnum
CREATE TYPE "AnchorStatus" AS ENUM ('active', 'deprecated', 'merged');

-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "cell_id" TEXT;

-- CreateTable
CREATE TABLE "cells" (
    "id" TEXT NOT NULL,
    "cell_id_str" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tier" "CellTier" NOT NULL DEFAULT 'uncurated',
    "scope_level" TEXT NOT NULL DEFAULT 'topic',
    "location_refs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "membrane_read" TEXT NOT NULL DEFAULT 'public',
    "membrane_write" TEXT NOT NULL DEFAULT 'scope_verified',
    "scope_proof_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jurisdictional_claims" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "governance_engine" TEXT NOT NULL DEFAULT 'approval_voting',
    "forked_from_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "lifecycle" "CellLifecycle" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cell_memberships" (
    "id" TEXT NOT NULL,
    "cell_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "CellMembershipKind" NOT NULL DEFAULT 'member',
    "issue_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "cell_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchor_records" (
    "id" TEXT NOT NULL,
    "anchor_id_str" TEXT NOT NULL,
    "kind" "AnchorKind" NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AnchorStatus" NOT NULL DEFAULT 'active',
    "merged_into_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anchor_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchor_links" (
    "id" TEXT NOT NULL,
    "anchor_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "scope_level" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anchor_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchor_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "anchor_id" TEXT NOT NULL,
    "scope_levels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anchor_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_lenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anchor_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_lenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cells_cell_id_str_key" ON "cells"("cell_id_str");

-- CreateIndex
CREATE INDEX "cells_tier_idx" ON "cells"("tier");

-- CreateIndex
CREATE INDEX "cells_lifecycle_idx" ON "cells"("lifecycle");

-- CreateIndex
CREATE INDEX "cell_memberships_cell_id_user_id_idx" ON "cell_memberships"("cell_id", "user_id");

-- CreateIndex
CREATE INDEX "cell_memberships_user_id_idx" ON "cell_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "anchor_records_anchor_id_str_key" ON "anchor_records"("anchor_id_str");

-- CreateIndex
CREATE INDEX "anchor_records_kind_idx" ON "anchor_records"("kind");

-- CreateIndex
CREATE INDEX "anchor_records_status_idx" ON "anchor_records"("status");

-- CreateIndex
CREATE INDEX "anchor_links_issue_id_idx" ON "anchor_links"("issue_id");

-- CreateIndex
CREATE UNIQUE INDEX "anchor_links_anchor_id_issue_id_key" ON "anchor_links"("anchor_id", "issue_id");

-- CreateIndex
CREATE INDEX "anchor_subscriptions_user_id_idx" ON "anchor_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "anchor_subscriptions_user_id_anchor_id_key" ON "anchor_subscriptions"("user_id", "anchor_id");

-- CreateIndex
CREATE INDEX "saved_lenses_user_id_idx" ON "saved_lenses"("user_id");

-- CreateIndex
CREATE INDEX "issues_cell_id_idx" ON "issues"("cell_id");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_forked_from_id_fkey" FOREIGN KEY ("forked_from_id") REFERENCES "cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_memberships" ADD CONSTRAINT "cell_memberships_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_links" ADD CONSTRAINT "anchor_links_anchor_id_fkey" FOREIGN KEY ("anchor_id") REFERENCES "anchor_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_links" ADD CONSTRAINT "anchor_links_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchor_subscriptions" ADD CONSTRAINT "anchor_subscriptions_anchor_id_fkey" FOREIGN KEY ("anchor_id") REFERENCES "anchor_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
