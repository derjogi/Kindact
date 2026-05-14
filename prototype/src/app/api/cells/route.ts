import { ok, created, handleError } from "@/server/api-utils";
import { getAuthUser, requireAuth } from "@/server/auth/middleware";
import { listCells, createCell } from "@/server/cells";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getAuthUser(request);
    const cells = await listCells({
      tier: searchParams.get("tier") ?? undefined,
      scopeLevel: searchParams.get("scopeLevel") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      userId: user?.id,
    });
    return ok({ items: cells });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const cell = await createCell({ creatorId: user.id, ...body });
    return created(cell);
  } catch (err) {
    return handleError(err);
  }
}
