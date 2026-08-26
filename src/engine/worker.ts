import { csvToJson, jsonToCsv } from '../converters/csv';
import { txtToMarkdown } from '../converters/text';

self.onmessage = async (e: MessageEvent) => {
  const { id, type, fileText, from, to } = e.data;
  if (type === 'CONVERT_TEXT') {
    try {
      let resultText = '';
      if (from === 'csv' && to === 'json') {
        resultText = csvToJson(fileText);
      } else if (from === 'json' && to === 'csv') {
        resultText = jsonToCsv(fileText);
      } else if (from === 'txt' && to === 'md') {
        resultText = txtToMarkdown(fileText);
      } else {
        throw new Error(`Unsupported text conversion in worker: ${from} -> ${to}`);
      }

      self.postMessage({ id, success: true, resultText });
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message || 'Unknown worker error' });
    }
  }
};
