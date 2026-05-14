import { ok, handleError } from "@/server/api-utils";
import { getEvents } from "@/server/ledger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const events = await getEvents({
      objectType: searchParams.get("objectType") ?? undefined,
      objectId: searchParams.get("objectId") ?? undefined,
      actor: searchParams.get("actor") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return ok(events);
  } catch (err) {
    return handleError(err);
  }
}
