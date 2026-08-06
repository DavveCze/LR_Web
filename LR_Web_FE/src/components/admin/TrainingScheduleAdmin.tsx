import { FormEvent, useEffect, useState } from "react";
import type { TrainingBlock } from "../schedule/TrainingSchedule";

const API_URL = "http://localhost:8080/api/training-schedule.php";

type FormState = {
  id?: number;
  day_of_week: TrainingBlock["day_of_week"];
  start_time: string;
  end_time: string;
  title: string;
  subtitle: string;
  block_type: TrainingBlock["block_type"];
  is_active: boolean;
  display_order: number;
};

const EMPTY_FORM: FormState = {
  day_of_week: "monday",
  start_time: "16:15",
  end_time: "17:00",
  title: "",
  subtitle: "",
  block_type: "guided",
  is_active: true,
  display_order: 0,
};

const DAYS = [
  ["monday", "Pondělí"],
  ["tuesday", "Úterý"],
  ["wednesday", "Středa"],
  ["thursday", "Čtvrtek"],
  ["friday", "Pátek"],
] as const;

export function TrainingScheduleAdmin() {
  const [items, setItems] = useState<TrainingBlock[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const response = await fetch(`${API_URL}?admin=1`, {
      credentials: "include",
    });

    const payload = await response.json();

    if (payload.status === "success") {
      setItems(payload.data);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

const editItem = (item: TrainingBlock) => {
  setForm({
    id: item.id,
    day_of_week: item.day_of_week,
    start_time: item.start_time,
    end_time: item.end_time,
    title: item.title,
    subtitle: item.subtitle ?? "",
    block_type: item.block_type,
    is_active: item.is_active,
    display_order: item.display_order,
  });

  setMessage("");
};

  const deleteItem = async (id: number) => {
    if (!window.confirm("Opravdu chceš tento blok z rozvrhu smazat?")) {
      return;
    }

    const response = await fetch(API_URL, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.message ?? "Mazání selhalo.");
      return;
    }

    setMessage(payload.message);
    await loadItems();

    if (form.id === id) {
      setForm(EMPTY_FORM);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch(API_URL, {
      method: form.id ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();

    setSaving(false);

    if (!response.ok || payload.status !== "success") {
      setMessage(payload.message ?? "Uložení selhalo.");
      return;
    }

    setMessage(payload.message);
    setForm(EMPTY_FORM);
    await loadItems();
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Správa rozvrhu tréninků
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Přidej, uprav, skryj nebo smaž jednotlivé bloky rozvrhu.
          </p>
        </div>

        {form.id && (
          <button
            type="button"
            onClick={() => setForm(EMPTY_FORM)}
            className="rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Nový blok
          </button>
        )}
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 border-b border-neutral-200 pb-6 md:grid-cols-2 xl:grid-cols-4"
      >
        <label className="text-sm font-medium text-neutral-700">
          Den
          <select
            value={form.day_of_week}
            onChange={(event) =>
              setField(
                "day_of_week",
                event.target.value as TrainingBlock["day_of_week"],
              )
            }
            className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
          >
            {DAYS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-neutral-700">
          Začátek
          <input
            type="time"
            step="900"
            value={form.start_time}
            onChange={(event) => setField("start_time", event.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 p-2"
            required
          />
        </label>

        <label className="text-sm font-medium text-neutral-700">
          Konec
          <input
            type="time"
            step="900"
            value={form.end_time}
            onChange={(event) => setField("end_time", event.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 p-2"
            required
          />
        </label>

        <label className="text-sm font-medium text-neutral-700">
          Typ bloku
          <select
            value={form.block_type}
            onChange={(event) =>
              setField(
                "block_type",
                event.target.value as TrainingBlock["block_type"],
              )
            }
            className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
          >
            <option value="free">Volný trénink</option>
            <option value="guided">Vedený trénink</option>
            <option value="practice">Practice</option>
            <option value="fitness">Fyzička / strečink</option>
          </select>
        </label>

        <label className="text-sm font-medium text-neutral-700 md:col-span-2">
          Hlavní text
          <input
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Např. VEDENÝ TRÉNINK"
            className="mt-1 w-full rounded border border-neutral-300 p-2"
            required
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 md:col-span-2">
          Doplněk
          <input
            value={form.subtitle}
            onChange={(event) => setField("subtitle", event.target.value)}
            placeholder="Např. Lukáš - přípravka"
            className="mt-1 w-full rounded border border-neutral-300 p-2"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setField("is_active", event.target.checked)}
          />
          Zobrazit veřejně
        </label>

        <div className="flex items-end gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {saving
              ? "Ukládám…"
              : form.id
                ? "Uložit změny"
                : "Přidat blok"}
          </button>

          {message && (
            <p className="text-sm text-neutral-600">{message}</p>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="px-3 py-3">Den</th>
              <th className="px-3 py-3">Čas</th>
              <th className="px-3 py-3">Blok</th>
              <th className="px-3 py-3">Typ</th>
              <th className="px-3 py-3">Stav</th>
              <th className="px-3 py-3 text-right">Akce</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="px-3 py-3">{item.day_of_week}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {item.start_time}–{item.end_time}
                </td>
                <td className="px-3 py-3">
                  <strong className="block">{item.title}</strong>
                  {item.subtitle && (
                    <span className="text-neutral-500">{item.subtitle}</span>
                  )}
                </td>
                <td className="px-3 py-3">{item.block_type}</td>
                <td className="px-3 py-3">
                  {item.is_active ? "Aktivní" : "Skrytý"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                    className="mr-3 text-neutral-700 underline hover:text-black"
                  >
                    Upravit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-700 underline hover:text-red-900"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-neutral-500"
                >
                  Zatím nejsou vytvořené žádné bloky rozvrhu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}