import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, JwtPayload } from '../auth';

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

// GET /lists?orderBy=name|created_at|updated_at&order=asc|desc
router.get('/lists', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { orderBy, order } = req.query;

  const col = ['name', 'created_at', 'updated_at'].includes(String(orderBy))
    ? String(orderBy)
    : 'created_at';
  const dir = order === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await db.query(
    `SELECT * FROM lists WHERE user_id = $1 ORDER BY ${col} ${dir}`,
    [user.userId]
  );

  res.json(rows);
});

// POST /lists
router.post('/lists', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const { rows } = await db.query(
    'INSERT INTO lists (name, description, user_id) VALUES ($1, $2, $3) RETURNING id',
    [name.trim(), description?.trim() || null, user.userId]
  );

  const { rows: listRows } = await db.query('SELECT * FROM lists WHERE id = $1', [rows[0].id]);
  res.status(201).json(listRows[0]);
});

// GET /lists/:listId — returns list with its documents
router.get('/lists/:listId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);

  const { rows: listRows } = await db.query(
    'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
    [listId, user.userId]
  );
  const list = listRows[0];

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  const { rows: documents } = await db.query(
    `SELECT d.* FROM documents d
     JOIN lists_documents ld ON ld.document_id = d.id
     WHERE ld.list_id = $1`,
    [listId]
  );

  res.json({ ...list, documents });
});

// PUT /lists/:listId
router.put('/lists/:listId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);
  const { name, description } = req.body;

  const { rows: listRows } = await db.query(
    'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
    [listId, user.userId]
  );
  const list = listRows[0] as { name: string; description: string | null } | undefined;

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  await db.query(
    `UPDATE lists SET name = $1, description = $2, updated_at = NOW() WHERE id = $3`,
    [name.trim(), description?.trim() ?? list.description, listId]
  );

  const { rows: updated } = await db.query('SELECT * FROM lists WHERE id = $1', [listId]);
  res.json(updated[0]);
});

// DELETE /lists/:listId
router.delete('/lists/:listId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);

  const { rows } = await db.query(
    'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
    [listId, user.userId]
  );
  const list = rows[0] as { name: string } | undefined;

  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  if (list.name === 'default') {
    res.status(403).json({ error: 'Cannot delete the default list' });
    return;
  }

  await db.query('DELETE FROM lists WHERE id = $1', [listId]);
  res.status(204).send();
});

// POST /lists/:listId/documents
router.post('/lists/:listId/documents', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);
  const { url, platform } = req.body;

  const { rows: listRows } = await db.query(
    'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
    [listId, user.userId]
  );

  if (listRows.length === 0) {
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

  const { rows: docRows } = await db.query(
    'INSERT INTO documents (user_id, url, platform) VALUES ($1, $2, $3) RETURNING id',
    [user.userId, url.trim(), platform.trim()]
  );
  const docId = docRows[0].id;

  await db.query(
    'INSERT INTO lists_documents (list_id, document_id) VALUES ($1, $2)',
    [listId, docId]
  );

  const { rows: doc } = await db.query('SELECT * FROM documents WHERE id = $1', [docId]);
  res.status(201).json(doc[0]);
});

export default router;
