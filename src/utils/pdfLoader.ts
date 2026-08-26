declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export async function loadPdfJS(): Promise<any> {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js library loaded but pdfjsLib global not found'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load PDF.js from CDN'));
    };
    document.head.appendChild(script);
  });
}
