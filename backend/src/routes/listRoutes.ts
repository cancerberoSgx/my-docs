import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, JwtPayload } from '../auth';

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

/**
 * @openapi
 * components:
 *   schemas:
 *     TokenResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *     List:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         user_id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Doc:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         url:
 *           type: string
 *         platform:
 *           type: string
 *         type:
 *           type: string
 *           example: youtube
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @openapi
 * /documentType:
 *   get:
 *     tags: [Documents]
 *     summary: Infer document type from a URL
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *     responses:
 *       '200':
 *         description: Detected document type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: youtube
 */
// GET /documentType?url=...
router.get('/documentType', (req: Request, res: Response): void => {
  const url = String(req.query.url || '');
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const type = host.includes('youtube.com') || host === 'youtu.be' ? 'youtube' : 'unknown';
    res.json({ type });
  } catch {
    res.json({ type: 'unknown' });
  }
});

/**
 * @openapi
 * /lists:
 *   get:
 *     tags: [Lists]
 *     summary: Get all lists for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, created_at, updated_at]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       '200':
 *         description: Array of lists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/List'
 *       '401':
 *         description: Unauthorized
 */
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

/**
 * @openapi
 * /lists:
 *   post:
 *     tags: [Lists]
 *     summary: Create a list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         description: Unauthorized
 */
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

/**
 * @openapi
 * /lists/{listId}:
 *   get:
 *     tags: [Lists]
 *     summary: Get a list with its documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: List with documents
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/List'
 *                 - type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Doc'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: List not found
 */
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

/**
 * @openapi
 * /lists/{listId}:
 *   put:
 *     tags: [Lists]
 *     summary: Update a list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Updated list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       '400':
 *         description: Missing name
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: List not found
 */
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

/**
 * @openapi
 * /lists/{listId}:
 *   delete:
 *     tags: [Lists]
 *     summary: Delete a list (cannot delete the default list)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '204':
 *         description: Deleted
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Cannot delete the default list
 *       '404':
 *         description: List not found
 */
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

/**
 * @openapi
 * /lists/{listId}/documents:
 *   post:
 *     tags: [Documents]
 *     summary: Add a document to a list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, platform]
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *               platform:
 *                 type: string
 *                 example: youtube
 *               type:
 *                 type: string
 *                 example: youtube
 *     responses:
 *       '201':
 *         description: Created document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doc'
 *       '400':
 *         description: Missing url or platform
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: List not found
 */
// POST /lists/:listId/documents
router.post('/lists/:listId/documents', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const listId = Number(req.params.listId);
  const { url, platform, type } = req.body;

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
    'INSERT INTO documents (user_id, url, platform, type) VALUES ($1, $2, $3, $4) RETURNING id',
    [user.userId, url.trim(), platform.trim(), type || 'unknown']
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
