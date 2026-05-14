import { prisma } from "@/server/db";
import { appendEvent, getEvents } from "@/server/ledger";
import { notFound, badRequest } from "@/server/errors";
import { mintReward, burnFee } from "@/server/cc-ledger";

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

  const cooldown = await checkAccusationCooldown(params.challengerId);
  if (!cooldown.allowed) {
    throw badRequest(
      `Accusation cooldown active until ${cooldown.cooldownUntil!.toISOString()}`
    );
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

// ─── Assign Verifier with Rotation ──────────────────────────────────────────

export async function assignVerifier(params: {
  claimId: string;
  verifierId: string;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
  if (!claim) throw notFound("Claim not found");
  if (claim.implementerId === params.verifierId) {
    throw badRequest("Verifier cannot be the implementer");
  }

  const recentReviews = await prisma.verificationReview.findMany({
    where: {
      reviewerId: params.verifierId,
      claim: { implementerId: claim.implementerId },
    },
    orderBy: { createdAt: "desc" },
    include: { claim: true },
  });

  let consecutiveApprovals = 0;
  for (const review of recentReviews) {
    if (review.decision === "approve") {
      consecutiveApprovals++;
    } else {
      break;
    }
  }

  if (consecutiveApprovals >= 2) {
    throw badRequest(
      "Rotation constraint: reviewer has approved 2+ consecutive claims from this implementer"
    );
  }

  const assignment = await prisma.verificationReview.create({
    data: {
      claimId: params.claimId,
      reviewerId: params.verifierId,
      decision: "assigned",
    },
  });

  await appendEvent({
    actor: params.verifierId,
    objectType: "verification_review",
    objectId: assignment.id,
    action: "assigned",
    payload: { claimId: params.claimId },
  });

  return assignment;
}

// ─── Automated Evidence Checks ──────────────────────────────────────────────

export async function runEvidenceChecks(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      reports: {
        include: { evidence: true },
      },
    },
  });
  if (!claim) throw notFound("Claim not found");

  const assets = claim.reports.flatMap((r) => r.evidence);
  const findings: { type: string; assetId: string; matchClaimId: string }[] = [];

  for (const asset of assets) {
    const duplicates = await prisma.evidenceAsset.findMany({
      where: {
        blobHash: asset.blobHash,
        id: { not: asset.id },
        report: {
          claim: { id: { not: claimId } },
        },
      },
      include: { report: true },
    });

    for (const dup of duplicates) {
      findings.push({
        type: "duplicate_hash",
        assetId: asset.id,
        matchClaimId: dup.report.claimId,
      });
    }
  }

  if (findings.length > 0) {
    await appendEvent({
      actor: "system",
      objectType: "evidence_check",
      objectId: claimId,
      action: "findings",
      payload: { findings },
    });
  }

  return findings;
}

// ─── Reward Holdback ────────────────────────────────────────────────────────

export async function mintVerifiedReward(params: {
  claimId: string;
  amount: number;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
  if (!claim) throw notFound("Claim not found");
  if (claim.status !== "verified") {
    throw badRequest("Claim must be verified before minting reward");
  }

  const result = await mintReward({
    userId: claim.implementerId,
    amount: params.amount,
    sourceClaimId: params.claimId,
  });

  await appendEvent({
    actor: claim.implementerId,
    objectType: "reward",
    objectId: params.claimId,
    action: "minted",
    payload: { amount: params.amount },
  });

  return result;
}

// ─── Dispute Voting ─────────────────────────────────────────────────────────

export async function castDisputeVote(params: {
  disputeId: string;
  voterId: string;
  vote: "fraud" | "clean";
}) {
  const dispute = await prisma.disputeCase.findUnique({
    where: { id: params.disputeId },
  });
  if (!dispute) throw notFound("Dispute not found");
  if (dispute.status !== "open") {
    throw badRequest("Dispute is not open for voting");
  }

  const existing = await getEvents({
    objectType: "dispute_vote",
    objectId: params.disputeId,
  });
  const alreadyVoted = existing.items.some(
    (e) => e.actor === params.voterId
  );
  if (alreadyVoted) {
    throw badRequest("User has already voted on this dispute");
  }

  const event = await appendEvent({
    actor: params.voterId,
    objectType: "dispute_vote",
    objectId: params.disputeId,
    action: params.vote,
    payload: { disputeId: params.disputeId, vote: params.vote },
  });

  return event;
}

// ─── Penalty Actions ────────────────────────────────────────────────────────

export async function applyPenalty(params: {
  userId: string;
  type: "clawback" | "restriction";
  amount?: number;
  reasonCode: string;
}) {
  if (params.type === "clawback") {
    if (!params.amount || params.amount <= 0) {
      throw badRequest("Amount is required for clawback");
    }

    const result = await burnFee({
      userId: params.userId,
      amount: params.amount,
      burnType: "tx_fee",
    });

    await appendEvent({
      actor: "system",
      objectType: "penalty",
      objectId: params.userId,
      action: "clawback",
      payload: { amount: params.amount, reasonCode: params.reasonCode },
    });

    return result;
  }

  const restriction = await prisma.restriction.create({
    data: {
      userId: params.userId,
      type: params.type,
      reasonCode: params.reasonCode,
    },
  });

  await appendEvent({
    actor: "system",
    objectType: "penalty",
    objectId: params.userId,
    action: "restriction",
    payload: { reasonCode: params.reasonCode, restrictionId: restriction.id },
  });

  return restriction;
}

// ─── Accusation Cooldown ────────────────────────────────────────────────────

export async function checkAccusationCooldown(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dismissedDisputes = await prisma.disputeCase.findMany({
    where: {
      challengerId: userId,
      status: { in: ["resolved_clean", "dismissed"] },
      resolvedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { resolvedAt: "desc" },
  });

  const failedCount = dismissedDisputes.length;

  if (failedCount === 0) {
    return { allowed: true, failedCount: 0 };
  }

  let cooldownDays: number;
  if (failedCount === 1) {
    cooldownDays = 1;
  } else if (failedCount === 2) {
    cooldownDays = 3;
  } else {
    cooldownDays = 7 * (failedCount - 2);
  }

  const lastDismissed = dismissedDisputes[0].resolvedAt!;
  const cooldownUntil = new Date(lastDismissed);
  cooldownUntil.setDate(cooldownUntil.getDate() + cooldownDays);

  const now = new Date();
  if (now < cooldownUntil) {
    return { allowed: false, cooldownUntil, failedCount };
  }

  return { allowed: true, failedCount };
}
