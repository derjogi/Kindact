import { prisma } from "@/server/db";

// ─── Subscribe ──────────────────────────────────────────────────────────────

export async function subscribe(userId: string, issueId: string) {
  return prisma.issueSubscription.upsert({
    where: { userId_issueId: { userId, issueId } },
    create: { userId, issueId },
    update: {},
  });
}

// ─── Unsubscribe ────────────────────────────────────────────────────────────

export async function unsubscribe(userId: string, issueId: string) {
  await prisma.issueSubscription.deleteMany({
    where: { userId, issueId },
  });
}

// ─── Notify ─────────────────────────────────────────────────────────────────

export async function notify(params: {
  issueId: string;
  type: string;
  message: string;
  excludeUserId?: string;
}) {
  const subscriptions = await prisma.issueSubscription.findMany({
    where: { issueId: params.issueId },
  });

  const recipientIds = subscriptions
    .map((s) => s.userId)
    .filter((id) => id !== params.excludeUserId);

  if (recipientIds.length === 0) return [];

  // Check user preferences — exclude users who disabled this event type
  const disabledPrefs = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: recipientIds },
      eventType: params.type,
      enabled: false,
    },
  });
  const disabledUserIds = new Set(disabledPrefs.map((p) => p.userId));
  const eligibleIds = recipientIds.filter((id) => !disabledUserIds.has(id));

  if (eligibleIds.length === 0) return [];

  const data = eligibleIds.map((userId) => ({
    userId,
    type: params.type,
    objectId: params.issueId,
    message: params.message,
  }));

  await prisma.notification.createMany({ data });

  return data;
}

// ─── Get Notifications ──────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  params: { unreadOnly?: boolean; limit?: number; cursor?: string },
) {
  const take = Math.min(params.limit ?? 20, 100);

  const where: Record<string, unknown> = { userId };
  if (params.unreadOnly) where.read = false;

  const notifications = await prisma.notification.findMany({
    where,
    take: take + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = notifications.length > take;
  const items = hasMore ? notifications.slice(0, take) : notifications;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return { items, nextCursor };
}

// ─── Mark Read ──────────────────────────────────────────────────────────────

export async function markRead(userId: string, notificationIds: string[]) {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: { read: true },
  });
}

// ─── Unread Count ───────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
