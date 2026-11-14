import React, { useState } from 'react';
import { ImagePickerModal } from './ImagePickerModal';

export interface ImagePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  mode?: 'path' | 'baseName';
  defaultFolder?: string;
  className?: string;
  required?: boolean;
}

export const ImagePickerInput: React.FC<ImagePickerInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '/assets/imgs/...',
  mode = 'path',
  defaultFolder = 'All',
  className = '',
  required = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Získání URL pro náhled fotky (podporuje jak plnou cestu, tak baseName)
  const previewSrc = React.useMemo(() => {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
      return value;
    }
    // Pokud je zadán baseName (např. u trenérů), zkusíme náhled v treneri složce
    return `/assets/imgs/treneri/${value}_1.webp`;
  }, [value]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-blue-500 focus:outline-hidden"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-2 text-xs text-neutral-400 hover:text-neutral-700"
              title="Vymazat"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Vybrat z knihovny
        </button>
      </div>

      {/* Živý vizuální náhled vybrané fotky */}
      {previewSrc && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-2 mt-1">
          <img
            src={previewSrc}
            alt="Náhled"
            className="h-12 w-16 rounded object-contain bg-white border border-neutral-200"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedFallback && !target.src.includes(':5173')) {
                target.dataset.triedFallback = 'true';
                target.src = `http://localhost:5173${value}`;
              } else {
                target.style.display = 'none';
              }
            }}
          />
          <div className="text-[11px] text-neutral-600 truncate flex-1 font-mono">
            {value}
          </div>
        </div>
      )}

      {/* Modální okno s vyhledávačem */}
      <ImagePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={({ path }) => onChange(path)}
        currentValue={value}
        mode={mode}
        defaultFolder={defaultFolder}
        title={label ? `Vybrat obrázek: ${label}` : undefined}
      />
    </div>
  );
};
