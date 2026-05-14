import { ok, created, handleError } from "@/server/api-utils";
import { getAuthUser, requireAuth } from "@/server/auth/middleware";
import { listAnchors, createAnchor } from "@/server/anchors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getAuthUser(request);
    const items = await listAnchors({
      kind: searchParams.get("kind") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      userId: user?.id,
    });
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const anchor = await createAnchor({ creatorId: user.id, ...body });
    return created(anchor);
  } catch (err) {
    return handleError(err);
  }
}
