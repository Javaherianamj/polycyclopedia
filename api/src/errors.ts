// RFC-7807-ish error body shared by every route: { error: { code, message } }.
// Never includes a stack trace or raw SQL.

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function notFoundError(message: string): ApiErrorBody {
  return { error: { code: 'NOT_FOUND', message } };
}

export function badRequestError(message: string): ApiErrorBody {
  return { error: { code: 'BAD_REQUEST', message } };
}

export function internalError(message = 'Internal server error'): ApiErrorBody {
  return { error: { code: 'INTERNAL_ERROR', message } };
}
