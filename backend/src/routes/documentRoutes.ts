import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, JwtPayload } from '../auth';

const router = Router();

router.get('/documents', requireAuth, (req: Request, res: Response): void => {
  const user = (req as Request & { user: JwtPayload }).user;

  const docs = db.prepare('SELECT * FROM documents WHERE userId = ?').all(user.userId);
  res.json(docs);
});

export default router;
