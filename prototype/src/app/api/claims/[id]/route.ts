import { ok, handleError } from "@/server/api-utils";
import { getClaim } from "@/server/work";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claim = await getClaim(id);
    return ok(claim);
  } catch (err) {
    return handleError(err);
  }
}
