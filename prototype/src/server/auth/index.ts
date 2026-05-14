import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";

export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createOrGetUser(walletAddress: string) {
  const address = walletAddress.toLowerCase();

  const existing = await prisma.walletLink.findUnique({
    where: { address },
    include: { user: true },
  });

  if (existing) {
    return existing.user;
  }

  const user = await prisma.user.create({
    data: {
      wallets: {
        create: { address },
      },
    },
    include: { wallets: true },
  });

  await appendEvent({
    actor: user.id,
    objectType: "user",
    objectId: user.id,
    action: "created",
    payload: { walletAddress: address },
  });

  return user;
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  await appendEvent({
    actor: userId,
    objectType: "session",
    objectId: userId,
    action: "created",
    payload: { expiresAt: expiresAt.toISOString() },
  });

  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallets: true },
  });
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; avatar?: string; bio?: string; tags?: string[] },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: data.displayName,
      avatar: data.avatar,
      bio: data.bio,
      tags: data.tags,
    },
  });

  await appendEvent({
    actor: userId,
    objectType: "user",
    objectId: userId,
    action: "profile_updated",
    payload: { fields: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined) },
  });

  return user;
}
