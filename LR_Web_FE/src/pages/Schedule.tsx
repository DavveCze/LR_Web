import React from "react";
import { TrainingSchedule } from "../components/schedule/TrainingSchedule";
import { EditableProvider, EditableText } from "../components/cms/EditableContent";
import { LightButton } from "../components/ui/ButtonPrefab";
import { PageHeader } from "../components/layout/PageHeader";

export function TrainingPage() {
  return (
    <EditableProvider pageKey="schedule">
      <PageHeader title="Rozvrh tréninků" />
      <main className="mx-auto max-w-7xl px-4 py-10 font-sans text-neutral-800">
        <p className="mb-8 text-neutral-600">
          <EditableText
            path="header.subtitle"
            fallback="Týdenní plán sálových tréninků, vedených lekcí a praktisů pro jednotlivé výkonnostní kategorie."
          />
        </p>

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