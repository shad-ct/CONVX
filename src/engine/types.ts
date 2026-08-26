export type Format = 
  | 'pdf' 
  | 'txt' 
  | 'md' 
  | 'html' 
  | 'docx' 
  | 'png' 
  | 'jpg' 
  | 'webp' 
  | 'csv' 
  | 'json';

export interface ConversionOptions {
  quality?: number; // 1-100 or 0-1
  width?: number;
  height?: number;
  pdfOrientation?: 'portrait' | 'landscape';
}

export interface FileItemType {
  id: string;
  file: File;
  name: string;
  size: number;
  from: Format;
  to: Format;
  status: 'idle' | 'converting' | 'success' | 'error';
  progress: number;
  errorMsg?: string;
  resultBlob?: Blob;
  resultName?: string;
  options: ConversionOptions;
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
}
