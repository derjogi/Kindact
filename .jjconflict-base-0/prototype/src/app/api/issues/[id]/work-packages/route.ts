import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { createWorkPackage } from "@/server/work";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const { title, description } = await request.json();
    const workPackage = await createWorkPackage({ issueId: id, title, description });
    return created(workPackage);
  } catch (err) {
    return handleError(err);
  }
}
