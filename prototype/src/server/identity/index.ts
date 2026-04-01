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
