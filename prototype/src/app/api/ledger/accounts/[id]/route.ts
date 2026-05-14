import { ok, handleError } from "@/server/api-utils";
import { getAccount } from "@/server/cc-ledger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await getAccount(id);
    return ok(account);
  } catch (err) {
    return handleError(err);
  }
}
