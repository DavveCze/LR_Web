import React, { useEffect, useState } from "react";
import { getTrainersList } from "../../api/client";

export type TrainerProps = {
  id?: number | string;
  full_name: string;
  title?: string;
  info?: string;
  category_lat?: boolean;
  category_stt?: boolean;
  image_src?: string;
  is_active?: boolean;
  display_order?: number;
};

/**
 * Bezpečně vyřeší funkční cestu nebo URL pro fotografii trenéra.
 * Podporuje:
 * 1. BaseName (např. "cep", "marki", "masaryk", "chovancikova", "skopalikova", "bolek")
 * 2. Cestu s příponou nebo úrovní kvality ("cep_1.webp", "cep_2")
 * 3. Přímou absolutní cestu (/assets/imgs/...)
 * 4. Plnou externí URL (Convex storage, CDN)
 */
export function resolveTrainerImageUrl(imageSrc?: string | null): string {
  if (!imageSrc || typeof imageSrc !== "string") {
    return "/assets/imgs/dancers/default_dancer.webp";
  }
  const clean = imageSrc.trim();
  if (!clean) {
    return "/assets/imgs/dancers/default_dancer.webp";
  }

  // Plná URL (Convex Cloud Storage, CDN, blob, data)
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }

  // Již je absolutní cestou na webu
  if (clean.startsWith("/")) {
    return clean;
  }

  // Obsahuje příponu souboru (např. cep_1.webp, trener.png)
  if (clean.includes(".")) {
    return `/assets/imgs/treneri/${clean}`;
  }

  // Pokud obsahuje označení kvality (např. cep_1 nebo cep_2)
  if (/_[123]$/.test(clean)) {
    return `/assets/imgs/treneri/${clean}.webp`;
  }

  // Základní jméno (např. "cep", "marki", "masaryk", "chovancikova", "skopalikova", "bolek")
  return `/assets/imgs/treneri/${clean}_2.webp`;
}

// Vizuál pro 3 sloupcový layout - kulaté fotky, texty centrované
export const TrainerProfileSmall: React.FC<TrainerProps> = ({
  full_name,
  title,
  category_lat,
  category_stt,
  image_src,
}) => {
  const categoryText = [
    category_lat ? "LAT" : null,
    category_stt ? "STT" : null,
  ].filter(Boolean).join(", ");

  const [imgSrc, setImgSrc] = useState(() => resolveTrainerImageUrl(image_src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(resolveTrainerImageUrl(image_src));
    setHasError(false);
  }, [image_src]);

  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="w-40 h-40 rounded-full overflow-hidden mb-4 shadow-sm bg-neutral-100 flex items-center justify-center">
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={full_name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => {
              if (imgSrc.includes("_2.webp")) {
                setImgSrc(imgSrc.replace("_2.webp", "_1.webp"));
              } else if (!imgSrc.includes("default_dancer")) {
                setImgSrc("/assets/imgs/dancers/default_dancer.webp");
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400 font-medium text-2xl">
            {full_name ? full_name.charAt(0).toUpperCase() : "T"}
          </div>
        )}
      </div>
      
      <div className="text-xl font-bold text-gray-800 mb-1">{full_name}</div>
      {title && <div className="text-gray-500 font-medium mb-1">{title}</div>}
      
      {categoryText && (
        <div className="flex items-center gap-2 text-gray-400 font-semibold text-sm uppercase mt-1">
          <span className="text-gray-300">›</span>
          {categoryText}
          <span className="text-gray-300">‹</span>
        </div>
      )}
    </div>
  );
};

// Vizuál s velkou obdélníkovou fotkou a plným textem vedle
export const TrainerProfileLarge: React.FC<TrainerProps> = ({ 
  full_name, 
  title, 
  info, 
  image_src 
}) => {
  const [imgSrc, setImgSrc] = useState(() => resolveTrainerImageUrl(image_src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(resolveTrainerImageUrl(image_src));
    setHasError(false);
  }, [image_src]);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start py-8 border-b border-gray-200 last:border-b-0">
      <div className="w-full max-w-sm mx-auto md:mx-0 md:w-64 h-auto shrink-0 bg-neutral-100 rounded-sm overflow-hidden">
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={full_name}
            className="w-full h-auto object-cover rounded-sm shadow-sm"
            loading="lazy"
            onError={() => {
              if (imgSrc.includes("_2.webp")) {
                setImgSrc(imgSrc.replace("_2.webp", "_1.webp"));
              } else if (!imgSrc.includes("default_dancer")) {
                setImgSrc("/assets/imgs/dancers/default_dancer.webp");
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-64 bg-neutral-200 flex items-center justify-center text-neutral-400 font-medium text-3xl rounded-sm">
            {full_name ? full_name.charAt(0).toUpperCase() : "T"}
          </div>
        )}
      </div>
      <div className="flex-1">
        <h2 className="text-2xl md:text-4xl font-semibold text-gray-800 mb-3 md:mb-4">{full_name}</h2>
        <p className="text-base text-gray-600 leading-relaxed font-light">
          {info || title}
        </p>
      </div>
    </div>
  );
};

interface TrainerGridProps {
  filterRole?: "trainer" | "admin";
}

export const TrainerGrid: React.FC<TrainerGridProps> = ({ filterRole = "trainer" }) => {
  const [trainers, setTrainers] = useState<TrainerProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrainersList()
      .then((items) => {
        const formatted: TrainerProps[] = items.map((t) => ({
          id: t.id || t._id,
          full_name: t.full_name || t.name,
          title: t.title || t.role || "Trenér",
          info: t.info || t.bio || "",
          image_src: t.image_src || t.image_url || t.image || "",
          category_lat: Boolean(t.category_lat),
          category_stt: Boolean(t.category_stt),
          is_active: t.is_active ?? t.isActive ?? true,
          display_order: t.display_order ?? t.order ?? 0,
        }));
        const activeMembers = formatted.filter(
          (t) => t.is_active !== false && t.title === (filterRole === "admin" ? "Webmaster" : "Trenér")
        );
        setTrainers(activeMembers);
      })
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false));
  }, [filterRole]);

  if (loading) {
    return (
      <div className="flex justify-center gap-8 py-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-40 h-40 rounded-full bg-gray-200 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (trainers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-6">
      {trainers.map((trainer, index) => {
        const isFiveItems = trainers.length === 5;

        return (
          <div
            key={trainer.id || index}
            className={[
              "justify-self-center md:col-span-2",
              // Při přesně 5 trenérech:
              // 4. je v col 2–3, 5. v col 4–5.
              isFiveItems && index === 3 ? "md:col-start-2" : "",
              isFiveItems && index === 4 ? "md:col-start-4" : "",
            ].join(" ")}
          >
            <TrainerProfileSmall {...trainer} />
          </div>
        );
      })}
    </div>
  );
};