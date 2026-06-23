// Web Worker that imports API specs using adapter packages
import { importHar } from '@sketch-test/adapter-har';
import { importPostmanCollection } from '@sketch-test/adapter-postman';
import type { ContentHash } from '@sketch-test/contracts-common';
import type { ImportFormat } from '@sketch-test/format-detector';

type ImportResult = Awaited<ReturnType<typeof importPostmanCollection | typeof importHar>>;

interface ImportMessage {
  type: 'import';
  content: string;
  format: ImportFormat;
  options: Record<string, unknown>;
  envContent?: string;
}

interface CancelMessage {
  type: 'cancel';
}

self.onmessage = async (e: MessageEvent<ImportMessage | CancelMessage>) => {
  const { type } = e.data;

  if (type === 'cancel') {
    // Signal cancellation — the caller will terminate the worker
    return;
  }

  if (type === 'import') {
    const { content, format, options } = e.data;

    try {
      const parsed = JSON.parse(content);

      self.postMessage({
        type: 'progress',
        phase: '解析格式',
        current: 0,
        total: 1,
      });

      let result: ImportResult;
      switch (format) {
        case 'postman-collection': {
          result = importPostmanCollection(parsed, {
            sourceLabel: options['fileName'] as string,
            sourceHash: '0'.repeat(64) as ContentHash,
          });
          break;
        }
        case 'har': {
          result = importHar(parsed, {
            sourceLabel: options['fileName'] as string,
            sourceHash: '0'.repeat(64) as ContentHash,
          });
          break;
        }
        default:
          self.postMessage({
            type: 'error',
            message: `Unsupported format: ${format}`,
          });
          return;
      }

      self.postMessage({ type: 'complete', result });
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) });
    }
  }
};
