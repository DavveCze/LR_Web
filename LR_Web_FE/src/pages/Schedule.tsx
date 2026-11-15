import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { TrainingSchedule } from "../components/schedule/TrainingSchedule";
import { EditableProvider } from "../components/cms/EditableContent";
import { LightButton } from "../components/ui/ButtonPrefab";
import { PageHeader } from "../components/layout/PageHeader";

export function TrainingPage() {
  const scheduleExportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadScheduleImage = async () => {
    const node = scheduleExportRef.current;
    if (!node || isExporting) return;
    setIsExporting(true);

    try {
      // Vygenerujeme ostrý PNG snímek (2x rozlišení) aktuálního interaktivního rozvrhu
      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Rozvrh_LR_Dance_${new Date().getFullYear()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Chyba při exportu rozvrhu:", err);
      // Nouzový fallback na původní statický soubor při neočekávané chybě
      const fallbackUrl = "/assets/imgs/downloaded/rozvrh_treninku_2024_2025_origin.png";
      const link = document.createElement("a");
      link.href = fallbackUrl;
      link.download = "Rozvrh_LR_Dance.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <EditableProvider pageKey="schedule">
      <PageHeader title="Rozvrh tréninků" />
      <main className="mx-auto max-w-7xl px-4 py-10 font-sans text-neutral-800">
        {/* INTERAKTIVNÍ ROZVRH Z DATABÁZE */}
        <section className="mb-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-neutral-900">
              Interaktivní rozpis dle dnů
            </h2>
            <LightButton onClick={downloadScheduleImage}>
              {isExporting ? "Generuji obrázek..." : "Stáhnout rozvrh v plném rozlišení (PNG)"}
            </LightButton>
          </div>
          <TrainingSchedule exportRef={scheduleExportRef} />
        </section>
      </main>
    </EditableProvider>
  );
}