import { ok, created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { listIssues, createIssue } from "@/server/issues";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issues = await listIssues({
      status: searchParams.get("status") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return ok(issues);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const issue = await createIssue({ creatorId: user.id, ...body });
    return created(issue);
  } catch (err) {
    return handleError(err);
  }
}
