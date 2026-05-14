import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { transitionIssue } from "@/server/issues";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { status } = await request.json();
    const issue = await transitionIssue(user.id, id, status);
    return ok(issue);
  } catch (err) {
    return handleError(err);
  }
}
