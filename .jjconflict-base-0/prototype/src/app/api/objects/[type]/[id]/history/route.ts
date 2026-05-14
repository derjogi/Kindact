import { ok, handleError } from "@/server/api-utils";
import { getObjectHistory } from "@/server/ledger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const history = await getObjectHistory(type, id);
    return ok(history);
  } catch (err) {
    return handleError(err);
  }
}
