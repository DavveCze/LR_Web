import React from "react";
import { useParams } from "react-router-dom";
import { HomeButton } from "../components/ui/HomeButton";
import { PartnersSection } from "../components/ui/PartnersSection";

export interface CourseDetail {
  id: string;
  slugs: string[];
  title: string;
  subtitle: string;
  buttonLabel: string;
  image: string;
  paragraphs: string[];
  when: string;
  where: string;
  price: string;
  registrationUrl: string;
  notes?: string;
}

const COURSES_DATA: CourseDetail[] = [
  {
    id: "materinky",
    slugs: ["materinky"],
    title: "Taneční kurzy v mateřských školách",
    subtitle: "Výuka pro děti ve vaší mateřské škole.",
    buttonLabel: "Mateřské školy",
    image: "/assets/imgs/downloaded/deti_tanecni_lekce_1.webp",
    paragraphs: [
      "Taneční kurzy jsou zaměřené na pohybovou a rytmickou průpravu. Zároveň také na podporu zdravého psychomotorického vývoje dětí formou tanečních her a cvičení.",
      "Naším cílem je probudit v dětech pozitivní vztah k pohybu a hudbě a také je naučit správné držení těla. Děti se přirozeným způsobem naučí ovládat své tělo, zlepší si koordinaci a také fyzickou kondici.",
      "Taneční škola Carmen se dětem v mateřských školách věnuje již od roku 2000.",
      "Velkou výhodou je, že kurz probíhá přímo v prostorách vaší mateřské školy a tudíž nemusíte spěchat z práce a dítě převážet do neznámého prostředí.",
      "Nabízíme bohaté a kvalitní zkušenosti, pohybový rozvoj dítěte, spoustu zážitků, legrace a her. Vaše děti si naše tanečky zamilují.",
      "Tančíme se dětmi na dětské i moderní písničky, zdokonalí pohybovou koordinaci, protáhnou celé tělo, proto je kurz vhodný pro holky i kluky. Závěrem Vás čeká velkolepá taneční akademie."
    ],
    when: "říjen 2026 – květen 2027",
    where: "prostory vaší MŠ",
    price: "viz registrace",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/d4c837eedf5e2048fe21d93d5ca274a1"
  },
  {
    id: "zakladky",
    slugs: ["zakladky", "zakladka"],
    title: "Taneční kurzy na základních školách",
    subtitle: "Výuka pro děti ve vaší základní škole.",
    buttonLabel: "Základní školy",
    image: "/assets/imgs/downloaded/hiphop_dance_deti_1.webp",
    paragraphs: [
      "Taneční kurzy jsou zaměřené na pohybovou a kondiční průpravu. Tančíme s dětmi na moderní písničky, učíme choreografie, které znají z TikToku. Zdokonalí pohybovou koordinaci, protáhnou celé tělo, proto je kurz vhodný pro holky i kluky. Závěrem Vás čeká velkolepá taneční akademie.",
      "Naším cílem je probudit v dětech pozitivní vztah k pohybu a hudbě a také je naučit správné držení těla. Děti se přirozeným způsobem naučí ovládat své tělo, zlepší si koordinaci a také fyzickou kondici.",
      "Taneční škola Carmen se dětem na základních školách věnuje již od roku 2000.",
      "Velkou výhodou je, že kurz probíhá přímo v prostorách vaší základní školy a tudíž nemusíte spěchat z práce a dítě převážet do neznámého prostředí.",
      "Nabízíme bohaté a kvalitní zkušenosti, pohybový rozvoj dítěte, spoustu zážitků, legrace a her. Vaše děti si naše tanečky zamilují."
    ],
    when: "říjen 2026 – květen 2027",
    where: "prostory vaší ZŠ",
    price: "viz registrace",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/6118bf5fd762fae6541e3077de5ab1aa"
  },
  {
    id: "devitky",
    slugs: ["devitky", "konec-skoly"],
    title: "Taneční kurzy pro 9. třídy",
    subtitle: "Výuka tanečních pro 9. třídy základní školy",
    buttonLabel: "9. třídy",
    image: "/assets/imgs/downloaded/plakat_tanecni_kurzy_1.webp",
    paragraphs: [
      "Taneční kurzy jsou určeny pro studenty 9. tříd základních škol. Kurz obsahuje 9 lekcí + závěrečný večírek.",
      "Naučíme Vás společenské tance: Waltz, Tango, Valčík, Foxtrot, Čača, Jive, Mambo, Polka a Blues.",
      "Příjemné prostředí, zkušení trenéři a přátelská atmosféra bez zbytečného stresu."
    ],
    when: "leden 2026 – březen 2026",
    where: "Kulturní dům Hlučín",
    price: "viz přihláška",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/115696a4204f6c5f7dcba58921883d90"
  },
  {
    id: "stredoskolky",
    slugs: ["stredoskolky", "tanecni"],
    title: "Taneční kurzy pro středoškoláky",
    subtitle: "Středoškolské taneční kurzy a společenská výchova",
    buttonLabel: "Střední školy",
    image: "/assets/imgs/downloaded/tanecni_ss_kurz_1.webp",
    paragraphs: [
      "Taneční kurzy jsou určeny pro studenty středních škol. Kurz obsahuje 10 lekcí + slavnostní půlkolonu po 5. lekci a závěrečný věneček po 10. lekci.",
      "Naučíme Vás společenské tance: Waltz, Tango, Valčík, Foxtrot, Čača, Jive, Mambo, Polka a Blues.",
      "Po tomto kurzu následuje pokračovací kurz, kde se přiučíte nové tance, ale také nové pokročilejší choreografie."
    ],
    when: "září 2026 – listopad 2026",
    where: "Kulturní dům Hlučín",
    price: "viz přihláška",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/c92f0f7b205016e42b7255009656c739"
  },
  {
    id: "spolecenske",
    slugs: ["spolecenske", "manzelske"],
    title: "Taneční kurzy pro dospělé",
    subtitle: "Manželské a přátelské páry",
    buttonLabel: "Manželské a přátelské páry",
    image: "/assets/imgs/downloaded/soutez_standard_tanec_1.webp",
    paragraphs: [
      "Taneční kurzy pro dospělé jsou určeny pro taneční páry od 18 let, horní věková hranice je neomezena. Kurzy jsou rozděleny na začátečníky, pokročilé a super pokročilé. Každý kurz obsahuje 9 lekcí a je zakončen závěrečným večírkem.",
      "Vyhradíte si čas s partnerem jen pro sebe a příjemný společenský zážitek propojíte s fyzickou aktivitou. Naučíte se nové kroky a variace, získáte nové přátele, budete krásně tančit a to vše v přátelské a pohodové atmosféře.",
      "Naše kurzy Vám 'šijeme přímo na míru', proto se u nás naučí tančit úplně každý a přijdete na to, že tanec je skvělá zábava.",
      "Co na sebe: oblečení společenské, může být i mírně neformální (pánové – kalhoty, košile; dámy – šaty, sukně, společenské kalhoty). Pohodlná obuv vhodná k tanci."
    ],
    when: "Středa 19:00 - 20:30 (Hlučín) / Pondělí 18:00 - 19:30 & Neděle (Ludgeřovice)",
    where: "Kulturní dům Hlučín & Obecní dům Ludgeřovice",
    price: "2 200 Kč / osoba",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/66bdaa163d3d0f6da823bc9c7d3f4d03"
  },
  {
    id: "mladez",
    slugs: ["mladez"],
    title: "Taneční kurzy pro mládež po tanečních",
    subtitle: "Skončilo taneční a chceš pokračovat? Tento kurz je právě pro tebe",
    buttonLabel: "Mládež",
    image: "/assets/imgs/downloaded/soutez_finale_parket_1.webp",
    paragraphs: [
      "Jste mladí a chcete tančit? Máte za sebou taneční kurz pro středoškoláky a je Vám líto, že již skončil, protože Vás tanec nadchl? Tento kurz je určen přímo pro Vás.",
      "Naučíte se nové tance, nové choreografie a techniku tanců, které již znáte. Vytvoříte si novou partu a čekají na Vás skvělé zážitky plné zábavy a hlavně tance.",
      "Můžete se k nám přidat i během školního roku."
    ],
    when: "viz rozvrh klubu",
    where: "ZŠ Čkalovova, Ostrava-Poruba",
    price: "viz kurzovné a platby",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/d13a1f775cd4c08698ae3231adad78e3"
  },
  {
    id: "lr",
    slugs: ["lr", "sport"],
    title: "Výuka sportovního tance",
    subtitle: "Máš ambice vyhrávat medaile, nebo chceš tančit jen pro zábavu?",
    buttonLabel: "Sportovní tanec",
    image: "/assets/imgs/downloaded/soutez_medailove_pozice_1.webp",
    paragraphs: [
      "LR Cosmetic dance team je sportovní taneční klub, který zastřešuje Český svaz tanečního sportu. Zaměřujeme se na latinskoamerické a standardní tance. Výuka probíhá na hobby nebo profesionální úrovni a je jen na Vás, kterou si zvolíte.",
      "Tréninkové možnosti jsou rozděleny do několika kategorií: Děti (od 6 let), Junioři (od 8 let), Mládež (od 14 let), Dospělí (od 18 let).",
      "Vedení pod dohledem mistrů ČR Václava Masaryka a Kláry Chovančíkové."
    ],
    when: "viz rozvrh klubu",
    where: "Ostrava-Poruba ZŠ Čkalovova, Dům tance Stará Bělá, Kulturní dům Hlučín",
    price: "viz kurzovné a platby",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/5aa2b8b6509c8829651e7d51f4528b66"
  }
];

export const CoursesPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();

  const selectedCategory = categorySlug
    ? COURSES_DATA.find((c) => c.slugs.includes(categorySlug) || c.id === categorySlug)
    : null;

  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      {selectedCategory ? (
        /* DETAIL KURZU */
        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="mb-6">
            <HomeButton
              color="#393939"
              content="Nabídka kurzů"
              href="/nabidka-kurzu"
              arrows={false}
            />
          </div>

          <h1 className="mb-8 text-2xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
            {selectedCategory.title}
          </h1>

          {/* FOTOGRAFIE */}
          <div className="mb-10 overflow-hidden border border-neutral-200">
            <img
              src={selectedCategory.image}
              alt={selectedCategory.title}
              className="w-full max-h-[420px] object-cover"
            />
          </div>

          {/* ODSTAVCE DLE CLUBPAGE DESIGNU */}
          <div className="space-y-4 text-[20px] font-light leading-[1.6] text-neutral-500 md:text-[21px]">
            {selectedCategory.paragraphs.map((p, idx) => (
              <p key={idx} className="grid grid-cols-[22px_1fr] gap-x-5">
                <span
                  aria-hidden="true"
                  className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
                >
                  ›
                </span>
                <span>{p}</span>
              </p>
            ))}
          </div>

          {/* TABULKA INFORMACÍ KDY / KDE / CENA */}
          <div className="mt-12 space-y-px border-t border-b border-gray-300">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-base font-semibold text-gray-800">KDY</div>
              <div className="text-base font-normal text-gray-700 text-right">{selectedCategory.when}</div>
            </div>
            <div className="border-t border-gray-200" />
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-base font-semibold text-gray-800">KDE</div>
              <div className="text-base font-normal text-gray-700 text-right">{selectedCategory.where}</div>
            </div>
            <div className="border-t border-gray-200" />
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-base font-semibold text-gray-800">CENA</div>
              <div className="text-base font-normal text-gray-700 text-right">{selectedCategory.price}</div>
            </div>
          </div>

          {/* AKČNÍ TLAČÍTKA */}
          <div className="mt-10 flex flex-wrap gap-4">
            <HomeButton
              color="#393939"
              content="Registrace"
              href={selectedCategory.registrationUrl || "/prihlaska"}
              arrows={true}
            />
            <HomeButton
              color="#ffffff"
              content="Nabídka kurzů"
              href="/nabidka-kurzu"
              arrows={false}
            />
          </div>
        </section>
      ) : (
        /* PŘEHLED VŠECH KURZŮ */
        <section className="mx-auto max-w-5xl px-6 py-14">
          <h1 className="mb-12 text-2xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
            TANEČNÍ KURZY
          </h1>

          <div className="space-y-12">
            {COURSES_DATA.map((course, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={course.id}>
                  <article className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* LEVÝ SLOUPCE */}
                    <div
                      className={`md:col-span-5 ${
                        isEven ? "md:order-1" : "md:order-2"
                      }`}
                    >
                      <div className="overflow-hidden border border-neutral-200 aspect-[4/3] bg-neutral-100">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* PRAVÝ SLOUPCE */}
                    <div
                      className={`md:col-span-7 flex flex-col justify-center ${
                        isEven ? "md:order-2" : "md:order-1"
                      }`}
                    >
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-wide">
                        {course.title}
                      </h2>
                      <p className="mt-3 text-base md:text-lg text-neutral-600 font-light leading-relaxed">
                        {course.subtitle}
                      </p>
                      <div className={`mt-6 ${isEven ? "md:text-right" : "md:text-left"}`}>
                        <HomeButton
                          color="#393939"
                          content={course.buttonLabel}
                          href={`/nabidka-kurzu/${course.slugs[0]}`}
                          arrows={isEven}
                        />
                      </div>
                    </div>
                  </article>

                  {/* DĚLÍCÍ ČÁRA MEZI KURZY */}
                  {idx < COURSES_DATA.length - 1 && (
                    <div className="mt-12 border-t border-neutral-300" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};
