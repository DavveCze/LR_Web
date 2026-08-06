import React, { useEffect, useState } from 'react';
import { RegistrationItem } from '../ui/RegistrationCategory';

type AdminRegistrationItem = RegistrationItem & {
    category: string;
};

const DEFAULT_CATEGORY = 'Mateřské školy';

export const RegistrationManager: React.FC = () => {
    const [items, setItems] = useState<AdminRegistrationItem[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentItem, setCurrentItem] = useState<Partial<AdminRegistrationItem>>({
        isActive: true,
        category: DEFAULT_CATEGORY,
    });

    const fetchRegistrations = () => {
        fetch('http://localhost:8080/api/prihlasky.php')
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'success') {
                    const flatItems: AdminRegistrationItem[] = [];

                    data.data.forEach((cat: { headline: string; components: RegistrationItem[] }) => {
                        cat.components.forEach((comp) => {
                            flatItems.push({ ...comp, category: cat.headline });
                        });
                    });

                    setItems(flatItems);
                }
            });
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const method = currentItem.id ? 'PUT' : 'POST';

        const res = await fetch('http://localhost:8080/api/prihlasky.php', {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentItem),
        });

        if (res.ok) {
            setIsEditing(false);
            setCurrentItem({ isActive: true, category: DEFAULT_CATEGORY });
            fetchRegistrations();
        } else {
            alert('Chyba při ukládání');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu smazat tuto přihlášku?')) return;

        const res = await fetch('http://localhost:8080/api/prihlasky.php', {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });

        if (res.ok) fetchRegistrations();
    };

    return (
        <div>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold">Správa přihlášek</h2>
                    <button
                        onClick={() => {
                            setIsEditing(true);
                            setCurrentItem({ isActive: true, category: DEFAULT_CATEGORY });
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
                    >
                        + Přidat novou
                    </button>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3">Kategorie</th>
                            <th className="p-3">Název (Headline)</th>
                            <th className="p-3">Cena</th>
                            <th className="p-3">Aktivní</th>
                            <th className="p-3">Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{item.category}</td>
                                <td className="p-3">{item.headline}</td>
                                <td className="p-3">{item.cost}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    >
                                        {item.isActive ? 'Ano' : 'Ne'}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setCurrentItem(item);
                                        }}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Upravit
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">
                                        Smazat
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Zatím žádné přihlášky
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">{currentItem.id ? 'Upravit' : 'Přidat'} přihlášku</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Kategorie (pod kterou se kurz zobrazuje)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={currentItem.category || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                                    placeholder="např. Školky a školy"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Název kurzu (Podnadpis)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={currentItem.headline || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, headline: e.target.value })}
                                    placeholder="např. Příměstský tábor - srpen"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Popis / Obsah</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows={3}
                                    value={currentItem.content || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cena</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={currentItem.cost || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, cost: e.target.value })}
                                        placeholder="např. viz přihláška"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Odkaz na formulář (URL)</label>
                                    <input
                                        type="url"
                                        className="w-full border p-2 rounded"
                                        value={currentItem.link || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, link: e.target.value })}
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
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium">
                                    Aktivní (zobrazí se na webu)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Zrušit
                                </button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                                    Uložit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};