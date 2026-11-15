import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";
import { PageHeader } from "../components/layout/PageHeader";
import { getResultsList } from "../api/client";

type ResultItem = {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  created_at?: string | null;
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

interface MonthGroup {
  key: string;
  name: string;
  competitions: CompetitionGroup[];
}

interface SeasonGroup {
  season: string;
  stavK: string;
  months: MonthGroup[];
}

const CZECH_MONTHS = [
  "",
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

/**
 * Určí ročník / taneční sezónu z data (sezóna běží 1. 9. – 31. 8.)
 */
function getSeason(dateStr: string): string {
  try {
    const [yearStr, monthStr] = dateStr.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (month >= 9) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  } catch {
    return "Aktuální sezóna";
  }
}

/**
 * Formátuje datum/čas posledního vložení výsledků na tvar "[stav k D.M.YY]" (např. "[stav k 9.6.26]")
 */
function formatStavK(timestampOrDateStr: string): string {
  try {
    if (!timestampOrDateStr) return "";

    // Pokud je to čisté datum YYYY-MM-DD
    const pureDateMatch = timestampOrDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (pureDateMatch) {
      const day = parseInt(pureDateMatch[3], 10);
      const month = parseInt(pureDateMatch[2], 10);
      const shortYear = pureDateMatch[1].slice(-2);
      return `[stav k ${day}.${month}.${shortYear}]`;
    }

    // Pro timestamp / ISO string
    let d = new Date(timestampOrDateStr);
    if (isNaN(d.getTime())) {
      const fixed = timestampOrDateStr.replace(/([+-]\d{2})$/, "$1:00").replace(" ", "T");
      d = new Date(fixed);
    }

    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const shortYear = String(d.getFullYear()).slice(-2);
      return `[stav k ${day}.${month}.${shortYear}]`;
    }

    // Fallback: regulární výraz pro začátek data
    const match = timestampOrDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const day = parseInt(match[3], 10);
      const month = parseInt(match[2], 10);
      const shortYear = match[1].slice(-2);
      return `[stav k ${day}.${month}.${shortYear}]`;
    }

    return "";
  } catch {
    return "";
  }
}

/**
 * Formátuje nadpis soutěže na tvar "7.6. Kometa Series - Brno"
 */
function formatCompHeader(dateStr: string, name: string, location: string): string {
  try {
    const [, monthStr, dayStr] = dateStr.split("-");
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const datePrefix = `${day}.${month}.`;
    return location ? `${datePrefix} ${name} - ${location}` : `${datePrefix} ${name}`;
  } catch {
    return location ? `${name} - ${location}` : name;
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
 * Vytvoří popis taneční dvojice nebo sólisty (např. "Filip s Karolínou" nebo "Eliška")
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
 * Zjistí nejlepší (nejnižší) číselné umístění z pole výsledků pro účely řazení (1. místo < 2. místo)
 */
function extractBestRank(placements: string[]): number {
  let best = 999999;
  for (const p of placements) {
    const matches = p.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (num > 0 && num < best) {
          best = num;
        }
      }
    }
  }
  return best;
}

/**
 * Spojí a seřadí více umístění jednoho páru do přirozeného tvaru od nejlepšího (např. "2. a 3. místo")
 */
function combinePlacements(placements: string[]): string {
  if (placements.length === 0) return "";

  const allNums: number[] = [];
  const nonNumTokens: string[] = [];

  for (const p of placements) {
    const trimmed = p.trim().replace(/\s*místo$/i, "").trim();
    const matches = trimmed.match(/\d+/g);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (!allNums.includes(num)) {
          allNums.push(num);
        }
      }
    } else if (trimmed) {
      nonNumTokens.push(trimmed);
    }
  }

  if (allNums.length > 0) {
    allNums.sort((a, b) => a - b);

    let formatted: string;
    if (allNums.length === 1) {
      formatted = `${allNums[0]}. místo`;
    } else if (allNums.length === 2) {
      formatted = `${allNums[0]}. a ${allNums[1]}. místo`;
    } else {
      const allButLast = allNums.slice(0, -1).map((n) => `${n}.`).join(" ");
      const last = allNums[allNums.length - 1];
      formatted = `${allButLast} a ${last}. místo`;
    }

    if (nonNumTokens.length > 0) {
      return `${formatted} (${nonNumTokens.join(", ")})`;
    }
    return formatted;
  }

  return placements.join(", ");
}

export function ClubResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  useEffect(() => {
    getResultsList()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Seskupení výsledků: Sezóna -> Měsíc -> Soutěž -> Pár
  const seasonGroups = useMemo<SeasonGroup[]>(() => {
    if (results.length === 0) return [];

    // 1. Rozdělení podle sezóny
    const seasonsMap = new Map<string, ResultItem[]>();
    for (const item of results) {
      const s = getSeason(item.date);
      if (!seasonsMap.has(s)) {
        seasonsMap.set(s, []);
      }
      seasonsMap.get(s)!.push(item);
    }

    // Seřazení sezón sestupně (nejnovější sezóna nahoře)
    const sortedSeasonKeys = Array.from(seasonsMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedSeasonKeys.map((season) => {
      const seasonItems = seasonsMap.get(season)!;

      // Zjištění data posledního vložení výsledků v dané sezóně pro text "[stav k ...]"
      let latestTimeMs = -1;
      let latestTimestampStr = "";
      for (const cur of seasonItems) {
        const itemTime = cur.created_at || cur.date;
        const normalized = itemTime.includes(" ") && !itemTime.includes("T")
          ? itemTime.replace(" ", "T")
          : itemTime;
        const timeMs = new Date(normalized).getTime();
        const validMs = !isNaN(timeMs) ? timeMs : 0;
        if (validMs > latestTimeMs) {
          latestTimeMs = validMs;
          latestTimestampStr = itemTime;
        }
      }
      const stavK = formatStavK(latestTimestampStr);

      // 2. Rozdělení podle měsíce v rámci sezóny (YYYY-MM)
      const monthsMap = new Map<string, ResultItem[]>();
      for (const item of seasonItems) {
        const monthKey = item.date.slice(0, 7);
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }
        monthsMap.get(monthKey)!.push(item);
      }

      // Seřazení měsíců sestupně (nejnovější měsíc nahoře)
      const sortedMonthKeys = Array.from(monthsMap.keys()).sort((a, b) => b.localeCompare(a));

      const months: MonthGroup[] = sortedMonthKeys.map((monthKey) => {
        const monthItems = monthsMap.get(monthKey)!;
        const monthNum = parseInt(monthKey.split("-")[1], 10);
        const monthName = CZECH_MONTHS[monthNum] || `Měsíc ${monthNum}`;

        // 3. Rozdělení podle soutěže
        const compMap = new Map<string, CompetitionGroup>();
        for (const item of monthItems) {
          const compKey = `${item.date}__${item.competition_name}__${item.location}`;
          if (!compMap.has(compKey)) {
            compMap.set(compKey, {
              key: compKey,
              name: item.competition_name,
              date: item.date,
              location: item.location,
              pairs: [],
            });
          }

          const compGroup = compMap.get(compKey)!;
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

        // Seřazení párů v rámci každé soutěže od nejlepšího umístění (1. místo nahoře)
        for (const comp of compMap.values()) {
          comp.pairs.sort((a, b) => {
            const rankA = extractBestRank(a.placements);
            const rankB = extractBestRank(b.placements);
            if (rankA !== rankB) {
              return rankA - rankB;
            }
            return a.label.localeCompare(b.label, "cs");
          });
        }

        // Seřazení soutěží sestupně podle data
        const sortedComps = Array.from(compMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        return {
          key: monthKey,
          name: monthName,
          competitions: sortedComps,
        };
      });

      return {
        season,
        stavK,
        months,
      };
    });
  }, [results]);

  // Aktivní vybraná sezóna – pokud není explicitně zvolena, automaticky se použije nejnovější
  const activeSeason = (selectedSeason && seasonGroups.some((sg) => sg.season === selectedSeason))
    ? selectedSeason
    : (seasonGroups[0]?.season ?? "");

  const activeSeasonGroup = useMemo(() => {
    if (seasonGroups.length === 0) return null;
    return seasonGroups.find((sg) => sg.season === activeSeason) || seasonGroups[0];
  }, [seasonGroups, activeSeason]);

  return (
    <div>
      <PageHeader title="Výsledky soutěží" />
      <main className="py-10 text-neutral-950 font-sans">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* HORNÍ LIŠTA: PŘEPÍNAČ ROČNÍKŮ + TLAČÍTKO NAŠE PÁRY */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {seasonGroups.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full whitespace-nowrap scrollbar-none">
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mr-1 shrink-0">
                    Ročník:
                  </span>
                  {seasonGroups.map((sg) => (
                    <button
                      key={sg.season}
                      type="button"
                      onClick={() => setSelectedSeason(sg.season)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                        activeSeason === sg.season
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {sg.season}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block shrink-0">
              <DarkButton
                onClick={() => {
                  navigate("/klub/pary");
                }}
              >
                Naše páry
              </DarkButton>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6 pt-4">
              <div className="mx-auto h-12 w-48 animate-pulse rounded bg-neutral-200" />
              <div className="h-6 w-full animate-pulse rounded bg-neutral-100" />
              <div className="space-y-3 pt-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded bg-neutral-50" />
                ))}
              </div>
            </div>
          ) : !activeSeasonGroup ? (
            <p className="border-y border-neutral-300 py-10 text-center text-neutral-500">
              Zatím nemáme zveřejněné žádné výsledky soutěží.
            </p>
          ) : (
            <div className="pt-2">
              {/* VELKÝ NÁPIS ROČNÍKU NAHOŘE */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 text-center tracking-tight">
                {activeSeasonGroup.season}
              </h2>

              {/* STAV K DATU */}
              {activeSeasonGroup.stavK && (
                <div className="text-right text-xs md:text-sm text-neutral-400 font-light mt-2 mb-4">
                  {activeSeasonGroup.stavK}
                </div>
              )}

              {/* JEDNOTLIVÉ MĚSÍCE */}
              <div className="space-y-12">
                {activeSeasonGroup.months.map((monthGroup) => (
                  <section key={monthGroup.key}>
                    {/* HORNÍ DĚLÍCÍ ČÁRA NAD MĚSÍCEM */}
                    <div className="border-t border-neutral-300" />

                    {/* NÁZEV MĚSÍCE UPROSTŘED */}
                    <div className="py-6 text-center">
                      <h3 className="text-2xl md:text-3xl font-medium text-neutral-800 tracking-normal">
                        {monthGroup.name}
                      </h3>
                    </div>

                    {/* DĚLÍCÍ ČÁRA POD MĚSÍCEM */}
                    <div className="border-t border-neutral-300 mb-8" />

                    {/* SOUTĚŽE V DANÉM MĚSÍCI */}
                    <div className="space-y-8">
                      {monthGroup.competitions.map((comp, compIdx) => {
                        const headerTitle = formatCompHeader(comp.date, comp.name, comp.location);
                        return (
                          <div key={comp.key} className="space-y-8">
                            {compIdx > 0 && <div className="border-t border-neutral-300" />}
                            <div className="space-y-2 pl-1 sm:pl-2">
                              {/* Nadpis soutěže - jemný šedý text dle předlohy */}
                              <h4 className="text-base md:text-xl font-light text-neutral-400">
                                {headerTitle}
                              </h4>

                              {/* Seznam výsledků jednotlivých párů */}
                              <div className="space-y-1.5 text-sm sm:text-base md:text-lg text-neutral-800 font-normal">
                                {comp.pairs.map((p) => (
                                  <p key={p.pair_id}>
                                    <span>{p.label}</span>{" "}
                                    <strong className="font-bold text-neutral-900">
                                      {combinePlacements(p.placements)}
                                    </strong>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
