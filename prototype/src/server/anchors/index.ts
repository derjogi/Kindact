import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { badRequest, notFound } from "@/server/errors";
import type { AnchorKind } from "@/generated/prisma/client";

// ─── List ───────────────────────────────────────────────────────────────────

export async function listAnchors(filters: {
  kind?: string;
  search?: string;
  userId?: string;
}) {
  const where: Record<string, unknown> = { status: "active" };
  if (filters.kind) where.kind = filters.kind as AnchorKind;
  if (filters.search) {
    where.OR = [
      { displayName: { contains: filters.search, mode: "insensitive" } },
      { anchorId: { contains: filters.search, mode: "insensitive" } },
      { synonyms: { has: filters.search.toLowerCase() } },
    ];
  }

  const anchors = await prisma.anchorRecord.findMany({
    where,
    orderBy: [{ kind: "asc" }, { displayName: "asc" }],
    include: {
      _count: { select: { links: true, subscriptions: true } },
    },
  });

  let mySubs: Set<string> = new Set();
  if (filters.userId) {
    const subs = await prisma.anchorSubscription.findMany({
      where: { userId: filters.userId, muted: false },
      select: { anchorId: true },
    });
    mySubs = new Set(subs.map((s) => s.anchorId));
  }

  return anchors.map((a) => ({
    id: a.id,
    anchorId: a.anchorId,
    kind: a.kind,
    displayName: a.displayName,
    description: a.description,
    synonyms: a.synonyms,
    parentIds: a.parentIds,
    issueCount: a._count.links,
    subscriberCount: a._count.subscriptions,
    isSubscribed: mySubs.has(a.id),
    createdAt: a.createdAt,
  }));
}

// ─── Get ────────────────────────────────────────────────────────────────────

export async function getAnchor(idOrAnchorId: string, viewerId?: string) {
  const anchor = await prisma.anchorRecord.findFirst({
    where: { OR: [{ id: idOrAnchorId }, { anchorId: idOrAnchorId }] },
    include: {
      _count: { select: { links: true, subscriptions: true } },
    },
  });
  if (!anchor) throw notFound("Anchor not found");

  // Resolve parents and children.
  const parents = anchor.parentIds.length
    ? await prisma.anchorRecord.findMany({ where: { id: { in: anchor.parentIds } } })
    : [];
  const children = await prisma.anchorRecord.findMany({
    where: { parentIds: { has: anchor.id }, status: "active" },
  });

  let subscription: { id: string; muted: boolean; subscribedAt: Date } | null = null;
  if (viewerId) {
    const s = await prisma.anchorSubscription.findUnique({
      where: { userId_anchorId: { userId: viewerId, anchorId: anchor.id } },
    });
    if (s) subscription = { id: s.id, muted: s.muted, subscribedAt: s.subscribedAt };
  }

  return {
    id: anchor.id,
    anchorId: anchor.anchorId,
    kind: anchor.kind,
    displayName: anchor.displayName,
    description: anchor.description,
    synonyms: anchor.synonyms,
    issueCount: anchor._count.links,
    subscriberCount: anchor._count.subscriptions,
    parents: parents.map((p) => ({
      id: p.id,
      anchorId: p.anchorId,
      displayName: p.displayName,
      kind: p.kind,
    })),
    children: children.map((c) => ({
      id: c.id,
      anchorId: c.anchorId,
      displayName: c.displayName,
      kind: c.kind,
    })),
    subscription,
    createdAt: anchor.createdAt,
  };
}

// Resolve all descendant anchor IDs (BFS, capped depth) for hierarchy walking.
export async function resolveDescendantAnchorIds(rootIds: string[], maxDepth = 4): Promise<string[]> {
  const visited = new Set<string>(rootIds);
  let frontier = rootIds;
  for (let d = 0; d < maxDepth && frontier.length > 0; d++) {
    const children = await prisma.anchorRecord.findMany({
      where: { parentIds: { hasSome: frontier }, status: "active" },
      select: { id: true },
    });
    const next: string[] = [];
    for (const c of children) {
      if (!visited.has(c.id)) {
        visited.add(c.id);
        next.push(c.id);
      }
    }
    frontier = next;
  }
  return Array.from(visited);
}

// ─── Issues for anchor (with optional hierarchy walk) ───────────────────────

export async function listIssuesForAnchor(
  anchorIdOrUuid: string,
  opts: { includeChildren?: boolean } = {},
) {
  const anchor = await prisma.anchorRecord.findFirst({
    where: { OR: [{ id: anchorIdOrUuid }, { anchorId: anchorIdOrUuid }] },
    select: { id: true },
  });
  if (!anchor) throw notFound("Anchor not found");

  const ids = opts.includeChildren
    ? await resolveDescendantAnchorIds([anchor.id])
    : [anchor.id];

  const links = await prisma.anchorLink.findMany({
    where: { anchorId: { in: ids } },
    include: {
      issue: { include: { cell: true, anchorLinks: { include: { anchor: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Dedupe by issue id (an issue can be linked via multiple anchors in the set).
  const seen = new Set<string>();
  const issues = [];
  for (const l of links) {
    if (seen.has(l.issueId)) continue;
    seen.add(l.issueId);
    issues.push(l.issue);
  }
  return issues;
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export async function subscribe(userId: string, anchorIdOrUuid: string) {
  const anchor = await prisma.anchorRecord.findFirst({
    where: { OR: [{ id: anchorIdOrUuid }, { anchorId: anchorIdOrUuid }] },
  });
  if (!anchor) throw notFound("Anchor not found");

  const sub = await prisma.anchorSubscription.upsert({
    where: { userId_anchorId: { userId, anchorId: anchor.id } },
    update: { muted: false },
    create: { userId, anchorId: anchor.id },
  });

  await appendEvent({
    actor: userId,
    objectType: "anchor",
    objectId: anchor.id,
    action: "subscribed",
    payload: { anchorIdStr: anchor.anchorId },
  });

  return sub;
}

export async function unsubscribe(userId: string, anchorIdOrUuid: string) {
  const anchor = await prisma.anchorRecord.findFirst({
    where: { OR: [{ id: anchorIdOrUuid }, { anchorId: anchorIdOrUuid }] },
  });
  if (!anchor) throw notFound("Anchor not found");

  const existing = await prisma.anchorSubscription.findUnique({
    where: { userId_anchorId: { userId, anchorId: anchor.id } },
  });
  if (!existing) return null;

  await prisma.anchorSubscription.delete({ where: { id: existing.id } });

  await appendEvent({
    actor: userId,
    objectType: "anchor",
    objectId: anchor.id,
    action: "unsubscribed",
    payload: {},
  });

  return existing;
}

export async function setMuted(userId: string, anchorIdOrUuid: string, muted: boolean) {
  const anchor = await prisma.anchorRecord.findFirst({
    where: { OR: [{ id: anchorIdOrUuid }, { anchorId: anchorIdOrUuid }] },
  });
  if (!anchor) throw notFound("Anchor not found");

  const existing = await prisma.anchorSubscription.findUnique({
    where: { userId_anchorId: { userId, anchorId: anchor.id } },
  });
  if (!existing) throw badRequest("Not subscribed to this anchor");

  return prisma.anchorSubscription.update({
    where: { id: existing.id },
    data: { muted },
  });
}

// ─── My subscriptions (with hierarchy-inherited indicator) ──────────────────

export async function listMySubscriptions(userId: string) {
  const subs = await prisma.anchorSubscription.findMany({
    where: { userId },
    include: {
      anchor: { include: { _count: { select: { links: true } } } },
    },
    orderBy: { subscribedAt: "desc" },
  });

  return subs.map((s) => ({
    id: s.id,
    muted: s.muted,
    scopeLevels: s.scopeLevels,
    languages: s.languages,
    subscribedAt: s.subscribedAt,
    anchor: {
      id: s.anchor.id,
      anchorId: s.anchor.anchorId,
      kind: s.anchor.kind,
      displayName: s.anchor.displayName,
      issueCount: s.anchor._count.links,
    },
  }));
}

// Aggregate the issues a user sees via their subscriptions (hierarchy-walked).
export async function listIssuesForMySubscriptions(userId: string) {
  const subs = await prisma.anchorSubscription.findMany({
    where: { userId, muted: false },
    select: { anchorId: true },
  });
  if (subs.length === 0) return [];

  const allIds = await resolveDescendantAnchorIds(subs.map((s) => s.anchorId));
  const links = await prisma.anchorLink.findMany({
    where: { anchorId: { in: allIds } },
    include: {
      issue: { include: { cell: true, anchorLinks: { include: { anchor: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const issues = [];
  for (const l of links) {
    if (seen.has(l.issueId)) continue;
    seen.add(l.issueId);
    issues.push(l.issue);
  }
  return issues;
}

// ─── Create / link ──────────────────────────────────────────────────────────

export async function createAnchor(params: {
  creatorId: string;
  anchorId: string; // e.g. "anchor:#my-topic"
  kind: "topic" | "location" | "event" | "cell";
  displayName: string;
  description?: string;
  parentIds?: string[];
}) {
  if (!params.anchorId.startsWith("anchor:")) {
    throw badRequest('anchorId must start with "anchor:"');
  }
  const dup = await prisma.anchorRecord.findUnique({ where: { anchorId: params.anchorId } });
  if (dup) throw badRequest("Anchor with that id already exists");

  const created = await prisma.anchorRecord.create({
    data: {
      anchorId: params.anchorId,
      kind: params.kind,
      displayName: params.displayName,
      description: params.description ?? "",
      parentIds: params.parentIds ?? [],
      creatorId: params.creatorId,
    },
  });

  await appendEvent({
    actor: params.creatorId,
    objectType: "anchor",
    objectId: created.id,
    action: "created",
    payload: { anchorId: params.anchorId, kind: params.kind },
  });

  return created;
}

export async function linkIssue(issueId: string, anchorIds: string[], actorId: string) {
  const created: string[] = [];
  for (const aid of anchorIds) {
    const anchor = await prisma.anchorRecord.findFirst({
      where: { OR: [{ id: aid }, { anchorId: aid }] },
    });
    if (!anchor) continue;
    try {
      await prisma.anchorLink.create({
        data: { anchorId: anchor.id, issueId },
      });
      created.push(anchor.id);
    } catch {
      // unique constraint — already linked, ignore.
    }
  }
  if (created.length > 0) {
    await appendEvent({
      actor: actorId,
      objectType: "issue",
      objectId: issueId,
      action: "anchor_linked",
      payload: { anchorIds: created },
    });
  }
  return created;
}
