import { jsPDF } from 'jspdf';

export async function htmlToPdf(htmlContent: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const container = document.createElement('div');
  container.style.width = '500px';
  container.style.padding = '20px';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.5';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    await new Promise<void>((resolve) => {
      doc.html(container, {
        callback: function () {
          resolve();
        },
        x: 40,
        y: 40,
        width: 515, // width of A4 in pt minus margins (595 - 80)
        windowWidth: 555
      });
    });
  } finally {
    document.body.removeChild(container);
  }

  return doc.output('blob');
}
