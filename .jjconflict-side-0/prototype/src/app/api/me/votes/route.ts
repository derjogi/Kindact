import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { prisma } from "@/server/db";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const votes = await prisma.voteRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        issue: {
          select: { id: true, title: true, status: true },
        },
      },
    });
    return ok({ items: votes });
  } catch (err) {
    return handleError(err);
  }
}
