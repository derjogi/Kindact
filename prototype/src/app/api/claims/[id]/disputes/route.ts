import { ok, created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { createDispute, listDisputesForClaim } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { reason } = await request.json();
    const dispute = await createDispute({
      claimId: id,
      challengerId: user.id,
      reason,
    });
    return created(dispute);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const disputes = await listDisputesForClaim(id);
    return ok(disputes);
  } catch (err) {
    return handleError(err);
  }
}
