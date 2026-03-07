import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db, runMigrations } from '../src/db';

beforeAll(async () => {
  await runMigrations();
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
});

describe('POST /api/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'alice@example.com', password: 'password' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'alice@example.com', password: 'password' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already taken');
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'nope@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth', () => {
  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth')
      .send({ email: 'alice@example.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth')
      .send({ email: 'alice@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth')
      .send({ email: 'nobody@example.com', password: 'password' });

    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(400);
  });
});
