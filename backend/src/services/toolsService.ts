import { AppError } from '../errors';
import * as listsRepo from '../repositories/listsRepository';
import * as toolsRepo from '../repositories/toolsRepository';
import { DocumentStatus } from '../enums';
import { registry } from '../tools/registry';

export async function trigger(
  docId: number,
  userId: number | null,
  toolId: number,
  action: string,
  params: Record<string, unknown>,
): Promise<{ status: string }> {
  const doc = await listsRepo.getDocumentById(docId, userId);
  if (!doc) throw new AppError(404, 'Document not found');

  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) throw new AppError(404, 'Tool not found');

  if (!tool.documentTypes.includes(doc.type)) {
    throw new AppError(400, `Tool '${tool.name}' does not apply to ${doc.type} documents`);
  }

  if (!tool.actions.some((a) => a.name === action)) {
    throw new AppError(400, `Tool '${tool.name}' does not support action '${action}'`);
  }

  if (doc.status !== DocumentStatus.Empty && doc.status !== DocumentStatus.Ready) {
    throw new AppError(409, 'Document must be in empty or ready status');
  }

  const impl = registry.get(tool.name);
  if (!impl) throw new AppError(501, `Tool '${tool.name}' has no implementation`);

  await listsRepo.recordStatusChange(docId, DocumentStatus.Pending, null);

  impl.execute(docId, action, params)
    .then(({ url, mimetype, extra }) =>
      listsRepo.recordStatusChange(docId, DocumentStatus.Ready, null, url, mimetype, extra)
    )
    .catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      await listsRepo.recordStatusChange(docId, DocumentStatus.Error, msg);
    });

  return { status: DocumentStatus.Pending };
}
