import React, { useEffect, useState } from 'react';
import {
  RegistrationCategory,
  type RegistrationItem,
} from '../components/ui/RegistrationCategory';

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
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/prihlasky.php');

        if (!response.ok) {
          throw new Error('Nepodařilo se načíst přihlášky.');
        }

        const result = await response.json();

        if (result.status !== 'success' || !Array.isArray(result.data)) {
          throw new Error(result.message || 'Backend vrátil neplatná data.');
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
          categoryMap.entries(),
        ).map(([headline, components]) => ({
          headline,
          components,
        }));

        setCategories(mergedCategories);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Při načítání přihlášek došlo k chybě.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto min-h-[50vh] max-w-[1280px] px-6 py-20 text-center text-[#666666]">
        Načítám přihlášky…
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-[50vh] max-w-[1280px] px-6 py-20 text-center text-red-700">
        {error}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-4 sm:px-10 lg:px-0">
      {categories.length === 0 ? (
        <p className="py-20 text-center text-[#666666]">
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
    </main>
  );
};