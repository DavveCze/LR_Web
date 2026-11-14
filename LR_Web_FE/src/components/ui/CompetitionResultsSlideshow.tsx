import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../api/client';

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

interface CompetitionResultsSlideshowProps {
  className?: string;
  intervalMs?: number;
}

export const CompetitionResultsSlideshow: React.FC<CompetitionResultsSlideshowProps> = ({
  className = '',
  intervalMs = 5000,
}) => {
  const [competitions, setCompetitions] = useState<CompetitionGroup[]>([]);
  const [badgeText, setBadgeText] = useState<string>('🏆 Výsledky soutěží');
  const [headerRightText, setHeaderRightText] = useState<string>('');
  const [isRecentFallback, setIsRecentFallback] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('dancers.php?view=results'))
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!isMounted || !payload || payload.status !== 'success' || !Array.isArray(payload.data)) {
          return;
        }

        const rawList = payload.data as RawCompetitionResult[];

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
          groupsMap.get(key)!.results.push({
            id: item.id,
            dancer1: item.dancer1,
            dancer2: item.dancer2,
            placement: item.placement,
          });
        }

        const allGroups = Array.from(groupsMap.values());
        if (allGroups.length === 0) {
          setCompetitions([]);
          return;
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
          setIsRecentFallback(false);
          setBadgeText(
            weekendRef.isCurrentWeekend
              ? '🏆 Výsledky z tohoto víkendu'
              : '🏆 Výsledky z uplynulého víkendu'
          );
          setHeaderRightText(formatWeekendRange(weekendRef.satStr));
          setCompetitions(weekendCompetitions);
        } else {
          // REŽIM B: O tomto víkendu se nesoutěžilo -> zobrazíme poslední nedávné soutěže (max 4)
          setIsRecentFallback(true);
          setBadgeText('🏆 Poslední soutěže tanečních párů');
          setHeaderRightText('Nedávné soutěže');
          setCompetitions(candidateGroups.slice(0, 4));
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
  }, []);

  const total = competitions.length;

  const goTo = (index: number) => {
    if (total === 0) return;
    setActiveIndex(((index % total) + total) % total);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  // Automatické přepínání slidů (pokud je více než 1 soutěž)
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [total, intervalMs, isPaused]);

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
      className={`relative w-full ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsPaused(false);
      }}
    >
      {/* HLAVNÍ BOX SLIDESHOW */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-6 md:p-7 shadow-sm aspect-[8/5] min-h-[320px]">
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
            <Link
              to="/klub/vysledky-soutezi"
              className="mt-4 text-xs font-semibold text-neutral-900 underline hover:text-neutral-700"
            >
              Prohlédnout archiv výsledků ›
            </Link>
          </div>
        ) : (
          <>
            {/* HORNÍ LIŠTA: ŠTÍTEK + DATUM / ROZSAH */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-neutral-500">
                <span className="inline-flex items-center gap-1.5 rounded bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-neutral-800">
                  {badgeText}
                </span>
                {headerRightText && (
                  <span className="font-semibold text-neutral-600">
                    {headerRightText}
                  </span>
                )}
              </div>

              {/* Doplňující kontext, pokud se o víkendu nesoutěžilo */}
              {isRecentFallback && (
                <p className="mt-1 text-[11px] text-neutral-500 italic">
                  O uplynulém víkendu se soutěže nekonaly • Výběr z posledních akcí klubu:
                </p>
              )}

              {/* NÁZEV SOUTĚŽE */}
              <h4 className="mt-2.5 text-xl md:text-2xl font-bold text-neutral-900 tracking-tight line-clamp-1" title={currentComp.name}>
                {currentComp.name}
              </h4>

              {/* PŘESNÉ DATUM A LOKACE TÉTO KONKRÉTNÍ SOUTĚŽE */}
              <p className="mt-0.5 text-xs text-neutral-500">
                <span>{formatCompetitionDate(currentComp.date)}</span>
                {currentComp.location && (
                  <>
                    <span className="mx-1 text-neutral-400">•</span>
                    <span>{currentComp.location}</span>
                  </>
                )}
              </p>
            </div>

            {/* SEZNAM VÝSLEDKŮ TANEČNÍCH PÁRŮ */}
            <div className="my-3 space-y-2 overflow-y-auto max-h-[140px] pr-1">
              {currentComp.results.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between gap-3 rounded border border-neutral-200/80 bg-white px-3 py-2 text-sm shadow-2xs"
                >
                  <span
                    className="font-semibold text-neutral-800 truncate"
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

            {/* DOLNÍ ODKAZ & POČÍTADLO */}
            <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between">
              <Link
                to="/klub/vysledky-soutezi"
                className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:underline"
              >
                Kompletní výsledky soutěží ›
              </Link>

              {/* ČÍSLOVÁNÍ SLIDŮ (POKUD JE VÍCE SOUTĚŽÍ) */}
              {total > 1 && (
                <span className="text-[11px] font-mono text-neutral-400">
                  Soutěž {activeIndex + 1} z {total}
                </span>
              )}
            </div>
          </>
        )}

        {/* NAVIGAČNÍ ŠIPKY (POKUD JE VÍCE NEŽ 1 SOUTĚŽ) */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Předchozí soutěž"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition hover:bg-white hover:scale-105 cursor-pointer border border-neutral-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Další soutěž"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition hover:bg-white hover:scale-105 cursor-pointer border border-neutral-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* INDIKAČNÍ TEČKY POD SLIDESHOW */}
      {total > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
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
      )}
    </div>
  );
};
