import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api/client';
import { ImagePickerInput } from './ImagePickerInput';
import { CzechDatePicker } from '../ui/CzechDatePicker';

export interface NewsArticle {
    id: number;
    headline: string;
    text: string;
    date: string;
    image_url?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export const NewsManager: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [currentArticle, setCurrentArticle] = useState<Partial<NewsArticle>>({
        headline: '',
        text: '',
        date: new Date().toISOString().split('T')[0],
        image_url: '',
    });

    const fetchArticles = async () => {
        try {
            const res = await fetch(apiUrl('news.php'));
            if (!res.ok) throw new Error('Nepodařilo se načíst články');
            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                setArticles(data.data);
            }
        } catch {
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const showStatus = (msg: string) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleCreateNew = () => {
        setCurrentArticle({
            headline: '',
            text: '',
            date: new Date().toISOString().split('T')[0],
            image_url: '',
        });
        setIsEditing(true);
    };

    const handleEdit = (article: NewsArticle) => {
        setCurrentArticle({ ...article });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Opravdu chcete tuto aktualitu / článek smazat?')) return;

        try {
            const res = await fetch(apiUrl('news.php'), {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                showStatus('Aktualita byla úspěšně smazána.');
                fetchArticles();
            } else {
                alert('Chyba při mazání.');
            }
        } catch {
            alert('Chyba spojení.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentArticle.headline?.trim() || !currentArticle.text?.trim()) {
            alert('Vyplňte prosím název i text článku.');
            return;
        }

        const isUpdate = Boolean(currentArticle.id);
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(apiUrl('news.php'), {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentArticle),
            });

            if (res.ok) {
                setIsEditing(false);
                showStatus(isUpdate ? 'Článek byl upraven.' : 'Článek byl vytvořen.');
                fetchArticles();
            } else {
                const errData = await res.json().catch(() => null);
                if (res.status === 401) {
                    alert('Byl jste odhlášen. Přihlaste se prosím znovu.');
                } else {
                    alert(errData?.message || 'Chyba při ukládání článku.');
                }
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Chyba spojení.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Správa aktualit a článků</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Zde můžete vytvářet a upravovat články s titulkem, popisem, datem a titulní fotografií.
                    </p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow cursor-pointer"
                    >
                        + Přidat nový článek
                    </button>
                )}
            </div>

            {statusMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
                    {statusMessage}
                </div>
            )}

            {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4 max-w-2xl bg-gray-50 p-6 rounded border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {currentArticle.id ? 'Upravit článek' : 'Nový článek / aktualita'}
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Název / Titulek článku *
                        </label>
                        <input
                            type="text"
                            required
                            value={currentArticle.headline || ''}
                            onChange={(e) => setCurrentArticle({ ...currentArticle, headline: e.target.value })}
                            placeholder="např. Výsledky MČR v latinskoamerických tancích"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Datum zveřejnění
                            </label>
                            <CzechDatePicker
                                value={currentArticle.date || ''}
                                onChange={(val) => setCurrentArticle({ ...currentArticle, date: val })}
                            />
                        </div>

                        <div>
                            <ImagePickerInput
                                label="Titulní fotografie"
                                value={currentArticle.image_url || ''}
                                onChange={(val) => setCurrentArticle({ ...currentArticle, image_url: val })}
                                defaultFolder="news_imgs"
                                placeholder="/assets/imgs/news_imgs/..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Obsah / Popis článku *
                        </label>
                        <textarea
                            required
                            rows={8}
                            value={currentArticle.text || ''}
                            onChange={(e) => setCurrentArticle({ ...currentArticle, text: e.target.value })}
                            placeholder="Podrobný popis dění, výsledků, informací pro tanečníky a rodiče..."
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold shadow cursor-pointer"
                        >
                            {currentArticle.id ? 'Uložit změny' : 'Zveřejnit článek'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm font-semibold cursor-pointer"
                        >
                            Zrušit
                        </button>
                    </div>
                </form>
            ) : isLoading ? (
                <div className="p-8 text-center text-gray-500">Načítám články…</div>
            ) : articles.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded">
                    Zatím nejsou vytvořeny žádné články. Klikněte na tlačítko výše pro přidání.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Foto</th>
                                <th className="px-4 py-3">Název / Titulek</th>
                                <th className="px-4 py-3">Datum vytvoření</th>
                                <th className="px-4 py-3">Poslední úprava</th>
                                <th className="px-4 py-3 text-right">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {articles.map((art) => (
                                <tr key={art.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        {art.image_url ? (
                                            <img
                                                src={art.image_url}
                                                alt=""
                                                className="w-12 h-12 object-cover rounded border border-gray-200"
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">Bez fotky</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{art.headline}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1 max-w-md">
                                            {art.text}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                        {art.date}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                        {art.updated_at ? (
                                            new Date(art.updated_at).toLocaleDateString('cs-CZ')
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(art)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer"
                                        >
                                            Upravit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(art.id)}
                                            className="text-red-600 hover:text-red-800 font-semibold text-xs cursor-pointer"
                                        >
                                            Smazat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
