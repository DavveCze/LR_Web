import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";
import { Slideshow } from "../components/ui/Slideshow";
import { RajceGallery } from "../components/gallery/RajceGallery";
import { PageHeader } from "../components/layout/PageHeader";
import { getPageContent } from "../api/client";
import { DEFAULT_CARMEN_DATA, type CarmenContent } from "../constants/carmenData";

type CarmenTab = "tabory" | "prehled" | "tabor" | "primestsky" | "vikend" | "fotogalerie";

export const CarmenPage: React.FC = () => {
  const { subSection } = useParams<{ subSection?: string }>();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isTabory =
    path === "/tabory" ||
    path.startsWith("/tabory/") ||
    subSection === "tabory" ||
    path.endsWith("/tabory");

  const activeTab: CarmenTab =
    path.includes("fotogalerie") || subSection === "fotogalerie"
      ? "fotogalerie"
      : path.includes("primestsky") || subSection === "primestsky"
      ? "primestsky"
      : path.includes("vikend") || subSection === "vikend"
      ? "vikend"
      : isTabory
      ? "tabory"
      : path.includes("tabor") || subSection === "tabor"
      ? "tabor"
      : "prehled";
  const [content, setContent] = useState<CarmenContent>(DEFAULT_CARMEN_DATA);

  useEffect(() => {
    let isMounted = true;
    getPageContent<Partial<CarmenContent>>("carmen")
      .then((data) => {
        if (isMounted && data && typeof data === "object" && Object.keys(data).length > 0) {
          setContent((prev) => ({
            overview: { ...prev.overview, ...(data.overview || {}) },
            tabory: { ...prev.tabory, ...(data.tabory || {}) },
            tabor: { ...prev.tabor, ...(data.tabor || {}) },
            primestsky: { ...prev.primestsky, ...(data.primestsky || {}) },
            vikend: { ...prev.vikend, ...(data.vikend || {}) },
            fotogalerie: {
              title: data.fotogalerie?.title || prev.fotogalerie.title,
              albums: Array.isArray(data.fotogalerie?.albums)
                ? data.fotogalerie.albums
                : prev.fotogalerie.albums,
            },
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

  const getCarmenTitle = () => {
    switch (activeTab) {
      case "tabory":
        return content.tabory?.title || "Tábory";
      case "tabor":
        return content.tabor.title || "Spací tábor";
      case "primestsky":
        return content.primestsky.title || "Příměstský tábor";
      case "vikend":
        return content.vikend.title || "Taneční víkend";
      case "fotogalerie":
        return "Fotogalerie Carmen";
      default:
        return content.overview.title || "Taneční škola Carmen";
    }
  };

  return (
    <div>
      <PageHeader title={getCarmenTitle()} />
      <main className="w-full bg-white font-sans text-neutral-800 pt-6 pb-24">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {/* 1. ZÁLOŽKA: PŘEHLED (TŠ CARMEN - 1:1 DLE SCREENSHOTU) */}
          {activeTab === "prehled" && (
            <section className="space-y-10">

            {/* ODSTAVCE S CHEVRONEM › A ZVÝRAZNĚNÝM TEXTEM */}
            <div className="space-y-6 text-base md:text-[20px] font-light leading-[1.6] text-neutral-600">
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
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 max-w-2xl mx-auto w-full pt-4">
              <DarkButton
                href={content.overview.facebookUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
              >
                FACEBOOK
              </DarkButton>
              <DarkButton
                href={content.overview.galleryUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
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

        {/* 2. ZÁLOŽKA: TÁBORY (PŘESNĚ DLE PŘEDLOHY: JEN DVA BUTTONY A TEXT) */}
        {activeTab === "tabory" && (
          <section className="max-w-4xl mx-auto pt-4 sm:pt-6 pb-12">
            {/* DVA BUTTONY */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 max-w-2xl mx-auto w-full mb-12 sm:mb-16">
              <DarkButton
                href="/carmen/tabor"
                isBig
                className="justify-center text-center flex-1 sm:flex-initial"
              >
                Spací tábor
              </DarkButton>
              <DarkButton
                href="/carmen/primestsky"
                isBig
                className="justify-center text-center flex-1 sm:flex-initial"
              >
                Příměstský tábor
              </DarkButton>
            </div>

            {/* TEXTOVÝ OBSAH */}
            <div className="space-y-6 text-base sm:text-[18px] text-neutral-700 font-light leading-[1.7]">
              {content.tabory?.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* 3. ZÁLOŽKA: SPACÍ TÁBOR */}
        {activeTab === "tabor" && (
          <section className="space-y-8">
            {/* HORNÍ TLAČÍTKO REGISTRACE */}
            <div className="flex justify-center">
              <DarkButton
                href={content.tabor.registrationUrl}
                isBig
                isCentered
                className="uppercase tracking-wider font-bold"
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
            <div className="space-y-4 text-base md:text-[19px] font-light leading-[1.6] text-neutral-600 pt-4">
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
            <div className="flex justify-center pt-4">
              <DarkButton
                href={content.tabor.registrationUrl}
                isBig
                isCentered
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE
              </DarkButton>
            </div>
          </section>
        )}

        {/* 3. ZÁLOŽKA: PŘÍMĚSTSKÝ TÁBOR */}
        {activeTab === "primestsky" && (
          <section className="space-y-8">
            {/* DVĚ TLAČÍTKA REGISTRACE (ČERVENEC & SRPEN) */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 max-w-2xl mx-auto w-full">
              <DarkButton
                href={content.primestsky.julyUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
              >
                REGISTRACE (ČERVENEC)
              </DarkButton>
              <DarkButton
                href={content.primestsky.augustUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
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
            <div className="space-y-4 text-base md:text-[19px] font-light leading-[1.6] text-neutral-600 pt-4">
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
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 max-w-2xl mx-auto w-full pt-4">
              <DarkButton
                href={content.primestsky.julyUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
              >
                REGISTRACE (ČERVENEC)
              </DarkButton>
              <DarkButton
                href={content.primestsky.augustUrl}
                isBig
                className="uppercase tracking-wider font-bold justify-center text-center flex-1 sm:flex-initial"
              >
                REGISTRACE (SRPEN)
              </DarkButton>
            </div>
          </section>
        )}

        {/* 4. ZÁLOŽKA: TANEČNÍ VÍKEND */}
        {activeTab === "vikend" && (
          <section className="space-y-8">
            {/* HORNÍ TLAČÍTKO REGISTRACE */}
            <div className="flex justify-center">
              <DarkButton
                href={content.vikend.registrationUrl}
                isBig
                isCentered
                className="uppercase tracking-wider font-bold"
              >
                REGISTRACE
              </DarkButton>
            </div>

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
            <div className="space-y-4 text-base md:text-[19px] font-light leading-[1.6] text-neutral-600">
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

            {/* DOLNÍ TLAČÍTKO REGISTRACE */}
            <div className="flex justify-center pt-4">
              <DarkButton
                href={content.vikend.registrationUrl}
                isBig
                isCentered
                className="uppercase tracking-wider font-bold"
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
    </main>
  </div>
);
};
