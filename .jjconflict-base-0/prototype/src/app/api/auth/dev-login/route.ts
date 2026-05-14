import { ok, handleError } from "@/server/api-utils";
import { createOrGetUser, createSession } from "@/server/auth";

const DEV_WALLET = "0xdev0000000000000000000000000000000000";

export async function POST() {
  try {
    const user = await createOrGetUser(DEV_WALLET);
    const session = await createSession(user.id);
    return ok({ token: session.token, expiresAt: session.expiresAt, user });
  } catch (err) {
    return handleError(err);
  }
}
