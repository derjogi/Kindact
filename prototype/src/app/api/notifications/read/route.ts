import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { markRead } from "@/server/notifications";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { ids } = await request.json();
    await markRead(user.id, ids);
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
