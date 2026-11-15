import { useEffect, useRef, useState, type FC } from "react";
import { HelperImage, HelperBackgroundSection } from "../components/ui/HelperImage";
import { CompetitionResultsSlideshow } from "../components/ui/CompetitionResultsSlideshow";
import { HomeButton } from "../components/ui/HomeButton";
import { LightButton, DarkButton } from "../components/ui/ButtonPrefab";
import { getNewsList } from "../api/client";

interface LatestNewsItem {
  id: number;
  headline: string;
  text: string;
  date: string;
  image_url?: string | null;
}

export const HomePage: FC = () => {
  const [latestNews, setLatestNews] = useState<LatestNewsItem | null>(null);
  const newsScrollRef = useRef<HTMLDivElement>(null);
  const [isNewsPaused, setIsNewsPaused] = useState(false);
  const isNewsPausedRef = useRef(false);

  useEffect(() => {
    isNewsPausedRef.current = isNewsPaused;
  }, [isNewsPaused]);

  useEffect(() => {
    getNewsList({ latest: true })
      .then((items) => {
        if (items && items.length > 0) {
          const item = items[0];
          setLatestNews({
            id: item.id || item._id,
            headline: item.headline || item.title,
            text: item.text || item.perex || item.content,
            date: item.date || item.publishedAt,
            image_url: item.image_url || item.image,
          });
        }
      })
      .catch(() => {
        // Tichý fallback
      });
  }, []);

  // Automatický plynulý scroll delšího textu aktuality (zabraňuje nechtěnému roztahování bloku)
  useEffect(() => {
    if (!latestNews) return;

    const el = newsScrollRef.current;
    if (!el) return;

    el.scrollTop = 0;

    let animId: number | null = null;
    let phase: "top_pause" | "scrolling" | "bottom_pause" = "top_pause";
    let phaseElapsed = 0;
    let currentScroll = 0;
    let lastTimestamp: number | null = null;

    const TOP_PAUSE_MS = 2500;
    const BOTTOM_PAUSE_MS = 3000;
    const PIXELS_PER_SECOND = 20;

    const step = (now: number) => {
      if (!lastTimestamp) {
        lastTimestamp = now;
        animId = requestAnimationFrame(step);
        return;
      }

      const dt = now - lastTimestamp;
      lastTimestamp = now;

      if (isNewsPausedRef.current) {
        if (el) currentScroll = el.scrollTop;
        animId = requestAnimationFrame(step);
        return;
      }

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);

      if (maxScroll <= 4) {
        return;
      }

      if (phase === "top_pause") {
        phaseElapsed += dt;
        if (phaseElapsed >= TOP_PAUSE_MS) {
          phase = "scrolling";
          phaseElapsed = 0;
        }
        animId = requestAnimationFrame(step);
        return;
      }

      if (phase === "scrolling") {
        currentScroll += (PIXELS_PER_SECOND * dt) / 1000;
        if (currentScroll >= maxScroll) {
          currentScroll = maxScroll;
          el.scrollTop = maxScroll;
          phase = "bottom_pause";
          phaseElapsed = 0;
        } else {
          el.scrollTop = currentScroll;
        }
        animId = requestAnimationFrame(step);
        return;
      }

      if (phase === "bottom_pause") {
        phaseElapsed += dt;
        if (phaseElapsed >= BOTTOM_PAUSE_MS) {
          el.scrollTop = 0;
          currentScroll = 0;
          phase = "top_pause";
          phaseElapsed = 0;
        }
        animId = requestAnimationFrame(step);
        return;
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [latestNews]);

  return (
    <main className="bg-white font-sans text-neutral-800">
      {/* HERO — obrázek na pozadí přes helper */}
      <HelperBackgroundSection
        baseName="group"
        className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center"
        overlayClassName="bg-black/40"
      >
        <div className="relative z-10 max-w-7xl">
          <h1 className="border-t border-b border-white/70 py-4 text-2xl font-light uppercase tracking-wide text-white sm:text-3xl md:text-6xl">
            Taneční klub LR DANCE TEAM OSTRAVA
          </h1>
          <h2 className="mt-4 sm:mt-6 text-xl font-light uppercase tracking-wide text-white sm:text-2xl md:text-5xl">
            Taneční škola CARMEN
          </h2>
        </div>
      </HelperBackgroundSection>

      {/* AKTUÁLNÍ DĚNÍ — sjednocené záhlaví uprostřed, 2 bloky vedle sebe */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* SJEDNOCENÉ ZÁHLAVÍ UPROSTŘED */}
        <div className="mb-8 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
            Aktuální dění
          </h3>
          {/* DĚLÍCÍ ČÁRA */}
          <div className="border-t border-neutral-300 mt-2" />
        </div>

        {/* 2 SJEDNOCENÉ BLOKY VEDLE SEBE S ODDĚLOVACÍ ČÁROU PŘESNĚ UPROSTŘED */}
        <div className="relative">
          {/* Svislá dělící čára přesně uprostřed (vůči nadpisu i celému kontejneru) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-neutral-200"
          />

          <div className="grid grid-cols-1 items-stretch gap-10 md:gap-0 md:grid-cols-2">
            {/* LEVÝ BLOK: NEJNOVĚJŠÍ AKTUALITA */}
            <div className="flex flex-col justify-between h-full pb-10 md:pb-0 md:pr-10 lg:pr-14 border-b md:border-b-0 border-neutral-200">
              {latestNews ? (
                <div className="flex flex-col justify-between h-full min-h-[360px] md:min-h-[375px]">
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-500 mb-2">
                      <time className="font-semibold text-neutral-500">
                        {new Date(latestNews.date).toLocaleDateString("cs-CZ")}
                      </time>
                    </div>

                    <h4 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight line-clamp-2">
                      {latestNews.headline}
                    </h4>

                    <div
                      ref={newsScrollRef}
                      onMouseEnter={() => setIsNewsPaused(true)}
                      onMouseLeave={() => setIsNewsPaused(false)}
                      onFocus={() => setIsNewsPaused(true)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) setIsNewsPaused(false);
                      }}
                      onTouchStart={() => setIsNewsPaused(true)}
                      onTouchEnd={() => setIsNewsPaused(false)}
                      className="mt-3.5 max-h-[160px] overflow-y-auto pr-1 text-sm md:text-base text-neutral-600 font-light leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <p className="whitespace-pre-line">
                        {latestNews.text}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-center">
                    <DarkButton
                      href={`/aktuality#article-${latestNews.id}`}
                      className="px-6 py-3 font-medium"
                    >
                      Podrobnější informace
                    </DarkButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-full min-h-[360px] md:min-h-[375px]">
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                      Aktuální dění v klubu
                    </h4>
                    <p className="mt-3 text-sm md:text-base text-neutral-600 font-light leading-relaxed">
                      Sledujte pravidelně naše aktuality, ať vám neuniknou žádné důležité informace o trénincích, soustředěních a akcích klubu.
                    </p>
                  </div>
                  <div className="pt-6 flex justify-center">
                    <DarkButton
                      href="/aktuality"
                      className="px-6 py-3 font-medium"
                    >
                      Všechny aktuality
                    </DarkButton>
                  </div>
                </div>
              )}
            </div>

            {/* PRAVÝ BLOK: VÝSLEDKY SOUTĚŽÍ (SLIDESHOW) */}
            <div className="flex flex-col justify-between h-full md:pl-10 lg:pl-14">
              <CompetitionResultsSlideshow className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* PROFESIONÁLNÍ TANEČNÍ KLUB — parallax pruh přes helper */}
      <HelperBackgroundSection
        baseName="vasek_klarka"
        className="flex min-h-[60vh] items-center px-6 py-24"
        overlayClassName="bg-black/55"
      >
        <div className="relative z-10 mx-auto max-w-2xl text-white">
          <h2 className="mb-6 text-3xl font-semibold">Profesionální taneční klub</h2>
          <p className="mb-8 leading-relaxed">
            <span className="mr-2 text-[#939393]">›</span>
            Klub je zaměřen jak na <strong>standardní</strong>, tak <strong>latinskoamerické tance</strong>. Jedním z
            trenérů je také <strong>Václav Masaryk s Klárou Chovančíkovou</strong> – několikanásobný{" "}
            <strong>mistr České republiky</strong> v latinskoamerických tancích. Připoj se a{" "}
            <strong>tancuj s námi</strong>!
          </p>
          {/* Pravidlo: není vedlejší obrázek k nasměrování -> použít LightButton místo HomeButton */}
          <LightButton href="/o-nas" className="px-6 py-3 font-medium">
            O klubu
          </LightButton>
        </div>
      </HelperBackgroundSection>
      
      {/* OD MALÝCH AŽ PO TY VELKÉ — obrázek vlevo, text vpravo (HomeButton směruje vlevo do obrázku) */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <HelperImage
          baseName="junior"
          alt="Dětský taneční pár na soutěži"
          className="aspect-[8/5] w-full"
        />
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Od malých až po ty velké</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-[#939393]">›</span>
            Nabízíme široké <strong>věkové rozpětí</strong>. U nás se najdou děti ze <strong>školky</strong>, ze{" "}
            <strong>školy</strong>, ale také <strong>dospělí tanečníci</strong> různého věku. Neváhejte a{" "}
            <strong>začněte také</strong>!
          </p>
          <HomeButton color="#393939" content="Více o klubu" href="/kurzy" direction="left" />
        </div>
      </section>

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="border-t border-neutral-300" />
      </div>

      {/* TANEČNÍ SOUSTŘEDĚNÍ — text vlevo, obrázek vpravo (HomeButton směruje vpravo do obrázku) */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Taneční soustředění</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-[#939393]">›</span>
            <strong>Několikrát ročně</strong> pořádáme víkendová nebo <strong>týdenní soustředění</strong> zaměřená na{" "}
            <strong>fyzický trénink</strong>, přípravu na velké akce jako MČR a podobně. Soustředění jsou určena pro{" "}
            <strong>všechny věkové kategorie</strong>.
          </p>
          <HomeButton color="#393939" content="Kalendář akcí" href="/kalendar" direction="right" />
        </div>
        <HelperImage
          baseName="hotel"
          alt="Chata pro taneční soustředění"
          className="aspect-[8/5] w-full"
        />
      </section>
    </main>
  );
};
