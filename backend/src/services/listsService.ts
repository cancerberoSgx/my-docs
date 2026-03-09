import { AppError } from '../errors';
import * as listsRepo from '../repositories/listsRepository';
import { DocumentStatus, DocumentType } from '../enums';
import type { List, Doc, DocumentStatusResult } from '../repositories/listsRepository';

const VALID_ORDER_COLS = ['name', 'created_at', 'updated_at'];

export function getLists(userId: number | null, orderBy?: string, order?: string): Promise<List[]> {
  const col = VALID_ORDER_COLS.includes(String(orderBy)) ? String(orderBy) : 'created_at';
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  return listsRepo.getLists(userId, col, dir);
}

export async function getList(listId: number, userId: number | null): Promise<List & { documents: Doc[] }> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const documents = await listsRepo.getDocumentsByListId(listId);
  return { ...list, documents };
}

export function createList(userId: number, name: string, description?: string): Promise<List> {
  return listsRepo.createList(name, description?.trim() || null, userId);
}

export async function updateList(listId: number, userId: number | null, name: string, description?: string): Promise<List> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const newDesc = description !== undefined ? (description.trim() || null) : list.description;
  return listsRepo.updateList(listId, name, newDesc);
}

export async function deleteList(listId: number, userId: number | null): Promise<void> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  if (list.name === 'default') throw new AppError(403, 'Cannot delete the default list');
  await listsRepo.deleteList(listId);
}

export async function addDocumentToList(
  listId: number,
  userId: number | null,
  ownerId: number,
  url: string,
  platform: string,
  type: string,
  description: string | null,
  type_image: string | null,
): Promise<Doc> {
  const list = await listsRepo.getListById(listId, userId);
  if (!list) throw new AppError(404, 'List not found');
  const status = type === DocumentType.Webpage ? DocumentStatus.Ready : DocumentStatus.Empty;
  const doc = await listsRepo.createDocument(ownerId, url, platform, type, description, type_image, status);
  await listsRepo.addDocumentToList(listId, doc.id);
  return doc;
}

export async function getDocument(docId: number, userId: number | null): Promise<Doc> {
  const doc = await listsRepo.getDocumentById(docId, userId);
  if (!doc) throw new AppError(404, 'Document not found');
  return doc;
}

export async function updateDocument(
  docId: number,
  userId: number | null,
  data: { url: string; description: string | null; type: string; type_image: string | null },
): Promise<Doc> {
  const doc = await listsRepo.getDocumentById(docId, userId);
  if (!doc) throw new AppError(404, 'Document not found');
  return listsRepo.updateDocument(docId, data);
}

export async function getDocumentStatus(
  docId: number,
  userId: number | null,
): Promise<DocumentStatusResult> {
  const row = await listsRepo.getDocumentStatus(docId, userId);
  if (!row) throw new AppError(404, 'Document not found');
  return row;
}


export function detectDocumentType(url: string): { type: string; type_image: string } {
  let type: DocumentType = DocumentType.Webpage;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('youtube.com') || host === 'youtu.be') type = DocumentType.Youtube;
  } catch { /* keep webpage */ }
  return { type, type_image: type === DocumentType.Youtube ? '/icons/youtube.svg' : '/icons/webpage.svg' };
}
