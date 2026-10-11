import { useState, useEffect, useRef, useCallback, FC } from "react";

export interface CarouselItem {
  id: number | string;
  src: string;
  alt: string;
  title?: string;
  category?: string;
}

interface InfiniteCarouselProps {
  eyebrow?: string;
  title?: string;
  items: CarouselItem[];
  showLabels?: boolean;
  className?: string;
}

export const InfiniteCarouselWithLightbox: FC<InfiniteCarouselProps> = ({
  eyebrow = "Fotogalerie",
  title = "Momenty z parketu",
  items = [],
  showLabels = true,
  className = "",
}) => {
  const N = items.length;

  // Triple buffer pro nekonečnou smyčku
  const slides = [...items, ...items, ...items];
  const [activeIndex, setActiveIndex] = useState(N);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [lightboxItem, setLightboxItem] = useState<CarouselItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const handleStep = useCallback((dir: number) => {
    setIsTransitioning(true);
    setActiveIndex((prev) => Math.max(0, Math.min(prev + dir, slides.length - 1)));
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (N === 0 || lightboxItem || isPaused) return;

    const timer = setInterval(() => {
      handleStep(1);
    }, 4500);

    return () => clearInterval(timer);
  }, [lightboxItem, isPaused, handleStep, N]);

  // Reset smyčky bez animace
  const handleTransitionEnd = () => {
    if (activeIndex >= N * 2) {
      setIsTransitioning(false);
      setActiveIndex(activeIndex - N);
    } else if (activeIndex < N) {
      setIsTransitioning(false);
      setActiveIndex(activeIndex + N);
    }
  };

  // Klávesnice pro lightbox
  useEffect(() => {
    if (!lightboxItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxItem(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxItem]);

  if (N === 0) return null;

  return (
    <section className={`w-full overflow-hidden py-10 ${className}`}>
      {/* Nadpis */}
      <div className="mx-auto mb-8 max-w-6xl px-4 text-center">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="mt-1 text-2xl font-bold uppercase tracking-wide text-neutral-900 md:text-3xl">
            {title}
          </h2>
        )}
      </div>

      {/* Carousel Track */}
      <div
        ref={containerRef}
        className="relative mx-auto max-w-7xl px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          setIsPaused(true);
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            handleStep(diff > 0 ? 1 : -1);
          }
          touchStartX.current = null;
          setIsPaused(false);
        }}
      >
        <div className="overflow-hidden">
          <div
            className={`flex items-center gap-4 ${
              isTransitioning ? "transition-transform duration-500 ease-out" : ""
            }`}
            style={{
              transform: `translateX(calc(50% - ${(activeIndex + 0.5) * 320}px))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((slide, idx) => {
              const isCenter = idx === activeIndex;
              return (
                <div
                  key={`${slide.id}-${idx}`}
                  onClick={() => setLightboxItem(slide)}
                  className={`group relative shrink-0 cursor-pointer overflow-hidden rounded-sm border border-neutral-200 bg-neutral-900 transition-all duration-300 ${
                    isCenter
                      ? "w-[300px] sm:w-[360px] opacity-100 scale-100 shadow-xl"
                      : "w-[240px] sm:w-[280px] opacity-60 scale-95"
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-800">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {showLabels && slide.title && (
                    <div className="p-3 bg-white border-t border-neutral-200">
                      {slide.category && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block">
                          {slide.category}
                        </span>
                      )}
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {slide.title}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Šipky ovládání */}
        <button
          type="button"
          onClick={() => handleStep(-1)}
          aria-label="Předchozí fotografie"
          className="absolute left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md hover:bg-white transition-colors"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => handleStep(1)}
          aria-label="Další fotografie"
          className="absolute right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md hover:bg-white transition-colors"
        >
          ›
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-sm bg-neutral-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Zavřít detail fotografie"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              ✕
            </button>
            <img
              src={lightboxItem.src}
              alt={lightboxItem.alt}
              className="max-h-[80vh] w-auto max-w-full object-contain mx-auto"
            />
            {lightboxItem.title && (
              <p className="mt-2 text-center text-sm font-medium text-white/90">
                {lightboxItem.title}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
