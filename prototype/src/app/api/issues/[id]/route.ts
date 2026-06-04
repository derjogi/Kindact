import { ok, handleError } from "@/server/api-utils";
import { getAuthUser, requireAuth } from "@/server/auth/middleware";
import { getIssue, updateIssue } from "@/server/issues";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    const issue = await getIssue(id, user?.id);
    return ok(issue);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const updated = await updateIssue(user.id, id, body);
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
