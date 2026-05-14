import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { runEvidenceChecks } from "@/server/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const findings = await runEvidenceChecks(id);
    return ok(findings);
  } catch (err) {
    return handleError(err);
  }
}
