import { ok, handleError } from "@/server/api-utils";
import { getClaimVerification } from "@/server/verification";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getClaimVerification(id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
