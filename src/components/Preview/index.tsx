import { useState, useEffect, useRef } from 'react';
import type { Format } from '../../engine/types';
import { loadPdfJS } from '../../utils/pdfLoader';
import { marked } from 'marked';
import { readDocxText } from '../../converters/docx';

interface PreviewProps {
  name: string;
  blob: Blob;
  format: Format;
  onClose: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ name, blob, format, onClose }) => {
  const [textContent, setTextContent] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // PDF specific state
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [pdfZoom, setPdfZoom] = useState<number>(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // MD & HTML Toggles
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  useEffect(() => {
    // Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setError('');
    setTextContent('');
    setHtmlContent('');
    setCsvData({ headers: [], rows: [] });
    setDimensions(null);

    // Clean up previous image URL if any
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
      setImageSrc('');
    }

    const loadContent = async () => {
      try {
        if (['png', 'jpg', 'webp'].includes(format)) {
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
          
          const img = new Image();
          img.src = url;
          img.onload = () => {
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setLoading(false);
          };
          img.onerror = () => {
            setError('Failed to load image preview');
            setLoading(false);
          };
        } else if (format === 'pdf') {
          const pdfjs = await loadPdfJS();
          const buffer = await blob.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buffer }).promise;
          pdfDocRef.current = pdf;
          setPdfTotalPages(pdf.numPages);
          setPdfPage(1);
          setLoading(false);
        } else if (format === 'docx') {
          // Parse DOCX via zip extractor
          // Create dummy File object for our helper
          const dummyFile = new File([blob], name);
          const text = await readDocxText(dummyFile);
          setTextContent(text);
          setLoading(false);
        } else if (format === 'csv') {
          const text = await blob.text();
          setTextContent(text);
          
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length > 0) {
            const parseRow = (line: string) => {
              const result: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              result.push(current.trim());
              return result;
            };

            const headers = parseRow(lines[0]);
            const rows = lines.slice(1).map(parseRow);
            setCsvData({ headers, rows });
          }
          setLoading(false);
        } else if (format === 'md') {
          const text = await blob.text();
          setTextContent(text);
          const html = await marked.parse(text);
          setHtmlContent(html);
          setLoading(false);
        } else if (format === 'html') {
          const text = await blob.text();
          setTextContent(text);
          setHtmlContent(text);
          setLoading(false);
        } else if (format === 'txt' || format === 'json') {
          const text = await blob.text();
          setTextContent(text);
          setLoading(false);
        } else {
          setError(`Preview not available for .${format} format.`);
          setLoading(false);
        }
      } catch (err: any) {
        setError(`Failed to read file contents: ${err.message || err}`);
        setLoading(false);
      }
    };

    loadContent();

    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [blob, format, name]);

  // PDF Page Render Effect
  useEffect(() => {
    if (format !== 'pdf' || !pdfDocRef.current || loading) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocRef.current.getPage(pdfPage);
        const viewport = page.getViewport({ scale: pdfZoom });
        
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Draw page
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
          }
        }
      } catch (err) {
        console.error('PDF page render error:', err);
      }
    };

    renderPage();
  }, [format, pdfPage, pdfZoom, loading]);

  const handleNextPage = () => {
    if (pdfPage < pdfTotalPages) setPdfPage(pdfPage + 1);
  };

  const handlePrevPage = () => {
    if (pdfPage > 1) setPdfPage(pdfPage - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="w-full max-w-4xl bg-white border-4 border-black shadow-[8px_8px_0_#000] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="border-b-4 border-black p-4 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <span className="border-2 border-black bg-black text-white px-2 py-0.5 font-mono text-xs uppercase">
              PREVIEW
            </span>
            <span className="font-mono text-sm font-black truncate max-w-[200px] sm:max-w-md">
              {name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase bg-white hover:bg-black hover:text-white cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-neutral-50 relative min-h-[300px] flex flex-col justify-center">
          {loading && (
            <div className="text-center font-mono text-sm font-black uppercase animate-pulse">
              LOADING PREVIEW...
            </div>
          )}

          {error && (
            <div className="text-center p-6 border-2 border-black bg-white inline-block max-w-md mx-auto">
              <h5 className="font-mono text-sm font-black uppercase mb-2">PREVIEW UNAVAILABLE</h5>
              <p className="font-mono text-xs text-neutral-500 mb-4">{error}</p>
              <div className="text-xs font-mono border border-black border-dashed p-2">
                Type: {format.toUpperCase()} · Size: {(blob.size / 1024).toFixed(1)} KB
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* IMAGE PREVIEW */}
              {['png', 'jpg', 'webp'].includes(format) && imageSrc && (
                <div className="flex flex-col items-center max-w-full">
                  <img
                    src={imageSrc}
                    alt={name}
                    className="max-h-[60vh] max-w-full border-4 border-black object-contain bg-[radial-gradient(#ddd_1px,transparent_0)] bg-[size:10px_10px]"
                  />
                  {dimensions && (
                    <div className="mt-3 font-mono text-xs font-black bg-white border-2 border-black px-2 py-1 uppercase">
                      DIMENSIONS: {dimensions.width} × {dimensions.height} PX · SIZE: {(blob.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              )}

              {/* PDF PREVIEW */}
              {format === 'pdf' && (
                <div className="flex flex-col items-center max-w-full">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 border-2 border-black bg-white p-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={pdfPage <= 1}
                      className="border-2 border-black px-2 py-1 font-mono text-xs font-black disabled:opacity-50 cursor-pointer"
                    >
                      ← PREV
                    </button>
                    <span className="font-mono text-xs font-black px-2">
                      PAGE {pdfPage} OF {pdfTotalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={pdfPage >= pdfTotalPages}
                      className="border-2 border-black px-2 py-1 font-mono text-xs font-black disabled:opacity-50 cursor-pointer"
                    >
                      NEXT →
                    </button>
                    <div className="w-px h-4 bg-black mx-1" />
                    <button
                      onClick={() => setPdfZoom(z => Math.max(0.5, z - 0.2))}
                      className="border-2 border-black px-2 py-0.5 font-mono text-xs font-black cursor-pointer"
                    >
                      ZOOM -
                    </button>
                    <span className="font-mono text-xs font-black">
                      {Math.round(pdfZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setPdfZoom(z => Math.min(2.0, z + 0.2))}
                      className="border-2 border-black px-2 py-0.5 font-mono text-xs font-black cursor-pointer"
                    >
                      ZOOM +
                    </button>
                  </div>
                  {/* Page Canvas Container */}
                  <div className="border-4 border-black max-w-full overflow-auto bg-white p-2">
                    <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
                  </div>
                </div>
              )}

              {/* MARKDOWN PREVIEW */}
              {format === 'md' && (
                <div className="w-full flex flex-col">
                  <div className="flex justify-end gap-2 mb-4">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase cursor-pointer ${
                        viewMode === 'preview' ? 'bg-black text-white' : 'bg-white'
                      }`}
                    >
                      PREVIEW
                    </button>
                    <button
                      onClick={() => setViewMode('source')}
                      className={`border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase cursor-pointer ${
                        viewMode === 'source' ? 'bg-black text-white' : 'bg-white'
                      }`}
                    >
                      SOURCE
                    </button>
                  </div>
                  
                  {viewMode === 'preview' ? (
                    <div
                      className="w-full border-4 border-black bg-white p-6 max-h-[50vh] overflow-y-auto text-left prose prose-neutral max-w-none font-sans"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  ) : (
                    <pre className="w-full border-4 border-black bg-white p-4 font-mono text-xs text-left max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                      {textContent}
                    </pre>
                  )}
                </div>
              )}

              {/* HTML PREVIEW */}
              {format === 'html' && (
                <div className="w-full flex flex-col">
                  <div className="flex justify-end gap-2 mb-4">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase cursor-pointer ${
                        viewMode === 'preview' ? 'bg-black text-white' : 'bg-white'
                      }`}
                    >
                      RENDER
                    </button>
                    <button
                      onClick={() => setViewMode('source')}
                      className={`border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase cursor-pointer ${
                        viewMode === 'source' ? 'bg-black text-white' : 'bg-white'
                      }`}
                    >
                      SOURCE
                    </button>
                  </div>

                  {viewMode === 'preview' ? (
                    <div className="w-full border-4 border-black bg-white max-h-[50vh] overflow-hidden">
                      <iframe
                        sandbox="allow-same-origin"
                        srcDoc={htmlContent}
                        title="HTML Sandbox Preview"
                        className="w-full h-96 border-none"
                      />
                    </div>
                  ) : (
                    <pre className="w-full border-4 border-black bg-white p-4 font-mono text-xs text-left max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                      {textContent}
                    </pre>
                  )}
                </div>
              )}

              {/* CSV PREVIEW */}
              {format === 'csv' && (
                <div className="w-full flex flex-col">
                  <div className="font-mono text-xs font-black bg-white border-2 border-black border-bottom-0 p-2 uppercase flex items-center justify-between">
                    <span>ROWS: {csvData.rows.length} · COLS: {csvData.headers.length}</span>
                  </div>
                  <div className="w-full border-4 border-black bg-white overflow-auto max-h-[50vh]">
                    <table className="w-full border-collapse font-mono text-xs text-left">
                      <thead>
                        <tr className="bg-neutral-100 border-b-2 border-black">
                          {csvData.headers.map((h, i) => (
                            <th key={i} className="border-r border-black p-2 font-black uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 100).map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-neutral-300 hover:bg-neutral-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border-r border-neutral-300 p-2">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.rows.length > 100 && (
                      <div className="p-2 text-center bg-neutral-50 border-t border-black text-neutral-400">
                        [Showing first 100 rows only]
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TEXT, DOCX, JSON PREVIEWS */}
              {['txt', 'json', 'docx'].includes(format) && (
                <div className="w-full flex flex-col">
                  {format === 'docx' && (
                    <div className="font-mono text-xs font-black bg-white border-2 border-black border-b-0 p-2 uppercase">
                      EXTRACTED WORD DOCUMENT TEXT
                    </div>
                  )}
                  <pre className="w-full border-4 border-black bg-white p-4 font-mono text-xs text-left max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                    {textContent || '[Empty File]'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
