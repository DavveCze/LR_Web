import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../api/client";
import { PageHeader } from "../components/layout/PageHeader";

export interface NewsItem {
  id: number;
  headline: string;
  text: string;
  date: string;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  const location = useLocation();

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
        setNews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Automatické odscrollování na konkrétní článek dle kotvy v URL (#article-123)
  useEffect(() => {
    if (!loading && location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [loading, location.hash]);

  return (
    <div>
      <PageHeader title="Aktuality" />
      <main className="mx-auto max-w-5xl px-6 py-10 font-sans text-neutral-800">
        <p className="mb-8 text-neutral-600">
          Sledujte nejnovější informace z dění v našem tanečním klubu a taneční škole.
        </p>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-neutral-100 rounded-sm" />
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-12 divide-y divide-neutral-200">
          {news.map((item) => (
            <article
              key={item.id}
              id={`article-${item.id}`}
              className="pt-10 first:pt-0 scroll-mt-36"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                <time>{formatDate(item.date)}</time>
                {item.updated_at && (
                  <span className="text-neutral-400 font-normal">
                    (aktualizováno: {formatDate(item.updated_at)})
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                {item.headline}
              </h2>

              {item.image_url && (
                <div className="mt-4 mb-6 overflow-hidden rounded border border-neutral-200 aspect-[16/9] max-h-[460px] bg-neutral-100">
                  <img
                    src={item.image_url}
                    alt={item.headline}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="mt-4 text-neutral-700 leading-relaxed whitespace-pre-line text-base md:text-lg font-light">
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
    </main>
  </div>
);
};
