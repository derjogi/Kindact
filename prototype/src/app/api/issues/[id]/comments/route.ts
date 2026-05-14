import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { addComment } from "@/server/deliberation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { text, parentId, stance } = await request.json();
    const comment = await addComment({ issueId: id, authorId: user.id, text, parentId, stance });
    return created(comment);
  } catch (err) {
    return handleError(err);
  }
}
