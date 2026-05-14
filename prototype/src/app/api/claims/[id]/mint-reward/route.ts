import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { mintVerifiedReward } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const { amount } = await request.json();
    const result = await mintVerifiedReward({ claimId: id, amount });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
