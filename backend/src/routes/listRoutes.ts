import { Router, Request, Response } from 'express';
import { requireRole, JwtPayload } from '../auth';
import { AppError } from '../errors';
import { DocumentType, UserRole } from '../enums';
import * as listsService from '../services/listsService';

function scopedUserId(user: JwtPayload): number | null {
  return user.role === UserRole.Root ? null : user.userId;
}

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

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
router.get('/documentType', (req: Request, res: Response): void => {
  res.json(listsService.detectDocumentType(String(req.query.url || '')));
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
router.get('/lists', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getLists(scopedUserId(user), String(req.query.orderBy || ''), String(req.query.order || '')));
  } catch (err) {
    handleError(res, err);
  }
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
 *         description: Missing name
 *       '401':
 *         description: Unauthorized
 */
router.post('/lists', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    res.status(201).json(await listsService.createList(user.userId, name.trim(), description));
  } catch (err) {
    handleError(res, err);
  }
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
router.get('/lists/:listId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getList(Number(req.params.listId), scopedUserId(user)));
  } catch (err) {
    handleError(res, err);
  }
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
router.put('/lists/:listId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    res.json(await listsService.updateList(Number(req.params.listId), scopedUserId(user), name.trim(), description));
  } catch (err) {
    handleError(res, err);
  }
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
router.delete('/lists/:listId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    await listsService.deleteList(Number(req.params.listId), scopedUserId(user));
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
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
router.post('/lists/:listId/documents', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { url, platform, type, description, type_image } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  if (!platform || typeof platform !== 'string' || !platform.trim()) {
    res.status(400).json({ error: 'platform is required' });
    return;
  }
  try {
    res.status(201).json(
      await listsService.addDocumentToList(
        Number(req.params.listId),
        scopedUserId(user),
        user.userId,
        url.trim(),
        platform.trim(),
        type || DocumentType.Webpage,
        description?.trim() || null,
        type_image || null,
      )
    );
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
