import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { subscribe, unsubscribe } from "@/server/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await subscribe(user.id, id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await unsubscribe(user.id, id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
