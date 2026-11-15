import React, { useEffect, useState } from "react";
import { getPageContent, savePageContent } from "../../api/client";
import { formatShortAddress } from "../../utils/formatAddress";

export interface TrainingLocation {
  id: string;
  name: string;
  address: string;
  mapsUrl?: string;
}

export const DEFAULT_TRAINING_LOCATIONS: TrainingLocation[] = [
  {
    id: "ckalovova",
    name: "Tělocvična ZŠ Čkalovova",
    address: "Čkalovova 942/2, Ostrava – Poruba",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Z%C5%A0+%C4%8Ckalovova+942%2F2%2C+Ostrava+-+Poruba",
  },
  {
    id: "stara-bela",
    name: "Dům tance Ostrava",
    address: "Junácká 1435/89, Ostrava – Stará Bělá",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=D%C5%AFm+tance+Ostrava+Jun%C3%A1ck%C3%A1+1435%2F89+Star%C3%A1+B%C4%9Bl%C3%A1",
  },
  {
    id: "hlucin",
    name: "Kulturní dům Hlučín",
    address: "Ostravská 124/18, Hlučín",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kulturn%C3%AD+d%C5%AFm+Hlu%C4%8D%C3%ADn",
  },
];

export const TrainingLocationsAdmin: React.FC = () => {
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Formulář pro přidání / úpravu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formMapsUrl, setFormMapsUrl] = useState("");

  useEffect(() => {
    let isMounted = true;
    getPageContent<TrainingLocation[]>("training_locations")
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data);
        } else {
          setLocations(DEFAULT_TRAINING_LOCATIONS);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Chyba při načítání tréninkových míst:", err);
        setLocations(DEFAULT_TRAINING_LOCATIONS);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveLocations = async (updated: TrainingLocation[]) => {
    try {
      setSaving(true);
      setFeedback(null);
      await savePageContent("training_locations", updated);
      setLocations(updated);
      setFeedback("Tréninková místa byla úspěšně uložena.");
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      alert("Chyba při ukládání: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleStartAdd = () => {
    setEditingId("new");
    setFormName("");
    setFormAddress("");
    setFormMapsUrl("");
  };

  const handleStartEdit = (loc: TrainingLocation) => {
    setEditingId(loc.id);
    setFormName(loc.name);
    setFormAddress(loc.address);
    setFormMapsUrl(loc.mapsUrl || "");
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setFormName("");
    setFormAddress("");
    setFormMapsUrl("");
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanAddress = formatShortAddress(formAddress);
    if (!cleanName || !cleanAddress) {
      alert("Zadejte prosím název místa i zkrácenou adresu.");
      return;
    }

    const cleanMapsUrl = formMapsUrl.trim()
      ? formMapsUrl.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + " " + cleanAddress)}`;

    let updated: TrainingLocation[];
    if (editingId === "new") {
      const newLoc: TrainingLocation = {
        id: "loc_" + Date.now(),
        name: cleanName,
        address: cleanAddress,
        mapsUrl: cleanMapsUrl,
      };
      updated = [...locations, newLoc];
    } else {
      updated = locations.map((loc) =>
        loc.id === editingId
          ? {
              ...loc,
              name: cleanName,
              address: cleanAddress,
              mapsUrl: cleanMapsUrl,
            }
          : loc
      );
    }

    handleCancelForm();
    saveLocations(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Opravdu chcete toto tréninkové místo odstranit?")) return;
    const updated = locations.filter((loc) => loc.id !== id);
    saveLocations(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= locations.length) return;
    const updated = [...locations];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveLocations(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kde trénujeme (Adresy a Google Mapy)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Zde můžete upravovat tréninková místa zobrazená na stránce Kontakt. Adresy se zobrazují ve zkráceném tvaru (Název, ulice a č.p., Město/Obec bez PSČ) s přímým proklikem na Google Mapy.
          </p>
        </div>
        {editingId === null && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="bg-black hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer"
          >
            + Přidat místo
          </button>
        )}
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded">
          {feedback}
        </div>
      )}

      {/* FORMULÁŘ EDITACE / PŘIDÁNÍ */}
      {editingId !== null && (
        <form onSubmit={handleSubmitForm} className="mb-6 p-4 bg-neutral-50 border border-neutral-300 rounded space-y-4">
          <h3 className="font-bold text-gray-900">
            {editingId === "new" ? "Přidat nové tréninkové místo" : "Upravit tréninkové místo"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Název místa / sálu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="např. Tělocvična ZŠ Čkalovova"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Zkrácená adresa (ulice a č.p., Město/Obec bez PSČ) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="např. Čkalovova 942/2, Ostrava – Poruba"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Odkaz na Google Mapy (volitelné – pokud nevyplníte, vygeneruje se automaticky)
            </label>
            <input
              type="url"
              value={formMapsUrl}
              onChange={(e) => setFormMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/search/?api=1&query=..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Ukládám..." : "Uložit místo"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="h-32 animate-pulse bg-gray-100 rounded" />
      ) : locations.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">Žádná tréninková místa nejsou zadána.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Pořadí</th>
                <th className="p-3 font-semibold text-gray-700">Název</th>
                <th className="p-3 font-semibold text-gray-700">Zkrácená adresa (bez PSČ)</th>
                <th className="p-3 font-semibold text-gray-700">Odkaz na mapu</th>
                <th className="p-3 font-semibold text-gray-700 text-right">Akce</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc, idx) => (
                <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={idx === 0 || saving}
                      onClick={() => handleMove(idx, "up")}
                      className="px-1 text-gray-500 hover:text-black disabled:opacity-20 cursor-pointer"
                      title="Posunout nahoru"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === locations.length - 1 || saving}
                      onClick={() => handleMove(idx, "down")}
                      className="px-1 text-gray-500 hover:text-black disabled:opacity-20 cursor-pointer"
                      title="Posunout dolů"
                    >
                      ▼
                    </button>
                  </td>
                  <td className="p-3 font-semibold text-gray-900">{loc.name}</td>
                  <td className="p-3 text-gray-700">{loc.address}</td>
                  <td className="p-3">
                    {loc.mapsUrl ? (
                      <a
                        href={loc.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Otevřít mapu ↗
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Automatická</span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(loc)}
                      className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Upravit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(loc.id)}
                      className="px-2.5 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
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
