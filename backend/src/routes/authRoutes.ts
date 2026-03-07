import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken } from '../auth';

const router = Router();

router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0] as { id: number; email: string; password: string; role: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token });
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const { rows: existing } = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email already taken' });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const { rows } = await db.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
    [email, hashed, 'user']
  );
  const userId = rows[0].id;

  await db.query(
    'INSERT INTO lists (name, description, user_id) VALUES ($1, $2, $3)',
    ['default', 'Default list', userId]
  );

  const token = signToken({ userId, email, role: 'user' });
  res.status(201).json({ token });
});

export default router;
