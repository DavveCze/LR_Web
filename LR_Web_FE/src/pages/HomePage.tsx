import { useEffect, useState, type FC } from "react";
import { Link } from "react-router-dom";
import { HelperImage, HelperBackgroundSection } from "../components/ui/HelperImage";
import { CompetitionResultsSlideshow } from "../components/ui/CompetitionResultsSlideshow";
import { HomeButton } from "../components/ui/HomeButton";
import { LightButton } from "../components/ui/ButtonPrefab";
import { apiUrl } from "../api/client";

interface LatestNewsItem {
  id: number;
  headline: string;
  text: string;
  date: string;
  image_url?: string | null;
}

export const HomePage: FC = () => {
  const [latestNews, setLatestNews] = useState<LatestNewsItem | null>(null);

  useEffect(() => {
    fetch(apiUrl("news.php?latest=1"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === "success" && data.data) {
          setLatestNews(data.data as LatestNewsItem);
        }
      })
      .catch(() => {
        // Tichý fallback
      });
  }, []);

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

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="border-t border-neutral-300" />
      </div>

      {/* AKTUÁLNÍ DĚNÍ — sjednocené záhlaví uprostřed, 2 bloky vedle sebe */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* SJEDNOCENÉ ZÁHLAVÍ UPROSTŘED */}
        <div className="mb-8 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
            Aktuální dění
          </h3>
        </div>

        {/* 2 SJEDNOCENÉ BLOKY VEDLE SEBE */}
        <div className="grid grid-cols-1 items-start gap-8 md:gap-10 md:grid-cols-2">
          {/* LEVÝ BLOK: NEJNOVĚJŠÍ AKTUALITA */}
          {latestNews ? (
            <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-5 md:p-6 shadow-sm min-h-[320px] md:aspect-[8/5] md:min-h-[345px] transition hover:border-neutral-400">
              <Link
                to={`/aktuality#article-${latestNews.id}`}
                className="group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 rounded bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-neutral-800">
                      Nejnovější aktualita
                    </span>
                    <time className="font-semibold text-neutral-600">
                      {new Date(latestNews.date).toLocaleDateString("cs-CZ")}
                    </time>
                  </div>

                  <p className="mt-1 text-[11px] text-neutral-500 italic">
                    Zprávy z klubu a taneční školy CARMEN:
                  </p>

                  <h4 className="mt-2.5 text-xl md:text-2xl font-bold text-neutral-900 tracking-tight line-clamp-2 group-hover:text-neutral-700 transition-colors">
                    {latestNews.headline}
                  </h4>

                  <p className="mt-3 text-sm md:text-base text-neutral-600 font-light leading-relaxed line-clamp-3">
                    {latestNews.text}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between">
                  <span className="inline-flex items-center text-xs font-semibold text-neutral-900 group-hover:underline">
                    Zobrazit podrobnější informace ›
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Přečíst článek
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-5 md:p-6 shadow-sm min-h-[320px] md:aspect-[8/5] md:min-h-[345px]">
              <div>
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-500">
                  <span className="inline-flex items-center gap-1.5 rounded bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-neutral-800">
                    Aktuality
                  </span>
                </div>
                <h4 className="mt-2.5 text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                  Aktuální dění v klubu
                </h4>
                <p className="mt-3 text-sm md:text-base text-neutral-600 font-light leading-relaxed">
                  Sledujte pravidelně naše aktuality, ať vám neuniknou žádné důležité informace o trénincích, soustředěních a akcích klubu.
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between">
                <Link
                  to="/aktuality"
                  className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:underline"
                >
                  Přejít na aktuality ›
                </Link>
              </div>
            </div>
          )}

          {/* PRAVÝ BLOK: VÝSLEDKY SOUTĚŽÍ (SLIDESHOW) */}
          <CompetitionResultsSlideshow className="w-full" />
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

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="border-t border-neutral-300" />
      </div>

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
