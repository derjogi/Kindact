import { ok, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { getMe, updateProfile } from "@/server/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const profile = await getMe(user.id);
    return ok(profile);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const updated = await updateProfile(user.id, body);
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
