import { db } from '../db';
import type { User } from './usersRepository';
import type { Doc } from './listsRepository';
import type { List } from './listsRepository';

export interface Paginated<T> {
  items: T[];
  total: number;
}

interface PageParams {
  limit: number;
  offset: number;
  orderBy: string;
  order: string;
}

export async function adminGetUsers(
  params: PageParams & { email?: string },
): Promise<Paginated<Omit<User, 'password'> & { created_at: string }>> {
  const validCols: Record<string, string> = { created_at: 'created_at', email: 'email', role: 'role', id: 'id' };
  const col = validCols[params.orderBy] ?? 'created_at';
  const dir = params.order === 'desc' ? 'DESC' : 'ASC';

  const vals: unknown[] = [];
  const conds: string[] = [];
  if (params.email) {
    vals.push(`%${params.email}%`);
    conds.push(`email ILIKE $${vals.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const { rows: [{ count }] } = await db.query<{ count: string }>(`SELECT COUNT(*) FROM users ${where}`, vals);
  const { rows } = await db.query(
    `SELECT id, email, role, created_at FROM users ${where} ORDER BY ${col} ${dir} LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, params.limit, params.offset],
  );
  return { items: rows, total: Number(count) };
}

export async function adminGetDocuments(
  params: PageParams & { url?: string; type?: string },
): Promise<Paginated<Doc & { created_at: string }>> {
  const validCols: Record<string, string> = { created_at: 'created_at', url: 'url', type: 'type', id: 'id' };
  const col = validCols[params.orderBy] ?? 'created_at';
  const dir = params.order === 'desc' ? 'DESC' : 'ASC';

  const vals: unknown[] = [];
  const conds: string[] = [];
  if (params.url) { vals.push(`%${params.url}%`); conds.push(`url ILIKE $${vals.length}`); }
  if (params.type) { vals.push(params.type); conds.push(`type = $${vals.length}`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const { rows: [{ count }] } = await db.query<{ count: string }>(`SELECT COUNT(*) FROM documents ${where}`, vals);
  const { rows } = await db.query(
    `SELECT * FROM documents ${where} ORDER BY ${col} ${dir} LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, params.limit, params.offset],
  );
  return { items: rows, total: Number(count) };
}

export async function adminGetLists(
  params: PageParams & { name?: string },
): Promise<Paginated<List>> {
  const validCols: Record<string, string> = { created_at: 'created_at', updated_at: 'updated_at', name: 'name', id: 'id' };
  const col = validCols[params.orderBy] ?? 'created_at';
  const dir = params.order === 'desc' ? 'DESC' : 'ASC';

  const vals: unknown[] = [];
  const conds: string[] = [];
  if (params.name) { vals.push(`%${params.name}%`); conds.push(`name ILIKE $${vals.length}`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const { rows: [{ count }] } = await db.query<{ count: string }>(`SELECT COUNT(*) FROM lists ${where}`, vals);
  const { rows } = await db.query(
    `SELECT * FROM lists ${where} ORDER BY ${col} ${dir} LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, params.limit, params.offset],
  );
  return { items: rows, total: Number(count) };
}

export async function adminSetUserRole(userId: number, role: string): Promise<void> {
  await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
}
