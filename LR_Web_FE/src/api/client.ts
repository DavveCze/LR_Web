/**
 * Centralizovaný klient pro komunikaci s backend API.
 * Využívá buď relativní cesty /api/... (napojené na Vite proxy v devu a reverzní proxy v produkci),
 * nebo proměnnou VITE_API_URL, pokud je explicitně nastavena.
 */

const rawBase = import.meta.env.VITE_API_URL;

export const API_BASE_URL = rawBase
  ? `${rawBase.replace(/\/$/, '')}/api`
  : '/api';

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) message = errorJson.message;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  return response.json();
}
