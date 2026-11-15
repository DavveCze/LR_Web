import React, { useEffect, useState } from 'react';
import { RegistrationItem } from '../ui/RegistrationCategory';
import {
    getRegistrationsList,
    saveRegistrationItem,
    deleteRegistrationItem,
    AdminRegistrationPayload
} from '../../api/client';

export type AdminRegistrationItem = Omit<RegistrationItem, 'id'> & {
    id: number | string;
    category: string;
};

const DEFAULT_CATEGORY = 'Mateřské školy';

export const RegistrationManager: React.FC = () => {
    const [items, setItems] = useState<AdminRegistrationItem[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentItem, setCurrentItem] = useState<Partial<AdminRegistrationItem>>({
        isActive: true,
        category: DEFAULT_CATEGORY,
    });

    const fetchRegistrations = async () => {
        try {
            const raw = await getRegistrationsList<any>();
            if (Array.isArray(raw) && raw.length > 0) {
                const flatItems: AdminRegistrationItem[] = [];

                // Podpora jak formátu ze serveru s seskupenými kategoriemi, tak plochého z Convexu
                raw.forEach((entry: any) => {
                    // 1. Seskupený formát { headline: string, components: [...] }
                    if (entry.headline && Array.isArray(entry.components)) {
                        entry.components.forEach((comp: any) => {
                            flatItems.push({
                                id: comp.id,
                                category: entry.headline,
                                headline: comp.headline,
                                content: comp.content,
                                link: comp.link,
                                cost: comp.cost,
                                isActive: comp.isActive !== false,
                            });
                        });
                    } 
                    // 2. Plochý formát (Convex / REST flat)
                    else {
                        flatItems.push({
                            id: entry._id || entry.id || Math.random().toString(),
                            category: entry.category || 'Ostatní',
                            headline: entry.headline || entry.title || '',
                            content: entry.content || entry.subtitle || '',
                            link: entry.link || entry.url || '',
                            cost: entry.cost || '',
                            isActive: entry.isActive !== false,
                        });
                    }
                });

                setItems(flatItems);
            }
        } catch (err) {
            console.warn('[RegistrationManager] Chyba načtení přihlášek:', err);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const payload: AdminRegistrationPayload = {
                id: currentItem.id,
                category: (currentItem.category || DEFAULT_CATEGORY).trim(),
                headline: (currentItem.headline || '').trim(),
                content: currentItem.content?.trim() || null,
                link: currentItem.link?.trim() || null,
                cost: currentItem.cost?.trim() || null,
                isActive: currentItem.isActive !== false,
            };

            await saveRegistrationItem(payload);
            setIsEditing(false);
            setCurrentItem({ isActive: true, category: DEFAULT_CATEGORY });
            await fetchRegistrations();
        } catch (err) {
            console.error('[RegistrationManager] Chyba ukládání:', err);
            setError(err instanceof Error ? err.message : 'Chyba při ukládání přihlášky.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm('Opravdu smazat tuto přihlášku?')) return;
        setError(null);

        try {
            await deleteRegistrationItem(id);
            await fetchRegistrations();
        } catch (err) {
            console.error('[RegistrationManager] Chyba mazání:', err);
            alert(err instanceof Error ? err.message : 'Chyba při mazání.');
        }
    };

    return (
        <div>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Správa přihlášek</h2>
                    <button
                        onClick={() => {
                            setError(null);
                            setIsEditing(true);
                            setCurrentItem({ isActive: true, category: DEFAULT_CATEGORY });
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
                    >
                        + Přidat novou
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b text-neutral-600 text-sm">
                            <th className="p-3">Kategorie</th>
                            <th className="p-3">Název (Headline)</th>
                            <th className="p-3">Cena</th>
                            <th className="p-3">Aktivní</th>
                            <th className="p-3 text-right">Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={String(item.id)} className="border-b hover:bg-gray-50 text-sm">
                                <td className="p-3 font-medium text-neutral-800">{item.category}</td>
                                <td className="p-3 text-neutral-900">{item.headline}</td>
                                <td className="p-3 text-neutral-600">{item.cost || '—'}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    >
                                        {item.isActive ? 'Ano' : 'Ne'}
                                    </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <button
                                        onClick={() => {
                                            setError(null);
                                            setIsEditing(true);
                                            setCurrentItem(item);
                                        }}
                                        className="text-blue-600 hover:underline mr-3 font-medium"
                                    >
                                        Upravit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:underline font-medium"
                                    >
                                        Smazat
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-500">
                                    Zatím žádné přihlášky
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-neutral-900">
                            {currentItem.id ? 'Upravit' : 'Přidat'} přihlášku
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-neutral-700">
                                    Kategorie (pod kterou se kurz zobrazuje)
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-neutral-300 p-2 rounded"
                                    value={currentItem.category || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                                    placeholder="např. Školky a školy"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-neutral-700">
                                    Název kurzu (Podnadpis)
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-neutral-300 p-2 rounded"
                                    value={currentItem.headline || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, headline: e.target.value })}
                                    placeholder="např. Příměstský tábor - srpen"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-neutral-700">
                                    Popis / Obsah
                                </label>
                                <textarea
                                    className="w-full border border-neutral-300 p-2 rounded"
                                    rows={3}
                                    value={currentItem.content || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-neutral-700">Cena</label>
                                    <input
                                        type="text"
                                        className="w-full border border-neutral-300 p-2 rounded"
                                        value={currentItem.cost || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, cost: e.target.value })}
                                        placeholder="např. viz přihláška"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-neutral-700">Odkaz na formulář (URL)</label>
                                    <input
                                        type="url"
                                        className="w-full border border-neutral-300 p-2 rounded"
                                        value={currentItem.link || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, link: e.target.value })}
                                        placeholder="https://is.pohodlne.info/..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={currentItem.isActive ?? false}
                                    onChange={(e) =>
                                        setCurrentItem((previous) => ({
                                            ...previous,
                                            isActive: e.target.checked,
                                        }))
                                    }
                                    className="w-4 h-4 rounded text-black focus:ring-black"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-neutral-800">
                                    Aktivní (zobrazí se na webu)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-neutral-300 rounded hover:bg-gray-50 text-neutral-700 font-medium"
                                >
                                    Zrušit
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-black text-white rounded hover:bg-neutral-800 disabled:bg-neutral-400 font-medium"
                                >
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
