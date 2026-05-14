import { ok, handleError } from "@/server/api-utils";
import { findSimilarIssues } from "@/server/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await findSimilarIssues(id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
