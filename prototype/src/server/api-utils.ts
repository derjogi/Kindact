import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
