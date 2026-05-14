import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { listMySubscriptions } from "@/server/anchors";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const items = await listMySubscriptions(user.id);
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}
