import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { ensureLoadedImg } from "../js/img_load_helper.js";
import { Slideshow } from "../components/ui/Slideshow";
import { HomeButton } from "../components/ui/HomeButton";

/**
 * Hook, který asynchronně vyřeší nejlepší dostupnou WebP variantu pro daný
 * baseName přes ensureLoadedImg a poté ji na pozadí opakovaně zkouší
 * vylepšit (dokud se kvalita dvakrát po sobě nezmění, pak polling zastaví).
 * Dokud se první výsledek nenačte, vrací null (zobrazíme skeleton).
 */
function useRefreshingAsset(
  baseName: string,
  pageFolder = "home_imgs",
  refreshIntervalMs = 5000
) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let lastSrc: string | null = null;
    let stableCount = 0;

    const loadAsset = async () => {
      const resolved = await ensureLoadedImg(baseName, "/assets/imgs", pageFolder);
      if (!isMounted) return;

      setSrc(resolved);

      if (resolved === lastSrc) {
        stableCount += 1;
        if (stableCount >= 2) {
          clearInterval(intervalId);
        }
      } else {
        stableCount = 0;
        lastSrc = resolved;
      }
    };

    loadAsset();
    const intervalId = setInterval(loadAsset, refreshIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [baseName, pageFolder, refreshIntervalMs]);

  return src;
}

/**
 * Stejná logika jako useRefreshingAsset, ale pro víc obrázků najednou.
 * baseNames je stabilizované přes useMemo na základě obsahu, ne reference,
 * aby se effect nespouštěl znovu při každém renderu.
 */
function useRefreshingAssets(
  baseNames: string[],
  pageFolder = "home_imgs",
  refreshIntervalMs = 5000
) {
  const [srcs, setSrcs] = useState<(string | null)[]>(() => Array(baseNames.length).fill(null));
  const namesKey = useMemo(() => baseNames.join("|"), [baseNames]);

  useEffect(() => {
    let isMounted = true;
    const names = namesKey.split("|");
    let lastKey = "";
    let stableCount = 0;

    const loadAssets = async () => {
      const resolved = await Promise.all(
        names.map((name) => ensureLoadedImg(name, "/assets/imgs", pageFolder))
      );
      if (!isMounted) return;

      setSrcs(resolved);

      const currentKey = resolved.join("|");
      if (currentKey === lastKey) {
        stableCount += 1;
        if (stableCount >= 2) {
          clearInterval(intervalId);
        }
      } else {
        stableCount = 0;
        lastKey = currentKey;
      }
    };

    loadAssets();
    const intervalId = setInterval(loadAssets, refreshIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [namesKey, pageFolder, refreshIntervalMs]);

  return srcs;
}

/**
 * Znovupoužitelný <img>, který čeká na vyřešení assetu přes helper a pak
 * na pozadí postupně zkouší vylepšit kvalitu (useRefreshingAsset je teď
 * jediný zdroj pravdy pro src — žádné duplicitní volání helperu).
 */
const HelperImage: FC<{
  baseName: string;
  pageFolder?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
}> = ({
  baseName,
  pageFolder = "home_imgs",
  alt,
  className,
  width = 800,
  height = 500,
  loading = "lazy",
}) => {
  const src = useRefreshingAsset(baseName, pageFolder);
  const [isDecoded, setIsDecoded] = useState(false);

  useEffect(() => {
    if (!src) return;
    setIsDecoded(false);
    const img = new Image();
    img.src = src;
    img.onload = () => setIsDecoded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className ?? ""}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isDecoded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-neutral-200" aria-hidden="true" />
      )}
    </div>
  );
};

/**
 * Sekce s obrázkem na pozadí (hero, parallax), napojená na helper.
 * Používá stejný refreshing hook, takže se i pozadí postupně vylepšuje.
 */
const HelperBackgroundSection: FC<{
  baseName: string;
  pageFolder?: string;
  className?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}> = ({ baseName, pageFolder = "home_imgs", className, overlayClassName, children }) => {
  const src = useRefreshingAsset(baseName, pageFolder);

  return (
    <section
      className={`relative bg-cover bg-center bg-fixed transition-[background-image] duration-500 ${className ?? ""}`}
      style={{
        backgroundImage: src ? `url('${src}')` : undefined,
        backgroundColor: src ? undefined : "#e5e5e5",
      }}
    >
      <div className={`absolute inset-0 ${overlayClassName ?? ""}`} />
      {children}
    </section>
  );
};

export const HomePage: FC = () => {
  const aktualitySrc = useRefreshingAssets(["akademie", "sousko", "sousko1", "sousko2"], "home_imgs");
  // Map resolved srcs to Slideshow's expected {src, alt} shape, filtering unresolved (null) entries
  const aktualityImages = aktualitySrc
    .map((s, i) => (s ? { src: s, alt: `Aktualita ${i + 1}` } : null))
    .filter((v): v is { src: string; alt: string } => v !== null);

  return (
    <main className="bg-white font-sans text-neutral-800">

      {/* HERO — obrázek na pozadí přes helper (assets/home_imgs/hero_1.webp, _2, _3) */}
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

      {/* AKTUÁLNÍ DĚNÍ — text vlevo, slideshow vpravo (obrázky přes helper) */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-[939393]">›</span> Aktuální dění
          </h3>
          <p className="mb-6 text-neutral-700">
            Snažíme se stránky udržovat, proto je dobré sledovat aktuality.
          </p>
          <HomeButton color="#393939" content="Aktuality" href="/aktuality" arrows={true} />
        </div>

        {aktualityImages.length > 0 ? (
          <Slideshow images={aktualityImages} className="aspect-[8/5] w-full" />
        ) : (
          <div className="aspect-[8/5] w-full bg-neutral-200 animate-pulse" aria-hidden="true" />
        )}
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
            <span className="mr-2 text-[939393]">›</span>
            Klub je zaměřen jak na <strong>standardní</strong>, tak <strong>latinskoamerické tance</strong>. Jedním z
            trenérů je také <strong>Václav Masaryk s Klárou Chovančíkovou</strong> – několikanásobný{" "}
            <strong>mistr České republiky</strong> v latinskoamerických tancích. Připoj se a{" "}
            <strong>tancuj s námi</strong>!
          </p>
          <HomeButton color="#ffffff" content="O klubu" href="/o-nas" arrows={false} />
        </div>
      </HelperBackgroundSection>

      {/* OD MALÝCH AŽ PO TY VELKÉ — obrázek přes helper vlevo, text vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <HelperImage
          baseName="junior"
          alt="Dětský taneční pár na soutěži"
          className="aspect-[8/5] w-full"
        />
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Od malých až po ty velké</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-[939393]">›</span>
            Nabízíme široké <strong>věkové rozpětí</strong>. U nás se najdou děti ze <strong>školky</strong>, ze{" "}
            <strong>školy</strong>, ale také <strong>dospělí tanečníci</strong> různého věku. Neváhejte a{" "}
            <strong>začněte také</strong>!
          </p>
          <HomeButton color="#393939" content="Více o klubu" href="/kurzy" arrows={false} />
        </div>
      </section>

      {/* TANEČNÍ SOUSTŘEDĚNÍ — text vlevo, obrázek přes helper vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Taneční soustředění</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-[939393]">›</span>
            <strong>Několikrát ročně</strong> pořádáme víkendová nebo <strong>týdenní soustředění</strong> zaměřená na{" "}
            <strong>fyzický trénink</strong>, přípravu na velké akce jako MČR a podobně. Soustředění jsou určena pro{" "}
            <strong>všechny věkové kategorie</strong>.
          </p>
          <HomeButton color="#393939" content="Kalendář akcí" href="/kalendar" arrows={true} />
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