import { Router, Request, Response } from 'express';
import { requireRole } from '../auth';
import { AppError } from '../errors';
import * as toolsRepo from '../repositories/toolsRepository';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/tools', requireRole(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentType } = req.query;
    if (documentType && typeof documentType === 'string') {
      res.json(await toolsRepo.getToolsByDocumentType(documentType));
    } else {
      res.json(await toolsRepo.getAllTools());
    }
  } catch (err) { handleError(res, err); }
});

router.get('/tools/:toolId', requireRole(), async (req: Request, res: Response): Promise<void> => {
  try {
    const tool = await toolsRepo.getToolById(Number(req.params.toolId));
    if (!tool) { res.status(404).json({ error: 'Tool not found' }); return; }
    res.json(tool);
  } catch (err) { handleError(res, err); }
});

export default router;
