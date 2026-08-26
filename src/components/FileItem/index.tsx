import { useState } from 'react';
import type { FileItemType, Format, ConversionOptions } from '../../engine/types';
import { FormatSelector } from '../FormatSelector';

interface FileItemProps {
  item: FileItemType;
  onRemove: (id: string) => void;
  onPreview: (item: FileItemType) => void;
  onChangeFormat: (id: string, to: Format) => void;
  onChangeOptions: (id: string, options: Partial<ConversionOptions>) => void;
  onConvertSingle: (id: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  item,
  onRemove,
  onPreview,
  onChangeFormat,
  onChangeOptions,
  onConvertSingle,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  // Helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = ['png', 'jpg', 'webp'].includes(item.from);
  const isImageToPdf = isImage && item.to === 'pdf';

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onChangeOptions(item.id, { width: isNaN(val) ? undefined : val });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onChangeOptions(item.id, { height: isNaN(val) ? undefined : val });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeOptions(item.id, { quality: parseInt(e.target.value) });
  };

  const handleOrientationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeOptions(item.id, { pdfOrientation: e.target.value as 'portrait' | 'landscape' });
  };

  return (
    <div className="border-4 border-black bg-white mb-6 p-4 md:p-6 shadow-[4px_4px_0_#000] relative">
      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 border-2 border-black w-6 h-6 flex items-center justify-center font-mono font-black text-xs uppercase bg-white hover:bg-black hover:text-white cursor-pointer transition-all"
        title="Remove file"
      >
        ×
      </button>

      {/* Main File Details Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Name and Meta */}
        <div className="flex items-start space-x-3">
          <div className="border-2 border-black px-2 py-1 bg-black text-white font-mono text-xs font-black uppercase">
            {item.from}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-mono text-sm font-black truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={item.name}>
              {item.name}
            </h4>
            <p className="font-mono text-xs text-neutral-500">{formatSize(item.size)}</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {item.status === 'idle' && (
            <>
              <FormatSelector
                from={item.from}
                value={item.to}
                onChange={(to) => onChangeFormat(item.id, to)}
              />
              
              {(isImage || isImageToPdf) && (
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className={`border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                    showOptions ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'
                  }`}
                >
                  [ OPTIONS {showOptions ? '▲' : '▼'} ]
                </button>
              )}

              <button
                onClick={() => onPreview(item)}
                className="border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer"
              >
                [ PREVIEW ]
              </button>

              <button
                onClick={() => onConvertSingle(item.id)}
                className="border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase bg-black text-white hover:bg-neutral-800 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              >
                CONVERT
              </button>
            </>
          )}

          {item.status === 'converting' && (
            <div className="flex items-center space-x-2">
              <div className="font-mono text-xs font-black animate-pulse">
                CONVERTING... ({item.progress}%)
              </div>
              <div className="w-20 md:w-32 border-2 border-black h-4 bg-neutral-200 overflow-hidden relative">
                <div
                  className="bg-black h-full transition-all duration-150"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {item.status === 'success' && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase bg-neutral-100 border-2 border-neutral-300 px-2 py-0.5 text-neutral-600">
                DONE
              </span>
              <button
                onClick={() => onPreview(item)}
                className="border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer"
              >
                [ PREVIEW ]
              </button>
              <a
                href={item.resultBlob ? URL.createObjectURL(item.resultBlob) : '#'}
                download={item.resultName || 'converted_file'}
                className="border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase bg-black text-white hover:bg-neutral-800 text-center inline-block cursor-pointer"
                onClick={(e) => {
                  if (!item.resultBlob) {
                    e.preventDefault();
                  } else {
                    // Revoke URL after timeout
                    const url = e.currentTarget.href;
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  }
                }}
              >
                DOWNLOAD
              </a>
            </div>
          )}

          {item.status === 'error' && (
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-mono text-xs font-black uppercase border-2 border-black bg-neutral-200 px-2 py-0.5" title={item.errorMsg}>
                FAILED
              </span>
              <button
                onClick={() => onConvertSingle(item.id)}
                className="border-2 border-black px-2 py-1 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer"
              >
                RETRY
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Options Drawer */}
      {showOptions && item.status === 'idle' && (
        <div className="mt-4 pt-4 border-t-2 border-dashed border-neutral-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-neutral-50 p-4 border-2 border-black">
          {isImage && (
            <>
              <div>
                <label className="block font-mono text-xs font-black uppercase mb-1">
                  Quality ({item.options.quality ?? 90}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={item.options.quality ?? 90}
                  onChange={handleQualityChange}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-black uppercase mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  placeholder="Original"
                  value={item.options.width ?? ''}
                  onChange={handleWidthChange}
                  className="w-full border-2 border-black px-2 py-1 font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-black uppercase mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  placeholder="Original"
                  value={item.options.height ?? ''}
                  onChange={handleHeightChange}
                  className="w-full border-2 border-black px-2 py-1 font-mono text-xs focus:outline-none"
                />
              </div>
            </>
          )}

          {isImageToPdf && (
            <div>
              <label className="block font-mono text-xs font-black uppercase mb-1">
                PDF Page Orientation
              </label>
              <select
                value={item.options.pdfOrientation ?? 'portrait'}
                onChange={handleOrientationChange}
                className="w-full border-2 border-black px-2 py-1 font-mono text-xs bg-white focus:outline-none cursor-pointer"
              >
                <option value="portrait">PORTRAIT</option>
                <option value="landscape">LANDSCAPE</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Error Message Display */}
      {item.status === 'error' && item.errorMsg && (
        <div className="mt-2 text-xs font-mono text-neutral-500 bg-neutral-100 p-2 border border-black border-dashed">
          ERROR: {item.errorMsg}
        </div>
      )}
    </div>
  );
};
