import { db } from '../db';

export interface User {
  id: number;
  email: string;
  password: string;
  role: string;
}

export async function findByEmail(email: string): Promise<User | null> {
  const { rows } = await db.query<User>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function emailExists(email: string): Promise<boolean> {
  const { rows } = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
  return rows.length > 0;
}

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function updatePassword(id: number, hashedPassword: string): Promise<void> {
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
}

export async function deleteUser(id: number): Promise<void> {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

export async function createUser(email: string, hashedPassword: string): Promise<User> {
  const { rows: [{ id }] } = await db.query<{ id: number }>(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
    [email, hashedPassword, 'user']
  );
  const { rows } = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}
