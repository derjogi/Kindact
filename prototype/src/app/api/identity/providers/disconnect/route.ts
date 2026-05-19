import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { disconnectProvider } from "@/server/identity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { provider } = await request.json();
    const result = await disconnectProvider({ userId: user.id, provider });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
