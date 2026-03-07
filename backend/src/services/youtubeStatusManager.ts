import * as listsRepo from '../repositories/listsRepository';

async function runLoadProcess(docId: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  await listsRepo.setDocumentStatus(docId, 'ready', null);
}

export async function triggerLoad(docId: number): Promise<void> {
  await listsRepo.setDocumentStatus(docId, 'pending', null);
  runLoadProcess(docId).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    await listsRepo.setDocumentStatus(docId, 'error', msg);
  });
}
