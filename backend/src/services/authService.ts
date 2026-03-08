import bcrypt from 'bcryptjs';
import { AppError } from '../errors';
import { signToken } from '../auth';
import * as usersRepo from '../repositories/usersRepository';
import * as listsRepo from '../repositories/listsRepository';

export async function login(email: string, password: string): Promise<string> {
  const user = await usersRepo.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new AppError(401, 'Invalid credentials');
  }
  return signToken({ userId: user.id, email: user.email, role: user.role });
}

export async function getMe(userId: number): Promise<{ id: number; email: string; role: string }> {
  const user = await usersRepo.getUserById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return { id: user.id, email: user.email, role: user.role };
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const user = await usersRepo.getUserById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if (!bcrypt.compareSync(currentPassword, user.password)) throw new AppError(401, 'Current password is incorrect');
  await usersRepo.updatePassword(userId, bcrypt.hashSync(newPassword, 10));
}

export async function deleteAccount(userId: number, password: string): Promise<void> {
  const user = await usersRepo.getUserById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if (!bcrypt.compareSync(password, user.password)) throw new AppError(401, 'Password is incorrect');
  await usersRepo.deleteUser(userId);
}

export async function register(email: string, password: string): Promise<string> {
  if (await usersRepo.emailExists(email)) {
    throw new AppError(409, 'Email already taken');
  }
  const hashed = bcrypt.hashSync(password, 10);
  const user = await usersRepo.createUser(email, hashed);
  await listsRepo.createList('default', 'Default list', user.id);
  return signToken({ userId: user.id, email, role: 'user' });
}
