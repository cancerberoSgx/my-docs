import { Router, Request, Response } from 'express';
import { AppError } from '../errors';
import { login, register } from '../services/authService';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * @openapi
 * /auth:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       '200':
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       '400':
 *         description: Missing fields
 *       '401':
 *         description: Invalid credentials
 */
router.post('/auth', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    res.json({ token: await login(email, password) });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * @openapi
 * /register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       '201':
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       '400':
 *         description: Missing fields
 *       '409':
 *         description: Email already taken
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    res.status(201).json({ token: await register(email, password) });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
