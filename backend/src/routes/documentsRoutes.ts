import { Router, Request, Response } from 'express';
import { requireRole, JwtPayload } from '../auth';
import { AppError } from '../errors';
import { DocumentType, UserRole } from '../enums';
import * as listsService from '../services/listsService';
import * as toolsService from '../services/toolsService';

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

router.get('/documents/:docId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getDocument(Number(req.params.docId), scopedUserId(user)));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/documents/:docId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { url, description, type, type_image } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  try {
    res.json(
      await listsService.updateDocument(Number(req.params.docId), scopedUserId(user), {
        url: url.trim(),
        description: description?.trim() || null,
        type: type || DocumentType.Webpage,
        type_image: type_image || null,
      })
    );
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/documents/:docId/status', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getDocumentStatus(Number(req.params.docId), scopedUserId(user)));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/documents/:docId/history', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = req.query.status ? String(req.query.status) : undefined;
  try {
    const result = await listsService.getDocumentHistory(Number(req.params.docId), scopedUserId(user), { limit, offset, status });
    if (!result) { res.status(404).json({ error: 'Document not found' }); return; }
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/documents/:docId/history/:entryId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    const entry = await listsService.getHistoryEntry(
      Number(req.params.docId),
      Number(req.params.entryId),
      scopedUserId(user),
    );
    if (!entry) { res.status(404).json({ error: 'Entry not found' }); return; }
    res.json(entry);
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/documents/:docId/status', requireRole(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { toolId, action, params } = req.body;
  if (!toolId || typeof toolId !== 'number') {
    res.status(400).json({ error: 'toolId is required' });
    return;
  }
  if (!action || typeof action !== 'string') {
    res.status(400).json({ error: 'action is required' });
    return;
  }
  try {
    res.json(await toolsService.trigger(
      Number(req.params.docId),
      scopedUserId(user),
      toolId,
      action,
      typeof params === 'object' && params !== null ? params : {},
    ));
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
