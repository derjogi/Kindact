import { ok, handleError } from "@/server/api-utils";
import { generateSummary } from "@/server/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const summary = await generateSummary(id);
    return ok(summary);
  } catch (err) {
    return handleError(err);
  }
}
