import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { joinCell, leaveCell, joinAsGuest } from "@/server/cells";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: "join" | "leave" | "guest";
      issueId?: string;
    };
    const action = body.action ?? "join";

    if (action === "leave") {
      const result = await leaveCell(id, user.id);
      return ok({ ok: true, membership: result });
    }
    if (action === "guest") {
      if (!body.issueId) throw new Error("issueId required for guest join");
      const result = await joinAsGuest(id, user.id, body.issueId);
      return ok({ ok: true, membership: result });
    }
    const result = await joinCell(id, user.id);
    return ok({ ok: true, membership: result });
  } catch (err) {
    return handleError(err);
  }
}
