import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { notFound, badRequest } from "@/server/errors";

// ─── Decision State Helper ──────────────────────────────────────────────────

export async function getOrCreateDecisionState(issueId: string) {
  const existing = await prisma.decisionState.findUnique({ where: { issueId } });
  if (existing) return existing;

  return prisma.decisionState.create({
    data: { issueId },
  });
}

// ─── Cast Vote ──────────────────────────────────────────────────────────────

export async function castVote(params: {
  issueId: string;
  userId: string;
  vote: "approve" | "reject";
}) {
  const issue = await prisma.issue.findUnique({ where: { id: params.issueId } });
  if (!issue) throw notFound("Issue not found");
  if (issue.status !== "vote_ready") {
    throw badRequest("Issue is not in vote-ready status");
  }

  await prisma.voteRecord.upsert({
    where: { issueId_userId: { issueId: params.issueId, userId: params.userId } },
    create: {
      issueId: params.issueId,
      userId: params.userId,
      vote: params.vote,
    },
    update: { vote: params.vote },
  });

  // Recompute tally
  const [approveCount, rejectCount] = await Promise.all([
    prisma.voteRecord.count({ where: { issueId: params.issueId, vote: "approve" } }),
    prisma.voteRecord.count({ where: { issueId: params.issueId, vote: "reject" } }),
  ]);

  const ds = await getOrCreateDecisionState(params.issueId);
  const totalVotes = approveCount + rejectCount;
  const approvePercentage = totalVotes > 0 ? approveCount / totalVotes : 0;

  const updateData: Record<string, unknown> = {
    approveCount,
    rejectCount,
  };

  // Check threshold and quorum for adoption
  if (
    ds.state === "open" &&
    approvePercentage >= ds.threshold &&
    totalVotes >= ds.quorum
  ) {
    updateData.observationStart = new Date();
  }

  // Check if observation window has passed
  if (
    ds.state === "open" &&
    ds.observationStart &&
    new Date().getTime() - ds.observationStart.getTime() >=
      ds.observationDays * 24 * 60 * 60 * 1000
  ) {
    updateData.state = "adopted";
    updateData.adoptedAt = new Date();

    await prisma.issue.update({
      where: { id: params.issueId },
      data: { status: "adopted" },
    });
  }

  await prisma.decisionState.update({
    where: { id: ds.id },
    data: updateData,
  });

  await appendEvent({
    actor: params.userId,
    objectType: "vote",
    objectId: params.issueId,
    action: "cast",
    payload: { vote: params.vote, approveCount, rejectCount },
  });

  return { approveCount, rejectCount, totalVotes, approvePercentage };
}

// ─── Get Tally ──────────────────────────────────────────────────────────────

export async function getTally(issueId: string) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw notFound("Issue not found");

  const ds = await getOrCreateDecisionState(issueId);

  return {
    approveCount: ds.approveCount,
    rejectCount: ds.rejectCount,
    totalVotes: ds.approveCount + ds.rejectCount,
    state: ds.state,
    threshold: ds.threshold,
    quorum: ds.quorum,
    observationStart: ds.observationStart,
    observationDays: ds.observationDays,
    adoptedAt: ds.adoptedAt,
  };
}
