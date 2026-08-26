import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: FileList | File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`border-4 border-black p-8 md:p-12 text-center bg-white shadow-[4px_4px_0_#000] transition-transform duration-100 ${
        isDragActive ? 'translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_#000]' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload-input"
        aria-label="Upload files"
      />
      
      <div className="font-mono text-xs uppercase tracking-wider mb-8 text-neutral-500">
        CONVX // LOCAL_CONVERTER.EXE
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="border-2 border-black border-dashed p-6 w-full max-w-md bg-neutral-50">
          <div className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
            DROP FILES HERE
          </div>
          <div className="text-xs font-mono text-neutral-400">
            [SUPPORTED: PDF, DOCX, TXT, MD, HTML, PNG, JPG, WEBP, CSV, JSON]
          </div>
        </div>

        <div className="font-mono text-sm font-bold text-neutral-600">OR</div>

        <button
          onClick={onButtonClick}
          className="border-2 border-black px-6 py-3 font-mono font-black text-sm uppercase bg-white hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0_0_0_#000] shadow-[2px_2px_0_#000] cursor-pointer transition-all"
        >
          [ ADD FILES ]
        </button>

        <div className="border-t border-black w-full max-w-xs pt-4 mt-4">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            ⌁ YOUR FILES NEVER LEAVE YOUR DEVICE
          </p>
        </div>
      </div>
    </div>
  );
};
