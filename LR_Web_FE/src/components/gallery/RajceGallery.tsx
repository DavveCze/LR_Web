import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getRajceAlbums, getRajceAlbumPhotos, RajceAlbum, RajcePhoto } from "../../api/rajce";

// Výchozí záložní alba pro případ výpadku sítě nebo offline vývoje
const FALLBACK_ALBUMS: RajceAlbum[] = [
  {
    id: "soustredeni-leto-2026",
    title: "Soustředění LÉTO 2026",
    url: "https://www.rajce.idnes.cz/lr-dance/album/soustredeni-leto-2026",
    coverUrl: "https://img44.rajce.idnes.cz/d4403/20/20047/20047611_d68bb8f1e44638f35241bc6b3c07fe58/thumb/DSC01407.jpg?ver=0",
    date: "Mon, 27 Jul 2026 11:18:50 +0200",
    category: "club",
    tags: ["tanec", "soustredeni", "leto"],
  },
  {
    id: "novorocni-soustredeni-2026",
    title: "Novoroční Soustředění 2026",
    url: "https://www.rajce.idnes.cz/lr-dance/album/novorocni-soustredeni-2026",
    coverUrl: "https://img43.rajce.idnes.cz/d4303/19/19873/19873031_10b7cd7c4c933f96221899d7ffee559a/thumb/DSC09040.jpg?ver=0",
    date: "Wed, 11 Feb 2026 08:41:44 +0100",
    category: "club",
    tags: ["tanec", "zima"],
  },
  {
    id: "kolona-tanecni-carmen-2025-ctvrtek",
    title: "KOLONA taneční CARMEN 2025 - ČTVRTEK",
    url: "https://www.rajce.idnes.cz/lr-dance/album/kolona-tanecni-carmen-2025-ctvrtek",
    coverUrl: "https://img44.rajce.idnes.cz/d4402/19/19802/19802197_a09bb3724b31cf917c439ce24dd9accb/thumb/DSC01511.jpg?ver=0",
    date: "Mon, 01 Dec 2025 15:07:32 +0100",
    category: "carmen",
    tags: ["carmen", "kolona"],
  },
  {
    id: "soustredeni-leto-2025",
    title: "Soustředění LÉTO 2025",
    url: "https://www.rajce.idnes.cz/lr-dance/album/soustredeni-leto-2025",
    coverUrl: "https://img41.rajce.idnes.cz/d4103/19/19690/19690564_93a0c5ad20eb9e4c4edd04053f78fb1b/thumb/DSC05192.jpg?ver=0",
    date: "Tue, 26 Aug 2025 19:26:47 +0200",
    category: "club",
    tags: ["tanec", "leto"],
  },
  {
    id: "ts-carmen-2025",
    title: "TŠ Carmen 2025",
    url: "https://www.rajce.idnes.cz/lr-dance/album/ts-carmen-2025",
    coverUrl: "https://img42.rajce.idnes.cz/d4202/19/19584/19584223_4fe59a86690cca72406ce0412e1fa932/thumb/DSC03222.jpg?ver=0",
    date: "Thu, 29 May 2025 08:37:53 +0200",
    category: "carmen",
    tags: ["carmen", "tanec"],
  },
  {
    id: "primestsky-tabor-carmen-2024",
    title: "Příměstský tábor CARMEN 2024",
    url: "https://www.rajce.idnes.cz/lr-dance/album/primestsky-tabor-carmen-2024",
    coverUrl: "https://img43.rajce.idnes.cz/d4303/19/19235/19235354_21f3a3f9f6bb83b457e31183eef7f87e/thumb/DSC_0425.jpg?ver=0",
    date: "Sat, 24 Aug 2024 12:54:36 +0200",
    category: "carmen",
    tags: ["carmen", "tabor", "deti"],
  },
  {
    id: "ts-carmen-2024",
    title: "TŠ Carmen 2024",
    url: "https://www.rajce.idnes.cz/lr-dance/album/ts-carmen-2024",
    coverUrl: "https://img43.rajce.idnes.cz/d4301/19/19067/19067208_60655a3639fee850979a5da366a9514a/thumb/DSC_0538.jpg?ver=0",
    date: "Thu, 23 May 2024 10:53:35 +0200",
    category: "carmen",
    tags: ["carmen", "tanec"],
  },
  {
    id: "ts-carmen",
    title: "TŠ Carmen 2023",
    url: "https://www.rajce.idnes.cz/lr-dance/album/ts-carmen",
    coverUrl: "https://img41.rajce.idnes.cz/d4103/18/18465/18465127_c51e78c3481a8f20a829a066dc48416a/thumb/DSC_0686.jpg?ver=0",
    date: "Fri, 05 May 2023 06:09:07 +0200",
    category: "carmen",
    tags: ["carmen"],
  },
];

function formatCzechDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export interface RajceGalleryProps {
  defaultCategory?: "all" | "club" | "carmen";
  fixedCategory?: "all" | "club" | "carmen";
  title?: string;
  description?: string;
  hideCategoryFilters?: boolean;
  className?: string;
}

export const RajceGallery: React.FC<RajceGalleryProps> = ({
  defaultCategory = "all",
  fixedCategory,
  title,
  description,
  hideCategoryFilters = false,
  className = "",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Zjištění kategorie z parametrů URL nebo výchozí prop (pokud není kategorie pevně zafixována)
  const queryCat = searchParams.get("kategorie");
  const initialCategory: "all" | "club" | "carmen" =
    fixedCategory ??
    (queryCat === "carmen" || queryCat === "club" || queryCat === "all"
      ? queryCat
      : defaultCategory);

  const [filter, setFilter] = useState<"all" | "club" | "carmen">(initialCategory);
  const effectiveCategory = fixedCategory ?? filter;
  const shouldHideFilters = hideCategoryFilters || !!fixedCategory;
  const [albums, setAlbums] = useState<RajceAlbum[]>(FALLBACK_ALBUMS);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState<boolean>(true);

  // Stav pro aktivní otevřené album (In-Gallery Viewer)
  const [activeAlbum, setActiveAlbum] = useState<RajceAlbum | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<RajcePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Inkrementální render fotek (stránkování v paměti pro plynulý výkon)
  const [renderedCount, setRenderedCount] = useState<number>(48);

  // Lightbox
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Načtení alb z backendu při inicializaci
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAlbums(true);

    getRajceAlbums()
      .then((data) => {
        if (isMounted) {
          if (data && data.length > 0) {
            setAlbums(data);
          }
          setIsLoadingAlbums(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAlbums(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Automatické otevření alba, pokud je v URL parametr ?album=...
  // Otevření detailu alba
  const handleOpenAlbum = async (album: RajceAlbum) => {
    setActiveAlbum(album);
    setIsLoadingPhotos(true);
    setPhotoError(null);
    setAlbumPhotos([]);
    setRenderedCount(48);
    setActiveLightboxIndex(null);

    // Zachování stávajících parametrů a nastavení parametru album
    const newParams = new URLSearchParams(searchParams);
    newParams.set("album", album.id);
    setSearchParams(newParams);

    try {
      const res = await getRajceAlbumPhotos(album.url);
      if (res && res.photos && res.photos.length > 0) {
        setAlbumPhotos(res.photos);
      } else {
        setPhotoError("V tomto albu nebyly nalezeny žádné fotografie nebo album není veřejné.");
      }
    } catch {
      setPhotoError("Nepodařilo se stáhnout fotografie z Rajče.cz. Můžete si album otevřít přímo na Rajčeti.");
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Reakce na URL parametr ?album=xy
  useEffect(() => {
    const targetAlbumId = searchParams.get("album");
    if (!targetAlbumId) return;

    const matched = albums.find((a) => a.id === targetAlbumId);
    if (matched && (!activeAlbum || activeAlbum.id !== matched.id)) {
      handleOpenAlbum(matched);
    }
  }, [searchParams, albums, activeAlbum]);

  // Filtrování alb
  const filteredAlbums = useMemo(() => {
    return albums.filter((item) => (effectiveCategory === "all" ? true : item.category === effectiveCategory));
  }, [albums, effectiveCategory]);

  // Návrat zpět do seznamu alb
  const handleBackToAlbums = () => {
    setActiveAlbum(null);
    setAlbumPhotos([]);
    setActiveLightboxIndex(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("album");
    setSearchParams(newParams);
  };

  // Načíst další fotky
  const handleLoadMore = () => {
    setRenderedCount((prev) => Math.min(prev + 48, albumPhotos.length));
  };

  // Klávesová navigace v Lightboxu
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev > 0 ? prev - 1 : albumPhotos.length - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev < albumPhotos.length - 1 ? prev + 1 : 0) : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, albumPhotos.length]);

  const defaultTitle =
    effectiveCategory === "carmen"
      ? "Fotogalerie TŠ Carmen & Tábory"
      : effectiveCategory === "club"
      ? "Fotogalerie Klub LR Dance"
      : "Klubová fotogalerie";

  const defaultDesc =
    effectiveCategory === "carmen"
      ? "Záběry z letních a příměstských táborů, víkendových soustředění a tanečních kolon TŠ Carmen."
      : "Kompletní archiv fotografií ze soutěží, tréninků a soustředění tanečního klubu LR Dance.";

  return (
    <div className={`w-full ${className}`}>
      {/* =========================================================================
          ZÁHLAVÍ STRÁNKY / SEKCE
      ========================================================================= */}
      <div className="mb-10 border-b-2 border-neutral-900 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {activeAlbum ? (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                <button
                  type="button"
                  onClick={handleBackToAlbums}
                  className="hover:text-neutral-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  ← {effectiveCategory === "carmen" ? "Alba Carmen" : effectiveCategory === "club" ? "Klubová alba" : "Všechna alba"}
                </button>
                <span>/</span>
                <span className="text-neutral-900">
                  {activeAlbum.category === "carmen" ? "Tábory Carmen" : "Klub LR Dance"}
                </span>
              </div>
            ) : null}

            <h2 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">
              {activeAlbum ? activeAlbum.title : title || defaultTitle}
            </h2>
            <p className="mt-2 text-neutral-600 max-w-2xl">
              {activeAlbum ? (
                <>
                  Fotografie ze soustředění, vystoupení a tanečních akcí.
                  {activeAlbum.date ? ` Zveřejněno: ${formatCzechDate(activeAlbum.date)}.` : ""}
                </>
              ) : (
                description || defaultDesc
              )}
            </p>
          </div>

          {/* Akce v záhlaví */}
          <div className="flex flex-wrap items-center gap-3">
            {activeAlbum ? (
              <>
                <button
                  type="button"
                  onClick={handleBackToAlbums}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  ← {effectiveCategory === "carmen" ? "Zpět na alba Carmen" : effectiveCategory === "club" ? "Zpět na klubová alba" : "Zpět na alba"}
                </button>
                <a
                  href={activeAlbum.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Otevřít na Rajče.cz</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </>
            ) : (
              /* FILTRY KATEGORIÍ POUZE POKUD NEJSOU SKRYTÉ */
              !shouldHideFilters && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filter === "all"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    Vše ({albums.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("club")}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filter === "club"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    LR Dance Klub
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("carmen")}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filter === "carmen"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    Tábory Carmen
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          POHLED 1: PŘEHLED FOTOALB
      ========================================================================= */}
      {!activeAlbum && (
        <section aria-label="Seznam alb">
          {isLoadingAlbums ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 mb-4" />
              <p className="text-sm font-medium text-neutral-600">Načítám fotoalba z Rajče.cz...</p>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 border border-neutral-200">
              <p className="text-neutral-600">V této kategorii nejsou žádná fotoalba.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.map((album) => (
                <article
                  key={album.id}
                  className="group flex flex-col justify-between border border-neutral-200 bg-white shadow-xs transition-all duration-300 hover:border-neutral-400 hover:shadow-md overflow-hidden"
                >
                  {/* Klikací náhledová část */}
                  <div
                    onClick={() => handleOpenAlbum(album)}
                    className="cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                          Bez náhledu
                        </div>
                      )}

                      {/* Štítek kategorie */}
                      <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                        {album.category === "carmen" ? "Tábory Carmen" : "LR Dance Klub"}
                      </span>

                      {/* Datum */}
                      {album.date ? (
                        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 backdrop-blur-xs">
                          {formatCzechDate(album.date)}
                        </span>
                      ) : null}
                    </div>

                    <div className="p-4 pb-2">
                      <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {album.title}
                      </h3>
                      {album.tags && album.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {album.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Akční tlačítka v patičce karty */}
                  <div className="p-4 pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 bg-neutral-50/50">
                    <button
                      type="button"
                      onClick={() => handleOpenAlbum(album)}
                      className="text-xs font-bold text-neutral-900 hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Prohlížet v galerii</span>
                      <span>→</span>
                    </button>

                    <a
                      href={album.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
                      title="Otevřít originální album na Rajče.cz"
                    >
                      <span>Rajče.cz</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          POHLED 2: IN-GALLERY ALBUM VIEWER (INTERAKTIVNÍ WINDOW IN WINDOW)
      ========================================================================= */}
      {activeAlbum && (
        <section aria-label="Fotografie vybraného alba">
          {isLoadingPhotos ? (
            <div className="py-24 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-amber-600 mb-4" />
              <p className="text-base font-semibold text-neutral-800">
                Načítám fotografie z alba „{activeAlbum.title}“...
              </p>
              <p className="mt-1 text-xs text-neutral-500">Stahuji data z Rajče.cz</p>
            </div>
          ) : photoError ? (
            <div className="p-8 text-center bg-neutral-50 border border-neutral-200">
              <p className="text-neutral-800 font-medium">{photoError}</p>
              <div className="mt-4 flex justify-center gap-4">
                <a
                  href={activeAlbum.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  Otevřít na Rajče.cz
                </a>
                <button
                  type="button"
                  onClick={handleBackToAlbums}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Zpět na přehled
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Informační lišta o počtu fotek */}
              <div className="mb-6 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Celkem nalezeno: <strong>{albumPhotos.length}</strong> fotografií
                </span>
                <span>
                  Zobrazeno: <strong>{Math.min(renderedCount, albumPhotos.length)}</strong> / {albumPhotos.length}
                </span>
              </div>

              {/* Grid fotek */}
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {albumPhotos.slice(0, renderedCount).map((photo, index) => (
                  <article
                    key={photo.id}
                    onClick={() => setActiveLightboxIndex(index)}
                    className="group relative aspect-square cursor-pointer overflow-hidden bg-neutral-100 border border-neutral-200 transition-all hover:border-neutral-900"
                  >
                    <img
                      src={photo.thumbUrl || photo.imageUrl}
                      alt={photo.alt}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] px-2 py-1 rounded-xs">
                        Zvětšit
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tlačítko pro načtení dalších fotek při velkých albech */}
              {renderedCount < albumPhotos.length && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Načíst dalších 48 fotek (Zbývá {albumPhotos.length - renderedCount})
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL
      ========================================================================= */}
      {activeLightboxIndex !== null && albumPhotos[activeLightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xs select-none"
          onClick={() => setActiveLightboxIndex(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-6xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={albumPhotos[activeLightboxIndex].imageUrl}
              alt={albumPhotos[activeLightboxIndex].alt}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] w-auto max-w-full object-contain shadow-2xl"
            />

            {/* Informační lišta lightboxu */}
            <div className="mt-3 w-full flex items-center justify-between text-white text-xs px-2">
              <span className="font-medium text-neutral-300">
                {activeAlbum?.title} – {albumPhotos[activeLightboxIndex].title}
              </span>
              <span className="font-mono text-neutral-400">
                {activeLightboxIndex + 1} / {albumPhotos.length}
              </span>
            </div>

            {/* Tlačítko Zavřít */}
            <button
              type="button"
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 text-2xl font-light focus:outline-hidden cursor-pointer"
              aria-label="Zavřít galerii"
            >
              ✕
            </button>

            {/* Šipka Předchozí */}
            <button
              type="button"
              onClick={() =>
                setActiveLightboxIndex((prev) =>
                  prev !== null ? (prev > 0 ? prev - 1 : albumPhotos.length - 1) : null
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/90 focus:outline-hidden cursor-pointer"
              aria-label="Předchozí fotka"
            >
              ‹
            </button>

            {/* Šipka Další */}
            <button
              type="button"
              onClick={() =>
                setActiveLightboxIndex((prev) =>
                  prev !== null ? (prev < albumPhotos.length - 1 ? prev + 1 : 0) : null
                )
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/90 focus:outline-hidden cursor-pointer"
              aria-label="Další fotka"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
