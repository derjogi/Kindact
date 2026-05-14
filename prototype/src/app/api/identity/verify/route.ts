import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { verifyIdentity } from "@/server/identity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const result = await verifyIdentity(user.id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
