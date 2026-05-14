import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { castDisputeVote } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { vote } = await request.json();
    const result = await castDisputeVote({
      disputeId: id,
      voterId: user.id,
      vote,
    });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
