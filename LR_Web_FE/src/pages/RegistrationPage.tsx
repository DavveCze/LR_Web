import React, { useEffect, useState } from "react";
import { apiUrl, api } from "../api/client";
import { convex } from "../convex";
import { PageHeader } from "../components/layout/PageHeader";
import {
  RegistrationCategory,
  type RegistrationItem,
} from "../components/ui/RegistrationCategory";

type ApiCategory = {
  headline: string;
  components: RegistrationItem[];
};

type GroupedCategory = {
  headline: string;
  components: RegistrationItem[];
};

export const DEFAULT_REGISTRATION_CATEGORIES: GroupedCategory[] = [
  {
    headline: "Taneční kurzy pro školy",
    components: [
      {
        id: 1,
        headline: "Taneční kurzy v mateřských školách",
        content: "Výuka pro děti přímo ve vaší mateřské škole. Základy rytmiky, koordinace a taneční průprava.",
        link: "https://is.pohodlne.info/udalost/detail/d4c837eedf5e2048fe21d93d5ca274a1",
        cost: "Dle vybrané MŠ",
        isActive: true,
      },
      {
        id: 2,
        headline: "Taneční kurzy na základních školách",
        content: "Výuka pro děti přímo ve vaší ZŠ. Moderní choreografie a zábavná taneční průprava.",
        link: "https://is.pohodlne.info/udalost/detail/6118bf5fd762fae6541e3077de5ab1aa",
        cost: "Dle vybrané ZŠ",
        isActive: true,
      },
      {
        id: 3,
        headline: "Taneční kurzy pro 9. třídy",
        content: "Příprava na středoškolské plesy a výuka základních společenských tanců v KD Hlučín.",
        link: "https://is.pohodlne.info/udalost/detail/115696a4204f6c5f7dcba58921883d90",
        cost: "Kulturní dům Hlučín",
        isActive: true,
      },
    ],
  },
  {
    headline: "Taneční kurzy pro mládež a dospělé",
    components: [
      {
        id: 4,
        headline: "Taneční kurzy pro středoškoláky",
        content: "Základní společenské tance, etiketa a slavnostní věneček.",
        link: "https://is.pohodlne.info/udalost/detail/c92f0f7b205016e42b7255009656c739",
        cost: "Kulturní dům Hlučín",
        isActive: true,
      },
      {
        id: 5,
        headline: "Taneční kurzy pro dospělé (manželské a přátelské páry)",
        content: "Společenský večer, příjemná atmosféra, začátečníci i pokročilí.",
        link: "https://is.pohodlne.info/udalost/detail/66bdaa163d3d0f6da823bc9c7d3f4d03",
        cost: "2 200 Kč / osoba",
        isActive: true,
      },
      {
        id: 6,
        headline: "Taneční kurzy pro mládež po tanečních",
        content: "Pokračovací tréninky a nové taneční variace pro absolventy základních kurzů.",
        link: "https://is.pohodlne.info/udalost/detail/d13a1f775cd4c08698ae3231adad78e3",
        cost: "ZŠ Čkalovova, Poruba",
        isActive: true,
      },
    ],
  },
  {
    headline: "Sportovní taneční klub & Tábory CARMEN",
    components: [
      {
        id: 7,
        headline: "Výuka sportovního tance – LR Cosmetic dance team",
        content: "Zastřešeno Českým svazem tanečního sportu (ČSTS). Hobby i soutěžní úroveň.",
        link: "https://is.pohodlne.info/udalost/detail/5aa2b8b6509c8829651e7d51f4528b66",
        cost: "Dle kategorie",
        isActive: true,
      },
      {
        id: 8,
        headline: "Letní spací tábor CARMEN (RK Budoucnost)",
        content: "Celotáborová hra, taneční tréninky, in-line dráha a koupání v Beskydech.",
        link: "https://is.pohodlne.info/udalost/detail/7276514b04c88c5d5b6d4f6eed82ab20",
        cost: "Frýdlant n. O.",
        isActive: true,
      },
      {
        id: 9,
        headline: "Příměstský tábor CARMEN (Červenec / Srpen)",
        content: "Denní program plný tance, her v přírodě a kamarádů v Markvartovicích.",
        link: "https://is.pohodlne.info/udalost/detail/963ee4c7ec8f45e975dc32e22460b0e5",
        cost: "Markvartovice",
        isActive: true,
      },
    ],
  },
];

export const RegistrationPage: React.FC = () => {
  const [categories, setCategories] = useState<GroupedCategory[]>(DEFAULT_REGISTRATION_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRegistrations = async () => {
      try {
        // 1. Zkoušíme načíst data z Convexu
        if (convex) {
          try {
            const list = await (convex as any).query(api.registrations.listRegistrations, {});
            if (isMounted && Array.isArray(list) && list.length > 0) {
              const categoryMap = new Map<string, RegistrationItem[]>();
              list.forEach((raw) => {
                const item = raw as Record<string, unknown>;
                const category = ((item.category as string) || "Kurzy a tréninky").trim();
                if (!categoryMap.has(category)) categoryMap.set(category, []);
                categoryMap.get(category)!.push({
                  id: Number(item.id) || 1,
                  headline: (item.title as string) || (item.headline as string) || "",
                  content: (item.subtitle as string) || (item.content as string) || null,
                  link: (item.url as string) || (item.link as string) || null,
                  cost: (item.cost as string) || null,
                  isActive: item.isActive !== false,
                });
              });

              const parsed: GroupedCategory[] = Array.from(categoryMap.entries()).map(
                ([headline, components]) => ({ headline, components })
              );

              if (parsed.length > 0) {
                setCategories(parsed);
                return;
              }
            }
          } catch {
            // Ignorujeme chybu v Convexu a zkusíme fallback
          }
        }

        // 2. Zkoušíme REST fallback – pouze pokud vrací JSON!
        const response = await fetch(apiUrl("prihlasky.php"));
        const contentType = response.headers.get("content-type") || "";

        if (response.ok && contentType.includes("application/json")) {
          const result = await response.json();
          if (isMounted && result && result.status === "success" && Array.isArray(result.data) && result.data.length > 0) {
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

            if (mergedCategories.length > 0) {
              setCategories(mergedCategories);
              return;
            }
          }
        }
      } catch {
        // Při jakékoliv chybě sítě ponecháme osvědčená výchozí data (DEFAULT_REGISTRATION_CATEGORIES)
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRegistrations();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Přihláška" />
        <main className="mx-auto min-h-[40vh] max-w-5xl px-6 py-12 text-center text-neutral-500 font-sans">
          Načítám vypsané přihlášky…
        </main>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Přihláška" />
      <main className="w-full bg-white font-sans text-neutral-800 pt-6 pb-24">
        <div className="mx-auto max-w-5xl px-6 py-6">
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
      </main>
    </div>
  );
};
