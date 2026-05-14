import { ok, handleError } from "@/server/api-utils";
import { getTally } from "@/server/voting";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tally = await getTally(id);
    return ok(tally);
  } catch (err) {
    return handleError(err);
  }
}
