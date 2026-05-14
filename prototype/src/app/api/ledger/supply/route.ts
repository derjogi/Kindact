import { ok, handleError } from "@/server/api-utils";
import { getSupply } from "@/server/cc-ledger";

export async function GET() {
  try {
    const supply = await getSupply();
    return ok(supply);
  } catch (err) {
    return handleError(err);
  }
}
