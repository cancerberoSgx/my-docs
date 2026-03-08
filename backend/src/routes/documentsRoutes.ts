import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../auth';
import { AppError } from '../errors';
import { DocumentType } from '../enums';
import * as listsService from '../services/listsService';

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/documents/:docId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getDocument(Number(req.params.docId), user.userId));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/documents/:docId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { url, description, type, type_image } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  try {
    res.json(
      await listsService.updateDocument(Number(req.params.docId), user.userId, {
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

router.get('/documents/:docId/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await listsService.getDocumentStatus(Number(req.params.docId), user.userId));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/documents/:docId/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { action } = req.body;
  if (!action || typeof action !== 'string') {
    res.status(400).json({ error: 'action is required' });
    return;
  }
  try {
    res.json(await listsService.triggerDocumentAction(Number(req.params.docId), user.userId, action));
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
