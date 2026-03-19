import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { getAccount } from "@/server/cc-ledger";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const account = await getAccount(user.id);
    return ok({ balance: account.balance });
  } catch (err) {
    return handleError(err);
  }
}
