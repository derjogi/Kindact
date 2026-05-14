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

export async function getIssue(issueId: string) {
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
    },
  });
  if (!issue) throw notFound("Issue not found");
  return issue;
}

// ─── List ───────────────────────────────────────────────────────────────────

export async function listIssues(filters: {
  status?: string;
  scope?: string;
  search?: string;
  limit?: number;
  cursor?: string;
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

  const issues = await prisma.issue.findMany({
    where,
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: { rewardIntent: true, metrics: true },
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
