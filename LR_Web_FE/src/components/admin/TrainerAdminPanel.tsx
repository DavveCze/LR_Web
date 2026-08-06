import React, { useEffect, useState } from 'react';
import { TrainerProps } from '../ui/TrainerProfiles';

export const TrainerAdminPanel: React.FC = () => {
    const [trainers, setTrainers] = useState<TrainerProps[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<TrainerProps>>({
        is_active: true, category_lat: false, category_stt: false, display_order: 0
    });

    const fetchTrainers = () => {
        fetch('http://localhost:8080/api/trainers.php')
            .then(res => res.json())
            .then(data => { if (data.status === 'success') setTrainers(data.data); });
    };

    useEffect(() => { fetchTrainers(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = currentItem.id ? 'PUT' : 'POST';
        
        await fetch('http://localhost:8080/api/trainers.php', {
            method, credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentItem)
        });
        
        setIsEditing(false);
        fetchTrainers();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Smazat trenéra?')) return;
        await fetch('http://localhost:8080/api/trainers.php', {
            method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        fetchTrainers();
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Správa trenérů</h2>
                <button 
                    onClick={() => { setIsEditing(true); setCurrentItem({ is_active: true }); }}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
                >+ Přidat trenéra</button>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="p-3">Jméno</th>
                        <th className="p-3">Kategorie (LAT/STT)</th>
                        <th className="p-3">Aktivní</th>
                        <th className="p-3">Akce</th>
                    </tr>
                </thead>
                <tbody>
                    {trainers.map(t => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{t.full_name}</td>
                            <td className="p-3 text-sm">
                                {[t.category_lat ? 'LAT' : '', t.category_stt ? 'STT' : ''].filter(Boolean).join(', ')}
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.is_active ? 'Ano' : 'Ne'}
                                </span>
                            </td>
                            <td className="p-3 flex gap-2">
                                <button onClick={() => { setIsEditing(true); setCurrentItem(t); }} className="text-blue-600 hover:underline">Upravit</button>
                                <button onClick={() => handleDelete(t.id!)} className="text-red-600 hover:underline">Smazat</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">{currentItem.id ? 'Upravit' : 'Přidat'} trenéra</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1">Jméno a Příjmení</label>
                                    <input type="text" required className="w-full border p-2 rounded" value={currentItem.full_name || ''} onChange={e => setCurrentItem({...currentItem, full_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Název Fotky z Image Manageru</label>
                                    <input type="text" placeholder="např. cep" className="w-full border p-2 rounded" value={currentItem.image_src || ''} onChange={e => setCurrentItem({...currentItem, image_src: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm mb-1">Pozice (Malý text pod jménem, např. 'Trenér')</label>
                                <input type="text" className="w-full border p-2 rounded" value={currentItem.title || ''} onChange={e => setCurrentItem({...currentItem, title: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Plný popis (Pokud je vyplněn, zobrazí se ve velkém rozložení)</label>
                                <textarea rows={3} className="w-full border p-2 rounded" value={currentItem.info || ''} onChange={e => setCurrentItem({...currentItem, info: e.target.value})}></textarea>
                            </div>

                            <div className="flex gap-4 p-2 bg-gray-50 rounded">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={currentItem.category_lat ?? false} onChange={e => setCurrentItem({...currentItem, category_lat: e.target.checked})} /> LAT</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={currentItem.category_stt ?? false} onChange={e => setCurrentItem({...currentItem, category_stt: e.target.checked})} /> STT</label>
                                <label className="flex items-center gap-2 ml-auto text-blue-800"><input type="checkbox" checked={currentItem.is_active ?? true} onChange={e => setCurrentItem({...currentItem, is_active: e.target.checked})} /> Viditelný na webu</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded">Zrušit</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Uložit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};