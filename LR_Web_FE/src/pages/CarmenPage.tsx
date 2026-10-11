import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";
import { Slideshow } from "../components/ui/Slideshow";
import { PartnersSection } from "../components/ui/PartnersSection";
import { RajceGallery } from "../components/gallery/RajceGallery";
import { apiUrl } from "../api/client";

type CarmenTab = "prehled" | "tabor" | "primestsky" | "vikend" | "fotogalerie";

interface CarmenContentData {
  overview: {
    title: string;
    bullets: string[];
    facebookUrl: string;
    galleryUrl: string;
    slideshow: { src: string; alt?: string }[];
  };
  tabor: {
    title: string;
    paragraphs: string[];
    location: string;
    age: string;
    food: string;
    poster: string;
    registrationUrl: string;
  };
  primestsky: {
    title: string;
    paragraphs: string[];
    location: string;
    terms: string;
    food: string;
    julyUrl: string;
    augustUrl: string;
    poster: string;
  };
  vikend: {
    title: string;
    paragraphs: string[];
    term: string;
    location: string;
    price: string;
    poster: string;
    registrationUrl: string;
  };
  fotogalerie: {
    title: string;
    albums: { id: string; title: string; image: string; url: string }[];
  };
}

const DEFAULT_CARMEN_CONTENT: CarmenContentData = {
  overview: {
    title: "TŠ CARMEN",
    bullets: [
      "Taneční školu Carmen založila Lucie Skopalíková v roce 2000. Zaměřujeme se na práci s dětmi v mateřských a základních školách.",
      "Nabízíme bohaté a kvalitní zkušenosti v oblasti výuky tance, rozvoj pohybu a koordinace dítěte, spoustu zážitků, legrace a her, mnohaletou praxi s dětmi. Výuka probíhá přímo ve školce či škole, takže nemusíte nikam dojíždět. Závěr kurzu je ukončen velkolepou taneční akademií v kulturním domě Akord. Možnost pokračování ve sportovním klubu LR Dance team Ostrava.",
      "Během roku pořádáme další aktivity pro děti jako jsou např. víkendové pobyty, o prázdninách - spací tábor a také příměstské tábory.",
    ],
    facebookUrl: "https://www.facebook.com/groups/572718036195543",
    galleryUrl: "/carmen/fotogalerie",
    slideshow: [
      { src: "/assets/imgs/carmen/carmen_tanec_1.webp", alt: "Taneční vystoupení Carmen" },
      { src: "/assets/imgs/carmen/carmen_tanec1_1.webp", alt: "Dětský tanec Carmen" },
      { src: "/assets/imgs/carmen/carmen_tanec3_1.webp", alt: "Taneční lekce Carmen" },
      { src: "/assets/imgs/carmen/carmen_skupina_1.webp", alt: "Společné foto dětí Carmen" },
    ],
  },
  tabor: {
    title: "SPACÍ TÁBOR",
    paragraphs: [
      "Letní spací tábor probíhá v RK Budoucnost v krásném prostředí Beskyd (Nová Ves – Frýdlant nad Ostravicí).",
      "Děti čeká celotáborová hra, tréninky v tanečním sále, in-line dráha, diskotéky a koupání.",
    ],
    location: "RK Budoucnost, Frýdlant n. O.",
    age: "od 6 do 17 let",
    food: "Plná penze 5x denně + pitný režim",
    poster: "/assets/imgs/downloaded/plakat_carmen_spaci_tabor_1.webp",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/7276514b04c88c5d5b6d4f6eed82ab20",
  },
  primestsky: {
    title: "PŘÍMĚSTSKÝ TÁBOR",
    paragraphs: [
      "Příměstské tábory pořádáme v Markvartovicích nedaleko Ostravy, kde již kousíček za městem jsme v úplně jiném světě plném přírody.",
      "Děti přicházejí ráno a odpoledne odcházejí domů. Program plný tance, her v přírodě a kamarádů.",
    ],
    location: "Markvartovice u Ostravy",
    terms: "Červenec & Srpen",
    food: "Oběd, svačina, pitný režim, program",
    julyUrl: "https://is.pohodlne.info/udalost/detail/963ee4c7ec8f45e975dc32e22460b0e5",
    augustUrl: "https://is.pohodlne.info/udalost/detail/a7f620f6e30b373bdbc66a86b8c9b407",
    poster: "/assets/imgs/downloaded/plakat_carmen_primestsky_1.webp",
  },
  vikend: {
    title: "TANEČNÍ VÍKEND",
    paragraphs: [
      "Vážení rodiče a milé děti, naše taneční škola pořádá každým rokem různé taneční víkendy a také letní a příměstské tábory. Pro děti máme kromě tanečních tréninků připraveny různé hry, k dispozici máme taneční sál, večer nesmí chybět diskotéka a také si odpočineme ve wellness hotelu Budoucnost.",
      "Chceme vás tímto pozvat na taneční víkend do Frýdlantu nad Ostravicí na hotel Budoucnost, kde máme zázemí v příjemném prostředí Beskyd. Některé děti možná ještě nikde samotné nebyly, proto volíme na začátek pouze víkend, ať nemají děti strach, že budou dlouho bez rodičů, a dvě noci určitě zvládnou. Pro děti se snažíme udělat maximum, aby byly spokojené a víkend si pořádně užily!",
      "Soustředění a tábory pořádáme již 20 let a mezi nejmladší účastníky patří i čtyřleté děti, takže nemusíte mít strach, o vaše děti bude dobře postaráno. Vaše děti si užijí skvělou atmosféru a vy se můžete v klidu odpočinout.",
    ],
    term: "12. 12. – 14. 12. 2026",
    location: "Hotel Budoucnost, Frýdlant nad Ostravicí",
    price: "2 600 Kč (cena zahrnuje ubytování, stravu, pitný režim, tréninky, taneční sál, wellness a dopravu)",
    poster: "/assets/imgs/downloaded/plakat_carmen_vikend_1.webp",
    registrationUrl: "https://is.pohodlne.info/udalost/detail/f1bea44fb1dd886eeeb7945055654da6",
  },
  fotogalerie: {
    title: "FOTOGALERIE CARMEN",
    albums: [
      {
        id: "akademie-2023",
        title: "Akademie 2023",
        image: "/assets/imgs/downloaded/carmen_akademie_2023_1.webp",
        url: "https://www.rajce.idnes.cz/lr-dance/album/ts-carmen",
      },
      {
        id: "akademie-2024",
        title: "Akademie 2024",
        image: "/assets/imgs/downloaded/carmen_akademie_2024_1.webp",
        url: "https://www.rajce.idnes.cz/lr-dance/album/ts-carmen-2024",
      },
      {
        id: "primestsky-2024",
        title: "Příměstské tábory 2024",
        image: "/assets/imgs/downloaded/carmen_primestsky_2024_1.webp",
        url: "https://www.rajce.idnes.cz/lr-dance/album/primestsky-tabor-carmen-2024",
      },
    ],
  },
};

export const CarmenPage: React.FC = () => {
  const { subSection } = useParams<{ subSection?: string }>();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const activeTab: CarmenTab =
    path.includes("fotogalerie") || subSection === "fotogalerie"
      ? "fotogalerie"
      : path.includes("primestsky") || subSection === "primestsky"
      ? "primestsky"
      : path.includes("vikend") || subSection === "vikend"
      ? "vikend"
      : path.includes("tabor") || subSection === "tabor"
      ? "tabor"
      : "prehled";
  const [content, setContent] = useState<CarmenContentData>(DEFAULT_CARMEN_CONTENT);

  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl("content.php?page=carmen"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data === "object" && Object.keys(data).length > 0) {
          setContent((prev) => ({
            overview: { ...prev.overview, ...(data.overview || {}) },
            tabor: { ...prev.tabor, ...(data.tabor || {}) },
            primestsky: { ...prev.primestsky, ...(data.primestsky || {}) },
            vikend: { ...prev.vikend, ...(data.vikend || {}) },
            fotogalerie: { ...prev.fotogalerie, ...(data.fotogalerie || {}) },
          }));
        }
      })
      .catch(() => {
        // Fallback to default
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* 1. ZÁLOŽKA: PŘEHLED (TŠ CARMEN - 1:1 DLE SCREENSHOTU) */}
        {activeTab === "prehled" && (
          <section className="space-y-10">
            {/* HLAVNÍ TITULEK */}
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-neutral-900">
              {content.overview.title}
            </h1>

            {/* ODSTAVCE S CHEVRONEM › A ZVÝRAZNĚNÝM TEXTEM */}
            <div className="space-y-6 text-[18px] md:text-[20px] font-light leading-[1.6] text-neutral-600">
              {content.overview.bullets.map((bullet, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-x-4 items-start">
                  <span
                    aria-hidden="true"
                    className="text-[24px] font-light leading-none text-neutral-400 select-none pt-0.5"
                  >
                    ›
                  </span>
                  <div>
                    {idx === 1 ? (
                      <p>
                        <strong className="font-semibold text-neutral-800">
                          Nabízíme bohaté a kvalitní zkušenosti v oblasti výuky tance, rozvoj pohybu a koordinace dítěte, spoustu zážitků, legrace a her, mnohaletou praxi s dětmi.
                        </strong>{" "}
                        Výuka probíhá přímo ve školce či škole, takže nemusíte nikam dojíždět. Závěr kurzu je ukončen velkolepou taneční akademií v kulturním domě Akord. Možnost pokračování ve sportovním klubu LR Dance team Ostrava.
                      </p>
                    ) : (
                      <p>{bullet}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TLAČÍTKA FACEBOOK A FOTOGALERIE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-4">
              <DarkButton
                href={content.overview.facebookUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                FACEBOOK
              </DarkButton>
              <DarkButton
                href={content.overview.galleryUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                FOTOGALERIE
              </DarkButton>
            </div>

            {/* SLIDESHOW S FOTKAMI */}
            <div className="pt-6">
              <Slideshow
                images={content.overview.slideshow}
                dotsOutside={true}
                className="rounded-none shadow-xs"
              />
            </div>
          </section>
        )}

        {/* 2. ZÁLOŽKA: SPACÍ TÁBOR */}
        {activeTab === "tabor" && (
          <section className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
              {content.tabor.title}
            </h1>

            {/* HORNÍ TLAČÍTKO REGISTRACE */}
            <div className="flex justify-start">
              <DarkButton
                href={content.tabor.registrationUrl}
                className="px-8 py-3 uppercase tracking-wider font-bold text-sm"
              >
                REGISTRACE
              </DarkButton>
            </div>

            {/* PLAKÁT SPACÍHO TÁBORA */}
            <div className="overflow-hidden border border-neutral-200 bg-neutral-50 shadow-xs max-w-2xl mx-auto">
              <img
                src={content.tabor.poster}
                alt="Plakát spacího tábora CARMEN"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>

            {/* POPIS A INFORMACE */}
            <div className="space-y-4 text-[18px] md:text-[19px] font-light leading-[1.6] text-neutral-600 pt-4">
              {content.tabor.paragraphs.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-x-4 items-start">
                  <span aria-hidden="true" className="text-[24px] font-light leading-none text-neutral-400 select-none pt-0.5">
                    ›
                  </span>
                  <p>{p}</p>
                </div>
              ))}
            </div>

            {/* TABULKA SPECIFIKACÍ */}
            <div className="space-y-px border-t border-b border-neutral-200 mt-6">
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Lokalita</span>
                <span className="text-right text-neutral-600">{content.tabor.location}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Věk účastníků</span>
                <span className="text-right text-neutral-600">{content.tabor.age}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Strava</span>
                <span className="text-right text-neutral-600">{content.tabor.food}</span>
              </div>
            </div>

            {/* DOLNÍ TLAČÍTKO REGISTRACE */}
            <div className="flex justify-start pt-4">
              <DarkButton
                href={content.tabor.registrationUrl}
                className="px-8 py-3 uppercase tracking-wider font-bold text-sm"
              >
                REGISTRACE
              </DarkButton>
            </div>
          </section>
        )}

        {/* 3. ZÁLOŽKA: PŘÍMĚSTSKÝ TÁBOR */}
        {activeTab === "primestsky" && (
          <section className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
              {content.primestsky.title}
            </h1>

            {/* DVĚ TLAČÍTKA REGISTRACE (ČERVENEC & SRPEN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <DarkButton
                href={content.primestsky.julyUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE (ČERVENEC)
              </DarkButton>
              <DarkButton
                href={content.primestsky.augustUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE (SRPEN)
              </DarkButton>
            </div>

            {/* PLAKÁT PŘÍMĚSTSKÉHO TÁBORA */}
            <div className="overflow-hidden border border-neutral-200 bg-neutral-50 shadow-xs max-w-2xl mx-auto">
              <img
                src={content.primestsky.poster}
                alt="Plakát příměstského tábora CARMEN"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>

            {/* POPIS A INFORMACE */}
            <div className="space-y-4 text-[18px] md:text-[19px] font-light leading-[1.6] text-neutral-600 pt-4">
              {content.primestsky.paragraphs.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-x-4 items-start">
                  <span aria-hidden="true" className="text-[24px] font-light leading-none text-neutral-400 select-none pt-0.5">
                    ›
                  </span>
                  <p>{p}</p>
                </div>
              ))}
            </div>

            {/* SPECIFIKACE */}
            <div className="space-y-px border-t border-b border-neutral-200 mt-6">
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Místo konání</span>
                <span className="text-right text-neutral-600">{content.primestsky.location}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Termíny</span>
                <span className="text-right text-neutral-600">{content.primestsky.terms}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">V ceně</span>
                <span className="text-right text-neutral-600">{content.primestsky.food}</span>
              </div>
            </div>

            {/* DOLNÍ TLAČÍTKA REGISTRACE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-4">
              <DarkButton
                href={content.primestsky.julyUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE (ČERVENEC)
              </DarkButton>
              <DarkButton
                href={content.primestsky.augustUrl}
                isFlexible
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE (SRPEN)
              </DarkButton>
            </div>
          </section>
        )}

        {/* 4. ZÁLOŽKA: TANEČNÍ VÍKEND */}
        {activeTab === "vikend" && (
          <section className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
              {content.vikend.title}
            </h1>

            {/* FOTOGRAFIE / PLAKÁT VÍKENDU */}
            <div className="overflow-hidden border border-neutral-200 bg-neutral-50 shadow-xs max-w-3xl mx-auto">
              <img
                src={content.vikend.poster}
                alt="Taneční víkend soustředění"
                className="w-full max-h-[460px] object-cover"
                loading="eager"
              />
            </div>

            {/* TEXTOVÝ OBSAH */}
            <div className="space-y-4 text-[18px] md:text-[19px] font-light leading-[1.6] text-neutral-600">
              {content.vikend.paragraphs.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-x-4 items-start">
                  <span aria-hidden="true" className="text-[24px] font-light leading-none text-neutral-400 select-none pt-0.5">
                    ›
                  </span>
                  <p>{p}</p>
                </div>
              ))}
            </div>

            {/* INFORMACE O TERMÍNU A CENĚ */}
            <div className="space-y-px border-t border-b border-neutral-200 mt-6">
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Termín víkendu</span>
                <span className="text-right text-neutral-600 font-semibold">{content.vikend.term}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Lokalita</span>
                <span className="text-right text-neutral-600">{content.vikend.location}</span>
              </div>
              <div className="border-t border-neutral-200" />
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <span className="font-semibold text-neutral-800">Cena</span>
                <span className="text-right text-neutral-600">{content.vikend.price}</span>
              </div>
            </div>

            {/* TLAČÍTKO REGISTRACE */}
            <div className="flex justify-start pt-4">
              <DarkButton
                href={content.vikend.registrationUrl}
                className="px-8 py-3 uppercase tracking-wider font-bold text-sm"
              >
                REGISTRACE
              </DarkButton>
            </div>
          </section>
        )}

        {/* 5. ZÁLOŽKA: FOTOGALERIE CARMEN (INTERAKTIVNÍ RAJČE GALERIE) */}
        {activeTab === "fotogalerie" && (
          <section className="pt-2">
            <RajceGallery
              fixedCategory="carmen"
              title={content.fotogalerie.title || "FOTOGALERIE TŠ CARMEN"}
              description="Fotoalba z příměstských táborů, víkendových soustředění a tanečních kolon Taneční školy Carmen."
            />
          </section>
        )}
      </div>

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};
