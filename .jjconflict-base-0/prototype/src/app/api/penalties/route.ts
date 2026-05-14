import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { applyPenalty } from "@/server/verification";

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const { userId, type, amount, reasonCode } = await request.json();
    const result = await applyPenalty({ userId, type, amount, reasonCode });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
