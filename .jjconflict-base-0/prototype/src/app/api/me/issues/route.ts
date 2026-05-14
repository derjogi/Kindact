import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { prisma } from "@/server/db";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const issues = await prisma.issue.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        scope: true,
        participants: true,
        createdAt: true,
      },
    });
    return ok({ items: issues });
  } catch (err) {
    return handleError(err);
  }
}
