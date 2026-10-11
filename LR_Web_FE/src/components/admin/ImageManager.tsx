import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api/client';

type Asset = {
  folder: string;
  baseName: string;
  previewUrl: string;
};

export const ImageManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('All');

  const fetchAssets = async () => {
    try {
      const res = await fetch(apiUrl('images.php'));
      const data = await res.json();
      if (data.status === 'success') setAssets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (folder: string, baseName: string) => {
    if (!confirm(`Opravdu smazat všechny varianty obrázku "${baseName}" ve složce "${folder}"?`)) return;

    await fetch(apiUrl('images.php'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, baseName }),
      credentials: 'include'
    });
    fetchAssets();
  };

  const handleRename = async (folder: string, oldBaseName: string) => {
    const newBaseName = prompt('Zadejte nový název (bez diakritiky a mezer):', oldBaseName);
    if (!newBaseName || newBaseName === oldBaseName) return;

    await fetch(apiUrl('images.php'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, oldBaseName, newBaseName }),
      credentials: 'include'
    });
    fetchAssets();
  };

  if (loading) return <div>Načítání obrázků...</div>;

  const folders = Array.from(new Set(assets.map(a => a.folder)));
  const filteredAssets = selectedFolder === 'All' ? assets : assets.filter(a => a.folder === selectedFolder);

  return (
    <section className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Správce mediálních souborů</h2>
        <button onClick={fetchAssets} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">Aktualizovat</button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">Složka:</label>
        <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="text-sm bg-white border rounded px-2 py-1">
          <option value="All">Všechny</option>
          {folders.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredAssets.map(asset => (
          <div key={`${asset.folder}-${asset.baseName}`} className="border rounded p-2 flex flex-col items-center text-center">
            <img 
              src={asset.previewUrl}
              alt={asset.baseName} 
              className="h-24 w-full object-cover rounded bg-gray-100 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
              title={`Kliknutím zkopírujete cestu k obrázku (${asset.previewUrl})`}
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(asset.previewUrl);
                }
              }}
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
            <span className="text-xs text-gray-500 w-full truncate">{asset.folder}</span>
            <span className="font-medium text-sm w-full truncate mb-2">{asset.baseName}</span>
            
            <div className="flex w-full gap-1 mt-auto">
              <button 
                onClick={() => handleRename(asset.folder, asset.baseName)}
                className="flex-1 bg-blue-50 text-blue-600 text-xs py-1 rounded hover:bg-blue-100"
              >
                Přejmenovat
              </button>
              <button 
                onClick={() => handleDelete(asset.folder, asset.baseName)}
                className="flex-1 bg-red-50 text-red-600 text-xs py-1 rounded hover:bg-red-100"
              >
                Smazat
              </button>
            </div>
          </div>
        ))}
        {assets.length === 0 && <p className="col-span-full text-gray-500">Zatím nebyly nahrány žádné obrázky.</p>}
        {assets.length > 0 && filteredAssets.length === 0 && <p className="col-span-full text-gray-500">V této složce nejsou žádné obrázky.</p>}
      </div>
    </section>
  );
};