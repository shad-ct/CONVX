import React from 'react';

interface ProgressProps {
  percentage: number;
  message: string;
}

export const Progress: React.FC<ProgressProps> = ({ percentage, message }) => {
  return (
    <div className="border-4 border-black p-4 bg-white shadow-[4px_4px_0_#000] mb-6">
      <div className="flex items-center justify-between font-mono text-xs font-black uppercase mb-2">
        <span>CONVERTING BATCH...</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full border-2 border-black h-6 bg-neutral-100 overflow-hidden relative">
        <div
          className="bg-black h-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {message && (
        <div className="font-mono text-[10px] text-neutral-500 uppercase mt-2 animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};
