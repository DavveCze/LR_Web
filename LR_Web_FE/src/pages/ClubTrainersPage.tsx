import React, { useEffect, useState } from "react";
import { getTrainersList } from "../api/client";
import { TrainerProps, TrainerProfileSmall, TrainerProfileLarge } from "../components/ui/TrainerProfiles";
import { PageHeader } from "../components/layout/PageHeader";

export const ClubTrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrainersList()
      .then((items) => {
        // Normalizace formátu
        const formatted: TrainerProps[] = items.map((t) => ({
          id: t.id || t._id,
          full_name: t.full_name || t.name,
          title: t.title || t.role || "Trenér",
          image_src: t.image_src || t.image_url || t.image || "",
          info: t.info || t.bio || "",
          category_lat: Boolean(t.category_lat),
          category_stt: Boolean(t.category_stt),
          display_order: t.display_order ?? t.order ?? 0,
          is_active: t.is_active ?? t.isActive ?? true,
        }));
        setTrainers(formatted.filter((t) => (t.title === "Trenér" || !t.title) && t.is_active !== false));
      })
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Trenéři klubu" />
        <div className="py-20 text-center text-gray-500">Načítání trenérů...</div>
      </div>
    );
  }

  // Oddělíme "Small" (bez infa) od "Large" (s infem) podle toho, jak to bylo na screenu
  const smallTrainers = trainers.filter(t => !t.info || t.info.trim() === '');
  const largeTrainers = trainers.filter(t => t.info && t.info.trim() !== '');

  return (
    <div>
      <PageHeader title="Trenéři klubu" />
      <main className="max-w-6xl mx-auto px-6 py-12">
        {smallTrainers.length > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
              {smallTrainers.map((trainer, idx) => (
                <TrainerProfileSmall key={trainer.id || idx} {...trainer} />
              ))}
            </div>
          </section>
        )}

        {largeTrainers.length > 0 && (
          <section className={smallTrainers.length > 0 ? "mt-12 border-t border-gray-200 pt-8" : ""}>
            <div className="flex flex-col gap-4">
              {largeTrainers.map((trainer, idx) => (
                <TrainerProfileLarge key={trainer.id || idx} {...trainer} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};