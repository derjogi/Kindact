import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { checkPrivilege } from "@/server/identity";

const PRIVILEGES = ["vote", "verify", "post"] as const;

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const results = await Promise.all(
      PRIVILEGES.map(async (p) => [p, await checkPrivilege(user.id, p)] as const)
    );
    const privileges = Object.fromEntries(results);
    return ok(privileges);
  } catch (err) {
    return handleError(err);
  }
}
