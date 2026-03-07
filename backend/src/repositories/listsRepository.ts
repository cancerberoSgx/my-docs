import { db } from '../db';

export interface List {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
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

async function getById(id: number): Promise<List | null> {
  const { rows } = await db.query<List>('SELECT * FROM lists WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getLists(userId: number, col: string, dir: string): Promise<List[]> {
  const { rows } = await db.query<List>(
    `SELECT * FROM lists WHERE user_id = $1 ORDER BY ${col} ${dir}`,
    [userId]
  );
  return rows;
}

export async function getListById(id: number, userId: number): Promise<List | null> {
  const { rows } = await db.query<List>(
    'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function getDocumentsByListId(listId: number): Promise<Doc[]> {
  const { rows } = await db.query<Doc>(
    `SELECT d.* FROM documents d
     JOIN lists_documents ld ON ld.document_id = d.id
     WHERE ld.list_id = $1`,
    [listId]
  );
  return rows;
}

export async function createList(name: string, description: string | null, userId: number): Promise<List> {
  const { rows: [{ id }] } = await db.query<{ id: number }>(
    'INSERT INTO lists (name, description, user_id) VALUES ($1, $2, $3) RETURNING id',
    [name, description, userId]
  );
  return (await getById(id))!;
}

export async function updateList(id: number, name: string, description: string | null): Promise<List> {
  await db.query(
    `UPDATE lists SET name = $1, description = $2, updated_at = NOW() WHERE id = $3`,
    [name, description, id]
  );
  return (await getById(id))!;
}

export function deleteList(id: number): Promise<void> {
  return db.query('DELETE FROM lists WHERE id = $1', [id]).then(() => {});
}

export async function createDocument(
  userId: number,
  url: string,
  platform: string,
  type: string,
  description: string | null,
  type_image: string | null,
  status: string,
): Promise<Doc> {
  const { rows: [{ id }] } = await db.query<{ id: number }>(
    'INSERT INTO documents (user_id, url, platform, type, description, type_image, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [userId, url, platform, type, description, type_image, status]
  );
  const { rows } = await db.query<Doc>('SELECT * FROM documents WHERE id = $1', [id]);
  return rows[0];
}

export interface DocumentStatusResult {
  status: string;
  status_change_error: string | null;
  resolved_url: string | null;
  resolved_mimetype: string | null;
  resolved_extra: object | null;
}

export async function recordStatusChange(
  id: number,
  status: string,
  error: string | null,
  resolvedUrl?: string | null,
  resolvedMimetype?: string | null,
  resolvedExtra?: object | null,
): Promise<void> {
  await db.query(
    'UPDATE documents SET status = $1, status_change_error = $2 WHERE id = $3',
    [status, error, id]
  );
  await db.query(
    `INSERT INTO document_status_history (document_id, status, resolved_url, resolved_mimetype, resolved_extra)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, status, resolvedUrl ?? null, resolvedMimetype ?? null, resolvedExtra ?? null]
  );
}

export async function getDocumentStatus(id: number, userId: number): Promise<DocumentStatusResult | null> {
  const { rows } = await db.query<DocumentStatusResult>(
    `SELECT d.status, d.status_change_error,
            h.resolved_url, h.resolved_mimetype, h.resolved_extra
     FROM documents d
     LEFT JOIN LATERAL (
       SELECT resolved_url, resolved_mimetype, resolved_extra
       FROM document_status_history
       WHERE document_id = d.id
       ORDER BY created_at DESC
       LIMIT 1
     ) h ON true
     WHERE d.id = $1 AND d.user_id = $2`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export function addDocumentToList(listId: number, documentId: number): Promise<void> {
  return db.query(
    'INSERT INTO lists_documents (list_id, document_id) VALUES ($1, $2)',
    [listId, documentId]
  ).then(() => {});
}

export async function getDocumentById(id: number, userId: number): Promise<Doc | null> {
  const { rows } = await db.query<Doc>(
    'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function updateDocument(
  id: number,
  data: { url: string; description: string | null; type: string; type_image: string | null },
): Promise<Doc> {
  await db.query(
    'UPDATE documents SET url = $1, description = $2, type = $3, type_image = $4 WHERE id = $5',
    [data.url, data.description, data.type, data.type_image, id]
  );
  const { rows } = await db.query<Doc>('SELECT * FROM documents WHERE id = $1', [id]);
  return rows[0];
}
