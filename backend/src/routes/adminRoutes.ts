import bcrypt from 'bcryptjs';
import { Router, Request, Response } from 'express';
import { requireRole } from '../auth';
import { AppError } from '../errors';
import { UserRole } from '../enums';
import * as adminRepo from '../repositories/adminRepository';
import * as usersRepo from '../repositories/usersRepository';

const router = Router();

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

function pageParams(query: Record<string, unknown>) {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const orderBy = String(query.orderBy || '');
  const order = query.order === 'desc' ? 'desc' : 'asc';
  return { limit, offset, orderBy, order };
}

router.get('/admin/users', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.query.email ? String(req.query.email) : undefined;
    res.json(await adminRepo.adminGetUsers({ ...pageParams(req.query as Record<string, unknown>), email }));
  } catch (err) { handleError(res, err); }
});

router.get('/admin/users/:userId', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await usersRepo.getUserById(Number(req.params.userId));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) { handleError(res, err); }
});

router.put('/admin/users/:userId/password', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'newPassword must be at least 8 characters' });
    return;
  }
  try {
    const user = await usersRepo.getUserById(Number(req.params.userId));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    await usersRepo.updatePassword(Number(req.params.userId), bcrypt.hashSync(newPassword, 10));
    res.json({ message: 'Password updated' });
  } catch (err) { handleError(res, err); }
});

router.delete('/admin/users/:userId', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await usersRepo.getUserById(Number(req.params.userId));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    await usersRepo.deleteUser(Number(req.params.userId));
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

router.put('/admin/users/:userId/role', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!role || !Object.values(UserRole).includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  try {
    await adminRepo.adminSetUserRole(Number(req.params.userId), role);
    res.json({ message: 'Role updated' });
  } catch (err) { handleError(res, err); }
});

router.get('/admin/documents', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  try {
    const url = req.query.url ? String(req.query.url) : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;
    res.json(await adminRepo.adminGetDocuments({ ...pageParams(req.query as Record<string, unknown>), url, type }));
  } catch (err) { handleError(res, err); }
});

router.get('/admin/lists', requireRole(UserRole.Root), async (req: Request, res: Response): Promise<void> => {
  try {
    const name = req.query.name ? String(req.query.name) : undefined;
    res.json(await adminRepo.adminGetLists({ ...pageParams(req.query as Record<string, unknown>), name }));
  } catch (err) { handleError(res, err); }
});

export default router;
