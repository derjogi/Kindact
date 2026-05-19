import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { getIdentityStatus } from "@/server/identity";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const result = await getIdentityStatus(user.id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
