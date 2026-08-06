import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  CUSTOM_FOLDER_VALUE,
  IMAGE_FOLDER_OPTIONS,
} from './ImageFolders';

type Variant = {
  width: number;
  height: number;
  filename: string;
  url: string;
};

type UploadResponse = {
  status: 'success' | 'error';
  message?: string;
  folder?: string;
  original?: {
    filename: string;
    url: string;
  };
  variants?: Variant[];
};

export const ImageUploadPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // === STAVY KOMPONENTY ===
  const [image, setImage] = useState<File | null>(null);
  
  // Stavy pro složku a název (přesunuto dovnitř!)
  const [folderChoice, setFolderChoice] = useState('home_imgs');
  const [customFolder, setCustomFolder] = useState('');
  const [name, setName] = useState('');
  
  // Stavy pro upload
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResponse | null>(null);

  // Výpočet finální složky
  const folder =
    folderChoice === CUSTOM_FOLDER_VALUE
      ? customFolder.trim()
      : folderChoice;

  const previewUrl = useMemo(() => {
    if (!image) {
      return null;
    }

    return URL.createObjectURL(image);
  }, [image]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;

    setImage(selected);
    setError('');
    setResult(null);

    // Pokud uživatel ještě nezadal jméno, zkusíme ho předvyplnit z názvu souboru
    if (selected && !name) {
      setName(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!folder) {
      setError('Vyber podstránku nebo zadej vlastní složku.');
      return;
    }

    if (!name.trim()) {
      setError('Zadej název assetu.');
      return;
    }

    if (!image) {
      setError('Nejdřív vyber obrázek.');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('folder', folder);
    formData.append('name', name.trim());

    try {
      const response = await fetch('http://localhost:8080/api/upload-image.php', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message ?? 'Nahrávání obrázku selhalo.');
      }

      setResult(data);

            setResult(data);
      
      // VYRESETOVÁNÍ FORMULÁŘE
      setImage(null);
      setName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Volitelně můžeme zprávu o úspěchu po 5 vteřinách schovat
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Při nahrávání došlo k neočekávané chybě.',
      );
    } finally {
      setUploading(false);
    }
  };

  const primaryUrl = result?.variants?.find(
    (variant) => variant.width === 1920,
  )?.url;

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Nahrání obrázku
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Originál se uloží společně s optimalizovanými WebP variantami 1920,
          1280 a 768 px.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label
            htmlFor="upload-image"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Obrázek
          </label>

          <input
            id="upload-image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full cursor-pointer rounded border border-gray-300 bg-white p-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800 disabled:cursor-not-allowed"
          />

          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, GIF nebo WebP; maximálně 12 MB.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="upload-page"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Podstránka / cílová složka
            </label>

            <select
              id="upload-page"
              value={folderChoice}
              onChange={(event) => setFolderChoice(event.target.value)}
              disabled={uploading}
              className="w-full rounded border border-gray-300 bg-white p-2 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            >
              {IMAGE_FOLDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}

              <option value={CUSTOM_FOLDER_VALUE}>Jiná složka…</option>
            </select>

            {folderChoice !== CUSTOM_FOLDER_VALUE && (
              <p className="mt-1 text-xs text-gray-500">
                {
                  IMAGE_FOLDER_OPTIONS.find(
                    (option) => option.value === folderChoice,
                  )?.description
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="upload-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Název assetu
            </label>

            <input
              id="upload-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="např. group nebo akademie"
              disabled={uploading}
              className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            />

            <p className="mt-1 text-xs text-gray-500">
              Nepiš příponu ani `_1`, `_2`, `_3`; systém je vytvoří automaticky.
            </p>
          </div>
        </div>

        {folderChoice === CUSTOM_FOLDER_VALUE && (
          <div>
            <label
              htmlFor="upload-custom-folder"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Vlastní složka v `public/assets/imgs`
            </label>

            <input
              id="upload-custom-folder"
              value={customFolder}
              onChange={(event) => setCustomFolder(event.target.value)}
              placeholder="např. galerie/rok-2026"
              disabled={uploading}
              className="w-full rounded border border-gray-300 p-2 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            />

            <p className="mt-1 text-xs text-gray-500">
              Povoleny jsou podsložky, například `gallery/2026`.
            </p>
          </div>
        )}

        {previewUrl && (
          <div className="overflow-hidden rounded border border-gray-200 bg-gray-50">
            <img
              src={previewUrl}
              alt="Náhled nahrávaného obrázku"
              className="h-56 w-full object-contain"
            />
          </div>
        )}

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {result?.status === 'success' && (
          <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">{result.message}</p>

            {primaryUrl && (
              <div className="mt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-green-700">
                  URL pro použití ve frontendu
                </p>

                <code className="block break-all rounded bg-white/70 p-2 text-xs text-gray-800">
                  {primaryUrl}
                </code>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !image}
          className="rounded bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {uploading ? 'Nahrávám a optimalizuji…' : 'Nahrát obrázek'}
        </button>
      </form>
    </section>
  );
};