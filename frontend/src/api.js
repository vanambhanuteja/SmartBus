// Tiny wrapper around fetch(): adds the JWT, parses JSON and throws readable errors.
const TOKEN_KEY = 'smartbus_session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; }
}
export function saveSession(s) { s ? localStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : localStorage.removeItem(TOKEN_KEY); }

export async function api(path, { method = 'GET', body } = {}) {
  const session = getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = data.details ? ' ' + Object.values(data.details).join(', ') : '';
    throw new Error((data.error || `Request failed (${res.status})`) + details);
  }
  return data;
}
