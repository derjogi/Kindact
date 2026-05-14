import { ok, handleError } from "@/server/api-utils";
import { listIssuesForAnchor } from "@/server/anchors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") !== "false";
    const issues = await listIssuesForAnchor(decodeURIComponent(id), { includeChildren });
    return ok({ items: issues });
  } catch (err) {
    return handleError(err);
  }
}
