import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { submitReview } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { decision, rationale } = await request.json();
    const review = await submitReview({
      claimId: id,
      reviewerId: user.id,
      decision,
      rationale,
    });
    return created(review);
  } catch (err) {
    return handleError(err);
  }
}
