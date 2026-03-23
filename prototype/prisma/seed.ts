import { PrismaClient, IssueStatus, IssueScope } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// Deterministic UUIDs
const issueId = (n: number) => `00000000-0000-0000-0000-00000000000${n}`;
const currentUserId = "00000000-0000-0000-0000-0000000000a0";

const userMap: Record<string, string> = {
  Owl: "00000000-0000-0000-0000-0000000000a1",
  Fox: "00000000-0000-0000-0000-0000000000a2",
  Bear: "00000000-0000-0000-0000-0000000000a3",
  Deer: "00000000-0000-0000-0000-0000000000a4",
  Rabbit: "00000000-0000-0000-0000-0000000000a5",
  Eagle: "00000000-0000-0000-0000-0000000000a6",
  Dolphin: "00000000-0000-0000-0000-0000000000a7",
  Panda: "00000000-0000-0000-0000-0000000000a8",
  Turtle: "00000000-0000-0000-0000-0000000000a9",
  Hawk: "00000000-0000-0000-0000-0000000000aa",
  Wolf: "00000000-0000-0000-0000-0000000000ab",
  Crane: "00000000-0000-0000-0000-0000000000ac",
  Otter: "00000000-0000-0000-0000-0000000000ad",
  Hedgehog: "00000000-0000-0000-0000-0000000000ae",
  Salamander: "00000000-0000-0000-0000-0000000000af",
  Badger: "00000000-0000-0000-0000-0000000000b0",
  Heron: "00000000-0000-0000-0000-0000000000b1",
};

const statusMap: Record<string, IssueStatus> = {
  draft: IssueStatus.draft,
  deliberating: IssueStatus.deliberating,
  "vote-ready": IssueStatus.vote_ready,
  adopted: IssueStatus.adopted,
  implementing: IssueStatus.implementing,
  completed: IssueStatus.completed,
  archived: IssueStatus.archived,
};

async function clean() {
  // Delete in reverse dependency order
  await prisma.burnEvent.deleteMany();
  await prisma.mintEvent.deleteMany();
  await prisma.tokenAccount.deleteMany();
  await prisma.demurrageCheckpoint.deleteMany();
  await prisma.monetarySnapshot.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.restriction.deleteMany();
  await prisma.riskSignal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.issueSubscription.deleteMany();
  await prisma.evidenceAsset.deleteMany();
  await prisma.implementationReport.deleteMany();
  await prisma.verificationReview.deleteMany();
  await prisma.disputeCase.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.workPackage.deleteMany();
  await prisma.decisionState.deleteMany();
  await prisma.voteRecord.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.eligibilityQuiz.deleteMany();
  await prisma.stakeClaim.deleteMany();
  await prisma.boundaryAssessment.deleteMany();
  await prisma.metricAssessment.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.argumentNode.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.proposalRevision.deleteMany();
  await prisma.proposalDocument.deleteMany();
  await prisma.issueAlias.deleteMany();
  await prisma.issueRevision.deleteMany();
  await prisma.rewardIntent.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.session.deleteMany();
  await prisma.walletLink.deleteMany();
  await prisma.identityProviderLink.deleteMany();
  await prisma.contentBlob.deleteMany();
  await prisma.anchorBatch.deleteMany();
  await prisma.ledgerEvent.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  console.log("🧹 Cleaning database...");
  await clean();

  console.log("👤 Creating users...");
  // Current user (with wallet so dev-login can find them)
  await prisma.user.create({
    data: {
      id: currentUserId,
      displayName: "You",
      wallets: {
        create: { address: "0xdev0000000000000000000000000000000000" },
      },
    },
  });

  // Mock alias users
  for (const [alias, id] of Object.entries(userMap)) {
    await prisma.user.create({
      data: { id, displayName: alias },
    });
  }

  // Token account for current user
  await prisma.tokenAccount.create({
    data: { userId: currentUserId, balance: 142.3 },
  });

  console.log("📋 Creating issues...");

  // Import mock data inline to avoid TS module issues
  const { issues } = await import("../src/lib/mock-data");

  for (const issue of issues) {
    const iid = issueId(Number(issue.id));

    await prisma.issue.create({
      data: {
        id: iid,
        title: issue.title,
        summary: issue.summary,
        description: issue.description,
        status: statusMap[issue.status],
        scope: issue.scope as IssueScope,
        tags: issue.tags,
        creatorId: currentUserId,
        participants: issue.participants,
        createdAt: new Date(issue.createdAt),
      },
    });

    // RewardIntent
    await prisma.rewardIntent.create({
      data: { issueId: iid, amount: issue.rewardIntent },
    });

    // MetricAssessments
    for (const metric of issue.metrics) {
      await prisma.metricAssessment.create({
        data: {
          issueId: iid,
          dimension: metric.label.toLowerCase(),
          value: metric.value,
          confidence: metric.confidence,
          sourceType: "creator",
          authorId: currentUserId,
        },
      });
    }

    // BoundaryAssessments
    for (const boundary of issue.boundaries) {
      await prisma.boundaryAssessment.create({
        data: {
          issueId: iid,
          label: boundary.label,
          icon: boundary.icon,
          direction: boundary.direction,
          delta: boundary.delta,
          confidence: boundary.confidence,
          authorId: currentUserId,
        },
      });
    }

    // AISummary
    if (issue.aiSummary) {
      await prisma.aISummary.create({
        data: {
          issueId: iid,
          content: issue.aiSummary,
          modelVersion: "gpt-4o-2026-01",
          promptVersion: "v1",
        },
      });
    }

    // Track aliases created per issue to map alias→userId for comments/arguments
    const aliasesCreated = new Set<string>();

    // Comments — need to create parent comments first, then children
    const parentComments = issue.comments.filter((c) => c.parentId === null);
    const childComments = issue.comments.filter((c) => c.parentId !== null);

    // Map from mock comment id → db comment id
    const commentIdMap: Record<string, string> = {};

    for (const comment of [...parentComments, ...childComments]) {
      const authorId = userMap[comment.alias];
      if (!authorId) continue;

      // Create IssueAlias if not already created
      if (!aliasesCreated.has(comment.alias)) {
        await prisma.issueAlias.create({
          data: {
            issueId: iid,
            userId: authorId,
            alias: comment.alias,
            emoji: comment.emoji,
          },
        });
        aliasesCreated.add(comment.alias);
      }

      const parentDbId = comment.parentId ? commentIdMap[comment.parentId] : null;

      const created = await prisma.comment.create({
        data: {
          issueId: iid,
          authorId,
          text: comment.text,
          parentId: parentDbId,
          upvotes: comment.upvotes,
          downvotes: comment.downvotes,
          stance: comment.stance ?? null,
        },
      });
      commentIdMap[comment.id] = created.id;
    }

    // ArgumentNodes — parent first, then children
    const parentArgs = issue.arguments.filter((a) => a.parentId === null);
    const childArgs = issue.arguments.filter((a) => a.parentId !== null);
    const argIdMap: Record<string, string> = {};

    for (const arg of [...parentArgs, ...childArgs]) {
      const authorId = userMap[arg.alias];
      if (!authorId) continue;

      // Create IssueAlias if not already created
      if (!aliasesCreated.has(arg.alias)) {
        await prisma.issueAlias.create({
          data: {
            issueId: iid,
            userId: authorId,
            alias: arg.alias,
            emoji: arg.emoji,
          },
        });
        aliasesCreated.add(arg.alias);
      }

      const parentDbId = arg.parentId ? argIdMap[arg.parentId] : null;

      const created = await prisma.argumentNode.create({
        data: {
          issueId: iid,
          authorId,
          text: arg.text,
          type: arg.type,
          parentId: parentDbId,
        },
      });
      argIdMap[arg.id] = created.id;
    }

    // DecisionState
    const { approve, reject } = issue.votesTally;
    if (approve > 0 || reject > 0) {
      await prisma.decisionState.create({
        data: {
          issueId: iid,
          state: "open",
          approveCount: approve,
          rejectCount: reject,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
