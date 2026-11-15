import React, { useEffect, useRef, useState } from 'react';
import { getResultsList } from '../../api/client';
import { DarkButton } from './ButtonPrefab';

export interface RawCompetitionResult {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  dancer1: string;
  dancer2: string | null;
}

export interface CompetitionGroup {
  key: string;
  name: string;
  date: string;
  location: string;
  results: {
    id: number;
    pair_id?: number;
    dancer1: string;
    dancer2: string | null;
    placement: string;
  }[];
}

interface WeekendReference {
  satStr: string;
  sunStr: string;
  friStr: string;
  isCurrentWeekend: boolean;
}

/**
 * Spočítá referenční víkend vzhledem k aktuálnímu datu.
 * - Sobota a neděle: aktuálně probíhající víkend.
 * - Pondělí až pátek: víkend, který právě skončil.
 */
function getCurrentWeekendReference(): WeekendReference {
  const now = new Date();
  const day = now.getDay(); // 0 = neděle, 1 = pondělí ... 6 = sobota

  let satOffset: number;
  if (day === 6) {
    satOffset = 0; // Dnes je sobota
  } else if (day === 0) {
    satOffset = -1; // Včera byla sobota
  } else {
    // Pondělí (1) až pátek (5) odkazuje na předchozí víkend
    satOffset = -(day + 1);
  }

  const sat = new Date(now);
  sat.setDate(now.getDate() + satOffset);
  const satStr = sat.toISOString().slice(0, 10);

  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const sunStr = sun.toISOString().slice(0, 10);

  const fri = new Date(sat);
  fri.setDate(sat.getDate() - 1);
  const friStr = fri.toISOString().slice(0, 10);

  return {
    satStr,
    sunStr,
    friStr,
    isCurrentWeekend: day === 6 || day === 0,
  };
}

/**
 * Formátuje rozsah víkendu, např. "14. – 15. 11. 2026"
 */
function formatWeekendRange(satKey: string): string {
  try {
    const sat = new Date(`${satKey}T12:00:00`);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const satDay = sat.getDate();
    const sunDay = sun.getDate();
    const satMonth = sat.getMonth() + 1;
    const year = sat.getFullYear();

    if (sat.getMonth() === sun.getMonth()) {
      return `${satDay}. – ${sunDay}. ${satMonth}. ${year}`;
    }
    const sunMonth = sun.getMonth() + 1;
    return `${satDay}. ${satMonth}. – ${sunDay}. ${sunMonth}. ${year}`;
  } catch {
    return satKey;
  }
}

/**
 * Naformátuje konkrétní datum soutěže včetně českého dne (např. "Sobota 17. 10. 2026")
 */
function formatCompetitionDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const dayName = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long' }).format(d);
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const formatted = new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(d);
    return `${capitalizedDay} ${formatted}`;
  } catch {
    return dateStr;
  }
}

/**
 * Zjistí nejlepší (nejnižší) číselné umístění z textu pro účely řazení párů (1. místo < 2. místo)
 */
function extractBestRank(placement: string): number {
  const matches = placement.match(/\d+/g);
  if (!matches) return 999999;
  let best = 999999;
  for (const m of matches) {
    const num = parseInt(m, 10);
    if (num > 0 && num < best) {
      best = num;
    }
  }
  return best;
}

/**
 * Spojí a seřadí čísla v textu umístění jednoho páru od nejlepšího (např. "6. 5. a 4. místo" -> "4. 5. a 6. místo")
 */
function combinePlacementStrings(placements: string[]): string {
  const allNums: number[] = [];
  for (const p of placements) {
    if (!p) continue;
    const matches = p.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (!allNums.includes(num)) {
          allNums.push(num);
        }
      }
    }
  }

  if (allNums.length === 0) return placements.join(", ");

  allNums.sort((a, b) => a - b);

  if (allNums.length === 1) {
    return `${allNums[0]}. místo`;
  }
  if (allNums.length === 2) {
    return `${allNums[0]}. a ${allNums[1]}. místo`;
  }
  const allButLast = allNums.slice(0, -1).map((n) => `${n}.`).join(" ");
  const last = allNums[allNums.length - 1];
  return `${allButLast} a ${last}. místo`;
}

interface CompetitionResultsSlideshowProps {
  className?: string;
  intervalMs?: number;
  maxRecentCompetitions?: number;
}

export const CompetitionResultsSlideshow: React.FC<CompetitionResultsSlideshowProps> = ({
  className = '',
  intervalMs = 5000,
  maxRecentCompetitions = 5,
}) => {
  const [competitions, setCompetitions] = useState<CompetitionGroup[]>([]);
  const [headerRightText, setHeaderRightText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    getResultsList()
      .then((data) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) {
          return;
        }

        const rawList: RawCompetitionResult[] = data.map((item) => ({
          id: item.id || item._id,
          pair_id: item.pair_id || 0,
          competition_name: item.competition_name || item.competitionName || "",
          date: item.date || "",
          location: item.location || "",
          placement: item.placement || "",
          dancer1: item.dancer1 || item.dancerNames || "",
          dancer2: item.dancer2 || null,
        }));

        // 1. Seskupení výsledků podle soutěže (název + datum + místo)
        const groupsMap = new Map<string, CompetitionGroup>();

        for (const item of rawList) {
          const key = `${item.competition_name}__${item.date}__${item.location}`;
          if (!groupsMap.has(key)) {
            groupsMap.set(key, {
              key,
              name: item.competition_name,
              date: item.date,
              location: item.location,
              results: [],
            });
          }

          const comp = groupsMap.get(key)!;
          // Zkontrolujeme, zda už tento pár v soutěži existuje (podle pair_id nebo jmen)
          const existingPair = comp.results.find(
            (r) =>
              (r.pair_id && r.pair_id === item.pair_id) ||
              (r.dancer1 === item.dancer1 && r.dancer2 === item.dancer2)
          );

          if (existingPair) {
            existingPair.placement = combinePlacementStrings([
              existingPair.placement,
              item.placement,
            ]);
          } else {
            comp.results.push({
              id: item.id,
              pair_id: item.pair_id,
              dancer1: item.dancer1,
              dancer2: item.dancer2,
              placement: combinePlacementStrings([item.placement]),
            });
          }
        }

        const allGroups = Array.from(groupsMap.values());
        if (allGroups.length === 0) {
          setCompetitions([]);
          return;
        }

        // Seřadíme výsledky v rámci každé soutěže od nejlepšího umístění (1. místo první)
        for (const g of allGroups) {
          g.results.sort((a, b) => {
            const numA = extractBestRank(a.placement);
            const numB = extractBestRank(b.placement);
            return numA - numB;
          });
        }

        // Seřadíme všechny proběhlé soutěže od nejnovějších
        const todayStr = new Date().toISOString().slice(0, 10);
        const pastOrTodayGroups = allGroups
          .filter((g) => g.date <= todayStr)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const candidateGroups = pastOrTodayGroups.length > 0 ? pastOrTodayGroups : allGroups;

        // 2. Kontrola, zda o referenčním víkendu byly nějaké soutěže
        const weekendRef = getCurrentWeekendReference();
        const weekendCompetitions = candidateGroups.filter(
          (g) => g.date === weekendRef.satStr || g.date === weekendRef.sunStr || g.date === weekendRef.friStr
        );

        if (weekendCompetitions.length > 0) {
          // REŽIM A: O tomto/uplynulém víkendu soutěže byly
          setHeaderRightText(formatWeekendRange(weekendRef.satStr));
          setCompetitions(weekendCompetitions.slice(0, maxRecentCompetitions));
        } else {
          // REŽIM B: O tomto víkendu se nesoutěžilo -> zobrazíme poslední nedávné soutěže (max 5)
          setHeaderRightText('Nedávné soutěže');
          setCompetitions(candidateGroups.slice(0, maxRecentCompetitions));
        }
      })
      .catch((err) => {
        console.error('Chyba při načítání výsledků soutěží:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [maxRecentCompetitions]);

  const total = competitions.length;

  const goTo = (index: number) => {
    if (total === 0) return;
    setActiveIndex(((index % total) + total) % total);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef<boolean>(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Automatický posun výsledků při přetečení + plynulý přechod na další soutěž
  useEffect(() => {
    if (loading || total === 0) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    // Vždy na začátku nové soutěže resetujeme pozici nahoru
    el.scrollTop = 0;

    let animId: number | null = null;
    let phase: 'top_pause' | 'scrolling' | 'bottom_pause' | 'done' = 'top_pause';
    let phaseElapsed = 0;
    let currentScroll = 0;
    let lastTimestamp: number | null = null;

    // Časování a rychlost
    const TOP_PAUSE_MS = 2000; // Počáteční pauza pro přečtení prvních párů
    const BOTTOM_PAUSE_MS = 2200; // Pauza dole pro přečtení spodních párů
    const NO_SCROLL_DURATION_MS = intervalMs || 5500; // Doba zobrazení, pokud se vše vejde
    const PIXELS_PER_SECOND = 24; // Pomalý, plynulý posun (cca 24 px za sekundu)

    const step = (now: number) => {
      if (!lastTimestamp) {
        lastTimestamp = now;
        animId = requestAnimationFrame(step);
        return;
      }

      const dt = now - lastTimestamp;
      lastTimestamp = now;

      // Pokud je slideshow pozastavena (např. hover myší nebo dotyk), nezvyšujeme čas ani posun
      if (isPausedRef.current) {
        // Pokud uživatel během pozastavení sám prescrolloval, sesynchronizujeme pozici
        if (el) currentScroll = el.scrollTop;
        animId = requestAnimationFrame(step);
        return;
      }

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);

      // PŘÍPAD 1: Všechny páry se vejdou do okna (není potřeba scrollovat)
      if (maxScroll <= 4) {
        phaseElapsed += dt;
        if (phaseElapsed >= NO_SCROLL_DURATION_MS) {
          if (total > 1) {
            setActiveIndex((prev) => (prev + 1) % total);
          } else {
            phaseElapsed = 0;
            animId = requestAnimationFrame(step);
            return;
          }
          return;
        }
        animId = requestAnimationFrame(step);
        return;
      }

      // PŘÍPAD 2: Páry se nevejdou -> pomalý automatický posun dolů
      if (phase === 'top_pause') {
        phaseElapsed += dt;
        if (phaseElapsed >= TOP_PAUSE_MS) {
          phase = 'scrolling';
          phaseElapsed = 0;
        }
        animId = requestAnimationFrame(step);
        return;
      }

      if (phase === 'scrolling') {
        currentScroll += (PIXELS_PER_SECOND * dt) / 1000;
        if (currentScroll >= maxScroll) {
          currentScroll = maxScroll;
          el.scrollTop = maxScroll;
          phase = 'bottom_pause';
          phaseElapsed = 0;
        } else {
          el.scrollTop = currentScroll;
        }
        animId = requestAnimationFrame(step);
        return;
      }

      if (phase === 'bottom_pause') {
        phaseElapsed += dt;
        if (phaseElapsed >= BOTTOM_PAUSE_MS) {
          phase = 'done';
          if (total > 1) {
            setActiveIndex((prev) => (prev + 1) % total);
          } else {
            // Pokud je v seznamu pouze 1 soutěž, vrátíme se nahoru a cyklujeme dál
            el.scrollTop = 0;
            currentScroll = 0;
            phase = 'top_pause';
            phaseElapsed = 0;
            animId = requestAnimationFrame(step);
            return;
          }
          return;
        }
        animId = requestAnimationFrame(step);
        return;
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [activeIndex, total, intervalMs, loading]);

  const currentComp = competitions[activeIndex];

  // Zvýraznění medailových a finálových pozic
  const getBadgeStyle = (placement: string) => {
    const p = placement.toLowerCase();
    if (p.includes('1.') || p.includes('zlato') || p.includes('1. místo')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (p.includes('2.') || p.includes('stříbro') || p.includes('2. místo')) {
      return 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
    }
    if (p.includes('3.') || p.includes('bronz') || p.includes('3. místo')) {
      return 'bg-amber-700/15 text-amber-950 border-amber-700/30 font-bold';
    }
    return 'bg-neutral-200 text-neutral-800 border-neutral-300 font-semibold';
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsPaused(false);
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* HLAVNÍ BOX SLIDESHOW */}
      <div className="relative flex flex-col justify-between h-full min-h-[360px] md:min-h-[375px]">
        {loading ? (
          <div className="flex h-full flex-col justify-between animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 bg-neutral-200 rounded" />
              <div className="h-4 w-28 bg-neutral-200 rounded" />
            </div>
            <div className="space-y-3 my-4">
              <div className="h-7 w-3/4 bg-neutral-200 rounded" />
              <div className="h-5 w-full bg-neutral-200 rounded" />
              <div className="h-5 w-5/6 bg-neutral-200 rounded" />
            </div>
            <div className="h-4 w-40 bg-neutral-200 rounded" />
          </div>
        ) : !currentComp ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-neutral-500">
            <span className="text-3xl mb-2">🏆</span>
            <h4 className="text-base font-bold text-neutral-800">Soutěžní výsledky klubu</h4>
            <p className="mt-1 text-xs text-neutral-500">
              Připravujeme čerstvé výsledky a umístění našich tanečních párů z nadcházejících soutěží.
            </p>
            <div className="pt-6 flex justify-center">
              <DarkButton
                href="/klub/vysledky-soutezi"
                className="px-6 py-3 font-medium"
              >
                Výsledky soutěží
              </DarkButton>
            </div>
          </div>
        ) : (
          <>
            {/* HORNÍ ČÁST: NÁZEV + DATUM + VÝSLEDKY + TEČKY */}
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-500 mb-2">
                {headerRightText && (
                  <span className="font-semibold text-neutral-500">
                    {headerRightText}
                  </span>
                )}
              </div>

              {/* NÁZEV SOUTĚŽE */}
              <h4 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight line-clamp-1" title={currentComp.name}>
                {currentComp.name}
              </h4>

              {/* PŘESNÉ DATUM A LOKACE TÉTO KONKRÉTNÍ SOUTĚŽE */}
              <p className="mt-1 text-xs text-neutral-500">
                <span>{formatCompetitionDate(currentComp.date)}</span>
                {currentComp.location && (
                  <>
                    <span className="mx-1 text-neutral-400">•</span>
                    <span>{currentComp.location}</span>
                  </>
                )}
              </p>

              {/* SEZNAM VÝSLEDKŮ TANEČNÍCH PÁRŮ - pevná výška h-[160px] garantuje nulový posun na ose Y */}
              <div
                ref={scrollContainerRef}
                className="mt-3.5 h-[160px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {currentComp.results.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between gap-3 rounded border border-neutral-200/80 bg-white px-3 py-2 text-sm shadow-2xs"
                  >
                    <span
                      className="font-semibold text-neutral-800 truncate min-w-0"
                      title={res.dancer2 ? `${res.dancer1} & ${res.dancer2}` : `${res.dancer1} (Sólo)`}
                    >
                      {res.dancer1}
                      {res.dancer2 ? (
                        <>
                          {" "}
                          <span className="text-neutral-400 font-normal">&amp;</span> {res.dancer2}
                        </>
                      ) : (
                        <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                          Sólo
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs shadow-2xs ${getBadgeStyle(
                        res.placement
                      )}`}
                    >
                      {res.placement}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DOLNÍ ČÁST: POSOUVACÍ BAR (STÁLE NA STEJNÉM MÍSTĚ TĚSNĚ NAD TLAČÍTKEM) + TLAČÍTKO */}
            <div className="pt-6 flex flex-col items-center">
              {/* INDIKAČNÍ TEČKY POD VÝSLEDKY S ŠIPKAMI */}
              {total > 1 && (
                <div className="mb-3.5 flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Předchozí soutěž"
                    onClick={goPrev}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-600 border border-neutral-300 shadow-2xs hover:bg-neutral-100 hover:scale-105 transition cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  <div className="flex gap-1.5">
                    {competitions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Přejít na soutěž ${i + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          i === activeIndex ? 'w-6 bg-neutral-800' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    aria-label="Další soutěž"
                    onClick={goNext}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-600 border border-neutral-300 shadow-2xs hover:bg-neutral-100 hover:scale-105 transition cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}

              <DarkButton
                href="/klub/vysledky-soutezi"
                className="px-6 py-3 font-medium"
              >
                Výsledky soutěží
              </DarkButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
