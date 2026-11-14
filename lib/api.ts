/**
 * Client fetch helper. Server route error handling is re-exported from the
 * canonical lib/api/* implementation below so `/lib/api.ts` and `/lib/api/`
 * cannot drift into two incompatible APIs.
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

export async function api<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: json?.error || `Request failed: ${res.status}`,
      details: json?.details,
    };
  }
  return json as ApiResponse<T>;
}

export const apiGet = <T>(path: string) => api<T>(path, { method: 'GET' });
export const apiPost = <T>(path: string, body: any) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: any) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });

export { APIError, APIErrors } from './api/api-error';
export { ErrorCode, ErrorMessages, getErrorMessage } from './api/error-codes';
export { withErrorHandling, withErrorHandlingParams } from './api/with-error-handling';
