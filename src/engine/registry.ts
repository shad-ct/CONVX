import type { Format, ConversionOptions } from './types';
import { pdfToTxt, pdfToHtml, pdfToImages } from '../converters/pdf';
import { convertImage, convertImagesToPdf } from '../converters/image';
import { csvToJson, jsonToCsv } from '../converters/csv';
import { markdownToHtml, markdownToPdf } from '../converters/markdown';
import { htmlToPdf } from '../converters/html';
import { txtToMarkdown } from '../converters/text';
import { docxToTxt, docxToMarkdown, docxToHtml, docxToPdf } from '../converters/docx';

export interface ConversionCapability {
  from: Format;
  to: Format[];
}

export const CONVERSION_REGISTRY: ConversionCapability[] = [
  {
    from: 'pdf',
    to: ['txt', 'html', 'png', 'jpg']
  },
  {
    from: 'docx',
    to: ['pdf', 'html', 'txt', 'md']
  },
  {
    from: 'png',
    to: ['jpg', 'webp', 'pdf']
  },
  {
    from: 'jpg',
    to: ['png', 'webp', 'pdf']
  },
  {
    from: 'webp',
    to: ['png', 'jpg', 'pdf']
  },
  {
    from: 'txt',
    to: ['md']
  },
  {
    from: 'md',
    to: ['html', 'pdf']
  },
  {
    from: 'html',
    to: ['pdf']
  },
  {
    from: 'csv',
    to: ['json']
  },
  {
    from: 'json',
    to: ['csv']
  }
];

export function getSupportedOutputs(from: Format): Format[] {
  const match = CONVERSION_REGISTRY.find(c => c.from === from);
  return match ? match.to : [];
}

export async function executeConversion(
  file: File,
  from: Format,
  to: Format,
  options: ConversionOptions = {}
): Promise<Blob> {
  switch (from) {
    case 'pdf':
      if (to === 'txt') return pdfToTxt(file);
      if (to === 'html') return pdfToHtml(file);
      if (to === 'png' || to === 'jpg') {
        const result = await pdfToImages(file, to);
        return result.blob;
      }
      break;

    case 'docx':
      if (to === 'txt') return docxToTxt(file);
      if (to === 'md') return docxToMarkdown(file);
      if (to === 'html') return docxToHtml(file);
      if (to === 'pdf') return docxToPdf(file);
      break;

    case 'png':
    case 'jpg':
    case 'webp':
      if (to === 'png' || to === 'jpg' || to === 'webp') {
        return convertImage(file, to, options);
      }
      if (to === 'pdf') {
        return convertImagesToPdf([file], options);
      }
      break;

    case 'txt':
      if (to === 'md') {
        const text = await file.text();
        const mdText = txtToMarkdown(text);
        return new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
      }
      break;

    case 'md':
      if (to === 'html') {
        const text = await file.text();
        const htmlText = await markdownToHtml(text);
        return new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      }
      if (to === 'pdf') {
        const text = await file.text();
        return markdownToPdf(text);
      }
      break;

    case 'html':
      if (to === 'pdf') {
        const text = await file.text();
        return htmlToPdf(text);
      }
      break;

    case 'csv':
      if (to === 'json') {
        const text = await file.text();
        const jsonText = csvToJson(text);
        return new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      }
      break;

    case 'json':
      if (to === 'csv') {
        const text = await file.text();
        const csvText = jsonToCsv(text);
        return new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      }
      break;
  }

  throw new Error(`Conversion from ${from} to ${to} is not implemented.`);
}
