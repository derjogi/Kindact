import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { badRequest, notFound } from "@/server/errors";

const SCORE_THRESHOLD = 15.0;

// ─── Connect Provider ───────────────────────────────────────────────────────

export async function connectProvider(params: {
  userId: string;
  provider: string;
  attestation?: unknown;
  score?: number;
}) {
  const link = await prisma.identityProviderLink.upsert({
    where: {
      userId_provider: {
        userId: params.userId,
        provider: params.provider,
      },
    },
    update: {
      attestation: params.attestation ?? undefined,
      score: params.score ?? undefined,
    },
    create: {
      userId: params.userId,
      provider: params.provider,
      attestation: params.attestation ?? undefined,
      score: params.score ?? undefined,
    },
  });

  await appendEvent({
    actor: params.userId,
    objectType: "identity_provider_link",
    objectId: link.id,
    action: "connected",
    payload: { provider: params.provider, score: params.score },
  });

  return link;
}

// ─── Verify Identity ────────────────────────────────────────────────────────

export async function verifyIdentity(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User not found");
  if (user.humanId) throw badRequest("User is already verified");

  const qualifyingLink = await prisma.identityProviderLink.findFirst({
    where: { userId, score: { gte: SCORE_THRESHOLD } },
  });
  if (!qualifyingLink) {
    throw badRequest("No provider link with sufficient score");
  }

  const humanId = crypto.randomUUID();

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { humanId },
  });

  await appendEvent({
    actor: userId,
    objectType: "user",
    objectId: userId,
    action: "identity_verified",
    payload: { humanId, provider: qualifyingLink.provider },
  });

  return { verified: true, humanId: updated.humanId };
}

// ─── Get Identity Status ────────────────────────────────────────────────────

export async function getIdentityStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { identityProviderLinks: true },
  });
  if (!user) throw notFound("User not found");

  return {
    verified: !!user.humanId,
    humanId: user.humanId,
    providers: user.identityProviderLinks.map((link) => ({
      id: link.id,
      provider: link.provider,
      score: link.score,
      connectedAt: link.connectedAt,
    })),
  };
}

// ─── Disconnect Provider ────────────────────────────────────────────────────

export async function disconnectProvider(params: {
  userId: string;
  provider: string;
}) {
  const link = await prisma.identityProviderLink.findUnique({
    where: {
      userId_provider: {
        userId: params.userId,
        provider: params.provider,
      },
    },
  });
  if (!link) throw notFound("Provider link not found");

  await prisma.identityProviderLink.delete({ where: { id: link.id } });

  const remaining = await prisma.identityProviderLink.findFirst({
    where: { userId: params.userId, score: { gte: SCORE_THRESHOLD } },
  });

  if (!remaining) {
    await prisma.user.update({
      where: { id: params.userId },
      data: { humanId: null },
    });
  }

  await appendEvent({
    actor: params.userId,
    objectType: "identity_provider_link",
    objectId: link.id,
    action: "disconnected",
    payload: { provider: params.provider, clearedHumanId: !remaining },
  });

  return { disconnected: true, clearedHumanId: !remaining };
}

// ─── Identity Challenges ────────────────────────────────────────────────────

export async function createIdentityChallenge(params: {
  challengerId: string;
  targetUserId: string;
  reason: string;
}) {
  const target = await prisma.user.findUnique({
    where: { id: params.targetUserId },
  });
  if (!target) throw notFound("Target user not found");

  const restriction = await prisma.restriction.create({
    data: {
      userId: params.targetUserId,
      type: "privilege_freeze",
      reasonCode: `identity_challenge:${params.challengerId}`,
    },
  });

  await appendEvent({
    actor: params.challengerId,
    objectType: "identity_challenge",
    objectId: restriction.id,
    action: "created",
    payload: {
      targetUserId: params.targetUserId,
      reason: params.reason,
    },
  });

  return restriction;
}

export async function resolveIdentityChallenge(params: {
  challengeId: string;
  resolution: "confirmed" | "dismissed";
}) {
  const restriction = await prisma.restriction.findUnique({
    where: { id: params.challengeId },
  });
  if (!restriction) throw notFound("Challenge not found");
  if (!restriction.reasonCode.startsWith("identity_challenge:")) {
    throw badRequest("Not an identity challenge");
  }
  if (restriction.liftedAt) throw badRequest("Challenge already resolved");

  await prisma.restriction.update({
    where: { id: restriction.id },
    data: { liftedAt: new Date() },
  });

  if (params.resolution === "confirmed") {
    await prisma.user.update({
      where: { id: restriction.userId },
      data: { humanId: null },
    });
  }

  await appendEvent({
    actor: restriction.userId,
    objectType: "identity_challenge",
    objectId: restriction.id,
    action: params.resolution === "confirmed" ? "confirmed" : "dismissed",
    payload: {
      targetUserId: restriction.userId,
      clearedHumanId: params.resolution === "confirmed",
    },
  });

  return {
    resolved: true,
    resolution: params.resolution,
    clearedHumanId: params.resolution === "confirmed",
  };
}

export async function getIdentityChallenges(userId: string) {
  const restrictions = await prisma.restriction.findMany({
    where: {
      userId,
      reasonCode: { startsWith: "identity_challenge:" },
    },
    orderBy: { createdAt: "desc" },
  });

  return restrictions.map((r) => ({
    id: r.id,
    challengerId: r.reasonCode.replace("identity_challenge:", ""),
    targetUserId: r.userId,
    status: r.liftedAt ? "resolved" : "pending",
    createdAt: r.createdAt,
    liftedAt: r.liftedAt,
  }));
}

// ─── Privilege Tiering ──────────────────────────────────────────────────────

export async function checkPrivilege(
  userId: string,
  privilege: "vote" | "verify" | "post"
): Promise<{ allowed: boolean; reason?: string }> {
  if (privilege === "post") return { allowed: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User not found");

  if (!user.humanId) {
    return { allowed: false, reason: "Identity verification required" };
  }

  const activeFreeze = await prisma.restriction.findFirst({
    where: {
      userId,
      type: "privilege_freeze",
      liftedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (activeFreeze) {
    return { allowed: false, reason: "Account has an active privilege freeze" };
  }

  return { allowed: true };
}
