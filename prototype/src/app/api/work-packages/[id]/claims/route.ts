import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { createClaim } from "@/server/work";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const claim = await createClaim({ workPackageId: id, implementerId: user.id });
    return created(claim);
  } catch (err) {
    return handleError(err);
  }
}
