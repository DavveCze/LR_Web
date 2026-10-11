import React, { useEffect, useState } from "react";
import { apiUrl } from "../api/client";
import {
  RegistrationCategory,
  type RegistrationItem,
} from "../components/ui/RegistrationCategory";
import { PartnersSection } from "../components/ui/PartnersSection";

type ApiCategory = {
  headline: string;
  components: RegistrationItem[];
};

type GroupedCategory = {
  headline: string;
  components: RegistrationItem[];
};

export const RegistrationPage: React.FC = () => {
  const [categories, setCategories] = useState<GroupedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const response = await fetch(apiUrl("prihlasky.php"));

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst přihlášky.");
        }

        const result = await response.json();

        if (result.status !== "success" || !Array.isArray(result.data)) {
          throw new Error(result.message || "Backend vrátil neplatná data.");
        }

        const categoryMap = new Map<string, RegistrationItem[]>();

        (result.data as ApiCategory[]).forEach((category) => {
          const categoryName = category.headline.trim();
          const existingItems = categoryMap.get(categoryName) ?? [];

          categoryMap.set(categoryName, [
            ...existingItems,
            ...category.components,
          ]);
        });

        const mergedCategories: GroupedCategory[] = Array.from(
          categoryMap.entries()
        ).map(([headline, components]) => ({
          headline,
          components,
        }));

        setCategories(mergedCategories);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Při načítání přihlášek došlo k chybě."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto min-h-[50vh] max-w-5xl px-6 pt-36 pb-24 text-center text-neutral-500 font-sans">
        Načítám vypsané přihlášky…
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-[50vh] max-w-5xl px-6 pt-36 pb-24 text-center text-red-700 font-sans">
        {error}
      </main>
    );
  }

  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* TITULEK STRÁNKY */}
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
          PŘIHLÁŠKY DO KURZŮ A TÁBORŮ
        </h1>
        <p className="mb-12 text-lg text-neutral-600 font-light leading-relaxed">
          Vyberte si níže vypsaný kurz nebo tábor. Přihlášení probíhá výhradně přes náš oficiální informační systém.
        </p>

        {/* SEZNAM KATEGORIÍ A PŘIHLÁŠEK PŘES IS.POHODLNE.INFO */}
        {categories.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">
            Momentálně nejsou k dispozici žádné aktivní přihlášky.
          </p>
        ) : (
          categories.map((category) => (
            <RegistrationCategory
              key={category.headline}
              headline={category.headline}
              components={category.components}
            />
          ))
        )}
      </div>

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};