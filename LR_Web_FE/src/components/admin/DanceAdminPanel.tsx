import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../api/client";
import { CzechDatePicker } from "../ui/CzechDatePicker";

const API_URL = apiUrl('dancers.php');

type Category = "" | "M" | "A" | "B" | "C" | "D" | "E";

type Dancer = {
  idt: number;
  name: string;
  surname: string;
  category_lat: Category | null;
  category_stt: Category | null;
  points_lat?: number;
  finals_lat?: number;
  points_stt?: number;
  finals_stt?: number;
  csts_idt?: number | null;
  csts_synced_at?: string | null;
  sex?: "M" | "F";
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type DancePair = {
  pair_id: number;
  idt1: number;
  idt2: number | null;
  category_lat?: Category | null;
  category_stt?: Category | null;
  points: number;
  finals: boolean;
  points_lat?: number;
  finals_lat?: number;
  points_stt?: number;
  finals_stt?: number;
  csts_synced_at?: string | null;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  dancer1_name: string;
  dancer1_surname: string;
  dancer1_sex?: "M" | "F";
  dancer2_name: string | null;
  dancer2_surname: string | null;
  dancer2_sex?: "M" | "F";
};

type CompetitionResult = {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  created_at?: string | null;
  dancer1: string;
  dancer2: string | null;
};

type AdminData = {
  dancers: Dancer[];
  pairs: DancePair[];
  results: CompetitionResult[];
};

type DancerForm = {
  idt?: number;
  csts_idt: string;
  name: string;
  surname: string;
  sex: "M" | "F";
  category_lat: Category;
  points_lat: number;
  finals_lat: number;
  category_stt: Category;
  points_stt: number;
  finals_stt: number;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type PairForm = {
  pair_id?: number;
  idt1: string;
  idt2: string;
  category_lat: Category;
  category_stt: Category;
  points_lat: number;
  finals_lat: number;
  points_stt: number;
  finals_stt: number;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
};

type ResultEntry = {
  pair_id: string;
  placement: string;
};

type ResultForm = {
  competition_name: string;
  date: string;
  location: string;
  entries: ResultEntry[];
};

const EMPTY_DANCER: DancerForm = {
  csts_idt: "",
  name: "",
  surname: "",
  sex: "M",
  category_lat: "",
  points_lat: 0,
  finals_lat: 0,
  category_stt: "",
  points_stt: 0,
  finals_stt: 0,
  is_active: true,
  is_public: true,
  display_order: 0,
};

const EMPTY_PAIR: PairForm = {
  idt1: "",
  idt2: "",
  category_lat: "",
  category_stt: "",
  points_lat: 0,
  finals_lat: 0,
  points_stt: 0,
  finals_stt: 0,
  is_active: true,
  is_public: true,
  display_order: 0,
};

const EMPTY_RESULT: ResultForm = {
  competition_name: "",
  date: "",
  location: "",
  entries: [{ pair_id: "", placement: "" }],
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
  if (!pair.idt2 || !pair.dancer2_name) {
    return `${pair.dancer1_name} ${pair.dancer1_surname} (Sólo)`;
  }
  return `${pair.dancer1_name} ${pair.dancer1_surname} & ${pair.dancer2_name} ${pair.dancer2_surname}`;
}

export function normalizePlacementInput(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  const matches = trimmed.match(/\d+/g);
  if (!matches || matches.length === 0) return trimmed;
  const nums = matches.map((m) => parseInt(m, 10)).filter((n) => n > 0);
  if (nums.length === 0) return trimmed;
  nums.sort((a, b) => a - b);
  if (nums.length === 1) return `${nums[0]}. místo`;
  if (nums.length === 2) return `${nums[0]}. a ${nums[1]}. místo`;
  const allButLast = nums.slice(0, -1).map((n) => `${n}.`).join(" ");
  const last = nums[nums.length - 1];
  return `${allButLast} a ${last}. místo`;
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
  const [cstsLoading, setCstsLoading] = useState(false);
  const [syncingCsts, setSyncingCsts] = useState(false);
  const [cstsNotice, setCstsNotice] = useState("");
  const [autoLinkPartner, setAutoLinkPartner] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<
    "dancers" | "pairs" | "results"
  >("dancers");

  const [dancerForm, setDancerForm] = useState<DancerForm>(EMPTY_DANCER);
  const [pairForm, setPairForm] = useState<PairForm>(EMPTY_PAIR);
  const [resultForm, setResultForm] = useState<ResultForm>(EMPTY_RESULT);

  const lastSyncTime = useMemo(() => {
    const dates = [
      ...data.dancers.map((d) => d.csts_synced_at),
      ...data.pairs.map((p) => p.csts_synced_at),
    ]
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime());

    if (dates.length === 0) return null;
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleString("cs-CZ");
  }, [data.dancers, data.pairs]);

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
    return data.dancers.filter((dancer) => dancer.is_active);
  }, [data.dancers]);

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

      let payload: any = null;
      const text = await response.text();
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload || payload.status !== "success") {
        throw new Error(
          getErrorMessage(
            payload,
            payload?.message || `Operace selhala (kód ${response.status}).`,
          ),
        );
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

  const fetchFromCsts = async () => {
    const idtVal = Number(dancerForm.csts_idt.trim());
    if (!idtVal || idtVal <= 0) {
      setError("Zadej platné ČSTS IDT (např. 10704233).");
      return;
    }

    setCstsLoading(true);
    setError("");
    setCstsNotice("");

    try {
      const res = await fetch(`${API_URL}?action=csts_preview&idt=${idtVal}`, {
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok || payload.status !== "success") {
        throw new Error(
          getErrorMessage(
            payload,
            "Tanečník s tímto IDT nebyl v ČSTS nalezen nebo má ČSTS dočasný výpadek.",
          ),
        );
      }

      const a = payload.data;
      setDancerForm((prev) => ({
        ...prev,
        name: a.name || prev.name,
        surname: a.surname || prev.surname,
        sex: (a.sex as "M" | "F") || prev.sex,
        category_lat: (a.category_lat as Category) || prev.category_lat,
        points_lat: a.points_lat ?? prev.points_lat,
        finals_lat: a.finals_lat ?? prev.finals_lat,
        category_stt: (a.category_stt as Category) || prev.category_stt,
        points_stt: a.points_stt ?? prev.points_stt,
        finals_stt: a.finals_stt ?? prev.finals_stt,
      }));

      const notices: string[] = [];
      const pLat = a.partner_lat_name;
      const pStt = a.partner_stt_name;
      const pLatId = a.partner_lat_idt;
      const pSttId = a.partner_stt_idt;

      if (pLat && pStt && pLatId !== pSttId) {
        notices.push(`LAT partner: ${pLat} (IDT: ${pLatId})`);
        notices.push(`STT partner: ${pStt} (IDT: ${pSttId})`);
        notices.push(
          "Při uložení budou automaticky vytvořeny oba samostatné páry (jeden pro LAT a druhý pro STT).",
        );
      } else if (pLat && pStt && pLatId === pSttId) {
        notices.push(
          `Partner pro LAT i STT: ${pLat} (IDT: ${pLatId}). Při uložení bude pár automaticky propojen.`,
        );
      } else if (pLat) {
        notices.push(
          `LAT partner: ${pLat} (IDT: ${pLatId}). Při uložení bude pár pro latinu automaticky propojen.`,
        );
      } else if (pStt) {
        notices.push(
          `STT partner: ${pStt} (IDT: ${pSttId}). Při uložení bude pár pro standard automaticky propojen.`,
        );
      } else {
        notices.push("Data z ČSTS byla úspěšně načtena (bez partnera).");
      }
      setCstsNotice(notices.join(" • "));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chyba při komunikaci s ČSTS.",
      );
    } finally {
      setCstsLoading(false);
    }
  };

  const syncAllFromCsts = async () => {
    const confirmed = window.confirm(
      "Spustit synchronizaci bodů a finále z ČSTS pro všechny aktivní tanečníky a páry?",
    );
    if (!confirmed) return;

    setSyncingCsts(true);
    setError("");
    setMessage("");

    try {
      const success = await sendRequest("POST", { action: "sync_csts" });
      if (success) {
        setMessage("Synchronizace s ČSTS byla úspěšně dokončena.");
      }
    } finally {
      setSyncingCsts(false);
    }
  };

  const submitDancer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let success = false;
    // Pokud jde o nového tanečníka se zadaným IDT a je povoleno automatické propojení z ČSTS
    if (!dancerForm.idt && dancerForm.csts_idt.trim() && autoLinkPartner) {
      success = await sendRequest("POST", {
        action: "create_from_csts",
        idt: Number(dancerForm.csts_idt),
        link_partner: autoLinkPartner,
      });
    } else {
      success = await sendRequest(
        dancerForm.idt ? "PUT" : "POST",
        {
          action: dancerForm.idt ? "update_dancer" : "create_dancer",
          ...dancerForm,
          csts_idt: dancerForm.csts_idt.trim() ? Number(dancerForm.csts_idt) : null,
        },
      );
    }

    if (success) {
      setDancerForm(EMPTY_DANCER);
      setCstsNotice("");
    }
  };

  const submitPair = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pairForm.idt2 && pairForm.idt1 === pairForm.idt2) {
      setError("Pár musí tvořit dva různí tanečníci.");
      return;
    }

    const success = await sendRequest(
      pairForm.pair_id ? "PUT" : "POST",
      {
        action: pairForm.pair_id ? "update_pair" : "create_pair",
        ...pairForm,
        category_lat: pairForm.category_lat || null,
        category_stt: pairForm.category_stt || null,
        idt1: Number(pairForm.idt1),
        idt2: pairForm.idt2 ? Number(pairForm.idt2) : null,
      },
    );

    if (success) {
      setPairForm(EMPTY_PAIR);
    }
  };

  const submitResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validEntries = resultForm.entries.filter(
      (e) => e.pair_id && e.placement.trim() !== "",
    );

    if (validEntries.length === 0) {
      setError("Vyplň alespoň jeden taneční pár / sólo s umístěním.");
      return;
    }

    const success = await sendRequest("POST", {
      action: "create_result",
      competition_name: resultForm.competition_name,
      date: resultForm.date,
      location: resultForm.location,
      entries: validEntries.map((e) => ({
        pair_id: Number(e.pair_id),
        placement: normalizePlacementInput(e.placement) || e.placement.trim(),
      })),
    });

    if (success) {
      setResultForm(EMPTY_RESULT);
    }
  };

  const addResultEntry = () => {
    setResultForm((current) => ({
      ...current,
      entries: [...current.entries, { pair_id: "", placement: "" }],
    }));
  };

  const removeResultEntry = (index: number) => {
    setResultForm((current) => ({
      ...current,
      entries: current.entries.filter((_, i) => i !== index),
    }));
  };

  const updateResultEntry = (
    index: number,
    field: keyof ResultEntry,
    value: string,
  ) => {
    setResultForm((current) => ({
      ...current,
      entries: current.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const editDancer = (dancer: Dancer) => {
    setActiveTab("dancers");
    setMessage("");
    setError("");
    setCstsNotice("");

    setDancerForm({
      idt: dancer.idt,
      csts_idt: dancer.csts_idt ? String(dancer.csts_idt) : "",
      name: dancer.name,
      surname: dancer.surname,
      sex: dancer.sex ?? "M",
      category_lat: dancer.category_lat ?? "",
      points_lat: dancer.points_lat ?? 0,
      finals_lat: dancer.finals_lat ?? 0,
      category_stt: dancer.category_stt ?? "",
      points_stt: dancer.points_stt ?? 0,
      finals_stt: dancer.finals_stt ?? 0,
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
      idt2: pair.idt2 ? String(pair.idt2) : "",
      category_lat: pair.category_lat ?? "",
      category_stt: pair.category_stt ?? "",
      points_lat: pair.points_lat ?? 0,
      finals_lat: pair.finals_lat ?? 0,
      points_stt: pair.points_stt ?? 0,
      finals_stt: pair.finals_stt ?? 0,
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

    await sendRequest("DELETE", {
      action: "delete_result",
      id: result.id,
    });
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
          {lastSyncTime && (
            <p className="mt-1 text-xs text-neutral-500">
              Poslední synchronizace bodů z ČSTS: <span className="font-medium text-neutral-700">{lastSyncTime}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={syncAllFromCsts}
            disabled={loading || saving || syncingCsts}
            className="flex items-center gap-2 rounded bg-blue-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            title="Aktualizuje body a finále všech aktivních párů z ČSTS"
          >
            <span className={syncingCsts ? "inline-block animate-spin" : ""}>⟳</span>
            {syncingCsts ? "Synchronizuji ČSTS…" : "Synchronizovat z ČSTS"}
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading || saving || syncingCsts}
            className="rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Obnovit data
          </button>
        </div>
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
                    onClick={() => {
                      setDancerForm(EMPTY_DANCER);
                      setCstsNotice("");
                    }}
                    className="text-sm text-neutral-600 underline hover:text-black"
                  >
                    Zrušit úpravu
                  </button>
                )}
              </div>
            </div>

            {/* ČSTS Sekce */}
            <div className="md:col-span-2 xl:col-span-4 rounded-lg bg-blue-50/70 border border-blue-200 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold text-blue-950 flex-1 min-w-[220px]">
                  ČSTS IDT (pro automatické načtení z csts.cz)
                  <input
                    type="number"
                    placeholder="Např. 10704233"
                    value={dancerForm.csts_idt}
                    onChange={(event) =>
                      updateDancerForm("csts_idt", event.target.value)
                    }
                    className="mt-1 w-full rounded border border-blue-300 bg-white p-2 font-mono text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={fetchFromCsts}
                  disabled={cstsLoading || !dancerForm.csts_idt.trim()}
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cstsLoading ? "Ověřuji v ČSTS…" : "Načíst z ČSTS"}
                </button>
              </div>

              {cstsNotice && (
                <p className="mt-2.5 text-xs font-medium text-blue-900 bg-blue-100/70 p-2.5 rounded border border-blue-200">
                  ℹ️ {cstsNotice}
                </p>
              )}

              {!dancerForm.idt && (
                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLinkPartner}
                    onChange={(event) => setAutoLinkPartner(event.target.checked)}
                  />
                  Automaticky vytvořit i evidovaného partnera z ČSTS a propojit pár
                </label>
              )}
            </div>

            <label className="text-sm font-medium text-neutral-700">
              Jméno *
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
              Příjmení *
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
              Pohlaví *
              <select
                value={dancerForm.sex}
                onChange={(event) =>
                  updateDancerForm("sex", event.target.value as "M" | "F")
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                <option value="M">Muž (Partner)</option>
                <option value="F">Žena (Partnerka)</option>
              </select>
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

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Body LAT
                <input
                  type="number"
                  min="0"
                  value={dancerForm.points_lat}
                  onChange={(event) =>
                    updateDancerForm("points_lat", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Finále LAT (F)
                <input
                  type="number"
                  min="0"
                  value={dancerForm.finals_lat}
                  onChange={(event) =>
                    updateDancerForm("finals_lat", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>
            </div>

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

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Body STT
                <input
                  type="number"
                  min="0"
                  value={dancerForm.points_stt}
                  onChange={(event) =>
                    updateDancerForm("points_stt", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Finále STT (F)
                <input
                  type="number"
                  min="0"
                  value={dancerForm.finals_stt}
                  onChange={(event) =>
                    updateDancerForm("finals_stt", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>
            </div>

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

            <div className="flex flex-wrap items-center gap-4 self-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dancerForm.is_active}
                  onChange={(event) =>
                    updateDancerForm("is_active", event.target.checked)
                  }
                />
                Aktivní
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dancerForm.is_public}
                  onChange={(event) =>
                    updateDancerForm("is_public", event.target.checked)
                  }
                />
                Zobrazit veřejně
              </label>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving || cstsLoading}
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
                  <th className="px-3 py-3">ČSTS IDT</th>
                  <th className="px-3 py-3">LAT (třída / body / F)</th>
                  <th className="px-3 py-3">STT (třída / body / F)</th>
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
                      <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 border border-neutral-200">
                        {dancer.sex === "F" ? "Žena" : "Muž"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-neutral-600">
                      {dancer.csts_idt ? (
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                          {dancer.csts_idt}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {dancer.category_lat ? (
                        <span>
                          <strong className="font-semibold">{dancer.category_lat}</strong>
                          <span className="ml-1 text-xs text-neutral-500">
                            ({dancer.points_lat ?? 0} b, {dancer.finals_lat ?? 0} F)
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {dancer.category_stt ? (
                        <span>
                          <strong className="font-semibold">{dancer.category_stt}</strong>
                          <span className="ml-1 text-xs text-neutral-500">
                            ({dancer.points_stt ?? 0} b, {dancer.finals_stt ?? 0} F)
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
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
                      colSpan={7}
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
                    {pairForm.pair_id ? "Upravit pár / sólo" : "Vytvořit taneční pár nebo sólo tanečníka"}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Tanečník může soutěžit v páru nebo jako sólo. Pro sólo nechej druhého tanečníka prázdného.
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
                  Tanečník (Partner / Muž) *
                  <select
                    required
                    value={pairForm.idt1}
                    onChange={(event) =>
                      updatePairForm("idt1", event.target.value)
                    }
                    className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                  >
                    <option value="">Vyber partnera (muže)</option>

                    {availablePairDancers.map((dancer) => (
                      <option key={dancer.idt} value={dancer.idt}>
                        {dancer.name} {dancer.surname} ({dancer.sex === "F" ? "Ž" : "M"})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-neutral-700">
                  Partnerka (Žena / nebo prázdné pro sólo)
                  <select
                    value={pairForm.idt2}
                    onChange={(event) =>
                      updatePairForm("idt2", event.target.value)
                    }
                    className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                  >
                    <option value="">(Žádná — Sólo tanečník)</option>

                    {availablePairDancers
                      .filter(
                        (dancer) => String(dancer.idt) !== pairForm.idt1,
                      )
                      .map((dancer) => (
                        <option key={dancer.idt} value={dancer.idt}>
                          {dancer.name} {dancer.surname} ({dancer.sex === "F" ? "Ž" : "M"})
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}

            {pairForm.pair_id && (
              <div className="rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 md:col-span-2 xl:col-span-4">
                Složení páru se po vytvoření nemění. Pokud potřebuješ změnit
                partnera, stávající pár skryj nebo smaž a vytvoř nový.
              </div>
            )}

            <div className="md:col-span-2 xl:col-span-4 rounded border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
              💡 <strong>Disciplíny páru:</strong> Pokud tanečník tančí s různými partnery (např. jeden na LAT a druhý na STT), zvol u daného páru pouze odpovídající třídu (LAT nebo STT). Druhou ponechej „Bez třídy / Netančí“.
            </div>

            <label className="text-sm font-medium text-neutral-700">
              Třída LAT (pro tento pár)
              <select
                value={pairForm.category_lat}
                onChange={(event) =>
                  updatePairForm(
                    "category_lat",
                    event.target.value as Category,
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category || "none"} value={category}>
                    {category ? `Třída ${category}` : "Bez třídy / Netančí LAT"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              Třída STT (pro tento pár)
              <select
                value={pairForm.category_stt}
                onChange={(event) =>
                  updatePairForm(
                    "category_stt",
                    event.target.value as Category,
                  )
                }
                className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category || "none"} value={category}>
                    {category ? `Třída ${category}` : "Bez třídy / Netančí STT"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Body LAT
                <input
                  type="number"
                  min="0"
                  value={pairForm.points_lat}
                  onChange={(event) =>
                    updatePairForm("points_lat", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Finále LAT (F)
                <input
                  type="number"
                  min="0"
                  value={pairForm.finals_lat}
                  onChange={(event) =>
                    updatePairForm("finals_lat", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Body STT
                <input
                  type="number"
                  min="0"
                  value={pairForm.points_stt}
                  onChange={(event) =>
                    updatePairForm("points_stt", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Finále STT (F)
                <input
                  type="number"
                  min="0"
                  value={pairForm.finals_stt}
                  onChange={(event) =>
                    updatePairForm("finals_stt", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>
            </div>

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
                  <th className="px-3 py-3">LAT body &amp; F</th>
                  <th className="px-3 py-3">STT body &amp; F</th>
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
                    <td className="px-3 py-3 text-xs text-neutral-600">
                      {pair.category_lat ? (
                        <span>
                          <strong className="text-neutral-900 font-semibold">{pair.category_lat}</strong>{" "}
                          ({pair.points_lat ?? 0} b, {pair.finals_lat ?? 0} F)
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-600">
                      {pair.category_stt ? (
                        <span>
                          <strong className="text-neutral-900 font-semibold">{pair.category_stt}</strong>{" "}
                          ({pair.points_stt ?? 0} b, {pair.finals_stt ?? 0} F)
                        </span>
                      ) : (
                        "—"
                      )}
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
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 space-y-5"
          >
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">
                Zapsat soutěž a výsledky párů / sólistů
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Název, datum a místo konání zadáš jednou pro celou soutěž. Pomocí tlačítka „+ Přidat další pár / sólo“ přiřadíš libovolný počet tanečníků s jejich umístěním.
              </p>
            </div>

            {/* SPOLEČNÉ ÚDAJE O SOUTĚŽI */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 bg-white p-4 rounded-lg border border-neutral-200">
              <label className="text-sm font-medium text-neutral-700">
                Datum soutěže *
                <div className="mt-1">
                  <CzechDatePicker
                    required
                    value={resultForm.date}
                    onChange={(val) => updateResultForm("date", val)}
                  />
                </div>
              </label>

              <label className="text-sm font-medium text-neutral-700">
                Název soutěže *
                <input
                  required
                  value={resultForm.competition_name}
                  onChange={(event) =>
                    updateResultForm("competition_name", event.target.value)
                  }
                  placeholder="Např. Velká cena TK Moravia Starlet"
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>

              <label className="text-sm font-medium text-neutral-700 sm:col-span-2 md:col-span-1">
                Místo konání *
                <input
                  required
                  value={resultForm.location}
                  onChange={(event) =>
                    updateResultForm("location", event.target.value)
                  }
                  placeholder="Např. Brno-Židenice"
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2"
                />
              </label>
            </div>

            {/* SEZNAM PÁRŮ A UMÍSTĚNÍ PRO TUTO SOUTĚŽ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                  Zúčastněné páry a umístění ({resultForm.entries.length})
                </h4>
                <button
                  type="button"
                  onClick={addResultEntry}
                  className="inline-flex items-center gap-1 rounded bg-neutral-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-300 transition-colors"
                >
                  <span className="text-base leading-none font-bold">+</span> Přidat další pár / sólo
                </button>
              </div>

              <div className="space-y-3">
                {resultForm.entries.map((entry, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-2xs"
                  >
                    <label className="text-xs font-medium text-neutral-700">
                      Taneční pár / sólo tanečník #{index + 1} *
                      <select
                        required
                        value={entry.pair_id}
                        onChange={(e) =>
                          updateResultEntry(index, "pair_id", e.target.value)
                        }
                        className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 text-sm"
                      >
                        <option value="">Vyber taneční pár nebo sólo</option>
                        {data.pairs.map((pair) => (
                          <option key={pair.pair_id} value={pair.pair_id}>
                            {getPairLabel(pair)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs font-medium text-neutral-700">
                      Umístění (např. 1. nebo 1. 2. 8. 1.) *
                      <input
                        required
                        value={entry.placement}
                        onChange={(e) =>
                          updateResultEntry(index, "placement", e.target.value)
                        }
                        placeholder="Např. 1. nebo 1. 2. 8. 1."
                        className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 text-sm"
                      />
                    </label>

                    <div className="flex justify-end pb-1">
                      {resultForm.entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResultEntry(index)}
                          className="rounded px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                          title="Odebrat tento pár"
                        >
                          ✕ Odebrat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving || data.pairs.length === 0}
                className="rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400 cursor-pointer shadow-sm"
              >
                {saving ? "Ukládám výsledky…" : `Uložit všechny výsledky (${resultForm.entries.length})`}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Datum</th>
                  <th className="px-3 py-3">Pár / Sólo</th>
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
                      {result.dancer1}
                      {result.dancer2 ? (
                        <> &amp; {result.dancer2}</>
                      ) : (
                        <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                          Sólo
                        </span>
                      )}
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