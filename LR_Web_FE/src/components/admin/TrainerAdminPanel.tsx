import React, { useEffect, useState } from 'react';
import { TrainerProps, resolveTrainerImageUrl } from '../ui/TrainerProfiles';
import { apiUrl } from '../../api/client';
import { convex } from '../../convex';
import { api } from '../../api/client';
import { ImagePickerInput } from './ImagePickerInput';

export const TrainerAdminPanel: React.FC = () => {
    const [trainers, setTrainers] = useState<TrainerProps[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentItem, setCurrentItem] = useState<Partial<TrainerProps>>({
        is_active: true, category_lat: false, category_stt: false, display_order: 0
    });

    const fetchTrainers = () => {
        if (convex) {
            (convex as any).query(api.trainers.listAllTrainers, {})
                .then((items: any) => {
                    if (Array.isArray(items) && items.length > 0) {
                        setTrainers(items.map((t: any) => ({
                            id: t._id || t.id,
                            full_name: t.name || t.full_name,
                            title: t.role || t.title,
                            info: t.bio || t.info,
                            image_src: t.image || t.image_src,
                            category_lat: Boolean(t.category_lat),
                            category_stt: Boolean(t.category_stt),
                            is_active: t.isActive ?? t.is_active ?? true,
                            display_order: t.order ?? t.display_order ?? 0,
                        })));
                        return;
                    }
                })
                .catch(() => {});
        }

        fetch(apiUrl('trainers.php'))
            .then(async (res) => {
                const isJson = (res.headers.get('content-type') || '').includes('application/json');
                if (res.ok && isJson) return await res.json();
                return null;
            })
            .then(data => {
                if (data && data.status === 'success' && Array.isArray(data.data)) {
                    setTrainers(data.data.map((t: any) => ({
                        id: t.id,
                        full_name: t.full_name || t.name,
                        title: t.title || t.role || 'Trenér',
                        info: t.info || t.bio || '',
                        image_src: t.image_src || t.image || '',
                        category_lat: Boolean(t.category_lat),
                        category_stt: Boolean(t.category_stt),
                        is_active: t.is_active !== false,
                        display_order: t.display_order ?? 0,
                    })));
                }
            })
            .catch(() => {});
    };

    useEffect(() => { fetchTrainers(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            if (convex) {
                try {
                    if (currentItem.id && typeof currentItem.id === 'string') {
                        await (convex as any).mutation(api.trainers.updateTrainer, {
                            id: currentItem.id,
                            name: (currentItem.full_name || '').trim(),
                            role: currentItem.title || 'Trenér',
                            bio: currentItem.info || '',
                            image: currentItem.image_src || undefined,
                            category_lat: Boolean(currentItem.category_lat),
                            category_stt: Boolean(currentItem.category_stt),
                            order: currentItem.display_order || 0,
                            isActive: currentItem.is_active !== false,
                        });
                    } else {
                        await (convex as any).mutation(api.trainers.createTrainer, {
                            name: (currentItem.full_name || '').trim(),
                            role: currentItem.title || 'Trenér',
                            bio: currentItem.info || '',
                            image: currentItem.image_src || undefined,
                            category_lat: Boolean(currentItem.category_lat),
                            category_stt: Boolean(currentItem.category_stt),
                            order: currentItem.display_order || 0,
                            isActive: currentItem.is_active !== false,
                        });
                    }
                    setIsEditing(false);
                    fetchTrainers();
                    return;
                } catch (cErr) {
                    console.warn('[Convex] Chyba ukládání trenéra, zkouším REST:', cErr);
                }
            }

            const method = currentItem.id ? 'PUT' : 'POST';
            const res = await fetch(apiUrl('trainers.php'), {
                method, credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentItem)
            });

            const isJson = (res.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await res.json().catch(() => null) : null;

            if (!res.ok) {
                throw new Error(data?.message || `Chyba při ukládání trenéra (HTTP ${res.status}).`);
            }

            setIsEditing(false);
            fetchTrainers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Chyba při ukládání trenéra.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm('Smazat trenéra?')) return;
        setError(null);

        try {
            if (convex && typeof id === 'string') {
                try {
                    await (convex as any).mutation(api.trainers.deleteTrainer, { id });
                    fetchTrainers();
                    return;
                } catch (cErr) {
                    console.warn('[Convex] Chyba mazání trenéra, zkouším REST:', cErr);
                }
            }

            const res = await fetch(apiUrl('trainers.php'), {
                method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const isJson = (res.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await res.json().catch(() => null) : null;

            if (!res.ok) {
                throw new Error(data?.message || `Chyba při mazání trenéra (HTTP ${res.status}).`);
            }

            fetchTrainers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Chyba při mazání.');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Správa trenérů</h2>
                <button 
                    onClick={() => { setError(null); setIsEditing(true); setCurrentItem({ is_active: true, category_lat: false, category_stt: false, display_order: 0 }); }}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
                >+ Přidat trenéra</button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="p-3 w-16">Foto</th>
                        <th className="p-3">Jméno</th>
                        <th className="p-3">Kategorie (LAT/STT)</th>
                        <th className="p-3">Aktivní</th>
                        <th className="p-3">Akce</th>
                    </tr>
                </thead>
                <tbody>
                    {trainers.map(t => (
                        <tr key={String(t.id)} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                                <img
                                    src={resolveTrainerImageUrl(t.image_src)}
                                    alt={t.full_name}
                                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 bg-neutral-100"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.dataset.triedFallback) {
                                            target.dataset.triedFallback = 'true';
                                            target.src = '/assets/imgs/dancers/default_dancer.webp';
                                        }
                                    }}
                                />
                            </td>
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
                                <button onClick={() => { setError(null); setIsEditing(true); setCurrentItem(t); }} className="text-blue-600 hover:underline">Upravit</button>
                                <button onClick={() => handleDelete(t.id!)} className="text-red-600 hover:underline">Smazat</button>
                            </td>
                        </tr>
                    ))}
                    {trainers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-500">Zatím žádní trenéři</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4">{currentItem.id ? 'Upravit' : 'Přidat'} trenéra</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1 font-medium">Jméno a Příjmení</label>
                                    <input type="text" required className="w-full border p-2 rounded" value={currentItem.full_name || ''} onChange={e => setCurrentItem({...currentItem, full_name: e.target.value})} />
                                </div>
                                <div>
                                    <ImagePickerInput
                                        label="Fotografie trenéra"
                                        value={currentItem.image_src || ''}
                                        onChange={(newImage) => setCurrentItem({ ...currentItem, image_src: newImage })}
                                        defaultFolder="treneri"
                                        placeholder="Vyberte nebo zadejte název souboru..."
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1 font-medium">Titul / Role</label>
                                    <input type="text" className="w-full border p-2 rounded" value={currentItem.title || ''} onChange={e => setCurrentItem({...currentItem, title: e.target.value})} placeholder="např. Trenér, Webmaster..." />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 font-medium">Pořadí zobrazení</label>
                                    <input type="number" className="w-full border p-2 rounded" value={currentItem.display_order ?? 0} onChange={e => setCurrentItem({...currentItem, display_order: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-1 font-medium">Informace / Bio</label>
                                <textarea rows={4} className="w-full border p-2 rounded" value={currentItem.info || ''} onChange={e => setCurrentItem({...currentItem, info: e.target.value})} placeholder="Krátký popis nebo profil trenéra..."></textarea>
                            </div>

                            <div className="flex gap-6 py-2">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input type="checkbox" checked={currentItem.category_lat || false} onChange={e => setCurrentItem({...currentItem, category_lat: e.target.checked})} />
                                    Latina (LAT)
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input type="checkbox" checked={currentItem.category_stt || false} onChange={e => setCurrentItem({...currentItem, category_stt: e.target.checked})} />
                                    Standard (STT)
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input type="checkbox" checked={currentItem.is_active ?? true} onChange={e => setCurrentItem({...currentItem, is_active: e.target.checked})} />
                                    Aktivní trenér
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" disabled={saving} onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Zrušit</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400">
                                    {saving ? 'Ukládám…' : 'Uložit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
