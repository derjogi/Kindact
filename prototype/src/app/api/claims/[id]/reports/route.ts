import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { submitReport } from "@/server/work";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const { type, content } = await request.json();
    const report = await submitReport({ claimId: id, type, content });
    return created(report);
  } catch (err) {
    return handleError(err);
  }
}
