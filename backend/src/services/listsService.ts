import { AppError } from '../errors';
import * as listsRepo from '../repositories/listsRepository';
import type { List, Doc } from '../repositories/listsRepository';

const VALID_ORDER_COLS = ['name', 'created_at', 'updated_at'];

export function getLists(userId: number, orderBy?: string, order?: string): Promise<List[]> {
  const col = VALID_ORDER_COLS.includes(String(orderBy)) ? String(orderBy) : 'created_at';
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  return listsRepo.getLists(userId, col, dir);
}

export async function getList(listId: number, userId: number): Promise<List & { documents: Doc[] }> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const documents = await listsRepo.getDocumentsByListId(listId);
  return { ...list, documents };
}

export function createList(userId: number, name: string, description?: string): Promise<List> {
  return listsRepo.createList(name, description?.trim() || null, userId);
}

export async function updateList(listId: number, userId: number, name: string, description?: string): Promise<List> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const newDesc = description !== undefined ? (description.trim() || null) : list.description;
  return listsRepo.updateList(listId, name, newDesc);
}

export async function deleteList(listId: number, userId: number): Promise<void> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  if (list.name === 'default') throw new AppError(403, 'Cannot delete the default list');
  await listsRepo.deleteList(listId);
}

export async function addDocumentToList(
  listId: number,
  userId: number,
  url: string,
  platform: string,
  type: string,
): Promise<Doc> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const doc = await listsRepo.createDocument(userId, url, platform, type);
  await listsRepo.addDocumentToList(listId, doc.id);
  return doc;
}

export function getDocumentType(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.includes('youtube.com') || host === 'youtu.be' ? 'youtube' : 'unknown';
  } catch {
    return 'unknown';
  }
}
