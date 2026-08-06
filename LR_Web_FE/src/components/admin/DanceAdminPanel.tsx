import { FormEvent, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api/dancers.php";

type Category = "" | "M" | "A" | "B" | "C" | "D" | "E";

type Dancer = {
  idt: number;
  name: string;
  surname: string;
  category_lat: Category | null;
  category_stt: Category | null;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type DancePair = {
  pair_id: number;
  idt1: number;
  idt2: number;
  points: number;
  finals: boolean;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  dancer1_name: string;
  dancer1_surname: string;
  dancer2_name: string;
  dancer2_surname: string;
};

type CompetitionResult = {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  dancer1: string;
  dancer2: string;
};

type AdminData = {
  dancers: Dancer[];
  pairs: DancePair[];
  results: CompetitionResult[];
};

type DancerForm = {
  idt?: number;
  name: string;
  surname: string;
  category_lat: Category;
  category_stt: Category;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type PairForm = {
  pair_id?: number;
  idt1: string;
  idt2: string;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type ResultForm = {
  id?: number;
  pair_id: string;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
};

const EMPTY_DANCER: DancerForm = {
  name: "",
  surname: "",
  category_lat: "",
  category_stt: "",
  is_active: true,
  is_public: true,
  display_order: 0,
};

const EMPTY_PAIR: PairForm = {
  idt1: "",
  idt2: "",
  is_active: true,
  is_public: true,
  display_order: 0,
};

const EMPTY_RESULT: ResultForm = {
  pair_id: "",
  competition_name: "",
  date: "",
  location: "",
  placement: "",
};

const CATEGORY_OPTIONS: Category[] = ["", "M", "A", "B", "C", "D", "E"];

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function getPairLabel(pair: DancePair): string {
  return `${pair.dancer1_name} ${pair.dancer1_surname} & ${pair.dancer2_name} ${pair.dancer2_surname}`;
}

function StatusBadge({
  active,
  publicVisible,
}: {
  active: boolean;
  publicVisible?: boolean;
}) {
  if (!active) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
        Neaktivní
      </span>
    );
  }

  if (publicVisible === false) {
    return (
      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
        Skrytý
      </span>
    );
  }

  return (
    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
      Veřejný
    </span>
  );
}

export function DanceAdminPanel() {
  const [data, setData] = useState<AdminData>({
    dancers: [],
    pairs: [],
    results: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<
    "dancers" | "pairs" | "results"
  >("dancers");

  const [dancerForm, setDancerForm] = useState<DancerForm>(EMPTY_DANCER);
  const [pairForm, setPairForm] = useState<PairForm>(EMPTY_PAIR);
  const [resultForm, setResultForm] = useState<ResultForm>(EMPTY_RESULT);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}?admin=1`, {
        credentials: "include",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || payload.status !== "success") {
        throw new Error(
          getErrorMessage(payload, "Nepodařilo se načíst data tanečníků."),
        );
      }

      setData(payload.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Při načítání dat došlo k neočekávané chybě.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availablePairDancers = useMemo(() => {
    const currentlyUsedByOtherPairs = new Set(
      data.pairs
        .filter((pair) => pair.pair_id !== pairForm.pair_id)
        .filter((pair) => pair.is_active)
        .flatMap((pair) => [pair.idt1, pair.idt2]),
    );

    return data.dancers.filter(
      (dancer) =>
        dancer.is_active &&
        !currentlyUsedByOtherPairs.has(dancer.idt),
    );
  }, [data.dancers, data.pairs, pairForm.pair_id]);

  const sendRequest = async (
    method: "POST" | "PUT" | "DELETE",
    body: Record<string, unknown>,
  ) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method,
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok || payload.status !== "success") {
        throw new Error(getErrorMessage(payload, "Operace selhala."));
      }

      setMessage(payload.message ?? "Změny byly uloženy.");
      await loadData();

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Při ukládání došlo k neočekávané chybě.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitDancer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await sendRequest(
      dancerForm.idt ? "PUT" : "POST",
      {
        action: dancerForm.idt ? "update_dancer" : "create_dancer",
        ...dancerForm,
      },
    );

    if (success) {
      setDancerForm(EMPTY_DANCER);
    }
  };

  const submitPair = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pairForm.idt1 === pairForm.idt2) {
      setError("Pár musí tvořit dva různí tanečníci.");
      return;
    }

    const success = await sendRequest(
      pairForm.pair_id ? "PUT" : "POST",
      {
        action: pairForm.pair_id ? "update_pair" : "create_pair",
        ...pairForm,
        idt1: Number(pairForm.idt1),
        idt2: Number(pairForm.idt2),
      },
    );

    if (success) {
      setPairForm(EMPTY_PAIR);
    }
  };

  const submitResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await sendRequest("POST", {
      action: "create_result",
      ...resultForm,
      pair_id: Number(resultForm.pair_id),
    });

    if (success) {
      setResultForm(EMPTY_RESULT);
    }
  };

  const editDancer = (dancer: Dancer) => {
    setActiveTab("dancers");
    setMessage("");
    setError("");

    setDancerForm({
      idt: dancer.idt,
      name: dancer.name,
      surname: dancer.surname,
      category_lat: dancer.category_lat ?? "",
      category_stt: dancer.category_stt ?? "",
      is_active: dancer.is_active,
      is_public: dancer.is_public,
      display_order: dancer.display_order,
    });
  };

const editPair = (pair: DancePair) => {
  setActiveTab("pairs");
  setMessage("");
  setError("");

  setPairForm({
    pair_id: pair.pair_id,
    idt1: String(pair.idt1),
    idt2: String(pair.idt2),
    is_active: pair.is_active,
    is_public: pair.is_public,
    display_order: pair.display_order,
  });
};

  const deletePair = async (pair: DancePair) => {
    const allowed = window.confirm(
      `Opravdu chceš smazat pár „${getPairLabel(pair)}“?\n\nBudou smazány také všechny jeho soutěžní výsledky.`,
    );

    if (!allowed) {
      return;
    }

    const success = await sendRequest("DELETE", {
      action: "delete_pair",
      pair_id: pair.pair_id,
    });

    if (success && pairForm.pair_id === pair.pair_id) {
      setPairForm(EMPTY_PAIR);
    }
  };

  const deleteResult = async (result: CompetitionResult) => {
    const allowed = window.confirm(
      `Opravdu chceš smazat výsledek „${result.competition_name}“?`,
    );

    if (!allowed) {
      return;
    }

    const success = await sendRequest("DELETE", {
      action: "delete_result",
      id: result.id,
    });

    if (success && resultForm.id === result.id) {
      setResultForm(EMPTY_RESULT);
    }
  };

  const updateDancerForm = <K extends keyof DancerForm>(
    field: K,
    value: DancerForm[K],
  ) => {
    setDancerForm((current) => ({ ...current, [field]: value }));
  };

  const updatePairForm = <K extends keyof PairForm>(
    field: K,
    value: PairForm[K],
  ) => {
    setPairForm((current) => ({ ...current, [field]: value }));
  };

  const updateResultForm = <K extends keyof ResultForm>(
    field: K,
    value: ResultForm[K],
  ) => {
    setResultForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Správa tanečníků a párů
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Přidávej tanečníky, vytvářej páry a eviduj jejich soutěžní výsledky.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading || saving}
          className="rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Obnovit data
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("dancers")}
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "dancers"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Tanečníci ({data.dancers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pairs")}
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "pairs"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Páry ({data.pairs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "results"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          Výsledky ({data.results.length})
        </button>
      </div>

      {error && (
        <p className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mb-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      )}

      {activeTab === "dancers" && (
        <div className="space-y-7">
          <form
            onSubmit={submitDancer}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="md:col-span-2 xl:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-neutral-900">
                  {dancerForm.idt ? "Upravit tanečníka" : "Přidat tanečníka"}
                </h3>

                {dancerForm.idt && (
                  <button
                    type="button"
                    onClick={() => setDancerForm(EMPTY_DANCER)}
                    className="text-sm text-neutral-600 underline hover:text-black"
                  >
                    Zrušit úpravu
                  </button>
                )}
              </div>
            </div>

            <label className="text-sm font-medium text-neutral-700">
              Jméno
              <input
                required
                value={dancerForm.name}
                onChange={(event) =>
                  updateDancerForm("name", event.target.value)
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Příjmení
              <input
                required
                value={dancerForm.surname}
                onChange={(event) =>
                  updateDancerForm("surname", event.target.value)
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Třída LAT
              <select
                value={dancerForm.category_lat}
                onChange={(event) =>
                  updateDancerForm(
                    "category_lat",
                    event.target.value as Category,
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category || "none"} value={category}>
                    {category || "Bez třídy"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Třída STT
              <select
                value={dancerForm.category_stt}
                onChange={(event) =>
                  updateDancerForm(
                    "category_stt",
                    event.target.value as Category,
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category || "none"} value={category}>
                    {category || "Bez třídy"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Ruční pořadí
              <input
                type="number"
                value={dancerForm.display_order}
                onChange={(event) =>
                  updateDancerForm(
                    "display_order",
                    Number(event.target.value),
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={dancerForm.is_active}
                onChange={(event) =>
                  updateDancerForm("is_active", event.target.checked)
                }
              />
              Aktivní
            </label>

            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={dancerForm.is_public}
                onChange={(event) =>
                  updateDancerForm("is_public", event.target.checked)
                }
              />
              Zobrazit veřejně
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {saving
                  ? "Ukládám…"
                  : dancerForm.idt
                    ? "Uložit změny"
                    : "Přidat tanečníka"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Tanečník</th>
                  <th className="px-3 py-3">LAT</th>
                  <th className="px-3 py-3">STT</th>
                  <th className="px-3 py-3">Pořadí</th>
                  <th className="px-3 py-3">Stav</th>
                  <th className="px-3 py-3 text-right">Akce</th>
                </tr>
              </thead>

              <tbody>
                {data.dancers.map((dancer) => (
                  <tr
                    key={dancer.idt}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="px-3 py-3 font-medium text-neutral-900">
                      {dancer.name} {dancer.surname}
                    </td>
                    <td className="px-3 py-3">{dancer.category_lat || "—"}</td>
                    <td className="px-3 py-3">{dancer.category_stt || "—"}</td>
                    <td className="px-3 py-3">{dancer.display_order}</td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        active={dancer.is_active}
                        publicVisible={dancer.is_public}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => editDancer(dancer)}
                        className="text-neutral-700 underline hover:text-black"
                      >
                        Upravit
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && data.dancers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-neutral-500"
                    >
                      Zatím nemáš uložené žádné tanečníky.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pairs" && (
        <div className="space-y-7">
          <form
            onSubmit={submitPair}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="md:col-span-2 xl:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {pairForm.pair_id ? "Upravit pár" : "Vytvořit taneční pár"}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Aktivní tanečník může být současně pouze v jednom aktivním páru.
                  </p>
                </div>

                {pairForm.pair_id && (
                  <button
                    type="button"
                    onClick={() => setPairForm(EMPTY_PAIR)}
                    className="text-sm text-neutral-600 underline hover:text-black"
                  >
                    Zrušit úpravu
                  </button>
                )}
              </div>
            </div>

            {!pairForm.pair_id && (
              <>
                <label className="text-sm font-medium text-neutral-700">
                  První tanečník
                  <select
                    required
                    value={pairForm.idt1}
                    onChange={(event) =>
                      updatePairForm("idt1", event.target.value)
                    }
                    className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                  >
                    <option value="">Vyber tanečníka</option>

                    {availablePairDancers.map((dancer) => (
                      <option key={dancer.idt} value={dancer.idt}>
                        {dancer.name} {dancer.surname}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-neutral-700">
                  Druhý tanečník
                  <select
                    required
                    value={pairForm.idt2}
                    onChange={(event) =>
                      updatePairForm("idt2", event.target.value)
                    }
                    className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                  >
                    <option value="">Vyber tanečníka</option>

                    {availablePairDancers
                      .filter(
                        (dancer) => String(dancer.idt) !== pairForm.idt1,
                      )
                      .map((dancer) => (
                        <option key={dancer.idt} value={dancer.idt}>
                          {dancer.name} {dancer.surname}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}

            {pairForm.pair_id && (
              <div className="rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 md:col-span-2">
                Složení páru se po vytvoření nemění. Pokud potřebuješ změnit
                partnera, stávající pár skryj nebo smaž a vytvoř nový.
              </div>
            )}

            <label className="text-sm font-medium text-neutral-700">
              Ruční pořadí
              <input
                type="number"
                value={pairForm.display_order}
                onChange={(event) =>
                  updatePairForm(
                    "display_order",
                    Number(event.target.value),
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={pairForm.is_active}
                onChange={(event) =>
                  updatePairForm("is_active", event.target.checked)
                }
              />
              Aktivní
            </label>

            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={pairForm.is_public}
                onChange={(event) =>
                  updatePairForm("is_public", event.target.checked)
                }
              />
              Zobrazit veřejně
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {saving
                  ? "Ukládám…"
                  : pairForm.pair_id
                    ? "Uložit změny"
                    : "Vytvořit pár"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Pár</th>
                  <th className="px-3 py-3">Pořadí</th>
                  <th className="px-3 py-3">Stav</th>
                  <th className="px-3 py-3 text-right">Akce</th>
                </tr>
              </thead>

              <tbody>
                {data.pairs.map((pair) => (
                  <tr
                    key={pair.pair_id}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="px-3 py-3 font-medium text-neutral-900">
                      {getPairLabel(pair)}
                    </td>
                    <td className="px-3 py-3">{pair.display_order}</td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        active={pair.is_active}
                        publicVisible={pair.is_public}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => editPair(pair)}
                        className="mr-3 text-neutral-700 underline hover:text-black"
                      >
                        Upravit
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePair(pair)}
                        className="text-red-700 underline hover:text-red-900"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && data.pairs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-neutral-500"
                    >
                      Zatím nemáš vytvořený žádný taneční pár.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-7">
          <form
            onSubmit={submitResult}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="md:col-span-2 xl:col-span-4">
              <h3 className="font-semibold text-neutral-900">
                Přidat soutěžní výsledek
              </h3>
            </div>

            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Taneční pár
              <select
                required
                value={resultForm.pair_id}
                onChange={(event) =>
                  updateResultForm("pair_id", event.target.value)
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                <option value="">Vyber taneční pár</option>

                {data.pairs.map((pair) => (
                  <option key={pair.pair_id} value={pair.pair_id}>
                    {getPairLabel(pair)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Datum
              <input
                required
                type="date"
                value={resultForm.date}
                onChange={(event) =>
                  updateResultForm("date", event.target.value)
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Umístění
              <input
                required
                value={resultForm.placement}
                onChange={(event) =>
                  updateResultForm("placement", event.target.value)
                }
                placeholder="Např. 1. místo"
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Název soutěže
              <input
                required
                value={resultForm.competition_name}
                onChange={(event) =>
                  updateResultForm("competition_name", event.target.value)
                }
                placeholder="Např. Mistrovství ČR"
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Místo konání
              <input
                required
                value={resultForm.location}
                onChange={(event) =>
                  updateResultForm("location", event.target.value)
                }
                placeholder="Např. Ostrava"
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              />
            </label>

            <div className="md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                disabled={saving || data.pairs.length === 0}
                className="rounded bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {saving ? "Ukládám…" : "Přidat výsledek"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Datum</th>
                  <th className="px-3 py-3">Pár</th>
                  <th className="px-3 py-3">Soutěž</th>
                  <th className="px-3 py-3">Místo</th>
                  <th className="px-3 py-3">Umístění</th>
                  <th className="px-3 py-3 text-right">Akce</th>
                </tr>
              </thead>

              <tbody>
                {data.results.map((result) => (
                  <tr
                    key={result.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="whitespace-nowrap px-3 py-3">
                      {result.date}
                    </td>
                    <td className="px-3 py-3 font-medium text-neutral-900">
                      {result.dancer1} &amp; {result.dancer2}
                    </td>
                    <td className="px-3 py-3">{result.competition_name}</td>
                    <td className="px-3 py-3">{result.location}</td>
                    <td className="px-3 py-3 font-semibold">
                      {result.placement}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteResult(result)}
                        className="text-red-700 underline hover:text-red-900"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && data.results.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-neutral-500"
                    >
                      Zatím nemáš uložené žádné soutěžní výsledky.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}