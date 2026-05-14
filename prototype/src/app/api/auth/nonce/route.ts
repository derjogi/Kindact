import { ok, handleError } from "@/server/api-utils";
import { generateNonce } from "@/server/auth";

export async function POST() {
  try {
    const nonce = await generateNonce();
    return ok({ nonce });
  } catch (err) {
    return handleError(err);
  }
}
