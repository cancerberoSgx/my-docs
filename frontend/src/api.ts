const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export interface Me {
  id: number;
  email: string;
  role: string;
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
  user_id: number;
  url: string;
  platform: string;
  type: string;
  description: string | null;
  type_image: string | null;
  status: string;
  status_change_error: string | null;
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
  return request<{ type: string; type_image: string }>(`/documentType?url=${encodeURIComponent(url)}`);
}

export function addDocument(
  token: string,
  listId: number,
  url: string,
  platform: string,
  type: string,
  description: string | null,
  type_image: string | null,
) {
  return request<Doc>(`/lists/${listId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ url, platform, type, description, type_image }),
  });
}

export function getDocument(token: string, docId: number) {
  return request<Doc>(`/documents/${docId}`, {
    headers: authHeaders(token),
  });
}

export function updateDocument(
  token: string,
  docId: number,
  data: { url: string; description: string | null; type: string; type_image: string | null },
) {
  return request<Doc>(`/documents/${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
}

export interface DocumentStatus {
  status: string;
  status_change_error: string | null;
  resolved_url: string | null;
  resolved_mimetype: string | null;
  resolved_extra: Record<string, unknown> | null;
}

export function getDocumentStatus(token: string, docId: number) {
  return request<DocumentStatus>(`/documents/${docId}/status`, {
    headers: authHeaders(token),
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface AdminUser {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export function adminGetUser(token: string, userId: number) {
  return request<Me>(`/admin/users/${userId}`, { headers: authHeaders(token) });
}

export function adminSetPassword(token: string, userId: number, newPassword: string) {
  return request<{ message: string }>(`/admin/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ newPassword }),
  });
}

export function adminDeleteUser(token: string, userId: number) {
  return fetch(`${BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then((res) => {
    if (!res.ok) return res.json().then((d: { error?: string }) => { throw new Error(d.error || 'Request failed'); });
  });
}

export function adminGetUsers(token: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<Paginated<AdminUser>>(`/admin/users?${qs}`, { headers: authHeaders(token) });
}

export function adminSetUserRole(token: string, userId: number, role: string) {
  return request<{ message: string }>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ role }),
  });
}

export function adminGetDocuments(token: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<Paginated<Doc>>(`/admin/documents?${qs}`, { headers: authHeaders(token) });
}

export interface AdminList {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function adminGetLists(token: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<Paginated<AdminList>>(`/admin/lists?${qs}`, { headers: authHeaders(token) });
}

// ── Account ───────────────────────────────────────────────────────────────────

export function getMe(token: string) {
  return request<Me>('/me', { headers: authHeaders(token) });
}

export function changePassword(token: string, currentPassword: string, newPassword: string) {
  return request<{ message: string }>('/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function deleteAccount(token: string, password: string) {
  return fetch(`${BASE}/me`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ password }),
  }).then((res) => {
    if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Request failed'); });
  });
}

export interface HistoryEntry {
  id: number;
  document_id: number;
  status: string;
  created_at: string;
  resolved_url: string | null;
  resolved_mimetype: string | null;
  resolved_extra: Record<string, unknown> | null;
}

export function getDocumentHistory(
  token: string,
  docId: number,
  params: { limit: number; offset: number; status?: string },
) {
  const qs = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  if (params.status) qs.set('status', params.status);
  return request<{ items: HistoryEntry[]; total: number }>(`/documents/${docId}/history?${qs}`, {
    headers: authHeaders(token),
  });
}

export function triggerDocumentAction(
  token: string,
  docId: number,
  toolId: number,
  action: string,
  params: Record<string, unknown> = {},
) {
  return request<{ status: string }>(`/documents/${docId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ toolId, action, params }),
  });
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface Tool {
  id: number;
  name: string;
  description: string;
}

export interface ToolAction {
  id: number;
  name: string;
  description: string;
  params_schema: Record<string, unknown> | null;
}

export interface ToolFull extends Tool {
  documentTypes: string[];
  actions: ToolAction[];
}

export function getToolsByType(token: string, documentType: string) {
  return request<ToolFull[]>(`/tools?documentType=${encodeURIComponent(documentType)}`, {
    headers: authHeaders(token),
  });
}

export function getAllTools(token: string) {
  return request<ToolFull[]>('/tools', { headers: authHeaders(token) });
}

export function getTool(token: string, toolId: number) {
  return request<ToolFull>(`/tools/${toolId}`, { headers: authHeaders(token) });
}
