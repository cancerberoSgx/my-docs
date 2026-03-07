import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken } from '../auth';

const router = Router();

router.post('/auth', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; password: string; role: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token });
});

router.post('/register', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const existing = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(email, hashed, 'user');

  const token = signToken({ userId: Number(result.lastInsertRowid), email, role: 'user' });
  res.status(201).json({ token });
});

export default router;
