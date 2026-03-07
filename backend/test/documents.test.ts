import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db, runMigrations } from '../src/db';
import { registerAndLogin, authHeader } from './helpers';

let token: string;
let listId: number;
let docId: number;

beforeAll(async () => {
  await runMigrations();
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
  token = await registerAndLogin('doc-owner@example.com');

  // create a list to attach documents to
  const listRes = await request(app)
    .post('/api/lists')
    .set(authHeader(token))
    .send({ name: 'Test List' });
  listId = listRes.body.id;

  // create the reference document used across most tests
  const docRes = await request(app)
    .post(`/api/lists/${listId}/documents`)
    .set(authHeader(token))
    .send({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      type: 'youtube',
      description: 'Never gonna give you up',
      type_image: '/icons/youtube.svg',
    });
  docId = docRes.body.id;
});

afterAll(async () => {
  await db.query('TRUNCATE users RESTART IDENTITY CASCADE');
});

// ---------------------------------------------------------------------------

describe('GET /api/documentType', () => {
  it('returns youtube type and icon for a YouTube URL', async () => {
    const res = await request(app)
      .get('/api/documentType?url=https://www.youtube.com/watch?v=abc');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('youtube');
    expect(res.body.type_image).toBe('/icons/youtube.svg');
  });

  it('returns youtube for youtu.be short URLs', async () => {
    const res = await request(app)
      .get('/api/documentType?url=https://youtu.be/abc');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('youtube');
  });

  it('returns webpage type and icon for any other URL', async () => {
    const res = await request(app)
      .get('/api/documentType?url=https://example.com/article');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('webpage');
    expect(res.body.type_image).toBe('/icons/webpage.svg');
  });

  it('returns webpage for a malformed URL', async () => {
    const res = await request(app)
      .get('/api/documentType?url=not-a-url');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('webpage');
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/lists/:listId/documents — new fields', () => {
  it('stores description and type_image', async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/documents`)
      .set(authHeader(token))
      .send({
        url: 'https://example.com/page',
        platform: 'webpage',
        type: 'webpage',
        description: 'An example page',
        type_image: '/icons/webpage.svg',
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('An example page');
    expect(res.body.type_image).toBe('/icons/webpage.svg');
    expect(res.body.type).toBe('webpage');
  });

  it('description defaults to null when omitted', async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/documents`)
      .set(authHeader(token))
      .send({ url: 'https://example.com/no-desc', platform: 'webpage', type: 'webpage' });

    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
  });

  it('type_image defaults to null when omitted', async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/documents`)
      .set(authHeader(token))
      .send({ url: 'https://example.com/no-img', platform: 'webpage', type: 'webpage' });

    expect(res.status).toBe(201);
    expect(res.body.type_image).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('GET /api/documents/:docId', () => {
  it('returns the document with all fields', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(docId);
    expect(res.body.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(res.body.type).toBe('youtube');
    expect(res.body.type_image).toBe('/icons/youtube.svg');
    expect(res.body.description).toBe('Never gonna give you up');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/documents/${docId}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', 'Bearer bad.token.value');
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent document', async () => {
    const res = await request(app)
      .get('/api/documents/999999')
      .set(authHeader(token));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Document not found');
  });

  it("returns 404 when fetching another user's document", async () => {
    const otherToken = await registerAndLogin('doc-spy@example.com');
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set(authHeader(otherToken));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------

describe('PUT /api/documents/:docId', () => {
  it('updates url, description, type, and type_image', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set(authHeader(token))
      .send({
        url: 'https://www.youtube.com/watch?v=updated',
        description: 'Updated description',
        type: 'youtube',
        type_image: '/icons/youtube.svg',
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://www.youtube.com/watch?v=updated');
    expect(res.body.description).toBe('Updated description');
    expect(res.body.type).toBe('youtube');
    expect(res.body.type_image).toBe('/icons/youtube.svg');
  });

  it('persists the update — GET reflects new values', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://www.youtube.com/watch?v=updated');
    expect(res.body.description).toBe('Updated description');
  });

  it('clears description when set to empty string', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set(authHeader(token))
      .send({ url: 'https://www.youtube.com/watch?v=updated', description: '', type: 'youtube', type_image: null });

    expect(res.status).toBe(200);
    expect(res.body.description).toBeNull();
  });

  it('can change type from youtube to webpage', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set(authHeader(token))
      .send({
        url: 'https://example.com/converted',
        description: null,
        type: 'webpage',
        type_image: '/icons/webpage.svg',
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('webpage');
    expect(res.body.type_image).toBe('/icons/webpage.svg');
  });

  it('returns 400 for missing url', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set(authHeader(token))
      .send({ description: 'no url', type: 'webpage' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('url is required');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .send({ url: 'https://example.com', type: 'webpage' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent document', async () => {
    const res = await request(app)
      .put('/api/documents/999999')
      .set(authHeader(token))
      .send({ url: 'https://example.com', type: 'webpage' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Document not found');
  });

  it("returns 404 when updating another user's document", async () => {
    const otherToken = await registerAndLogin('doc-attacker@example.com');
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set(authHeader(otherToken))
      .send({ url: 'https://evil.com', type: 'webpage' });

    expect(res.status).toBe(404);
  });
});
