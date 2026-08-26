import JSZip from 'jszip';
import { htmlToPdf } from '../html';

export async function readDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX file: missing word/document.xml');
  }
  const xmlText = await docXmlFile.async('text');

  // Parse XML using browser DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  // Extract text from w:p elements (paragraphs)
  const paragraphs = xmlDoc.getElementsByTagName('w:p');
  const lines: string[] = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textTags = p.getElementsByTagName('w:t');
    let pText = '';
    for (let j = 0; j < textTags.length; j++) {
      pText += textTags[j].textContent || '';
    }
    lines.push(pText);
  }
  
  return lines.join('\n');
}

export async function docxToTxt(file: File): Promise<Blob> {
  const text = await readDocxText(file);
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

export async function docxToMarkdown(file: File): Promise<Blob> {
  const text = await readDocxText(file);
  const md = text.split('\n').map(p => p.trim()).filter(p => p).join('\n\n');
  return new Blob([md], { type: 'text/markdown;charset=utf-8' });
}

export async function docxToHtml(file: File): Promise<Blob> {
  const text = await readDocxText(file);
  const htmlParagraphs = text.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('\n');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(file.name)} - Converted</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111; }
    p { margin-bottom: 1em; }
  </style>
</head>
<body>
  ${htmlParagraphs}
</body>
</html>`;
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

export async function docxToPdf(file: File): Promise<Blob> {
  const text = await readDocxText(file);
  const htmlParagraphs = text.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('\n');
  const StyledHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; font-size: 14px;">
      ${htmlParagraphs}
    </div>
  `;
  return htmlToPdf(StyledHtml);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
