import React, { useEffect, useState, useMemo } from 'react';
import { apiUrl } from '../../api/client';
import { IMAGE_FOLDER_OPTIONS } from './ImageFolders';

export interface ImageAsset {
  folder: string;
  baseName: string;
  previewUrl: string;
}

export interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: { path: string; baseName: string; folder: string }) => void;
  currentValue?: string;
  mode?: 'path' | 'baseName';
  defaultFolder?: string;
  title?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentValue = '',
  mode = 'path',
  defaultFolder = 'All',
  title = 'Vybrat obrázek z knihovny médií',
}) => {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>(defaultFolder);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    fetch(apiUrl('images.php'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.status === 'success' && Array.isArray(data.data)) {
          setAssets(data.data);
        }
      })
      .catch((err) => {
        console.error('Chyba při načítání obrázků:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Klávesa ESC pro zavření
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Seznam všech dostupných složek
  const folders = useMemo(() => {
    const set = new Set(assets.map((a) => a.folder));
    return Array.from(set).sort();
  }, [assets]);

  // Vyhledávání a filtrování
  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchFolder = selectedFolder === 'All' || asset.folder === selectedFolder;
      if (!matchFolder) return false;
      if (!q) return true;
      return (
        asset.baseName.toLowerCase().includes(q) ||
        asset.folder.toLowerCase().includes(q) ||
        asset.previewUrl.toLowerCase().includes(q)
      );
    });
  }, [assets, search, selectedFolder]);

  if (!isOpen) return null;

  const getFolderLabel = (folder: string) => {
    const match = IMAGE_FOLDER_OPTIONS.find((opt) => opt.value === folder);
    return match ? `${match.label} (${folder})` : folder;
  };

  const handleSelectAsset = (asset: ImageAsset) => {
    const selectedValue = mode === 'baseName' ? asset.baseName : asset.previewUrl;
    onSelect({
      path: selectedValue,
      baseName: asset.baseName,
      folder: asset.folder,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HLAVIČKA */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500">
              Vyberte obrázek kliknutím. Cesta se automaticky vyplní do formuláře.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
            title="Zavřít"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* VYHLEDÁVÁNÍ A FILTRY */}
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-6 py-3">
          <div className="relative min-w-[240px] flex-1">
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat podle názvu souboru nebo složky…"
              className="w-full rounded-lg border border-neutral-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-600">Složka:</span>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="All">Všechny složky ({assets.length})</option>
              {folders.map((f) => {
                const count = assets.filter((a) => a.folder === f).length;
                return (
                  <option key={f} value={f}>
                    {getFolderLabel(f)} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* OBSAH / MŘÍŽKA OBRÁZKŮ */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[360px]">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-neutral-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
              <p className="text-sm">Načítám knihovnu obrázků…</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-neutral-400">
              <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Žádné obrázky neodpovídají hledání.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedFolder('All');
                }}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Resetovat filtry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredAssets.map((asset) => {
                const targetValue = mode === 'baseName' ? asset.baseName : asset.previewUrl;
                const isSelected = currentValue && (currentValue === targetValue || currentValue.includes(asset.baseName));

                return (
                  <button
                    type="button"
                    key={`${asset.folder}-${asset.baseName}`}
                    onClick={() => handleSelectAsset(asset)}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition hover:shadow-md cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/20'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    {/* Náhled fotky */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
                      <img
                        src={asset.previewUrl}
                        alt={asset.baseName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.triedFallback && !target.src.includes(':5173')) {
                            target.dataset.triedFallback = 'true';
                            target.src = `http://localhost:5173${asset.previewUrl}`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-xs">
                        {asset.folder}
                      </span>
                      {isSelected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Popisek */}
                    <div className="p-2.5">
                      <div className="text-xs font-semibold text-neutral-800 line-clamp-1" title={asset.baseName}>
                        {asset.baseName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-400 line-clamp-1 font-mono">
                        {asset.previewUrl}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PATIČKA */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-xs text-neutral-500">
          <span>
            Zobrazeno {filteredAssets.length} z {assets.length} obrázků
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
