import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { notFound, badRequest } from "@/server/errors";

// ─── Create Work Package ────────────────────────────────────────────────────

export async function createWorkPackage(params: {
  issueId: string;
  title: string;
  description?: string;
}) {
  const issue = await prisma.issue.findUnique({ where: { id: params.issueId } });
  if (!issue) throw notFound("Issue not found");
  if (issue.status !== "adopted" && issue.status !== "implementing") {
    throw badRequest("Work packages can only be created for adopted or implementing issues");
  }

  const wp = await prisma.workPackage.create({
    data: {
      issueId: params.issueId,
      title: params.title,
      description: params.description,
    },
  });

  await appendEvent({
    actor: issue.creatorId,
    objectType: "work_package",
    objectId: wp.id,
    action: "created",
    payload: { issueId: params.issueId, title: params.title },
  });

  return wp;
}

// ─── Create Claim ───────────────────────────────────────────────────────────

export async function createClaim(params: {
  workPackageId: string;
  implementerId: string;
}) {
  const wp = await prisma.workPackage.findUnique({
    where: { id: params.workPackageId },
  });
  if (!wp) throw notFound("Work package not found");

  const claim = await prisma.claim.create({
    data: {
      workPackageId: params.workPackageId,
      implementerId: params.implementerId,
    },
  });

  await appendEvent({
    actor: params.implementerId,
    objectType: "claim",
    objectId: claim.id,
    action: "created",
    payload: { workPackageId: params.workPackageId },
  });

  return claim;
}

// ─── Submit Report ──────────────────────────────────────────────────────────

export async function submitReport(params: {
  claimId: string;
  type: "partial" | "milestone" | "final";
  content: string;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
  if (!claim) throw notFound("Claim not found");

  const report = await prisma.implementationReport.create({
    data: {
      claimId: params.claimId,
      type: params.type,
      content: params.content,
    },
  });

  await prisma.claim.update({
    where: { id: params.claimId },
    data: { status: "submitted" },
  });

  await appendEvent({
    actor: claim.implementerId,
    objectType: "report",
    objectId: report.id,
    action: "submitted",
    payload: { claimId: params.claimId, type: params.type },
  });

  return report;
}

// ─── Get Claim ──────────────────────────────────────────────────────────────

export async function getClaim(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      reports: {
        include: { evidence: true },
        orderBy: { createdAt: "asc" },
      },
      workPackage: true,
    },
  });
  if (!claim) throw notFound("Claim not found");
  return claim;
}

// ─── List Claims ────────────────────────────────────────────────────────────

export async function listClaims(issueId: string) {
  const workPackages = await prisma.workPackage.findMany({
    where: { issueId },
    include: {
      claims: {
        include: {
          reports: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return workPackages.flatMap((wp) =>
    wp.claims.map((claim) => ({ ...claim, workPackageTitle: wp.title })),
  );
}
