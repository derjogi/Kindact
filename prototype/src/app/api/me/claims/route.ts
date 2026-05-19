import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { prisma } from "@/server/db";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const claims = await prisma.claim.findMany({
      where: { implementerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        workPackage: {
          select: {
            id: true,
            title: true,
            issue: { select: { id: true, title: true } },
          },
        },
      },
    });
    return ok({ items: claims });
  } catch (err) {
    return handleError(err);
  }
}
