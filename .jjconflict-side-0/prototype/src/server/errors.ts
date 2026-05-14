export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function notFound(msg = "Not found") { return new ApiError(404, msg); }
export function badRequest(msg = "Bad request") { return new ApiError(400, msg); }
export function unauthorized(msg = "Unauthorized") { return new ApiError(401, msg); }
export function forbidden(msg = "Forbidden") { return new ApiError(403, msg); }
