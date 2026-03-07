import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, JwtPayload } from '../auth';

const router = Router();

router.get('/documents', requireAuth, (req: Request, res: Response): void => {
  const user = (req as Request & { user: JwtPayload }).user;

  const docs = db.prepare('SELECT * FROM documents WHERE userId = ?').all(user.userId);
  res.json(docs);
});

router.post('/documents', requireAuth, (req: Request, res: Response): void => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { url, platform } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }
  if (!platform || typeof platform !== 'string' || !platform.trim()) {
    res.status(400).json({ error: 'platform is required' });
    return;
  }

  const result = db
    .prepare('INSERT INTO documents (userId, url, platform) VALUES (?, ?, ?)')
    .run(user.userId, url.trim(), platform.trim());

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(doc);
});

export default router;
