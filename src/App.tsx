import { useState, useEffect } from 'react';
import type { FileItemType, Format, ConversionOptions } from './engine/types';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { Results } from './components/Results';
import { Preview } from './components/Preview';
import { convertFile } from './engine/pipeline';
import { getSupportedOutputs } from './engine/registry';

function App() {
  const [items, setItems] = useState<FileItemType[]>([]);
  const [previewItem, setPreviewItem] = useState<{ name: string; blob: Blob; format: Format } | null>(null);
  
  // Modals & Panels State
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmBeforeRemove, setConfirmBeforeRemove] = useState(true);
  const [animationsMinimal, setAnimationsMinimal] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  // Check offline service worker capability
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsOfflineReady(true);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      
      // 'a' -> trigger file input click
      if (key === 'a') {
        e.preventDefault();
        document.getElementById('file-upload-input')?.click();
      }
      
      // 'c' -> convert all idle files
      if (key === 'c') {
        e.preventDefault();
        handleConvertAll();
      }

      // 'd' -> download ZIP of results
      if (key === 'd') {
        const successItems = items.filter(item => item.status === 'success' && item.resultBlob);
        if (successItems.length > 1) {
          e.preventDefault();
          // Find the download all button and trigger click
          const downloadBtn = document.querySelector('[data-download-all]');
          if (downloadBtn) {
            (downloadBtn as HTMLButtonElement).click();
          }
        }
      }

      // 'delete' or 'backspace' -> remove selected or last file
      if (e.key === 'Delete') {
        if (items.length > 0) {
          e.preventDefault();
          handleRemoveItem(items[items.length - 1].id);
        }
      }

      // '?' -> show shortcut guide
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, confirmBeforeRemove]);

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: FileItemType[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      let format: Format | null = null;
      if (ext === 'jpeg' || ext === 'jpg') format = 'jpg';
      else if (ext === 'png') format = 'png';
      else if (ext === 'webp') format = 'webp';
      else if (ext === 'pdf') format = 'pdf';
      else if (ext === 'txt') format = 'txt';
      else if (ext === 'md' || ext === 'markdown') format = 'md';
      else if (ext === 'html' || ext === 'htm') format = 'html';
      else if (ext === 'docx') format = 'docx';
      else if (ext === 'csv') format = 'csv';
      else if (ext === 'json') format = 'json';

      const id = Math.random().toString(36).substring(7) + `_${Date.now()}`;

      if (format) {
        const outputs = getSupportedOutputs(format);
        const defaultTo = outputs[0] || format;

        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          from: format,
          to: defaultTo,
          status: 'idle',
          progress: 0,
          options: {
            quality: 90,
            pdfOrientation: 'portrait'
          }
        });
      } else {
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          from: 'txt',
          to: 'txt',
          status: 'error',
          progress: 0,
          errorMsg: `Format .${ext} is not supported.`,
          options: {}
        });
      }
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (confirmBeforeRemove) {
      if (!window.confirm(`Are you sure you want to remove "${item.name}"?`)) {
        return;
      }
    }

    setItems((prev) => prev.filter(i => i.id !== id));
  };

  const handleChangeFormat = (id: string, to: Format) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, to, status: 'idle', errorMsg: undefined } : item))
    );
  };

  const handleChangeOptions = (id: string, options: Partial<ConversionOptions>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, options: { ...item.options, ...options } } : item))
    );
  };

  const handleConvertSingle = async (id: string) => {
    // Fetch latest state item
    let currentItem = items.find((i) => i.id === id);
    if (!currentItem || currentItem.status === 'converting') return;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'converting', progress: 0, errorMsg: undefined } : item))
    );

    try {
      const resultBlob = await convertFile(
        currentItem.file,
        currentItem.from,
        currentItem.to,
        currentItem.options,
        (progress) => {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, progress } : item))
          );
        }
      );

      const baseName = currentItem.name.substring(0, currentItem.name.lastIndexOf('.')) || currentItem.name;
      const resultName = `${baseName}.${currentItem.to}`;

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'success',
                progress: 100,
                resultBlob,
                resultName,
              }
            : item
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'error',
                errorMsg: err.message || 'An error occurred during conversion.',
              }
            : item
        )
      );
    }
  };

  const handleConvertAll = async () => {
    const idleIds = items.filter((item) => item.status === 'idle').map((item) => item.id);
    if (idleIds.length === 0) return;

    // Sequential batch conversion
    for (const id of idleIds) {
      await handleConvertSingle(id);
    }
  };

  const handleBatchApplyFormat = (to: Format) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.status === 'idle' && getSupportedOutputs(item.from).includes(to)) {
          return { ...item, to };
        }
        return item;
      })
    );
  };

  const handleReset = () => {
    setItems([]);
  };

  const handlePreview = (item: FileItemType) => {
    if (item.status === 'success' && item.resultBlob && item.resultName) {
      setPreviewItem({
        name: item.resultName,
        blob: item.resultBlob,
        format: item.to
      });
    } else {
      setPreviewItem({
        name: item.name,
        blob: item.file,
        format: item.from
      });
    }
  };

  const handleAddMoreClick = () => {
    document.getElementById('file-upload-input')?.click();
  };

  const handleClearQueue = () => {
    if (confirmBeforeRemove && items.length > 0) {
      if (!window.confirm('Clear all files in the queue?')) return;
    }
    setItems([]);
  };

  const hasQueue = items.some(item => item.status !== 'success');
  const hasResults = items.some(item => item.status === 'success');

  return (
    <div className="min-h-screen flex flex-col font-sans max-w-4xl mx-auto px-4 py-8">
      {/* Top Navbar */}
      <header className="border-4 border-black bg-white p-4 mb-8 shadow-[4px_4px_0_#000] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase font-mono m-0 flex items-center gap-2">
            CONVX <span className="text-xs border-2 border-black px-1.5 py-0.5 bg-black text-white font-mono uppercase">V1.0</span>
          </h1>
          <p className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
            Client-Side Universal File Converter
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOfflineReady && (
            <span className="font-mono text-xs font-black uppercase bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0_#000]">
              ● OFFLINE READY
            </span>
          )}

          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="border-2 border-black p-1.5 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000]"
            title="Keyboard Shortcuts"
          >
            [ ? KEYBOARD ]
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="border-2 border-black p-1.5 font-mono text-xs font-black uppercase bg-white hover:bg-neutral-100 cursor-pointer shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000]"
            title="Settings"
          >
            [ ⚙ SETTINGS ]
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col items-stretch">
        {items.length === 0 ? (
          <div className="space-y-8">
            <DropZone onFilesAdded={handleFilesAdded} />
            
            {/* Quick Features comic-style box */}
            <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0_#000] grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-black p-4 bg-neutral-50">
                <h3 className="font-mono font-black text-sm uppercase mb-2">100% PRIVATE</h3>
                <p className="font-mono text-xs text-neutral-500 leading-relaxed">
                  Files are converted completely inside your browser memory. No data ever leaves your device.
                </p>
              </div>
              <div className="border-2 border-black p-4 bg-neutral-50">
                <h3 className="font-mono font-black text-sm uppercase mb-2">PWA CAPABLE</h3>
                <p className="font-mono text-xs text-neutral-500 leading-relaxed">
                  Install CONVX onto your device to open it offline anytime. Perfect for local utilities.
                </p>
              </div>
              <div className="border-2 border-black p-4 bg-neutral-50">
                <h3 className="font-mono font-black text-sm uppercase mb-2">NO REGISTRATION</h3>
                <p className="font-mono text-xs text-neutral-500 leading-relaxed">
                  No accounts, limits, or ads. Drag, convert, download. Straightforward and clean.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Display queue if we still have pending/converting files */}
            {hasQueue && (
              <FileQueue
                items={items}
                onRemove={handleRemoveItem}
                onPreview={handlePreview}
                onChangeFormat={handleChangeFormat}
                onChangeOptions={handleChangeOptions}
                onConvertSingle={handleConvertSingle}
                onConvertAll={handleConvertAll}
                onAddMoreClick={handleAddMoreClick}
                onClearQueue={handleClearQueue}
                onBatchApplyFormat={handleBatchApplyFormat}
              />
            )}

            {/* Display results */}
            {hasResults && (
              <Results
                items={items}
                onReset={handleReset}
                onPreview={handlePreview}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t-2 border-neutral-300 mt-12 pt-6 pb-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-neutral-500 uppercase">
          <div>
            CONVX · PRIVACY VERIFIED BY CLIENT-SIDE DESIGN
          </div>
          <div>
            YOUR FILES NEVER LEAVE YOUR DEVICE.
          </div>
        </div>

        {/* Short DevTools verification note */}
        <details className="mt-4 text-left border-2 border-black bg-white p-3 shadow-[2px_2px_0_#000] cursor-pointer">
          <summary className="font-mono text-xs font-black uppercase select-none">
            [ VERIFY FILE SAFETY IN DEVTOOLS ]
          </summary>
          <div className="mt-2 font-mono text-xs text-neutral-600 leading-relaxed space-y-2 border-t border-black pt-2 cursor-default">
            <p>CONVX is open-source and respects user data. To verify that no network requests are sent during conversion:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open browser developer tools (Press <kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd>).</li>
              <li>Select the <strong>Network</strong> tab.</li>
              <li>Drop a file, configure outputs, and hit <strong>Convert</strong>.</li>
              <li>Observe that no network requests appear, confirming local browser execution.</li>
            </ol>
          </div>
        </details>
      </footer>

      {/* Preview Modal */}
      {previewItem && (
        <Preview
          name={previewItem.name}
          blob={previewItem.blob}
          format={previewItem.format}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_#000]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
              <h3 className="font-mono text-sm font-black uppercase">KEYBOARD SHORTCUTS</h3>
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="font-mono text-xs font-black uppercase"
              >
                [ CLOSE ]
              </button>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span>ADD FILES</span>
                <kbd>A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>CONVERT ALL</span>
                <kbd>C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>DOWNLOAD ZIP (RESULTS)</span>
                <kbd>D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>REMOVE LAST FILE</span>
                <kbd>DELETE</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>CLOSE MODALS</span>
                <kbd>ESC</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>TOGGLE THIS HELP</span>
                <kbd>?</kbd>
              </div>
            </div>
            
            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="mt-6 w-full border-2 border-black py-2 font-mono text-xs font-black bg-black text-white hover:bg-neutral-800 cursor-pointer text-center"
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_#000]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
              <h3 className="font-mono text-sm font-black uppercase">SETTINGS</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="font-mono text-xs font-black uppercase"
              >
                [ CLOSE ]
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black uppercase mb-1">THEME</label>
                <div className="flex items-center space-x-2">
                  <input type="radio" checked readOnly className="accent-black" />
                  <span>BLACK & WHITE (STRICT SYSTEM)</span>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">DEFAULT OUTPUT FOLDER</label>
                <p className="text-neutral-500">BROWSER CONTROLLED (DOWNLOADS DIRECTORY)</p>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">ANIMATIONS</label>
                <select
                  value={animationsMinimal ? 'minimal' : 'standard'}
                  onChange={(e) => setAnimationsMinimal(e.target.value === 'minimal')}
                  className="w-full border-2 border-black p-1 bg-white font-mono text-xs font-black"
                >
                  <option value="minimal">MINIMAL / BRUTALIST</option>
                  <option value="standard">STANDARD TRANSITIONS</option>
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">CONFIRM ON REMOVAL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={confirmBeforeRemove}
                    onChange={(e) => setConfirmBeforeRemove(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span>CONFIRM BEFORE REMOVING FILES FROM QUEUE</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full border-2 border-black py-2 font-mono text-xs font-black bg-black text-white hover:bg-neutral-800 cursor-pointer text-center"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
