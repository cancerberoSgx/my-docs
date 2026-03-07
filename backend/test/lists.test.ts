import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db, runMigrations } from '../src/db';
import { registerAndLogin, authHeader } from './helpers';

let token: string;

beforeAll(async () => {
  await runMigrations();
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
  token = await registerAndLogin('bob@example.com');
});

afterAll(async () => {
  // delete all test users and their data
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
  await db.end();
});

describe('Lists', () => {
  describe('GET /api/lists (auth)', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/lists');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', 'Bearer bad.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/lists', () => {
    it('creates a list', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set(authHeader(token))
        .send({ name: 'Work', description: 'Work resources' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Work');
      expect(res.body.description).toBe('Work resources');
      expect(typeof res.body.id).toBe('number');
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set(authHeader(token))
        .send({ description: 'no name here' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('name is required');
    });
  });

  describe('GET /api/lists — sorting', () => {
    beforeAll(async () => {
      // create extra lists so we have enough to sort: default + Work + these
      await request(app).post('/api/lists').set(authHeader(token)).send({ name: 'Aardvark' });
      await request(app).post('/api/lists').set(authHeader(token)).send({ name: 'Zebra' });
    });

    it('returns all lists for the user', async () => {
      const res = await request(app).get('/api/lists').set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(4); // default + Work + Aardvark + Zebra
    });

    it('sorts by name ascending', async () => {
      const res = await request(app)
        .get('/api/lists?orderBy=name&order=asc')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      const names: string[] = res.body.map((l: { name: string }) => l.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it('sorts by name descending', async () => {
      const res = await request(app)
        .get('/api/lists?orderBy=name&order=desc')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      const names: string[] = res.body.map((l: { name: string }) => l.name);
      expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    });

    it('sorts by created_at ascending', async () => {
      const res = await request(app)
        .get('/api/lists?orderBy=created_at&order=asc')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      const dates: string[] = res.body.map((l: { created_at: string }) => l.created_at);
      expect(dates).toEqual([...dates].sort());
    });
  });

  describe('Permissions', () => {
    it("does not return another user's lists", async () => {
      const otherToken = await registerAndLogin('eve@example.com');
      const res = await request(app).get('/api/lists').set(authHeader(otherToken));
      expect(res.status).toBe(200);
      // eve was just registered, she only has her default list
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('default');
    });
  });

  describe('Documents', () => {
    let listId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/lists')
        .set(authHeader(token))
        .send({ name: 'Docs Test List' });
      listId = res.body.id;
    });

    it('adds a document to a list', async () => {
      const res = await request(app)
        .post(`/api/lists/${listId}/documents`)
        .set(authHeader(token))
        .send({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          platform: 'youtube',
          type: 'youtube',
        });

      expect(res.status).toBe(201);
      expect(res.body.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(res.body.type).toBe('youtube');
    });

    it('adds a second document', async () => {
      const res = await request(app)
        .post(`/api/lists/${listId}/documents`)
        .set(authHeader(token))
        .send({ url: 'https://example.com/article', platform: 'unknown', type: 'unknown' });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('unknown');
    });

    it('fetches list with its documents', async () => {
      const res = await request(app)
        .get(`/api/lists/${listId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.documents)).toBe(true);
      expect(res.body.documents.length).toBe(2);
    });

    it('rejects document with missing url', async () => {
      const res = await request(app)
        .post(`/api/lists/${listId}/documents`)
        .set(authHeader(token))
        .send({ platform: 'youtube' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url is required');
    });

    it('rejects adding a document to another user\'s list', async () => {
      const otherToken = await registerAndLogin('mallory@example.com');
      const res = await request(app)
        .post(`/api/lists/${listId}/documents`)
        .set(authHeader(otherToken))
        .send({ url: 'https://example.com', platform: 'unknown', type: 'unknown' });

      expect(res.status).toBe(404); // list not found for this user
    });
  });

  describe('DELETE /api/lists/:listId', () => {
    let listId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/lists')
        .set(authHeader(token))
        .send({ name: 'To Be Deleted' });
      listId = res.body.id;
    });

    it('deletes a list', async () => {
      const res = await request(app)
        .delete(`/api/lists/${listId}`)
        .set(authHeader(token));
      expect(res.status).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const res = await request(app)
        .get(`/api/lists/${listId}`)
        .set(authHeader(token));
      expect(res.status).toBe(404);
    });

    it('cannot delete the default list', async () => {
      const listsRes = await request(app).get('/api/lists').set(authHeader(token));
      const defaultList = listsRes.body.find((l: { name: string }) => l.name === 'default');

      const res = await request(app)
        .delete(`/api/lists/${defaultList.id}`)
        .set(authHeader(token));
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Cannot delete the default list');
    });

    it('cannot delete another user\'s list', async () => {
      const otherToken = await registerAndLogin('frank@example.com');
      const createRes = await request(app)
        .post('/api/lists')
        .set(authHeader(otherToken))
        .send({ name: 'Frank\'s list' });
      const frankListId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/lists/${frankListId}`)
        .set(authHeader(token)); // bob trying to delete frank's list
      expect(res.status).toBe(404);
    });
  });
});
