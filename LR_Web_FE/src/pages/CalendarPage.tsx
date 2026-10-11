import React from "react";
import { Link } from "react-router-dom";
import { PartnersSection } from "../components/ui/PartnersSection";
import { EditableProvider, EditableText } from "../components/cms/EditableContent";

interface EventItem {
  id: number;
  date: string;
  title: string;
  location: string;
  type: "soutez" | "soustredeni" | "tabor" | "akademie";
  note?: string;
}

const UPCOMING_EVENTS: EventItem[] = [
  {
    id: 1,
    date: "18. – 23. 07.",
    title: "Letní taneční soustředění – hotel Budoucnost",
    location: "Beskydy, Hotel Budoucnost",
    type: "soustredeni",
    note: "Fyzický trénink, standard i latina pro všechny věkové kategorie"
  },
  {
    id: 2,
    date: "14. 11.",
    title: "Podzimní taneční pohár ČSTS",
    location: "Sportovní hala Ostrava",
    type: "soutez",
    note: "Účast nominovaných párů LR Dance Team"
  },
  {
    id: 3,
    date: "28. – 29. 11.",
    title: "Víkendové intenzivní soustředění LAT & STT",
    location: "Taneční sál Ostrava",
    type: "soustredeni",
    note: "Semináře s Václavem Masarykem a Klárou Chovančíkovou"
  },
  {
    id: 4,
    date: "19. 12.",
    title: "Vánoční taneční akademie & večírek klubu",
    location: "Kulturní dům Ostrava",
    type: "akademie",
    note: "Vystoupení všech kurzů od dětí po dospělé"
  },
  {
    id: 5,
    date: "Letní prázdniny",
    title: "Letní spací tábor CARMEN",
    location: "Beskydy, Pobytový areál",
    type: "tabor",
    note: "Příjem přihlášek spuštěn"
  }
];

const typeLabels: Record<EventItem["type"], { label: string; color: string }> = {
  soutez: { label: "Soutěž", color: "bg-amber-100 text-amber-800" },
  soustredeni: { label: "Soustředění", color: "bg-blue-100 text-blue-800" },
  akademie: { label: "Akademie", color: "bg-purple-100 text-purple-800" },
  tabor: { label: "Tábor", color: "bg-emerald-100 text-emerald-800" }
};

export const CalendarPage: React.FC = () => {
  return (
    <EditableProvider pageKey="calendar">
      <main className="mx-auto max-w-5xl px-6 py-28 font-sans text-neutral-800">
        <div className="mb-12 border-b-2 border-neutral-900 pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">
            <EditableText path="header.title" fallback="KALENDÁŘ AKCÍ & SOUTĚŽÍ" />
          </h1>
          <p className="mt-2 text-neutral-600">
            <EditableText
              path="header.subtitle"
              fallback="Termíny nadcházejících soutěží, seminářů, soustředění a táborů pro aktuální sezónu."
            />
          </p>
        </div>

        {/* FEATURED SOUSTŘEDĚNÍ V BESKYDECH */}
        <div className="mb-12 overflow-hidden border border-neutral-200 bg-white grid md:grid-cols-2 shadow-xs">
          <div className="aspect-[4/3] md:aspect-auto w-full bg-neutral-100">
            <img
              src="/assets/imgs/downloaded/hotel_budoucnost_1.webp"
              alt="Beskydský hotel Budoucnost"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                Klíčová akce sezóny
              </span>
              <h2 className="mt-2 text-2xl font-bold text-neutral-900">
                Taneční soustředění v Beskydech
              </h2>
              <p className="mt-3 text-sm text-neutral-700 leading-relaxed">
                Tradiční soustředění se koná v beskydském hotelu <strong>Budoucnost</strong>.
                Čeká nás intenzivní fyzický trénink, technika latiny i standardu a příprava na soutěžní šampionáty.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://is.pohodlne.info/udalost/detail/83cc352d92a347ef6bc1e77854c2f122"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
              >
                Přihlásit se na soustředění ›
              </a>
            </div>
          </div>
        </div>

        {/* SEZNAM AKCÍ */}
        <div className="space-y-4">
          {UPCOMING_EVENTS.map((event) => (
            <article
              key={event.id}
              className="grid gap-4 border border-neutral-200 bg-white p-6 md:grid-cols-[160px_1fr_auto] md:items-center shadow-xs"
            >
              <div>
                <span className="text-sm font-bold text-neutral-900 block">{event.date}</span>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-none ${typeLabels[event.type].color}`}>
                  {typeLabels[event.type].label}
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
                  to="/kontakt"
                  className="inline-block border border-neutral-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Dotaz k akci ›
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* GOOGLE KALENDÁŘ ODKAZ */}
        <div className="mt-12 rounded-none border border-neutral-200 bg-neutral-50 p-6 text-center">
          <h3 className="text-base font-bold uppercase tracking-wide text-neutral-900">
            Sledujte náš kalendář online
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            Všechny termíny soutěží a soustředění sjednocujeme pro členy v Google kalendáři.
          </p>
          <div className="mt-4">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-neutral-900 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Otevřít Google Kalendář ›
            </a>
          </div>
        </div>

        {/* PARTNEŘI */}
        <PartnersSection className="mt-16" />
      </main>
    </EditableProvider>
  );
};
