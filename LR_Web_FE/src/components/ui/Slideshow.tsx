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

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
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

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Zobrazit fotku ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};