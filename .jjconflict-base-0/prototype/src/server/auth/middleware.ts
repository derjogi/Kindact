import type { User } from "@/generated/prisma/client";
import { unauthorized } from "@/server/errors";
import { validateSession } from "@/server/auth";

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function getAuthUser(request: Request): Promise<User | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  return validateSession(token);
}

export async function requireAuth(request: Request): Promise<User> {
  const user = await getAuthUser(request);
  if (!user) throw unauthorized();
  return user;
}
