import request from 'supertest';
import { app } from '../src/app';

export async function registerAndLogin(email: string, password = 'password'): Promise<string> {
  const res = await request(app)
    .post('/api/register')
    .send({ email, password });
  if (res.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  return res.body.token as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
