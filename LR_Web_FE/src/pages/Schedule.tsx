import React from "react";
import { TrainingSchedule } from "../components/schedule/TrainingSchedule";
import { PartnersSection } from "../components/ui/PartnersSection";
import { EditableProvider, EditableText } from "../components/cms/EditableContent";
import { LightButton } from "../components/ui/ButtonPrefab";

export function TrainingPage() {
  return (
    <EditableProvider pageKey="schedule">
      <main className="mx-auto max-w-7xl px-4 py-28 font-sans text-neutral-800">
        <div className="mb-12 border-b-2 border-neutral-900 pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">
            <EditableText path="header.title" fallback="ROZVRH TRÉNINKŮ 2024 / 2025" />
          </h1>
          <p className="mt-2 text-neutral-600">
            <EditableText
              path="header.subtitle"
              fallback="Týdenní plán sálových tréninků, vedených lekcí a praktisů pro jednotlivé výkonnostní kategorie."
            />
          </p>
        </div>

        {/* GRAFICKÝ PLAKÁT ROZVRHU Z KLUBU */}

        {/* INTERAKTIVNÍ ROZVRH Z DATABÁZE */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="mb-6 text-2xl font-bold uppercase tracking-wider text-neutral-900">
            Interaktivní rozpis dle dnů
          </h2>
            <LightButton onClick={() => {downloadScheduleImage()}}>
              Stáhnout rozvrh v plném rozlišení (PNG)
            </LightButton>
          </div>
          <TrainingSchedule />
        </section>

        {/* PARTNEŘI */}
        <PartnersSection className="mt-16" />
      </main>
    </EditableProvider>
  );

  function downloadScheduleImage() {
    const imageUrl = "/assets/imgs/downloaded/rozvrh_treninku_2024_2025_origin.png";
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "Rozvrh_LR_Dance_2024_2025.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}