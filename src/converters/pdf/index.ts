import { loadPdfJS } from '../../utils/pdfLoader';
import JSZip from 'jszip';

export async function pdfToTxt(file: File): Promise<Blob> {
  const pdfjs = await loadPdfJS();
  const fileArrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: fileArrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
}

export async function pdfToHtml(file: File): Promise<Blob> {
  const pdfjs = await loadPdfJS();
  const fileArrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: fileArrayBuffer }).promise;

  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(file.name)} - Converted</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111; }
    .page { border-bottom: 2px dashed #ccc; padding: 20px 0; margin-bottom: 20px; }
    .page-header { font-weight: bold; color: #555; margin-bottom: 10px; font-family: monospace; }
  </style>
</head>
<body>
`;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');

    htmlContent += `  <div class="page">\n`;
    htmlContent += `    <div class="page-header">PAGE ${i}</div>\n`;
    htmlContent += `    <p>${escapeHtml(pageText)}</p>\n`;
    htmlContent += `  </div>\n`;
  }

  htmlContent += `</body>\n</html>`;
  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}

export async function pdfToImages(
  file: File,
  format: 'png' | 'jpg'
): Promise<{ blob: Blob; isZip: boolean }> {
  const pdfjs = await loadPdfJS();
  const fileArrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: fileArrayBuffer }).promise;

  const pagesBlobs: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // high quality scale

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background for jpg/jpeg
    if (format === 'jpg') {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, viewport.width, viewport.height);
    }

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas rendering failed'));
      }, mimeType, 0.95);
    });

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    pagesBlobs.push({
      name: `${baseName}_page_${i}.${format}`,
      blob: blob
    });
  }

  if (pagesBlobs.length === 1) {
    return { blob: pagesBlobs[0].blob, isZip: false };
  } else {
    const zip = new JSZip();
    pagesBlobs.forEach((page) => {
      zip.file(page.name, page.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, isZip: true };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
