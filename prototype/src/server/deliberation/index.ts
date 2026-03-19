import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { notFound, badRequest } from "@/server/errors";

// ─── Animal Aliases ─────────────────────────────────────────────────────────

const ANIMAL_ALIASES = [
  { name: "Owl", emoji: "🦉" },
  { name: "Fox", emoji: "🦊" },
  { name: "Bear", emoji: "🐻" },
  { name: "Deer", emoji: "🦌" },
  { name: "Rabbit", emoji: "🐰" },
  { name: "Eagle", emoji: "🦅" },
  { name: "Dolphin", emoji: "🐬" },
  { name: "Panda", emoji: "🐼" },
  { name: "Turtle", emoji: "🐢" },
  { name: "Hawk", emoji: "🦅" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Penguin", emoji: "🐧" },
  { name: "Cat", emoji: "🐱" },
  { name: "Dog", emoji: "🐕" },
  { name: "Koala", emoji: "🐨" },
  { name: "Otter", emoji: "🦦" },
];

// ─── Alias Helper ───────────────────────────────────────────────────────────

export async function getOrCreateAlias(issueId: string, userId: string) {
  const existing = await prisma.issueAlias.findUnique({
    where: { issueId_userId: { issueId, userId } },
  });

  if (existing) return existing;

  const usedCount = await prisma.issueAlias.count({ where: { issueId } });
  const pick = ANIMAL_ALIASES[usedCount % ANIMAL_ALIASES.length];

  return prisma.issueAlias.create({
    data: {
      issueId,
      userId,
      alias: pick.name,
      emoji: pick.emoji,
    },
  });
}

// ─── Add Comment ────────────────────────────────────────────────────────────

export async function addComment(params: {
  issueId: string;
  authorId: string;
  text: string;
  parentId?: string;
  stance?: "pro" | "con";
}) {
  const issue = await prisma.issue.findUnique({ where: { id: params.issueId } });
  if (!issue) throw notFound("Issue not found");

  if (params.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: params.parentId } });
    if (!parent || parent.issueId !== params.issueId) {
      throw badRequest("Parent comment not found in this issue");
    }
  }

  const alias = await getOrCreateAlias(params.issueId, params.authorId);

  const comment = await prisma.comment.create({
    data: {
      issueId: params.issueId,
      authorId: params.authorId,
      text: params.text,
      parentId: params.parentId,
      stance: params.stance,
    },
  });

  await prisma.issue.update({
    where: { id: params.issueId },
    data: { participants: { increment: 1 } },
  });

  await appendEvent({
    actor: params.authorId,
    objectType: "comment",
    objectId: comment.id,
    action: "created",
    payload: { issueId: params.issueId, alias: `${alias.alias} ${alias.emoji}` },
  });

  return { ...comment, alias: `${alias.alias} ${alias.emoji}` };
}

// ─── Add Argument ───────────────────────────────────────────────────────────

export async function addArgument(params: {
  issueId: string;
  authorId: string;
  text: string;
  type: "pro" | "con";
  parentId?: string;
}) {
  const issue = await prisma.issue.findUnique({ where: { id: params.issueId } });
  if (!issue) throw notFound("Issue not found");

  if (params.parentId) {
    const parent = await prisma.argumentNode.findUnique({ where: { id: params.parentId } });
    if (!parent || parent.issueId !== params.issueId) {
      throw badRequest("Parent argument not found in this issue");
    }
  }

  const alias = await getOrCreateAlias(params.issueId, params.authorId);

  const argument = await prisma.argumentNode.create({
    data: {
      issueId: params.issueId,
      authorId: params.authorId,
      text: params.text,
      type: params.type,
      parentId: params.parentId,
    },
  });

  await appendEvent({
    actor: params.authorId,
    objectType: "argument",
    objectId: argument.id,
    action: "created",
    payload: {
      issueId: params.issueId,
      type: params.type,
      alias: `${alias.alias} ${alias.emoji}`,
    },
  });

  return { ...argument, alias: `${alias.alias} ${alias.emoji}` };
}

// ─── Get Deliberation ───────────────────────────────────────────────────────

export async function getDeliberation(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      arguments: { orderBy: { createdAt: "asc" } },
      proposalDoc: true,
    },
  });
  if (!issue) throw notFound("Issue not found");

  const aliases = await prisma.issueAlias.findMany({ where: { issueId } });
  const aliasMap = new Map(
    aliases.map((a) => [a.userId, `${a.alias} ${a.emoji}`]),
  );

  const comments = issue.comments.map((c) => ({
    ...c,
    alias: aliasMap.get(c.authorId) ?? "Anonymous",
  }));

  const arguments_ = issue.arguments.map((a) => ({
    ...a,
    alias: aliasMap.get(a.authorId) ?? "Anonymous",
  }));

  return {
    comments,
    arguments: arguments_,
    proposal: issue.proposalDoc,
  };
}
