import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { forkCell } from "@/server/cells";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = (await request.json()) as { displayName?: string };
    if (!body.displayName) throw new Error("displayName required");
    const cell = await forkCell(id, user.id, body.displayName);
    return created(cell);
  } catch (err) {
    return handleError(err);
  }
}
