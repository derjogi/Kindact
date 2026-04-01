import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { createIdentityChallenge } from "@/server/identity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { targetUserId, reason } = await request.json();
    const result = await createIdentityChallenge({
      challengerId: user.id,
      targetUserId,
      reason,
    });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
