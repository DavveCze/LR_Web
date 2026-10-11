import { useEffect, useState, type FC } from "react";

interface SlideshowProps {
  images: { src: string; alt?: string }[];
  intervalMs?: number;
  className?: string;
  dotsOutside?: boolean;
}

export const Slideshow: FC<SlideshowProps> = ({
  images,
  intervalMs = 4500,
  className = "",
  dotsOutside = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const imagesCount = images?.length ?? 0;

  const goTo = (index: number) => {
    if (imagesCount === 0) return;
    setActiveIndex(((index % imagesCount) + imagesCount) % imagesCount);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (imagesCount <= 1 || isHighlighted) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % imagesCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [imagesCount, intervalMs, isHighlighted]);

  if (!images || imagesCount === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* OBRÁZKOVÝ KONTEJNER */}
      <div
        className="group relative overflow-hidden w-full aspect-[16/10] sm:aspect-[16/9] bg-neutral-100 border border-neutral-200"
        onMouseEnter={() => setIsHighlighted(true)}
        onMouseLeave={() => setIsHighlighted(false)}
        onFocus={() => setIsHighlighted(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsHighlighted(false);
          }
        }}
      >
        {images.map((image, i) => (
          <img
            key={image.src + i}
            src={image.src}
            alt={image.alt || `Fotografie ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              i === activeIndex ? "opacity-100 z-1" : "opacity-0 z-0 pointer-events-none"
            }`}
          />
        ))}

        {images.length > 1 && (
          <>
            {/* LEVÁ ŠIPKA (BÍLÝ KRUH) */}
            <button
              type="button"
              aria-label="Předchozí fotka"
              onClick={goPrev}
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-neutral-800 shadow-md hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* PRAVÁ ŠIPKA (BÍLÝ KRUH) */}
            <button
              type="button"
              aria-label="Další fotka"
              onClick={goNext}
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-neutral-800 shadow-md hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {!dotsOutside && images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Zobrazit fotku ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 w-2 rounded-full transition-colors cursor-pointer ${
                  i === activeIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* TEČKY POD SLIDESHOW (DLE ORIGINÁLU) */}
      {dotsOutside && images.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Zobrazit fotku ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full transition-colors cursor-pointer ${
                i === activeIndex ? "bg-neutral-800 scale-110" : "bg-neutral-300 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};