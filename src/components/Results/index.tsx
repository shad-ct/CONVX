import { useState } from 'react';
import type { FileItemType } from '../../engine/types';
import JSZip from 'jszip';

interface ResultsProps {
  items: FileItemType[];
  onReset: () => void;
  onPreview: (item: FileItemType) => void;
}

export const Results: React.FC<ResultsProps> = ({ items, onReset, onPreview }) => {
  const [zipping, setZipping] = useState(false);

  const successItems = items.filter(item => item.status === 'success' && item.resultBlob);

  const downloadAllAsZip = async () => {
    if (successItems.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      successItems.forEach(item => {
        if (item.resultBlob) {
          zip.file(item.resultName || `converted_${item.name}`, item.resultBlob);
        }
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convx_converted_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip file:', err);
    } finally {
      setZipping(false);
    }
  };

  if (successItems.length === 0) return null;

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-2 mb-6">
        <h3 className="font-mono text-lg font-black uppercase">
          DONE · {successItems.length.toString().padStart(2, '0')} {successItems.length === 1 ? 'RESULT' : 'RESULTS'}
        </h3>
        <button
          onClick={onReset}
          className="font-mono text-xs font-black uppercase text-neutral-500 hover:text-black border-2 border-transparent hover:border-black px-2 py-0.5 cursor-pointer"
        >
          [ NEW CONVERSION ]
        </button>
      </div>

      {/* Results queue */}
      <div className="border-4 border-black bg-white p-4 md:p-6 shadow-[4px_4px_0_#000] mb-6 divide-y-2 divide-black">
        {successItems.map((item) => (
          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="font-mono text-xs text-neutral-400 block mb-1">
                {item.from.toUpperCase()} → {item.to.toUpperCase()}
              </span>
              <h4 className="font-mono text-sm font-black truncate max-w-xs sm:max-w-md md:max-w-lg">
                {item.resultName || `${item.name}.${item.to}`}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPreview(item)}
                className="border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer"
              >
                [ PREVIEW ]
              </button>
              <a
                href={item.resultBlob ? URL.createObjectURL(item.resultBlob) : '#'}
                download={item.resultName || `converted_${item.name}`}
                className="border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase bg-black text-white hover:bg-neutral-800 text-center inline-block cursor-pointer"
                onClick={(e) => {
                  if (!item.resultBlob) {
                    e.preventDefault();
                  } else {
                    const url = e.currentTarget.href;
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  }
                }}
              >
                DOWNLOAD
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Global Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <button
          onClick={onReset}
          className="w-full sm:w-auto border-2 border-black px-6 py-3 font-mono font-black text-sm uppercase bg-white hover:bg-neutral-100 cursor-pointer text-center"
        >
          [ ← CONVERT MORE ]
        </button>

        {successItems.length > 1 && (
          <button
            onClick={downloadAllAsZip}
            disabled={zipping}
            className="w-full sm:w-auto border-4 border-black px-6 py-3 font-mono font-black text-sm uppercase bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
          >
            {zipping ? '[ COMPRESSING... ]' : '[ DOWNLOAD ALL AS ZIP ]'}
          </button>
        )}
      </div>
    </div>
  );
};
