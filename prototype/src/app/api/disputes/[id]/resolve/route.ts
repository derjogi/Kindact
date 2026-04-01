import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { resolveDispute } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const { resolution } = await request.json();
    const result = await resolveDispute({ disputeId: id, resolution });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
