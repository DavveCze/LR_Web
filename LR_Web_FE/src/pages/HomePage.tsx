import { useEffect, useState, type FC } from "react";
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
          <h1 className="border-t border-b border-white/70 py-4 text-3xl font-light uppercase tracking-wide text-white md:text-6xl">
            Taneční klub LR DANCE TEAM OSTRAVA
          </h1>
          <h2 className="mt-6 text-2xl font-light uppercase tracking-wide text-white md:text-5xl">
            Taneční škola CARMEN
          </h2>
        </div>
      </HelperBackgroundSection>

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="border-t border-neutral-300" />
      </div>

      {/* AKTUÁLNÍ DĚNÍ — text vlevo, slideshow výsledků soutěží vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-[#939393]">›</span> Aktuální dění
          </h3>

          {/* SPECIÁLNÍ BOX K AKTUÁLNÍMU DĚNÍ (nejnovější titulek s proklikem) */}
          {latestNews ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 shadow-sm transition hover:border-neutral-400">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                <span className="bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded text-[11px] font-bold">
                  Nejnovější aktualita
                </span>
                <time>{new Date(latestNews.date).toLocaleDateString("cs-CZ")}</time>
              </div>
              <a
                href={`/aktuality#article-${latestNews.id}`}
                className="group block"
              >
                <h4 className="text-lg md:text-xl font-bold text-neutral-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {latestNews.headline}
                </h4>
                <p className="mt-2 text-sm text-neutral-600 line-clamp-2 leading-relaxed font-light">
                  {latestNews.text}
                </p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-neutral-900 group-hover:underline">
                  Zobrazit podrobnější informace ›
                </span>
              </a>
            </div>
          ) : (
            <p className="text-neutral-700">
              Snažíme se stránky udržovat, proto je dobré sledovat aktuality.
            </p>
          )}
        </div>

        {/* Výsledky soutěží za poslední víkend ve slideshow */}
        <CompetitionResultsSlideshow className="w-full" />
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
