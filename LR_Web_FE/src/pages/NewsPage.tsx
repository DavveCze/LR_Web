import React, { useEffect, useState } from "react";
import { apiUrl } from "../api/client";
import { PartnersSection } from "../components/ui/PartnersSection";

interface NewsItem {
  id: number;
  headline: string;
  text: string;
  date: string;
}

function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("news.php"))
      .then((res) => {
        if (!res.ok) throw new Error("Chyba načítání");
        return res.json();
      })
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.data)) {
          setNews(data.data);
        }
      })
      .catch(() => {
        // Fallback / tichý fallback pokud news.php ještě není na backendu nasazen
        setNews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-28 font-sans text-neutral-800">
      <div className="mb-12 border-b-2 border-neutral-900 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">
          Aktuality & Oznámení
        </h1>
        <p className="mt-2 text-neutral-600">
          Sledujte nejnovější informace z dění v našem tanečním klubu a taneční škole.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-neutral-100 rounded-sm" />
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-8 divide-y divide-neutral-200">
          {news.map((item) => (
            <article key={item.id} className="pt-6 first:pt-0">
              <time className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                {formatDate(item.date)}
              </time>
              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">
                {item.headline}
              </h2>
              <div className="mt-3 text-neutral-700 leading-relaxed whitespace-pre-line text-base">
                {item.text}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-neutral-200 bg-neutral-50 p-8 text-center rounded-sm">
          <p className="text-neutral-700 font-medium">
            Momentálně zde nejsou žádná nová oznámení.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Pravidelně stránky aktualizujeme, navštivte nás brzy znovu nebo sledujte náš rozvrh tréninků.
          </p>
        </div>
      )}

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};
