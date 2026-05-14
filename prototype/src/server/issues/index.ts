import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { notFound, badRequest, forbidden } from "@/server/errors";
import type { IssueStatus, IssueScope } from "@/generated/prisma/client";

// ─── State Machine ──────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  draft: ["deliberating"],
  deliberating: ["vote_ready", "draft"],
  vote_ready: ["adopted"],
  adopted: ["implementing"],
  implementing: ["completed"],
  completed: ["archived"],
  archived: [],
};

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createIssue(params: {
  creatorId: string;
  title: string;
  summary: string;
  description: string;
  scope: "local" | "national" | "global";
  tags: string[];
  rewardIntent: string;
}) {
  const issue = await prisma.issue.create({
    data: {
      title: params.title,
      summary: params.summary,
      description: params.description,
      scope: params.scope as IssueScope,
      tags: params.tags,
      creatorId: params.creatorId,
      rewardIntent: {
        create: { amount: params.rewardIntent },
      },
      revisions: {
        create: {
          title: params.title,
          summary: params.summary,
          description: params.description,
          authorId: params.creatorId,
        },
      },
      subscriptions: {
        create: { userId: params.creatorId },
      },
    },
    include: { rewardIntent: true },
  });

  await appendEvent({
    actor: params.creatorId,
    objectType: "issue",
    objectId: issue.id,
    action: "created",
    payload: { scope: params.scope, tags: params.tags },
  });

  return issue;
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateIssue(
  issueId: string,
  actorId: string,
  data: {
    title?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    rewardIntent?: string;
  },
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { rewardIntent: true },
  });
  if (!issue) throw notFound("Issue not found");

  if (issue.status !== "draft" && issue.status !== "deliberating") {
    throw badRequest("Issue can only be updated in draft or deliberating status");
  }

  if (data.rewardIntent && issue.rewardIntent?.locked) {
    throw badRequest("Reward intent is locked and cannot be changed");
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.tags !== undefined) updateData.tags = data.tags;

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: updateData,
    include: { rewardIntent: true },
  });

  if (data.rewardIntent && issue.rewardIntent) {
    await prisma.rewardIntent.update({
      where: { id: issue.rewardIntent.id },
      data: { amount: data.rewardIntent },
    });
  }

  await prisma.issueRevision.create({
    data: {
      issueId,
      title: updated.title,
      summary: updated.summary,
      description: updated.description,
      authorId: actorId,
    },
  });

  await appendEvent({
    actor: actorId,
    objectType: "issue",
    objectId: issueId,
    action: "updated",
    payload: { fields: Object.keys(data) },
  });

  return prisma.issue.findUnique({
    where: { id: issueId },
    include: { rewardIntent: true },
  });
}

// ─── Get ────────────────────────────────────────────────────────────────────

export async function getIssue(issueId: string, viewerId?: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      rewardIntent: true,
      comments: true,
      arguments: true,
      metrics: true,
      boundaries: true,
      decisionState: true,
      aiSummary: true,
      cell: true,
      anchorLinks: { include: { anchor: true } },
    },
  });
  if (!issue) throw notFound("Issue not found");

  // Viewer's relation to the issue's home cell, plus any guest-on-this-issue scope.
  let viewerCellRelation: "member" | "guest" | "none" = "none";
  let viewerIsGuestOnThisIssue = false;
  if (viewerId && issue.cellId) {
    const memberships = await prisma.cellMembership.findMany({
      where: { cellId: issue.cellId, userId: viewerId, leftAt: null },
    });
    const member = memberships.find((m) => m.kind === "member");
    const guest = memberships.find((m) => m.kind === "guest" && m.issueId === issueId);
    if (member) viewerCellRelation = "member";
    else if (guest) viewerCellRelation = "guest";
    viewerIsGuestOnThisIssue = !!guest;
  }

  // Viewer's anchor subscriptions that match this issue's anchors (for the
  // "you see this via your # bike-lanes subscription" strip).
  const anchorIds = issue.anchorLinks.map((l) => l.anchor.id);
  let viewerSubscribedAnchorIds: string[] = [];
  if (viewerId && anchorIds.length > 0) {
    const subs = await prisma.anchorSubscription.findMany({
      where: { userId: viewerId, anchorId: { in: anchorIds }, muted: false },
      select: { anchorId: true },
    });
    viewerSubscribedAnchorIds = subs.map((s) => s.anchorId);
  }

  // Related across cells — other issues that share at least one anchor but live in a different cell.
  let relatedAcrossCells: Array<{
    id: string;
    title: string;
    status: string;
    cell: { id: string; cellId: string; displayName: string; tier: string } | null;
    sharedAnchors: Array<{ id: string; anchorId: string; displayName: string; kind: string }>;
  }> = [];
  if (anchorIds.length > 0) {
    const otherLinks = await prisma.anchorLink.findMany({
      where: {
        anchorId: { in: anchorIds },
        issueId: { not: issueId },
        issue: issue.cellId ? { cellId: { not: issue.cellId } } : {},
      },
      include: { anchor: true, issue: { include: { cell: true } } },
    });
    const byIssue = new Map<string, typeof otherLinks>();
    for (const l of otherLinks) {
      const list = byIssue.get(l.issueId) ?? [];
      list.push(l);
      byIssue.set(l.issueId, list);
    }
    relatedAcrossCells = Array.from(byIssue.values()).slice(0, 5).map((links) => {
      const i = links[0].issue;
      return {
        id: i.id,
        title: i.title,
        status: i.status,
        cell: i.cell
          ? { id: i.cell.id, cellId: i.cell.cellId, displayName: i.cell.displayName, tier: i.cell.tier }
          : null,
        sharedAnchors: links.map((l) => ({
          id: l.anchor.id,
          anchorId: l.anchor.anchorId,
          displayName: l.anchor.displayName,
          kind: l.anchor.kind,
        })),
      };
    });
  }

  return {
    ...issue,
    viewerCellRelation,
    viewerIsGuestOnThisIssue,
    viewerSubscribedAnchorIds,
    relatedAcrossCells,
  };
}

// ─── List ───────────────────────────────────────────────────────────────────

export async function listIssues(filters: {
  status?: string;
  scope?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  source?: "all" | "subscriptions" | "cells" | "anchor";
  anchorId?: string;
  userId?: string;
}) {
  const take = Math.min(filters.limit ?? 20, 100);

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status as IssueStatus;
  if (filters.scope) where.scope = filters.scope as IssueScope;

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { summary: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Source filtering — gates which issue ids are visible.
  if (filters.source && filters.source !== "all" && filters.userId) {
    let issueIds: string[] = [];
    const { resolveDescendantAnchorIds } = await import("@/server/anchors");

    if (filters.source === "anchor" && filters.anchorId) {
      const anchor = await prisma.anchorRecord.findFirst({
        where: { OR: [{ id: filters.anchorId }, { anchorId: filters.anchorId }] },
        select: { id: true },
      });
      if (anchor) {
        const ids = await resolveDescendantAnchorIds([anchor.id]);
        const links = await prisma.anchorLink.findMany({
          where: { anchorId: { in: ids } },
          select: { issueId: true },
        });
        issueIds = Array.from(new Set(links.map((l) => l.issueId)));
      }
    } else if (filters.source === "subscriptions") {
      const subs = await prisma.anchorSubscription.findMany({
        where: { userId: filters.userId, muted: false },
        select: { anchorId: true },
      });
      if (subs.length > 0) {
        const allIds = await resolveDescendantAnchorIds(subs.map((s) => s.anchorId));
        const links = await prisma.anchorLink.findMany({
          where: { anchorId: { in: allIds } },
          select: { issueId: true },
        });
        issueIds = Array.from(new Set(links.map((l) => l.issueId)));
      }
    } else if (filters.source === "cells") {
      const memberships = await prisma.cellMembership.findMany({
        where: { userId: filters.userId, leftAt: null, kind: "member" },
        select: { cellId: true },
      });
      if (memberships.length > 0) {
        const cellIds = memberships.map((m) => m.cellId);
        const issues = await prisma.issue.findMany({
          where: { cellId: { in: cellIds } },
          select: { id: true },
        });
        issueIds = issues.map((i) => i.id);
      }
    }

    where.id = { in: issueIds };
  }

  const issues = await prisma.issue.findMany({
    where,
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      rewardIntent: true,
      metrics: true,
      cell: true,
      anchorLinks: { include: { anchor: true } },
    },
  });

  const hasMore = issues.length > take;
  const items = hasMore ? issues.slice(0, take) : issues;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return { items, nextCursor };
}

// ─── Transition ─────────────────────────────────────────────────────────────

export async function transitionIssue(
  issueId: string,
  actorId: string,
  newStatus: string,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { metrics: true, rewardIntent: true },
  });
  if (!issue) throw notFound("Issue not found");

  if (issue.creatorId !== actorId) {
    throw forbidden("Only the creator or a moderator can transition an issue");
  }

  const target = newStatus as IssueStatus;
  const allowed = VALID_TRANSITIONS[issue.status];
  if (!allowed?.includes(target)) {
    throw badRequest(
      `Invalid transition from "${issue.status}" to "${newStatus}"`,
    );
  }

  if (target === "vote_ready") {
    const dimensions = issue.metrics.map((m) => m.dimension);
    if (!dimensions.includes("cost") || !dimensions.includes("time")) {
      throw badRequest(
        "Issue must have both cost and time metrics before moving to vote-ready",
      );
    }

    if (issue.rewardIntent && !issue.rewardIntent.locked) {
      await prisma.rewardIntent.update({
        where: { id: issue.rewardIntent.id },
        data: { locked: true },
      });
    }
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: { status: target },
  });

  await appendEvent({
    actor: actorId,
    objectType: "issue",
    objectId: issueId,
    action: "state_changed",
    payload: { from: issue.status, to: target },
  });

  return updated;
}
