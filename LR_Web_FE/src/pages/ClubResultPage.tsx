import { useEffect, useState } from "react";
import { DarkButton } from "../components/ui/ButtonPrefab";

const API_URL = "http://localhost:8080/api/dancers.php";

type Result = {
  id: number;
  pair_id: number;
  competition_name: string;
  date: string;
  location: string;
  placement: string;
  dancer1: string;
  dancer2: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function ClubResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}?view=results`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.status === "success") {
          setResults(payload.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="py-40 text-neutral-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <h1 className="mb-12 text-3xl font-bold uppercase tracking-wide text-neutral-800">
          Výsledky soutěží
          </h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded bg-neutral-100"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="border-y border-neutral-300 py-10 text-center text-neutral-500">
            Zatím nemáme zveřejněné žádné výsledky soutěží.
          </p>
        ) : (
          <div className="border-t border-neutral-300">
            {results.map((result) => (
              <article
                key={result.id}
                className="grid gap-3 border-b border-neutral-300 px-4 py-7 md:grid-cols-[150px_1fr_auto] md:items-center md:px-8"
              >
                <time className="text-sm text-neutral-500">
                  {formatDate(result.date)}
                </time>

                <div>
                  <h2 className="text-lg font-semibold">
                    {result.dancer1} <span aria-hidden="true">&amp;</span>{" "}
                    {result.dancer2}
                  </h2>
                  <p className="mt-1 text-neutral-700">
                    {result.competition_name}
                    <span className="mx-2 text-neutral-400">•</span>
                    {result.location}
                  </p>
                </div>

                <strong className="text-lg text-neutral-900">
                  {result.placement}
                </strong>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}