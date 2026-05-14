import { ok, handleError } from "@/server/api-utils";
import { createOrGetUser, createSession } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    const user = await createOrGetUser(walletAddress);
    const session = await createSession(user.id);
    return ok({ token: session.token, expiresAt: session.expiresAt, user });
  } catch (err) {
    return handleError(err);
  }
}
