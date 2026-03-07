import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, JwtPayload } from '../auth';

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

// GET /lists?name=&orderBy=name|createdAt|updatedAt&order=asc|desc
router.get('/lists', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const { orderBy, order } = req.query;

  const col = ['name', 'createdAt', 'updatedAt'].includes(String(orderBy))
    ? String(orderBy)
    : 'createdAt';
  const dir = order === 'desc' ? 'DESC' : 'ASC';

  const lists = db
    .prepare(`SELECT * FROM lists WHERE userId = ? ORDER BY ${col} ${dir}`)
    .all(user.userId);

  res.json(lists);
});

// POST /lists
router.post('/lists', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const result = db
    .prepare('INSERT INTO lists (name, description, userId) VALUES (?, ?, ?)')
    .run(name.trim(), description?.trim() || null, user.userId);

  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(list);
});

// GET /lists/:listId — returns list with its documents
router.get('/lists/:listId', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);

  const list = db
    .prepare('SELECT * FROM lists WHERE id = ? AND userId = ?')
    .get(listId, user.userId);

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  const documents = db
    .prepare(
      `SELECT d.* FROM documents d
       JOIN lists_documents ld ON ld.documentId = d.id
       WHERE ld.listId = ?`
    )
    .all(listId);

  res.json({ ...list, documents });
});

// PUT /lists/:listId
router.put('/lists/:listId', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);
  const { name, description } = req.body;

  const list = db
    .prepare('SELECT * FROM lists WHERE id = ? AND userId = ?')
    .get(listId, user.userId) as { name: string; description: string | null } | undefined;

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  db.prepare(
    `UPDATE lists SET name = ?, description = ?, updatedAt = datetime('now') WHERE id = ?`
  ).run(name.trim(), description?.trim() ?? list.description, listId);

  const updated = db.prepare('SELECT * FROM lists WHERE id = ?').get(listId);
  res.json(updated);
});

// DELETE /lists/:listId
router.delete('/lists/:listId', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);

  const list = db
    .prepare('SELECT * FROM lists WHERE id = ? AND userId = ?')
    .get(listId, user.userId) as { name: string } | undefined;

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (list.name === 'default') {
    res.status(403).json({ error: 'Cannot delete the default list' });
    return;
  }

  db.prepare('DELETE FROM lists WHERE id = ?').run(listId);
  res.status(204).send();
});

// POST /lists/:listId/documents
router.post('/lists/:listId/documents', requireAuth, (req: Request, res: Response): void => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);
  const { url, platform } = req.body;

  const list = db
    .prepare('SELECT * FROM lists WHERE id = ? AND userId = ?')
    .get(listId, user.userId);

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  if (!platform || typeof platform !== 'string' || !platform.trim()) {
    res.status(400).json({ error: 'platform is required' });
    return;
  }

  const docResult = db
    .prepare('INSERT INTO documents (userId, url, platform) VALUES (?, ?, ?)')
    .run(user.userId, url.trim(), platform.trim());

  db.prepare('INSERT INTO lists_documents (listId, documentId) VALUES (?, ?)')
    .run(listId, docResult.lastInsertRowid);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docResult.lastInsertRowid);
  res.status(201).json(doc);
});

export default router;
