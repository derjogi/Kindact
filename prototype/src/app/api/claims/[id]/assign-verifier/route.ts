import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { assignVerifier } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const { verifierId } = await request.json();
    const assignment = await assignVerifier({ claimId: id, verifierId });
    return created(assignment);
  } catch (err) {
    return handleError(err);
  }
}
