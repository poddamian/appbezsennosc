type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
} | null | undefined;

/**
 * postgrest-js/auth-js normalize a failed `fetch` (offline, DNS, timeout) into
 * the same `{ data, error }` shape as a real API error, but leave `code` as an
 * empty string — a genuine Postgres/PostgREST error always carries a real
 * SQLSTATE-style code, so an empty one is our signal this was a client-side
 * network failure rather than a server response.
 */
export function isNetworkError(error: SupabaseLikeError): boolean {
  if (!error) return false;
  if (!error.code) return true;
  return /network|fetch/i.test(error.message ?? '');
}

export function getSupabaseErrorMessage(error: SupabaseLikeError): string {
  if (isNetworkError(error)) {
    return 'Sprawdź połączenie z internetem i spróbuj ponownie.';
  }
  return 'Nie udało się połączyć z serwerem. Spróbuj ponownie.';
}
