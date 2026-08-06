import React from "react";
import { TrainerGrid } from "../components/ui/TrainerProfiles"; // Importujeme naši novou grid komponentu
import { TrainingSchedule } from "../components/schedule/TrainingSchedule";

export const ClubPage: React.FC = () => {
  return (
    <main className="w-full bg-white font-sans text-gray-800 py-40">
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>
      {/* Úvodní texty */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-2 text-[20px] font-light leading-[1.6] text-neutral-500 md:text-[21px]">
          <p className="grid grid-cols-[22px_1fr] gap-x-5">
            <span
              aria-hidden="true"
              className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
            >
              ›
            </span>

            <span>
              Klub <strong className="font-semibold text-neutral-600">LR DANCE TEAM OSTRAVA</strong>{" "}
              je zaměřen jak na standardní, tak latinskoamerické tance. Jedním z trenérů je
              také{" "}
              <strong className="font-semibold text-neutral-600">
                Václav Masaryk s Klárou Chovančíkovou
              </strong>{" "}
              – několikanásobný mistr České republiky v latinskoamerických tancích.
            </span>
          </p>

          <p className="grid grid-cols-[22px_1fr] gap-x-5">
            <span
              aria-hidden="true"
              className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
            >
              ›
            </span>

            <span>
              Nabízíme široké věkové rozpětí. U nás se najdou děti ze školky, ze školy,
              ale také dospělí tanečníci různého věku.
            </span>
          </p>

          <p className="grid grid-cols-[22px_1fr] gap-x-5">
            <span
              aria-hidden="true"
              className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
            >
              ›
            </span>

            <span>
              Několikrát ročně pořádáme víkendová nebo týdenní soustředění zaměřená na
              fyzický trénink, přípravu na velké akce jako MČR a podobně. Soustředění jsou
              určena pro všechny věkové kategorie.
            </span>
          </p>
        </div>
      </section>

      {/* Dělící čára před trenéry */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      {/* 2. SEKCE: Naši Trenéři */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-12">Naši trenéři</h2>
        
        {/* Vykreslí dynamicky trenéry z DB */}
        <TrainerGrid filterRole="trainer" />

      </section>

      {/* Dělící čára před týmem */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* 3. SEKCE: Rozpis tréninků */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-12">Rozpis tréninků</h2>
        
        {/* Vykreslí dynamicky tréninky z DB */}
        <TrainingSchedule />

      </section>

      {/* Dělící čára před kurzovným */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* 4. SEKCE: Kurzovné */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-12">Kurzovné a platby</h2>
        
        <div className="space-y-px border-t border-b border-gray-300">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-base font-medium text-gray-800">Děti</div>
            <div className="text-base font-medium text-gray-800 text-right">600 Kč/měsíc</div>
          </div>
          <div className="border-t border-gray-200"></div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-base font-medium text-gray-800">Přípravka</div>
            <div className="text-base font-medium text-gray-800 text-right">600 Kč/měsíc</div>
          </div>
          <div className="border-t border-gray-200"></div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-base font-medium text-gray-800">Dospělí/Mládež</div>
            <div className="text-base font-medium text-gray-800 text-right">900 Kč/měsíc</div>
          </div>
          <div className="border-t border-gray-200"></div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-base font-medium text-gray-800">Číslo účtu (VS=rodné číslo)</div>
            <div className="text-base font-medium text-gray-800 text-right">1012808781/5500</div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4 text-right">(pololetní platba)</p>

      </section>

    </main>
  );
};