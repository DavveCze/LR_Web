import React, { FC, useEffect, useMemo, useState } from "react";
import { ensureLoadedImg } from "../../js/img_load_helper";


/**
 * Hook, který asynchronně vyřeší nejlepší dostupnou WebP variantu pro daný
 * baseName přes ensureLoadedImg a poté ji na pozadí opakovaně zkouší
 * vylepšit (dokud se kvalita dvakrát po sobě nezmění, pak polling zastaví).
 * Dokud se první výsledek nenačte, vrací null (zobrazíme skeleton).
 */
export function useRefreshingAsset(
  baseName: string,
  pageFolder: string = "home_imgs",
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
export function useRefreshingAssets(
  baseNames: string[],
  pageFolder: string = "home_imgs",
  refreshIntervalMs: number = 5000
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
export const HelperImage: FC<{
  baseName: string;
  pageFolder?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
}> = ({ baseName, pageFolder, alt, className, width, height, loading }) => {
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
export const HelperBackgroundSection: FC<{
  baseName: string;
  pageFolder?: string;
  className?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}> = ({ baseName, pageFolder, className, overlayClassName, children }) => {
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
