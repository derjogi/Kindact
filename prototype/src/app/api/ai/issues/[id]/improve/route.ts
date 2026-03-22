import { ok, handleError } from "@/server/api-utils";
import { generateImprovements } from "@/server/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await generateImprovements(id);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
