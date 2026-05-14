import { ok, handleError } from "@/server/api-utils";
import { getAuthUser } from "@/server/auth/middleware";
import { getCell } from "@/server/cells";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    const cell = await getCell(decodeURIComponent(id), user?.id);
    return ok(cell);
  } catch (err) {
    return handleError(err);
  }
}
