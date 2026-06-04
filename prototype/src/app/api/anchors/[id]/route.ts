import { ok, handleError } from "@/server/api-utils";
import { getAuthUser } from "@/server/auth/middleware";
import { getAnchor } from "@/server/anchors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    const anchor = await getAnchor(decodeURIComponent(id), user?.id);
    return ok(anchor);
  } catch (err) {
    return handleError(err);
  }
}
