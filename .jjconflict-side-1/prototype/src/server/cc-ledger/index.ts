import { prisma } from "@/server/db";
import { appendEvent } from "@/server/ledger";
import { badRequest } from "@/server/errors";

// ─── Demurrage ──────────────────────────────────────────────────────────────

const MONTHLY_DECAY = 0.99; // 1% per month

function applyDemurrage(balance: number, lastUpdated: Date): number {
  const now = new Date();
  const msElapsed = now.getTime() - lastUpdated.getTime();
  const monthsElapsed = msElapsed / (30 * 24 * 60 * 60 * 1000);
  return balance * Math.pow(MONTHLY_DECAY, monthsElapsed);
}

// ─── Get Account ────────────────────────────────────────────────────────────

export async function getAccount(userId: string) {
  let account = await prisma.tokenAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    account = await prisma.tokenAccount.create({
      data: { userId },
    });
  }

  const adjustedBalance = applyDemurrage(account.balance, account.updatedAt);

  return {
    ...account,
    balance: adjustedBalance,
  };
}

// ─── Mint Reward ────────────────────────────────────────────────────────────

export async function mintReward(params: {
  userId: string;
  amount: number;
  sourceClaimId?: string;
  sourceReportId?: string;
}) {
  if (params.amount <= 0) throw badRequest("Amount must be positive");

  const { balance, ...account } = await getAccount(params.userId);

  const mintEvent = await prisma.mintEvent.create({
    data: {
      accountId: account.id,
      amount: params.amount,
      sourceType: "work_minting",
      sourceClaimId: params.sourceClaimId,
      sourceReportId: params.sourceReportId,
    },
  });

  const newBalance = balance + params.amount;
  await prisma.tokenAccount.update({
    where: { id: account.id },
    data: { balance: newBalance },
  });

  await appendEvent({
    actor: params.userId,
    objectType: "token",
    objectId: account.id,
    action: "minted",
    payload: {
      amount: params.amount,
      sourceClaimId: params.sourceClaimId,
      sourceReportId: params.sourceReportId,
    },
  });

  return { mintEvent, newBalance };
}

// ─── Burn Fee ───────────────────────────────────────────────────────────────

export async function burnFee(params: {
  userId: string;
  amount: number;
  burnType: "access_fee" | "tx_fee";
}) {
  if (params.amount <= 0) throw badRequest("Amount must be positive");

  const { balance, ...account } = await getAccount(params.userId);

  if (balance < params.amount) {
    throw badRequest("Insufficient balance");
  }

  const burnEvent = await prisma.burnEvent.create({
    data: {
      accountId: account.id,
      amount: params.amount,
      burnType: params.burnType,
    },
  });

  const newBalance = balance - params.amount;
  await prisma.tokenAccount.update({
    where: { id: account.id },
    data: { balance: newBalance },
  });

  await appendEvent({
    actor: params.userId,
    objectType: "token",
    objectId: account.id,
    action: "burned",
    payload: { amount: params.amount, burnType: params.burnType },
  });

  return { burnEvent, newBalance };
}

// ─── Get Supply ─────────────────────────────────────────────────────────────

export async function getSupply() {
  const [mintResult, burnResult] = await Promise.all([
    prisma.mintEvent.aggregate({ _sum: { amount: true } }),
    prisma.burnEvent.aggregate({ _sum: { amount: true } }),
  ]);

  const totalMinted = mintResult._sum.amount ?? 0;
  const totalBurned = burnResult._sum.amount ?? 0;
  const totalSupply = totalMinted - totalBurned;

  return { totalSupply, totalMinted, totalBurned };
}
