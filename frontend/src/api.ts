const BASE = '/api';

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

export interface DocList {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Doc {
  id: number;
  userId: number;
  url: string;
  platform: string;
  type: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function getLists(token: string, orderBy = 'createdAt', order = 'asc') {
  return request<DocList[]>(`/lists?orderBy=${orderBy}&order=${order}`, {
    headers: authHeaders(token),
  });
}

export function createList(token: string, name: string, description: string) {
  return request<DocList>('/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ name, description }),
  });
}

export function updateList(token: string, listId: number, name: string, description: string) {
  return request<DocList>(`/lists/${listId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ name, description }),
  });
}

export function deleteList(token: string, listId: number) {
  return fetch(`${BASE}/lists/${listId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then((res) => {
    if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Request failed'); });
  });
}

export function getList(token: string, listId: number) {
  return request<DocList & { documents: Doc[] }>(`/lists/${listId}`, {
    headers: authHeaders(token),
  });
}

export function getDocumentType(url: string) {
  return request<{ type: string }>(`/documentType?url=${encodeURIComponent(url)}`);
}

export function addDocument(token: string, listId: number, url: string, platform: string, type: string) {
  return request<Doc>(`/lists/${listId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ url, platform, type }),
  });
}
