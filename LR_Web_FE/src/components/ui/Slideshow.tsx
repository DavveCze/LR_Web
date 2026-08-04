import { useEffect, useState, type FC } from "react";

interface SlideshowProps {
  images: { src: string; alt: string }[];
  intervalMs?: number;
  className?: string;
}

export const Slideshow: FC<SlideshowProps> = ({
  images,
  intervalMs = 4000,
  className = "",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const goTo = (index: number) => {
    const total = images.length;
    setActiveIndex(((index % total) + total) % total);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (images.length <= 1 || isHighlighted) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs, isHighlighted]);

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
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
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={800}
          height={500}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Neviditelný spacer, aby wrapper měl výšku podle první fotky */}
      <img
        src={images[0].src}
        alt=""
        aria-hidden="true"
        className="invisible w-full object-cover"
        width={800}
        height={500}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Předchozí fotka"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition-opacity duration-300 hover:bg-black/50 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Další fotka"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition-opacity duration-300 hover:bg-black/50 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Zobrazit fotku ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};