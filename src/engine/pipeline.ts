import type { Format, ConversionOptions } from './types';
import { executeConversion } from './registry';
import ConversionWorker from './worker?worker';

let workerInstance: Worker | null = null;
const pendingConversions = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new ConversionWorker();
    workerInstance.onmessage = (e: MessageEvent) => {
      const { id, success, resultText, error } = e.data;
      const pending = pendingConversions.get(id);
      if (pending) {
        pendingConversions.delete(id);
        if (success) {
          pending.resolve(resultText);
        } else {
          pending.reject(new Error(error));
        }
      }
    };
  }
  return workerInstance;
}

export async function convertFile(
  file: File,
  from: Format,
  to: Format,
  options: ConversionOptions = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const isWorkerTarget = 
    (from === 'csv' && to === 'json') ||
    (from === 'json' && to === 'csv') ||
    (from === 'txt' && to === 'md');

  if (isWorkerTarget) {
    onProgress?.(20);
    const text = await file.text();
    onProgress?.(50);

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);
      pendingConversions.set(id, {
        resolve: (resultText: string) => {
          onProgress?.(90);
          const mime = to === 'json' ? 'application/json' : (to === 'csv' ? 'text/csv' : 'text/markdown');
          resolve(new Blob([resultText], { type: `${mime};charset=utf-8` }));
        },
        reject: (err) => reject(err)
      });

      const worker = getWorker();
      worker.postMessage({ id, type: 'CONVERT_TEXT', fileText: text, from, to });
    });
  }

  // Main thread conversions
  onProgress?.(30);
  const result = await executeConversion(file, from, to, options);
  onProgress?.(100);
  return result;
}
