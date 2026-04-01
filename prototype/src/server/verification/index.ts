import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { notFound, badRequest } from "@/server/errors";

// ─── Submit Review ──────────────────────────────────────────────────────────

export async function submitReview(params: {
  claimId: string;
  reviewerId: string;
  decision: string;
  rationale?: string;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
  if (!claim) throw notFound("Claim not found");
  if (claim.status !== "submitted") {
    throw badRequest("Claim must be in submitted status to review");
  }
  if (claim.implementerId === params.reviewerId) {
    throw badRequest("Reviewer cannot be the implementer");
  }

  const review = await prisma.verificationReview.create({
    data: {
      claimId: params.claimId,
      reviewerId: params.reviewerId,
      decision: params.decision,
      rationale: params.rationale,
    },
  });

  if (params.decision === "approve") {
    const approvalCount = await prisma.verificationReview.count({
      where: { claimId: params.claimId, decision: "approve" },
    });
    if (approvalCount >= 2) {
      await prisma.claim.update({
        where: { id: params.claimId },
        data: { status: "verified" },
      });
    }
  } else if (params.decision === "reject") {
    await prisma.claim.update({
      where: { id: params.claimId },
      data: { status: "rejected" },
    });
  }

  await appendEvent({
    actor: params.reviewerId,
    objectType: "verification_review",
    objectId: review.id,
    action: params.decision,
    payload: { claimId: params.claimId, rationale: params.rationale },
  });

  return review;
}

// ─── Get Claim Verification ─────────────────────────────────────────────────

export async function getClaimVerification(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) throw notFound("Claim not found");

  const reviews = await prisma.verificationReview.findMany({
    where: { claimId },
    orderBy: { createdAt: "asc" },
  });

  const disputes = await prisma.disputeCase.findMany({
    where: { claimId },
    orderBy: { createdAt: "asc" },
  });

  return { claim, reviews, disputes };
}

// ─── Create Dispute ─────────────────────────────────────────────────────────

export async function createDispute(params: {
  claimId: string;
  challengerId: string;
  reason: string;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
  if (!claim) throw notFound("Claim not found");
  if (claim.implementerId === params.challengerId) {
    throw badRequest("Challenger cannot be the implementer");
  }

  const dispute = await prisma.disputeCase.create({
    data: {
      claimId: params.claimId,
      challengerId: params.challengerId,
      reason: params.reason,
    },
  });

  await appendEvent({
    actor: params.challengerId,
    objectType: "dispute_case",
    objectId: dispute.id,
    action: "created",
    payload: { claimId: params.claimId, reason: params.reason },
  });

  return dispute;
}

// ─── Resolve Dispute ────────────────────────────────────────────────────────

export async function resolveDispute(params: {
  disputeId: string;
  resolution: string;
}) {
  const dispute = await prisma.disputeCase.findUnique({
    where: { id: params.disputeId },
  });
  if (!dispute) throw notFound("Dispute not found");

  const updated = await prisma.disputeCase.update({
    where: { id: params.disputeId },
    data: {
      status: params.resolution,
      resolvedAt: new Date(),
    },
  });

  if (params.resolution === "resolved_fraud") {
    await prisma.claim.update({
      where: { id: dispute.claimId },
      data: { status: "rejected" },
    });
  }

  await appendEvent({
    actor: dispute.challengerId,
    objectType: "dispute_case",
    objectId: dispute.id,
    action: "resolved",
    payload: { resolution: params.resolution },
  });

  return updated;
}

// ─── List Disputes for Claim ────────────────────────────────────────────────

export async function listDisputesForClaim(claimId: string) {
  return prisma.disputeCase.findMany({
    where: { claimId },
    orderBy: { createdAt: "asc" },
  });
}
