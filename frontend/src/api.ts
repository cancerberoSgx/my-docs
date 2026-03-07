const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export function login(email: string, password: string) {
  return request<{ token: string }>('/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string) {
  return request<{ token: string }>('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function getDocuments(token: string) {
  return request<{ id: number; userId: number; url: string; platform: string }[]>('/documents', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
