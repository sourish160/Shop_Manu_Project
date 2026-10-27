/**
 * Privacy & Security Error Handler
 *
 * Sanitizes backend, database, and network error messages before they reach the UI.
 * Prevents information disclosure attacks by stripping:
 * - PostgreSQL table, column, and schema names
 * - Foreign key and unique constraint internal identifiers
 * - PostgREST and database RPC syntax traces
 * - Server paths, tokens, and stack traces
 */

export function sanitizeErrorMessage(
  error: unknown,
  defaultFallback: string = 'An unexpected error occurred. Please try again.'
): string {
  if (!error) return defaultFallback;

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : typeof (error as any)?.message === 'string'
      ? (error as any).message
      : '';

  if (!rawMessage || typeof rawMessage !== 'string') {
    return defaultFallback;
  }

  const lower = rawMessage.toLowerCase();

  // 1. PostgreSQL Constraint & Integrity Errors
  if (lower.includes('violates unique constraint') || lower.includes('duplicate key')) {
    return 'A record with this information already exists in the system.';
  }

  if (lower.includes('violates foreign key constraint') || lower.includes('cannot be deleted')) {
    return 'This item cannot be removed because it is linked to other active records.';
  }

  if (lower.includes('null value in column') || lower.includes('violates not-null')) {
    return 'Please complete all required fields before submitting.';
  }

  if (lower.includes('check constraint') || lower.includes('violates check')) {
    return 'One or more values submitted did not meet validation standards.';
  }

  // 2. Authorization & Permission Errors
  if (
    lower.includes('permission denied') ||
    lower.includes('insufficient_privilege') ||
    lower.includes('403') ||
    lower.includes('forbidden') ||
    lower.includes('is_admin')
  ) {
    return 'You do not have administrative or operational permissions for this action.';
  }

  if (lower.includes('jwt') || lower.includes('token is expired') || lower.includes('invalid token')) {
    return 'Your session has expired. Please sign in again.';
  }

  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials.';
  }

  // 3. Technical Database, Network, or Server Internals
  if (
    lower.includes('syntax error at or near') ||
    lower.includes('relation "') ||
    lower.includes('column "') ||
    lower.includes('function get_') ||
    lower.includes('function admin_') ||
    lower.includes('postgrest') ||
    lower.includes('pg_') ||
    lower.includes('sql') ||
    lower.includes('stack trace') ||
    lower.includes('at line') ||
    lower.includes('internal server error') ||
    lower.includes('500')
  ) {
    return defaultFallback;
  }

  // 4. Safe user-facing validation errors (clean string under 150 characters without path separators)
  if (!rawMessage.includes('/') && !rawMessage.includes('\\') && rawMessage.length <= 150) {
    return rawMessage;
  }

  return defaultFallback;
}
