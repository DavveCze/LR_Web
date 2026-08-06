import React, { useEffect, useState } from "react";
import { HelperImage, useRefreshingAsset } from "./HelperImage";

const path = "treneri"; // složka s obrázky trenérů

export type TrainerProps = {
  id?: number;
  full_name: string;
  title?: string;
  info?: string;
  category_lat?: boolean;
  category_stt?: boolean;
  image_src?: string;
  is_active?: boolean;
  display_order?: number;
};

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

  return (
    <div className="flex flex-col items-center text-center p-4">
      {image_src ? (
        <div className="w-40 h-40 rounded-full overflow-hidden mb-4 shadow-sm">
          <HelperImage
            baseName={image_src}
            pageFolder={path}
            alt={full_name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-40 h-40 rounded-full bg-gray-200 mb-4 shadow-sm animate-pulse" />
      )}
      
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
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start py-8 border-b border-gray-200 last:border-b-0">
      {image_src && (
        <div className="w-full md:w-64 h-auto shrink-0">
          <HelperImage
            baseName={image_src}
            pageFolder={path}
            alt={full_name}
            className="w-full h-auto object-cover rounded-sm shadow-sm"
          />
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-4">{full_name}</h2>
        <p className="text-gray-600 leading-relaxed font-light">
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
    fetch('http://localhost:8080/api/trainers.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // Filtrujeme pouze aktivní záznamy
          let activeMembers = data.data.filter((t: TrainerProps) => t.is_active !== false && t.title === (filterRole === 'admin' ? 'Webmaster' : 'Trenér'));

          setTrainers(activeMembers);
        }
      })
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
          key={trainer.id}
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