import { created, handleError } from "@/server/api-utils";
import { requireAuth } from "@/server/auth/middleware";
import { connectProvider } from "@/server/identity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { provider, attestation, score } = await request.json();
    const result = await connectProvider({
      userId: user.id,
      provider,
      attestation,
      score,
    });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
