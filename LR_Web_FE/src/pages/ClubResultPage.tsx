import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";
import { PageHeader } from "../components/layout/PageHeader";
import { apiUrl } from "../api/client";

const API_URL = apiUrl('dancers.php');

type ResultItem = {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  dancer1_name?: string;
  dancer1_surname?: string;
  dancer2_name?: string | null;
  dancer2_surname?: string | null;
  dancer1: string;
  dancer2: string | null;
};

interface PairResultGroup {
  pair_id: number;
  label: string;
  placements: string[];
}

interface CompetitionGroup {
  key: string;
  name: string;
  date: string;
  location: string;
  pairs: PairResultGroup[];
}

/**
 * Formátuje datum soutěže na tvar "D.M." (např. "31.5.")
 */
function formatCompHeaderDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${day}.${month}.`;
  } catch {
    return dateStr;
  }
}

/**
 * Skloňuje křestní jméno partnerky do 7. pádu ("Dominika" -> "s Dominikou", "Zuzana" -> "se Zuzanou")
 */
function inflectPartnerName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  let inflected = trimmed;
  if (lower.endsWith("a")) {
    inflected = trimmed.slice(0, -1) + "ou";
  } else if (lower.endsWith("e")) {
    inflected = trimmed.slice(0, -1) + "í";
  } else if (lower.endsWith("ie")) {
    inflected = trimmed.slice(0, -2) + "ií";
  }

  const firstLetter = lower[0];
  const prep = ["s", "z", "š", "ž"].includes(firstLetter) ? "se" : "s";
  return `${prep} ${inflected}`;
}

/**
 * Vytvoří popis taneční dvojice nebo sólisty (např. "Petr s Dominikou" nebo "Eliška")
 */
function formatDancerLabel(item: ResultItem): string {
  const d1 = item.dancer1_name || item.dancer1;
  const d2 = item.dancer2_name !== undefined ? item.dancer2_name : item.dancer2;

  if (!d2) {
    return d1; // Sólo tanečník
  }

  return `${d1} ${inflectPartnerName(d2)}`;
}

/**
 * Spojí více umístění jednoho páru do přirozeného tvaru (např. "1. 2. a 2. místo" nebo "1. a 7. místo" nebo "5. místo")
 */
function combinePlacements(placements: string[]): string {
  if (placements.length === 0) return "";
  if (placements.length === 1) return placements[0];

  // Odstraní případné koncové slovo "místo" z jednotlivých záznamů
  const items = placements.map((p) => {
    const trimmed = p.trim();
    return trimmed.replace(/\s*místo$/i, "").trim();
  });

  if (items.length === 2) {
    return `${items[0]} a ${items[1]} místo`;
  } else {
    const allButLast = items.slice(0, -1).join(". ");
    const last = items[items.length - 1];
    return `${allButLast} a ${last} místo`;
  }
}

export function ClubResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}?view=results`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.status === "success" && Array.isArray(payload.data)) {
          setResults(payload.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Seskupení výsledků podle soutěže a páru
  const competitionGroups = useMemo<CompetitionGroup[]>(() => {
    const groupsMap = new Map<string, CompetitionGroup>();

    for (const item of results) {
      const key = `${item.date}__${item.competition_name}__${item.location}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          name: item.competition_name,
          date: item.date,
          location: item.location,
          pairs: [],
        });
      }

      const compGroup = groupsMap.get(key)!;
      let pairEntry = compGroup.pairs.find((p) => p.pair_id === item.pair_id);

      if (!pairEntry) {
        pairEntry = {
          pair_id: item.pair_id,
          label: formatDancerLabel(item),
          placements: [],
        };
        compGroup.pairs.push(pairEntry);
      }

      pairEntry.placements.push(item.placement);
    }

    return Array.from(groupsMap.values());
  }, [results]);

  return (
    <div>
      <PageHeader title="Výsledky soutěží" />
      <main className="py-10 text-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex justify-end">
            <DarkButton
              onClick={() => {
                navigate("/klub/pary");
              }}
            >
              Naše páry
            </DarkButton>
          </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded border-b border-neutral-200 bg-neutral-50"
              />
            ))}
          </div>
        ) : competitionGroups.length === 0 ? (
          <p className="border-y border-neutral-300 py-10 text-center text-neutral-500">
            Zatím nemáme zveřejněné žádné výsledky soutěží.
          </p>
        ) : (
          <div className="border-t border-neutral-300">
            {competitionGroups.map((comp) => {
              const datePrefix = formatCompHeaderDate(comp.date);
              const headerTitle = comp.location
                ? `${datePrefix} ${comp.name} - ${comp.location}`
                : `${datePrefix} ${comp.name}`;

              return (
                <article
                  key={comp.key}
                  className="border-b border-neutral-300 py-7 px-2 md:px-4"
                >
                  {/* Nadpis soutěže - světlý elegantní styl dle předlohy */}
                  <h2 className="text-xl md:text-2xl font-light text-neutral-500 tracking-normal">
                    {headerTitle}
                  </h2>

                  {/* Výsledky jednotlivých párů / sólistů */}
                  <div className="mt-3.5 space-y-1.5 text-base md:text-lg text-neutral-800 font-normal">
                    {comp.pairs.map((p) => (
                      <p key={p.pair_id}>
                        {p.label} {combinePlacements(p.placements)}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  </div>
);
}