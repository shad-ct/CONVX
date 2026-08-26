import { jsPDF } from 'jspdf';

export async function convertImage(
  file: File,
  to: 'png' | 'jpg' | 'webp',
  options: { quality?: number; width?: number; height?: number } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const width = options.width || img.naturalWidth;
      const height = options.height || img.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      // Fill white background for jpeg if transparent
      if (to === 'jpg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = to === 'jpg' ? 'image/jpeg' : `image/${to}`;
      // Map quality from 1-100 to 0-1
      const quality = options.quality !== undefined ? options.quality / 100 : 0.9;

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      }, mimeType, quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
}

export async function convertImagesToPdf(
  files: File[],
  options: { pdfOrientation?: 'portrait' | 'landscape' } = {}
): Promise<Blob> {
  const orientation = options.pdfOrientation === 'landscape' ? 'l' : 'p';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: 'a4'
  });

  let isFirst = true;

  for (const file of files) {
    const imgData = await fileToDataURL(file);
    const imgDimensions = await getImageDimensions(file);

    if (!isFirst) {
      doc.addPage();
    } else {
      isFirst = false;
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let drawWidth = imgDimensions.width;
    let drawHeight = imgDimensions.height;

    const ratio = Math.min(pageWidth / drawWidth, pageHeight / drawHeight);
    drawWidth *= ratio;
    drawHeight *= ratio;

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    const format = file.type.split('/')[1]?.toUpperCase() || 'PNG';
    // Handle standard extensions
    const type = format === 'JPG' || format === 'JPEG' ? 'JPEG' : (format === 'WEBP' ? 'WEBP' : 'PNG');

    doc.addImage(imgData, type, x, y, drawWidth, drawHeight);
  }

  return doc.output('blob');
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(img.src);
      resolve(dims);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(img.src);
      reject(e);
    };
  });
}
