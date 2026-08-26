import { useState } from 'react';
import type { FileItemType, Format, ConversionOptions } from '../../engine/types';
import { FileItem } from '../FileItem';
import { getSupportedOutputs } from '../../engine/registry';

interface FileQueueProps {
  items: FileItemType[];
  onRemove: (id: string) => void;
  onPreview: (item: FileItemType) => void;
  onChangeFormat: (id: string, to: Format) => void;
  onChangeOptions: (id: string, options: Partial<ConversionOptions>) => void;
  onConvertSingle: (id: string) => void;
  onConvertAll: () => void;
  onAddMoreClick: () => void;
  onClearQueue: () => void;
  onBatchApplyFormat: (to: Format) => void;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  items,
  onRemove,
  onPreview,
  onChangeFormat,
  onChangeOptions,
  onConvertSingle,
  onConvertAll,
  onAddMoreClick,
  onClearQueue,
  onBatchApplyFormat,
}) => {
  const [batchFormat, setBatchFormat] = useState<Format | ''>('');

  if (items.length === 0) return null;

  // Find all formats that are common to all idle files in the queue
  // If no files are idle, we don't display the batch format option
  const idleItems = items.filter(item => item.status === 'idle');
  
  // To get a common list of output formats:
  let commonOutputs: Format[] = [];
  if (idleItems.length > 0) {
    const firstOutputs = getSupportedOutputs(idleItems[0].from);
    commonOutputs = firstOutputs.filter(outFormat => 
      idleItems.every(item => getSupportedOutputs(item.from).includes(outFormat))
    );
  }

  const handleBatchFormatApply = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value as Format;
    setBatchFormat(format);
    if (format) {
      onBatchApplyFormat(format);
    }
  };

  const isConvertingAny = items.some(item => item.status === 'converting');

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-2 mb-6">
        <h3 className="font-mono text-lg font-black uppercase">
          QUEUE · {items.length.toString().padStart(2, '0')} {items.length === 1 ? 'FILE' : 'FILES'}
        </h3>
        <button
          onClick={onClearQueue}
          disabled={isConvertingAny}
          className="font-mono text-xs font-black uppercase text-neutral-500 hover:text-black border-2 border-transparent hover:border-black px-2 py-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          [ CLEAR ALL ]
        </button>
      </div>

      {/* Queue items */}
      <div className="max-h-[50vh] overflow-y-auto pr-1">
        {items.map((item) => (
          <FileItem
            key={item.id}
            item={item}
            onRemove={onRemove}
            onPreview={onPreview}
            onChangeFormat={onChangeFormat}
            onChangeOptions={onChangeOptions}
            onConvertSingle={onConvertSingle}
          />
        ))}
      </div>

      {/* Queue Footer / Action Panel */}
      <div className="border-4 border-black p-4 md:p-6 bg-white shadow-[4px_4px_0_#000] mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Batch configuration */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={onAddMoreClick}
            className="border-2 border-black px-4 py-2 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer text-center"
          >
            [ + ADD MORE ]
          </button>
          
          {idleItems.length > 1 && commonOutputs.length > 0 && (
            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-black pt-3 sm:pt-0 sm:pl-3">
              <label className="font-mono text-xs font-black uppercase whitespace-nowrap">
                BATCH FORMAT:
              </label>
              <select
                value={batchFormat}
                onChange={handleBatchFormatApply}
                className="border-2 border-black font-mono text-xs font-black bg-white px-2 py-1 uppercase focus:outline-none cursor-pointer"
              >
                <option value="">-- SELECT --</option>
                {commonOutputs.map(fmt => (
                  <option key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Global Convert Trigger */}
        <button
          onClick={onConvertAll}
          disabled={idleItems.length === 0 || isConvertingAny}
          className="border-4 border-black px-6 py-3 font-mono font-black text-sm uppercase bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-400 disabled:cursor-not-allowed cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
        >
          [ CONVERT ALL ]
        </button>
      </div>
    </div>
  );
};
