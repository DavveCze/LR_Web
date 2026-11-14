import React, { useEffect, useState } from "react";
import { apiUrl } from "../api/client";
import { TrainerProps, TrainerProfileSmall, TrainerProfileLarge } from "../components/ui/TrainerProfiles";
import { PageHeader } from "../components/layout/PageHeader";

export const ClubTrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('trainers.php'))
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
            // Pouze trénery (ne administrativu)
            setTrainers(data.data.filter((t: TrainerProps) => t.title === 'Trenér' && t.is_active !== false));
        }
      })
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
              {smallTrainers.map(trainer => (
                <TrainerProfileSmall key={trainer.id} {...trainer} />
              ))}
            </div>
          </section>
        )}

        {largeTrainers.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-8">
              {largeTrainers.map(trainer => (
                <TrainerProfileLarge key={trainer.id} {...trainer} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};