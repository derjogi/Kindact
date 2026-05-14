import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { addArgument } from "@/server/deliberation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { text, type, parentId } = await request.json();
    const argument = await addArgument({ issueId: id, authorId: user.id, text, type, parentId });
    return created(argument);
  } catch (err) {
    return handleError(err);
  }
}
