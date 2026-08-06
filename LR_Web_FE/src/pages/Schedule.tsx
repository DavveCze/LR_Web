import { TrainingSchedule } from "../components/schedule/TrainingSchedule";

export function TrainingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20">
      <h1 className="mb-8 text-3xl font-bold uppercase">Rozvrh tréninků</h1>
      <TrainingSchedule />
    </main>
  );
}