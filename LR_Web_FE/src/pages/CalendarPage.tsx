import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EditableProvider, EditableText } from "../components/cms/EditableContent";
import { PageHeader } from "../components/layout/PageHeader";
import { HomeButton } from "../components/ui/HomeButton";
import { apiUrl } from "../api/client";

export interface EventItem {
  id: number | string;
  date: string;
  title: string;
  location: string;
  type: "soutez" | "soustredeni" | "tabor" | "akademie";
  note?: string;
  startDate?: string;
  endDate?: string;
  isUpcoming?: boolean;
}

// Výchozí synchronizovaná data z Google Kalendáře (LR akce apod.)
const DEFAULT_EVENTS: EventItem[] = [
  // Nadcházející termíny
  {
    id: 1,
    date: "11. – 13. 12.",
    title: "LR Víkendové soustředění",
    location: "Rekreační středisko Budoucnost, Nová Ves 139, 739 11 Frýdlant nad Ostravicí",
    type: "soustredeni",
    note: "Intenzivní víkendový seminář LAT & STT s trenéry klubu",
    startDate: "2026-12-11",
    endDate: "2026-12-13",
    isUpcoming: true
  },
  {
    id: 2,
    date: "04. – 09. 08. 2027",
    title: "LR Letní soustředění",
    location: "Hotel Beskyd, Trojanovice 700, 744 01 Trojanovice",
    type: "soustredeni",
    note: "Fyzický trénink, standard i latina pro všechny věkové kategorie",
    startDate: "2027-08-04",
    endDate: "2027-08-09",
    isUpcoming: true
  },
  // Proběhlé termíny (archiv)
  {
    id: 3,
    date: "17. – 21. 08.",
    title: "Příměstský tábor CARMEN",
    location: "Taneční sál Ostrava",
    type: "tabor",
    note: "Příměstský taneční tábor CARMEN pro děti a mládež",
    startDate: "2026-08-17",
    endDate: "2026-08-21",
    isUpcoming: false
  },
  {
    id: 4,
    date: "27. – 31. 07.",
    title: "Příměstský tábor CARMEN",
    location: "Taneční sál Ostrava",
    type: "tabor",
    note: "Příměstský taneční tábor CARMEN pro děti a mládež",
    startDate: "2026-07-27",
    endDate: "2026-07-31",
    isUpcoming: false
  },
  {
    id: 5,
    date: "18. – 23. 07.",
    title: "Letní soustředění LR",
    location: "Beskydy, Hotel Budoucnost",
    type: "soustredeni",
    note: "Fyzický trénink, standard i latina pro všechny věkové kategorie",
    startDate: "2026-07-18",
    endDate: "2026-07-23",
    isUpcoming: false
  },
  {
    id: 6,
    date: "06. – 11. 07.",
    title: "Letní tábor CARMEN",
    location: "Beskydy, Pobytový areál",
    type: "tabor",
    note: "Letní pobytový taneční tábor pro děti a mládež s bohatým programem",
    startDate: "2026-07-06",
    endDate: "2026-07-11",
    isUpcoming: false
  },
  {
    id: 7,
    date: "24. 05.",
    title: "Taneční akademie",
    location: "Kulturní dům Ostrava",
    type: "akademie",
    note: "Vystoupení všech kurzů od dětí po dospělé",
    startDate: "2026-05-24",
    endDate: "2026-05-24",
    isUpcoming: false
  },
  {
    id: 8,
    date: "09. 05.",
    title: "Taneční akademie",
    location: "Kulturní dům Ostrava",
    type: "akademie",
    note: "Vystoupení všech kurzů od dětí po dospělé",
    startDate: "2026-05-09",
    endDate: "2026-05-09",
    isUpcoming: false
  },
  {
    id: 9,
    date: "23. – 25. 01.",
    title: "Víkendové zimní soustředění LR",
    location: "Beskydy, Hotel Budoucnost",
    type: "soustredeni",
    note: "Intenzivní víkendový seminář LAT & STT s trenéry klubu",
    startDate: "2026-01-23",
    endDate: "2026-01-25",
    isUpcoming: false
  }
];

const typeLabels: Record<EventItem["type"], { label: string; color: string }> = {
  soustredeni: { label: "Soustředění", color: "bg-blue-100 text-blue-800" },
  soutez: { label: "Soutěž", color: "bg-amber-100 text-amber-800" },
  akademie: { label: "Akademie", color: "bg-purple-100 text-purple-800" },
  tabor: { label: "Tábor", color: "bg-emerald-100 text-emerald-800" }
};

function formatEventDateRange(
  startDateStr?: string,
  endDateStr?: string,
  fallbackDate?: string,
): string {
  if (!startDateStr) return fallbackDate || "";
  try {
    const start = new Date(startDateStr);
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();

    const monthNames = [
      "ledna", "února", "března", "dubna", "května", "června",
      "července", "srpna", "září", "října", "listopadu", "prosince"
    ];

    if (!endDateStr || startDateStr === endDateStr) {
      return `${startDay}. ${monthNames[startMonth]} ${startYear}`;
    }

    const end = new Date(endDateStr);
    const endDay = end.getDate();
    const endMonth = end.getMonth();
    const endYear = end.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay}. – ${endDay}. ${monthNames[endMonth]} ${endYear}`;
    }

    if (startYear === endYear) {
      return `${startDay}. ${monthNames[startMonth]} – ${endDay}. ${monthNames[endMonth]} ${endYear}`;
    }

    return `${startDay}. ${monthNames[startMonth]} ${startYear} – ${endDay}. ${monthNames[endMonth]} ${endYear}`;
  } catch {
    return fallbackDate || startDateStr;
  }
}

function formatLocationLine(location?: string): string {
  if (!location) return "";
  const trimmed = location.trim();
  if (trimmed.toLowerCase().includes("hotel budoucnost")) {
    return "v beskydském hotelu Budoucnost.";
  }
  if (trimmed.toLowerCase().includes("budoucnost")) {
    return "v beskydském hotelu Budoucnost.";
  }
  if (trimmed.toLowerCase().includes("hotel beskyd")) {
    return "v hotelu Beskyd (Trojanovice).";
  }
  if (/^(v|ve|na|u)\s/i.test(trimmed)) {
    return trimmed.endsWith(".") ? trimmed : trimmed + ".";
  }
  return `v: ${trimmed.endsWith(".") ? trimmed : trimmed + "."}`;
}

function getEventImage(event?: EventItem | null): string {
  if (!event) return "/assets/imgs/downloaded/hotel_budoucnost_1.webp";
  const loc = (event.location || "").toLowerCase();
  const title = (event.title || "").toLowerCase();
  if (loc.includes("budoucnost") || title.includes("budoucnost")) {
    return "/assets/imgs/downloaded/hotel_budoucnost_1.webp";
  }
  if (loc.includes("sál") || title.includes("akademie") || loc.includes("kulturní")) {
    return "/assets/imgs/downloaded/soustredeni_leto_sal_1.webp";
  }
  return "/assets/imgs/downloaded/hotel_budoucnost_1.webp";
}

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>(
    "https://calendar.google.com/calendar/embed?src=qc9gbrdp1qrij02tenteeknopk%40group.calendar.google.com&ctz=Europe%2FPrague"
  );

  useEffect(() => {
    let isMounted = true;
    const fetchCalendar = async () => {
      try {
        const res = await fetch(apiUrl("calendar.php"));
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.status === "success") {
          const list = Array.isArray(data.allEvents) && data.allEvents.length > 0
            ? data.allEvents
            : (Array.isArray(data.events) ? data.events : []);

          if (list.length > 0) {
            setEvents(list);
          }
          if (data.calendarUrl) {
            setGoogleCalendarUrl(data.calendarUrl);
          }
        }
      } catch {
        // Ponechá DEFAULT_EVENTS při offline režimu nebo chybě sítě
      }
    };

    fetchCalendar();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrace podle nadcházejících vs. proběhlých akcí
  const eventsByPeriod = events.filter((event) => {
    if (showPastEvents) {
      return event.isUpcoming === false;
    }
    return event.isUpcoming !== false;
  });

  // Řazení: nadcházející vzestupně (nejbližší první), proběhlé sestupně (nejnovější první)
  const sortedEvents = [...eventsByPeriod].sort((a, b) => {
    const dateA = a.startDate || "";
    const dateB = b.startDate || "";
    return showPastEvents ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });

  // Filtrace podle kategorie
  const filteredEvents = sortedEvents.filter((event) => {
    if (activeFilter === "all") return true;
    return event.type === activeFilter;
  });

  // Nejbližší nadcházející akce pro horní přehledový blok
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((e) => (e.startDate && e.startDate >= todayStr) || e.isUpcoming === true)
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  const featuredDateText = nextEvent
    ? formatEventDateRange(nextEvent.startDate, nextEvent.endDate, nextEvent.date)
    : "";

  const featuredHeadline = nextEvent
    ? (nextEvent.type === "soustredeni" || nextEvent.title.toLowerCase().includes("soustředění")
        ? `Nejbližší soustředění se koná ${featuredDateText}`
        : `Nejbližší akce (${nextEvent.title}) se koná ${featuredDateText}`)
    : "Nejbližší akce připravujeme";

  const featuredSubheadline = nextEvent
    ? formatLocationLine(nextEvent.location)
    : "Sledujte náš kalendář pro nově vypsané termíny.";

  const featuredImage = getEventImage(nextEvent);

  return (
    <EditableProvider pageKey="calendar">
      <div>
        <PageHeader title="Kalendář akcí" />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10 font-sans text-neutral-800">
          <p className="text-neutral-700 leading-relaxed text-base md:text-lg font-light mb-8">
            <EditableText
              path="header.subtitle"
              fallback="Termíny nadcházejících soutěží, seminářů, soustředění a táborů pro aktuální sezónu."
            />
          </p>

          {/* DĚLÍCÍ ČÁRA NAD BLOKEM DLE PŘEDLOHY */}
          <div className="border-t border-neutral-300 mb-8 sm:mb-12" />

          {/* NEJBLIŽŠÍ AKCE (Dynamicky dle nejbližšího termínu) */}
          <div className="mb-14 sm:mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* LEVÝ SLOUPEC: TEXTY A TLAČÍTKO */}
            <div className="md:col-span-7 flex flex-col justify-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-800 leading-snug">
                  {featuredHeadline}
                </h2>
                {featuredSubheadline && (
                  <p className="mt-1 text-base sm:text-lg text-neutral-700">
                    {featuredSubheadline}
                  </p>
                )}
              </div>

              <p className="mt-6 sm:mt-8 text-sm sm:text-base text-neutral-600 leading-relaxed">
                <EditableText
                  path="featured.notice"
                  fallback="Veškeré akce sjednoceny v Google kalendáři. Odkaz viz. níže."
                />
              </p>

              <div className="mt-6 sm:mt-8">
                <HomeButton
                  color="#393939"
                  content="Google kalendář"
                  href={googleCalendarUrl}
                  direction="right"
                />
              </div>
            </div>

            {/* PRAVÝ SLOUPEC: FOTOGRAFIE BESKYDSKÉHO HOTELU / MÍSTA */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <img
                src={featuredImage}
                alt={nextEvent ? `${nextEvent.title} - ${nextEvent.location}` : "Beskydský hotel Budoucnost"}
                className="w-full max-w-[460px] h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* FILTRY A PŘEPÍNAČ: NADCHÁZEJÍCÍ VS PROBĚHLÉ TERMÍNY */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Všechny akce
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("soustredeni")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === "soustredeni"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                }`}
              >
                Soustředění
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("tabor")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === "tabor"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Tábory
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("akademie")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === "akademie"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                }`}
              >
                Akademie
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 cursor-pointer select-none border border-neutral-300 bg-neutral-50 px-3 py-1.5 hover:bg-neutral-100 transition-colors">
                <input
                  type="checkbox"
                  checked={showPastEvents}
                  onChange={(e) => setShowPastEvents(e.target.checked)}
                  className="rounded border-neutral-400 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
                <span>Proběhlé termíny</span>
              </label>
            </div>
          </div>

          {/* INDIKÁTOR REŽIMU PŘI ZOBRAZENÍ PROBĚHLÝCH AKCÍ */}
          {showPastEvents && (
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 px-3 py-2 border border-neutral-200">
              <span>Zobrazeny <strong>proběhlé termíny</strong> (archiv akcí, řazeno od nejnovějších).</span>
              <button
                type="button"
                onClick={() => setShowPastEvents(false)}
                className="underline hover:text-neutral-900 cursor-pointer"
              >
                Zpět na nadcházející akce ›
              </button>
            </div>
          )}

          {/* SEZNAM AKCÍ V DESIGNU KARET */}
          {filteredEvents.length === 0 ? (
            <div className="border border-neutral-200 bg-white p-8 text-center text-neutral-500">
              {showPastEvents
                ? "Pro vybraný filtr nebyly nalezeny žádné proběhlé akce."
                : "V této kategorii nejsou momentálně vypsány žádné nadcházející termíny."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const badgeInfo = typeLabels[event.type] || typeLabels.soustredeni;
                return (
                  <article
                    key={event.id}
                    className="grid gap-4 border border-neutral-200 bg-white p-6 md:grid-cols-[160px_1fr_auto] md:items-center shadow-xs"
                  >
                    <div>
                      <span className="text-sm font-bold text-neutral-900 block">{event.date}</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-none ${badgeInfo.color}`}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        Místo: <strong className="text-neutral-800">{event.location}</strong>
                      </p>
                      {event.note && (
                        <p className="mt-1 text-xs text-neutral-500 italic">{event.note}</p>
                      )}
                    </div>

                    <div>
                      <Link
                        to={`/kontakt?subject=${encodeURIComponent(event.title)}`}
                        className="inline-block border border-neutral-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                      >
                        Dotaz k akci ›
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </EditableProvider>
  );
};
