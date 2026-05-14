import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { subscribe, unsubscribe, setMuted } from "@/server/anchors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const decoded = decodeURIComponent(id);
    const body = (await request.json().catch(() => ({}))) as {
      action?: "subscribe" | "unsubscribe" | "mute" | "unmute";
    };
    const action = body.action ?? "subscribe";

    if (action === "unsubscribe") {
      await unsubscribe(user.id, decoded);
      return ok({ ok: true });
    }
    if (action === "mute") {
      const sub = await setMuted(user.id, decoded, true);
      return ok({ ok: true, subscription: sub });
    }
    if (action === "unmute") {
      const sub = await setMuted(user.id, decoded, false);
      return ok({ ok: true, subscription: sub });
    }
    const sub = await subscribe(user.id, decoded);
    return ok({ ok: true, subscription: sub });
  } catch (err) {
    return handleError(err);
  }
}
