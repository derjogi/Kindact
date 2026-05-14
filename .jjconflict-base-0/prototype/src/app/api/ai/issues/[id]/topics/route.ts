import { ok, handleError } from "@/server/api-utils";
import { proposeTopics } from "@/server/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await proposeTopics(id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
