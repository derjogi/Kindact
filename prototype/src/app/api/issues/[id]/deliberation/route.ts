import { ok, handleError } from "@/server/api-utils";
import { getDeliberation } from "@/server/deliberation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deliberation = await getDeliberation(id);
    return ok(deliberation);
  } catch (err) {
    return handleError(err);
  }
}
