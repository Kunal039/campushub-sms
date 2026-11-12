// Small fetch wrapper: adds the JWT, parses JSON and turns API errors into exceptions.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'enrolla_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable - session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiRequestError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      signal,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiRequestError('Cannot reach the server. Is the API running?', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // A rejected token means the session expired: tell AuthContext to log out
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: data?.message }));
    }
    const message = data?.message || (res.status >= 500 ? 'The server is not responding. Is the API running?' : `Request failed (${res.status})`);
    throw new ApiRequestError(message, res.status, data?.errors);
  }
  return data;
}
