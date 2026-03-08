import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../auth';
import { AppError } from '../errors';
import { getMe, changePassword, deleteAccount } from '../services/authService';

const router = Router();

type AuthRequest = Request & { user: JwtPayload };

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    res.json(await getMe(user.userId));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/me/password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' });
    return;
  }
  try {
    await changePassword(user.userId, currentPassword, newPassword);
    res.json({ message: 'Password updated' });
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'password is required' });
    return;
  }
  try {
    await deleteAccount(user.userId, password);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
