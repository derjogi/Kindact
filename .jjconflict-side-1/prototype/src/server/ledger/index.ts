import { createHash } from "crypto";
import { prisma } from "@/server/db";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

// ---------------------------------------------------------------------------
// Append
// ---------------------------------------------------------------------------

interface AppendEventParams {
  actor: string;
  objectType: string;
  objectId: string;
  action: string;
  payload: unknown;
}

export async function appendEvent({
  actor,
  objectType,
  objectId,
  action,
  payload,
}: AppendEventParams) {
  const payloadHash = sha256(canonicalJson(payload));

  // Get prev_hash from the last event in the same object stream
  const prev = await prisma.ledgerEvent.findFirst({
    where: { objectType, objectId },
    orderBy: { sequence: "desc" },
    select: { eventHash: true },
  });

  const prevHash = prev?.eventHash ?? null;

  // Compute event_hash from canonical form of the event data
  const eventHash = sha256(
    canonicalJson({
      actor,
      objectType,
      objectId,
      action,
      payloadHash,
      prevHash,
    }),
  );

  return prisma.ledgerEvent.create({
    data: {
      actor,
      objectType,
      objectId,
      action,
      payloadHash,
      prevHash,
      eventHash,
    },
  });
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

interface GetEventsFilters {
  objectType?: string;
  objectId?: string;
  actor?: string;
  limit?: number;
  cursor?: string;
}

export async function getEvents(filters: GetEventsFilters) {
  const take = filters.limit ?? 50;

  const events = await prisma.ledgerEvent.findMany({
    where: {
      ...(filters.objectType && { objectType: filters.objectType }),
      ...(filters.objectId && { objectId: filters.objectId }),
      ...(filters.actor && { actor: filters.actor }),
    },
    orderBy: { sequence: "asc" },
    take: take + 1,
    ...(filters.cursor && {
      cursor: { id: filters.cursor },
      skip: 1,
    }),
  });

  const hasMore = events.length > take;
  const items = hasMore ? events.slice(0, take) : events;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return { items, nextCursor };
}

export async function getObjectHistory(objectType: string, objectId: string) {
  return prisma.ledgerEvent.findMany({
    where: { objectType, objectId },
    orderBy: { sequence: "asc" },
  });
}
