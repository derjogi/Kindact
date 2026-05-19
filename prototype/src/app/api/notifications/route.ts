import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { getNotifications } from "@/server/notifications";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const notifications = await getNotifications(user.id, {
      unreadOnly: searchParams.get("unreadOnly") === "true",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return ok(notifications);
  } catch (err) {
    return handleError(err);
  }
}
