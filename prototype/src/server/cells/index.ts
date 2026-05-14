import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { badRequest, notFound } from "@/server/errors";
import type { CellTier } from "@/generated/prisma/client";

// ─── List ───────────────────────────────────────────────────────────────────

export async function listCells(filters: {
  tier?: string;
  scopeLevel?: string;
  search?: string;
  userId?: string;
}) {
  const where: Record<string, unknown> = { lifecycle: "active" };
  if (filters.tier) where.tier = filters.tier as CellTier;
  if (filters.scopeLevel) where.scopeLevel = filters.scopeLevel;
  if (filters.search) {
    where.OR = [
      { displayName: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { cellId: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const cells = await prisma.cell.findMany({
    where,
    orderBy: [{ tier: "asc" }, { displayName: "asc" }],
    include: {
      _count: { select: { memberships: true, issues: true } },
    },
  });

  // If a user is given, also flag their relationship per cell.
  let myMemberships: Set<string> = new Set();
  if (filters.userId) {
    const m = await prisma.cellMembership.findMany({
      where: { userId: filters.userId, leftAt: null, kind: "member" },
      select: { cellId: true },
    });
    myMemberships = new Set(m.map((x) => x.cellId));
  }

  return cells.map((c) => ({
    id: c.id,
    cellId: c.cellId,
    displayName: c.displayName,
    description: c.description,
    tier: c.tier,
    scopeLevel: c.scopeLevel,
    locationRefs: c.locationRefs,
    topicTags: c.topicTags,
    membraneRead: c.membraneRead,
    membraneWrite: c.membraneWrite,
    jurisdictionalClaims: c.jurisdictionalClaims,
    governanceEngine: c.governanceEngine,
    lifecycle: c.lifecycle,
    memberCount: c._count.memberships,
    issueCount: c._count.issues,
    isMember: myMemberships.has(c.id),
    forkedFromId: c.forkedFromId,
    createdAt: c.createdAt,
    lastActivityAt: c.lastActivityAt,
  }));
}

// ─── Get ────────────────────────────────────────────────────────────────────

export async function getCell(idOrCellId: string, viewerId?: string) {
  // Accept either UUID or stable "kindact:berlin"-style cellId.
  const cell = await prisma.cell.findFirst({
    where: { OR: [{ id: idOrCellId }, { cellId: idOrCellId }] },
    include: {
      _count: { select: { memberships: true, issues: true } },
      forkedFrom: true,
    },
  });
  if (!cell) throw notFound("Cell not found");

  let viewerRelation: "member" | "guest" | "none" = "none";
  if (viewerId) {
    const m = await prisma.cellMembership.findFirst({
      where: { cellId: cell.id, userId: viewerId, leftAt: null },
      orderBy: { joinedAt: "desc" },
    });
    if (m) viewerRelation = m.kind === "guest" ? "guest" : "member";
  }

  return {
    id: cell.id,
    cellId: cell.cellId,
    displayName: cell.displayName,
    description: cell.description,
    tier: cell.tier,
    scopeLevel: cell.scopeLevel,
    locationRefs: cell.locationRefs,
    topicTags: cell.topicTags,
    membraneRead: cell.membraneRead,
    membraneWrite: cell.membraneWrite,
    scopeProofTypes: cell.scopeProofTypes,
    jurisdictionalClaims: cell.jurisdictionalClaims,
    governanceEngine: cell.governanceEngine,
    forkedFrom: cell.forkedFrom
      ? { id: cell.forkedFrom.id, cellId: cell.forkedFrom.cellId, displayName: cell.forkedFrom.displayName }
      : null,
    lifecycle: cell.lifecycle,
    memberCount: cell._count.memberships,
    issueCount: cell._count.issues,
    viewerRelation,
    createdAt: cell.createdAt,
    lastActivityAt: cell.lastActivityAt,
  };
}

// ─── Membership ─────────────────────────────────────────────────────────────

export async function joinCell(cellId: string, userId: string) {
  const cell = await prisma.cell.findUnique({ where: { id: cellId } });
  if (!cell) throw notFound("Cell not found");
  if (cell.lifecycle !== "active") throw badRequest("Cell is archived");

  // Idempotent: if there's a current open membership, return it.
  const existing = await prisma.cellMembership.findFirst({
    where: { cellId, userId, leftAt: null, kind: "member" },
  });
  if (existing) return existing;

  const membership = await prisma.cellMembership.create({
    data: { cellId, userId, kind: "member" },
  });

  await appendEvent({
    actor: userId,
    objectType: "cell",
    objectId: cellId,
    action: "joined",
    payload: { cellIdStr: cell.cellId },
  });

  return membership;
}

export async function leaveCell(cellId: string, userId: string) {
  const open = await prisma.cellMembership.findFirst({
    where: { cellId, userId, leftAt: null, kind: "member" },
  });
  if (!open) return null;

  const updated = await prisma.cellMembership.update({
    where: { id: open.id },
    data: { leftAt: new Date() },
  });

  await appendEvent({
    actor: userId,
    objectType: "cell",
    objectId: cellId,
    action: "left",
    payload: {},
  });

  return updated;
}

export async function joinAsGuest(cellId: string, userId: string, issueId: string) {
  const cell = await prisma.cell.findUnique({ where: { id: cellId } });
  if (!cell) throw notFound("Cell not found");

  const existing = await prisma.cellMembership.findFirst({
    where: { cellId, userId, issueId, leftAt: null, kind: "guest" },
  });
  if (existing) return existing;

  const membership = await prisma.cellMembership.create({
    data: { cellId, userId, kind: "guest", issueId },
  });

  await appendEvent({
    actor: userId,
    objectType: "cell",
    objectId: cellId,
    action: "guest_joined",
    payload: { issueId },
  });

  return membership;
}

// ─── Create / Fork ──────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function createCell(params: {
  creatorId: string;
  displayName: string;
  description?: string;
  scopeLevel?: string;
  locationRefs?: string[];
  topicTags?: string[];
  membraneRead?: string;
  membraneWrite?: string;
  scopeProofTypes?: string[];
  governanceEngine?: string;
  forkedFromId?: string;
}) {
  if (!params.displayName?.trim()) throw badRequest("displayName required");

  // New cells always land in uncurated/<creatorId>/<slug> per holochain/030.
  const slug = slugify(params.displayName);
  const cellIdStr = `uncurated/${params.creatorId}/${slug}`;

  const dup = await prisma.cell.findUnique({ where: { cellId: cellIdStr } });
  if (dup) throw badRequest(`Cell with slug "${slug}" already exists for this creator`);

  const cell = await prisma.cell.create({
    data: {
      cellId: cellIdStr,
      displayName: params.displayName,
      description: params.description ?? "",
      tier: "uncurated",
      scopeLevel: params.scopeLevel ?? "topic",
      locationRefs: params.locationRefs ?? [],
      topicTags: params.topicTags ?? [],
      membraneRead: params.membraneRead ?? "public",
      membraneWrite: params.membraneWrite ?? "scope_verified",
      scopeProofTypes: params.scopeProofTypes ?? [],
      governanceEngine: params.governanceEngine ?? "approval_voting",
      forkedFromId: params.forkedFromId ?? null,
      creatorId: params.creatorId,
    },
  });

  // Creator is automatically a member.
  await prisma.cellMembership.create({
    data: { cellId: cell.id, userId: params.creatorId, kind: "member" },
  });

  await appendEvent({
    actor: params.creatorId,
    objectType: "cell",
    objectId: cell.id,
    action: "created",
    payload: { cellIdStr, forkedFromId: params.forkedFromId ?? null },
  });

  return cell;
}

export async function forkCell(sourceId: string, creatorId: string, displayName: string) {
  const source = await prisma.cell.findUnique({ where: { id: sourceId } });
  if (!source) throw notFound("Source cell not found");

  return createCell({
    creatorId,
    displayName,
    description: `Fork of ${source.displayName}. ${source.description}`,
    scopeLevel: source.scopeLevel,
    locationRefs: source.locationRefs,
    topicTags: source.topicTags,
    membraneRead: source.membraneRead,
    membraneWrite: source.membraneWrite,
    scopeProofTypes: source.scopeProofTypes,
    governanceEngine: source.governanceEngine,
    forkedFromId: source.id,
  });
}

// ─── My state ───────────────────────────────────────────────────────────────

export async function listMyCells(userId: string) {
  const memberships = await prisma.cellMembership.findMany({
    where: { userId, leftAt: null },
    include: { cell: { include: { _count: { select: { memberships: true, issues: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    membershipId: m.id,
    kind: m.kind,
    issueId: m.issueId,
    joinedAt: m.joinedAt,
    cell: {
      id: m.cell.id,
      cellId: m.cell.cellId,
      displayName: m.cell.displayName,
      tier: m.cell.tier,
      scopeLevel: m.cell.scopeLevel,
      memberCount: m.cell._count.memberships,
      issueCount: m.cell._count.issues,
    },
  }));
}
