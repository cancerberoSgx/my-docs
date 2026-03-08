import * as listsRepo from '../repositories/listsRepository';
import { DocumentStatus } from '../enums';

async function runLoadProcess(docId: number): Promise<{ url: string; mimetype: string; extra: object }> {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  return {
    url: `https://example.com/stream/${docId}.mp4`,
    mimetype: 'video/mp4',
    extra: {},
  };
}

export async function triggerLoad(docId: number): Promise<void> {
  await listsRepo.recordStatusChange(docId, DocumentStatus.Pending, null);
  runLoadProcess(docId)
    .then(({ url, mimetype, extra }) =>
      listsRepo.recordStatusChange(docId, DocumentStatus.Ready, null, url, mimetype, extra)
    )
    .catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      await listsRepo.recordStatusChange(docId, DocumentStatus.Error, msg);
    });
}
