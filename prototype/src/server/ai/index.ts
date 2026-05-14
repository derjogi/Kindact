import { prisma } from "@/server/db";
import { notFound } from "@/server/errors";
import { aiComplete } from "@/lib/ai/client";

// ─── Generate Deliberation Summary ──────────────────────────────────────────

export async function generateSummary(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      arguments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!issue) throw notFound("Issue not found");

  const parts: string[] = [
    `## Issue: ${issue.title}`,
    `**Summary:** ${issue.summary}`,
    "",
    "## Deliberation Content",
  ];

  if (issue.comments.length > 0) {
    parts.push("", "### Comments");
    for (const c of issue.comments) {
      parts.push(`- ${c.text}`);
    }
  }

  if (issue.arguments.length > 0) {
    parts.push("", "### Arguments");
    for (const a of issue.arguments) {
      parts.push(`- [${a.type.toUpperCase()}] ${a.text}`);
    }
  }

  if (issue.comments.length === 0 && issue.arguments.length === 0) {
    parts.push("", "_No deliberation content yet._");
  }

  const result = await aiComplete("DELIBERATION_SUMMARY", parts.join("\n"));

  const sourceRefs = [
    ...issue.comments.map((c) => c.id),
    ...issue.arguments.map((a) => a.id),
  ];

  const summary = await prisma.aISummary.upsert({
    where: { issueId },
    create: {
      issueId,
      content: result.content,
      modelVersion: result.modelVersion,
      promptVersion: result.promptVersion,
      sourceRefs,
    },
    update: {
      content: result.content,
      modelVersion: result.modelVersion,
      promptVersion: result.promptVersion,
      sourceRefs,
      generatedAt: new Date(),
    },
  });

  return summary;
}

// ─── Generate Issue Improvement Suggestions ─────────────────────────────────

export async function generateImprovements(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
  });
  if (!issue) throw notFound("Issue not found");

  const userContent = [
    `**Title:** ${issue.title}`,
    `**Summary:** ${issue.summary}`,
    `**Description:** ${issue.description}`,
    `**Scope:** ${issue.scope}`,
    `**Tags:** ${issue.tags.join(", ")}`,
  ].join("\n");

  const result = await aiComplete("ISSUE_IMPROVER", userContent);

  return {
    suggestions: result.content,
    modelVersion: result.modelVersion,
    promptVersion: result.promptVersion,
  };
}

// ─── Propose Topics ─────────────────────────────────────────────────────────

export async function proposeTopics(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
  });
  if (!issue) throw notFound("Issue not found");

  const userContent = [
    `**Title:** ${issue.title}`,
    `**Description:** ${issue.description}`,
  ].join("\n");

  const result = await aiComplete("TOPIC_PROPOSER", userContent);

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(result.content);
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    // If the model didn't return valid JSON, try to extract tags
    const match = result.content.match(/\[[\s\S]*\]/);
    if (match) {
      try { tags = JSON.parse(match[0]); } catch { /* ignore */ }
    }
  }

  return { tags, raw: result.content, modelVersion: result.modelVersion };
}

// ─── Find Similar Issues ────────────────────────────────────────────────────

export async function findSimilarIssues(issueId: string) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw notFound("Issue not found");

  const otherIssues = await prisma.issue.findMany({
    where: { id: { not: issueId } },
    take: 50,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, summary: true },
  });

  if (otherIssues.length === 0) return { similar: [] };

  const userContent = [
    "## New Issue",
    `Title: ${issue.title}`,
    `Summary: ${issue.summary}`,
    "",
    "## Existing Issues",
    ...otherIssues.map((o) => `- ID: ${o.id} | Title: ${o.title} | Summary: ${o.summary}`),
  ].join("\n");

  const result = await aiComplete("SIMILARITY_DETECTOR", userContent);

  let similar: { id: string; reason: string }[] = [];
  try {
    const parsed = JSON.parse(result.content);
    if (Array.isArray(parsed)) similar = parsed;
  } catch {
    const match = result.content.match(/\[[\s\S]*\]/);
    if (match) {
      try { similar = JSON.parse(match[0]); } catch { /* ignore */ }
    }
  }

  return { similar, modelVersion: result.modelVersion };
}
