import { PrismaClient, Prisma, IssueStatus, IssueScope } from "../src/generated/prisma/client";

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
  await prisma.savedLens.deleteMany();
  await prisma.anchorSubscription.deleteMany();
  await prisma.anchorLink.deleteMany();
  await prisma.anchorRecord.deleteMany();
  await prisma.cellMembership.deleteMany();
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
  await prisma.cell.deleteMany();
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

  console.log("🏘️  Creating cells...");
  // Seed set per holochain/030 (canonical "We" registry, promoted public cells, an uncurated example).
  type SeedCell = {
    cellId: string;
    displayName: string;
    description: string;
    tier: "canonical" | "promoted" | "uncurated";
    scopeLevel: string;
    locationRefs?: string[];
    topicTags?: string[];
    membraneRead?: string;
    membraneWrite?: string;
    scopeProofTypes?: string[];
    jurisdictionalClaims?: string[];
    governanceEngine?: string;
  };
  const seedCells: SeedCell[] = [
    {
      cellId: "kindact:we",
      displayName: "Kindact (Global Registry)",
      description:
        "The canonical global registry — a 'We of Wes'. Hosts the cell directory, anchor index, and meta-governance. Read-public; writes via meta-governance.",
      tier: "canonical",
      scopeLevel: "global",
      membraneRead: "public",
      membraneWrite: "invite_only",
      governanceEngine: "meta_governance",
    },
    {
      cellId: "kindact:berlin",
      displayName: "Berlin",
      description:
        "Promoted city cell for Berlin. Members coordinate around city-scoped issues — housing, transit, public space.",
      tier: "promoted",
      scopeLevel: "city",
      locationRefs: ["place:berlin", "h3:88283082"],
      topicTags: ["#berlin", "#urban"],
      scopeProofTypes: ["geotagged_evidence", "neighbor_invite"],
      jurisdictionalClaims: ["jc:berlin-housing-rules-v2"],
      governanceEngine: "consensus_with_neighbor_agreement",
    },
    {
      cellId: "kindact:housing",
      displayName: "Housing",
      description:
        "Promoted topic cell for housing policy and tenant coordination across geographies.",
      tier: "promoted",
      scopeLevel: "topic",
      topicTags: ["#housing", "#tenants"],
      governanceEngine: "approval_voting",
    },
    {
      cellId: "kindact:green-energy",
      displayName: "Green Energy",
      description:
        "Promoted topic cell for renewable-energy projects, policy, and grants.",
      tier: "promoted",
      scopeLevel: "topic",
      topicTags: ["#energy", "#renewable", "#climate"],
      governanceEngine: "approval_voting",
    },
    {
      cellId: "kindact:climate",
      displayName: "Climate",
      description:
        "Promoted topic cell for climate adaptation, mitigation, and accountability.",
      tier: "promoted",
      scopeLevel: "topic",
      topicTags: ["#climate"],
      governanceEngine: "approval_voting",
    },
    {
      cellId: "kindact:permaculture",
      displayName: "Permaculture",
      description:
        "Promoted topic cell for regenerative agriculture and permaculture design coordination.",
      tier: "promoted",
      scopeLevel: "topic",
      topicTags: ["#permaculture", "#regenerative"],
      governanceEngine: "approval_voting",
    },
    {
      cellId: "uncurated/did:plc:elm-st-neighbors/elm-street-residents",
      displayName: "Elm Street Residents",
      description:
        "Uncurated neighborhood cell. Created by a resident to coordinate on Elm Street issues. Pending promotion proposal.",
      tier: "uncurated",
      scopeLevel: "neighborhood",
      locationRefs: ["place:elm-street"],
      scopeProofTypes: ["neighbor_invite"],
      governanceEngine: "consensus_with_neighbor_agreement",
    },
  ];

  // Track cellId string → DB UUID for later FK references.
  const cellDbId: Record<string, string> = {};
  for (const c of seedCells) {
    const created = await prisma.cell.create({
      data: {
        cellId: c.cellId,
        displayName: c.displayName,
        description: c.description,
        tier: c.tier,
        scopeLevel: c.scopeLevel,
        locationRefs: c.locationRefs ?? [],
        topicTags: c.topicTags ?? [],
        membraneRead: c.membraneRead ?? "public",
        membraneWrite: c.membraneWrite ?? "scope_verified",
        scopeProofTypes: c.scopeProofTypes ?? [],
        jurisdictionalClaims: c.jurisdictionalClaims ?? [],
        governanceEngine: c.governanceEngine ?? "approval_voting",
        creatorId: currentUserId,
      },
    });
    cellDbId[c.cellId] = created.id;
  }

  // Current user joins a few cells so the UI has state to show.
  const currentUserCells = ["kindact:berlin", "kindact:green-energy", "kindact:climate"];
  for (const cid of currentUserCells) {
    await prisma.cellMembership.create({
      data: { cellId: cellDbId[cid], userId: currentUserId, kind: "member" },
    });
  }

  console.log("⚓  Creating anchors...");
  // Per holochain/042 — global cross-cell discovery primitive.
  type SeedAnchor = {
    anchorId: string;
    kind: "topic" | "location" | "event" | "cell";
    displayName: string;
    description?: string;
    synonyms?: string[];
    parents?: string[];
  };
  const seedAnchors: SeedAnchor[] = [
    // Top-level topic anchors
    { anchorId: "anchor:#energy", kind: "topic", displayName: "Energy" },
    { anchorId: "anchor:#climate", kind: "topic", displayName: "Climate" },
    { anchorId: "anchor:#housing", kind: "topic", displayName: "Housing" },
    { anchorId: "anchor:#governance", kind: "topic", displayName: "Governance" },
    { anchorId: "anchor:#permaculture", kind: "topic", displayName: "Permaculture" },
    { anchorId: "anchor:#infrastructure", kind: "topic", displayName: "Infrastructure" },
    { anchorId: "anchor:#transit", kind: "topic", displayName: "Transit" },
    { anchorId: "anchor:#waste", kind: "topic", displayName: "Waste & Circular Economy" },
    { anchorId: "anchor:#digital-access", kind: "topic", displayName: "Digital Access" },
    // Child topic anchors
    {
      anchorId: "anchor:#wind-power",
      kind: "topic",
      displayName: "Wind Power",
      synonyms: ["wind-energy"],
      parents: ["anchor:#energy", "anchor:#climate"],
    },
    {
      anchorId: "anchor:#solar",
      kind: "topic",
      displayName: "Solar",
      parents: ["anchor:#energy", "anchor:#climate"],
    },
    {
      anchorId: "anchor:#bike-lanes",
      kind: "topic",
      displayName: "Bike Lanes",
      parents: ["anchor:#transit", "anchor:#infrastructure"],
    },
    {
      anchorId: "anchor:#public-space",
      kind: "topic",
      displayName: "Public Space",
      parents: ["anchor:#infrastructure"],
    },
    // Location anchors
    { anchorId: "anchor:📍berlin", kind: "location", displayName: "Berlin" },
    { anchorId: "anchor:📍manhattan", kind: "location", displayName: "Manhattan" },
    { anchorId: "anchor:📍new-york", kind: "location", displayName: "New York" },
    { anchorId: "anchor:📍elm-street", kind: "location", displayName: "Elm Street" },
    // Event anchor
    {
      anchorId: "anchor:event:cop34-2026",
      kind: "event",
      displayName: "COP34 (2026)",
      description: "Coordination cell for actions and commitments around COP34.",
    },
  ];

  const anchorDbId: Record<string, string> = {};
  // First pass: create without parents.
  for (const a of seedAnchors) {
    const created = await prisma.anchorRecord.create({
      data: {
        anchorId: a.anchorId,
        kind: a.kind,
        displayName: a.displayName,
        description: a.description ?? "",
        synonyms: a.synonyms ?? [],
        creatorId: currentUserId,
      },
    });
    anchorDbId[a.anchorId] = created.id;
  }
  // Second pass: wire parent IDs.
  for (const a of seedAnchors) {
    if (!a.parents?.length) continue;
    await prisma.anchorRecord.update({
      where: { id: anchorDbId[a.anchorId] },
      data: { parentIds: a.parents.map((p) => anchorDbId[p]).filter(Boolean) },
    });
  }

  // Subscribe current user to a handful of anchors so the feed has signal.
  const currentUserSubs = [
    "anchor:#energy",
    "anchor:#bike-lanes",
    "anchor:📍berlin",
    "anchor:📍elm-street",
  ];
  for (const aid of currentUserSubs) {
    await prisma.anchorSubscription.create({
      data: { userId: currentUserId, anchorId: anchorDbId[aid] },
    });
  }

  // Map issues (by mock-data id "1".."6") to their home cell + anchor links.
  // Spread across cells so the "cell context affordances" (029) have texture.
  const issueCellMap: Record<string, string> = {
    "1": "uncurated/did:plc:elm-st-neighbors/elm-street-residents", // Elm Street drainage
    "2": "kindact:green-energy",                                     // Solar panel program
    "3": "kindact:climate",                                          // Reduce packaging waste (climate)
    "4": "kindact:berlin",                                           // Park cleanup (city)
    "5": "kindact:housing",                                          // Free public Wi-Fi (tenant access)
    "6": "kindact:berlin",                                           // Bike lane network (city)
  };
  // Cross-cell anchors mean issues in different cells share anchors — that's
  // what powers the "Related across cells" surface on the issue detail page.
  const issueAnchorMap: Record<string, string[]> = {
    "1": ["anchor:#infrastructure", "anchor:📍elm-street"],
    "2": ["anchor:#solar", "anchor:#energy", "anchor:#climate"],
    "3": ["anchor:#waste", "anchor:#climate", "anchor:📍berlin"],
    "4": ["anchor:#public-space", "anchor:📍berlin"],
    "5": ["anchor:#digital-access", "anchor:#housing"],
    "6": ["anchor:#bike-lanes", "anchor:#transit", "anchor:📍berlin"],
  };

  // Cross-cell guest-contribution demo: current user is *not* a member of the
  // Elm Street uncurated cell but is a guest contributor on its only issue.
  // The strip on /issues/1 should render the "guest contributor" state.
  // We add the guest membership *after* the issues are created below.
  const guestContribIssueMockId = "1";

  console.log("📋 Creating issues...");

  // Import mock data inline to avoid TS module issues
  const { issues } = await import("../src/lib/mock-data");

  for (const issue of issues) {
    const iid = issueId(Number(issue.id));
    const homeCellId = issueCellMap[issue.id] ? cellDbId[issueCellMap[issue.id]] : null;

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
        cellId: homeCellId,
        participants: issue.participants,
        createdAt: new Date(issue.createdAt),
      },
    });

    // Anchor links
    const anchorIds = issueAnchorMap[issue.id] ?? [];
    for (const aid of anchorIds) {
      const dbId = anchorDbId[aid];
      if (!dbId) continue;
      await prisma.anchorLink.create({
        data: {
          anchorId: dbId,
          issueId: iid,
          scopeLevel: issue.scope,
        },
      });
    }

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
          quotedText: comment.quotedText ?? null,
          sourceType: comment.sourceType ?? null,
          sourceId: comment.sourceId ?? null,
          quoteStart: comment.quoteStart ?? null,
          quoteEnd: comment.quoteEnd ?? null,
        },
      });
      commentIdMap[comment.id] = created.id;
    }

    // AISummary (after comments so we can reference commentIdMap)
    if (issue.aiSummary) {
      let references: Prisma.InputJsonValue | undefined = undefined;
      if (issue.id === "6") {
        references = [
          { start: 0, end: 85, commentIds: [commentIdMap["c30"], commentIdMap["c31"]].filter(Boolean), strength: "direct" },
          { start: 86, end: 175, commentIds: [commentIdMap["c34"], commentIdMap["c34a"]].filter(Boolean), strength: "direct" },
          { start: 176, end: 280, commentIds: [commentIdMap["c35"], commentIdMap["c35a"]].filter(Boolean), strength: "approximate" },
          { start: 281, end: 380, commentIds: [commentIdMap["c36"], commentIdMap["c36a"], commentIdMap["c36b"]].filter(Boolean), strength: "direct" },
        ];
      }
      await prisma.aISummary.create({
        data: {
          issueId: iid,
          content: issue.aiSummary,
          modelVersion: "gpt-4o-2026-01",
          promptVersion: "v1",
          references: references,
        },
      });
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

  // Cross-cell guest contribution: currentUser becomes guest on a single issue
  // in a cell they are not a member of (per holochain/044 issue-scoped guest).
  {
    const guestIid = issueId(Number(guestContribIssueMockId));
    const guestIssue = await prisma.issue.findUnique({
      where: { id: guestIid },
      select: { cellId: true },
    });
    if (guestIssue?.cellId) {
      await prisma.cellMembership.create({
        data: {
          cellId: guestIssue.cellId,
          userId: currentUserId,
          kind: "guest",
          issueId: guestIid,
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
