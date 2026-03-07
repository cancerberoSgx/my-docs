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

export async function createDocument(userId: number, url: string, platform: string, type: string): Promise<Doc> {
  const { rows: [{ id }] } = await db.query<{ id: number }>(
    'INSERT INTO documents (user_id, url, platform, type) VALUES ($1, $2, $3, $4) RETURNING id',
    [userId, url, platform, type]
  );
  const { rows } = await db.query<Doc>('SELECT * FROM documents WHERE id = $1', [id]);
  return rows[0];
}

export function addDocumentToList(listId: number, documentId: number): Promise<void> {
  return db.query(
    'INSERT INTO lists_documents (list_id, document_id) VALUES ($1, $2)',
    [listId, documentId]
  ).then(() => {});
}
