import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";

const API_URL = "http://localhost:8080/api/dancers.php";

type Person = {
  id: number;
  name: string;
  surname: string;
};

type DancePair = {
  pair_id: number;
  dancer1: Person;
  dancer2: Person;
  category_lat: string | null;
  category_stt: string | null;
  points: number;
  finals: boolean;
};

type SingleDancer = {
  idt: number;
  name: string;
  surname: string;
  category_lat: string | null;
  category_stt: string | null;
};

function PersonName({ person }: { person: Person }) {
  return (
    <>
      {person.name} <strong className="font-semibold">{person.surname}</strong>
    </>
  );
}

function Categories({
  lat,
  stt,
}: {
  lat: string | null;
  stt: string | null;
}) {
  if (!lat && !stt) {
    return null;
  }

  return (
    <p className="mt-4 text-base tracking-wide text-neutral-900">
      {lat && (
        <>
          LAT <strong>{lat}</strong>
        </>
      )}

      {lat && stt && <span>, </span>}

      {stt && (
        <>
          STT <strong>{stt}</strong>
        </>
      )}
    </p>
  );
}

export function ClubPairsPage() {
  const [pairs, setPairs] = useState<DancePair[]>([]);
  const [singles, setSingles] = useState<SingleDancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}?view=pairs`).then((response) => response.json()),
      fetch(`${API_URL}?view=singles`).then((response) => response.json()),
    ])
      .then(([pairsPayload, singlesPayload]) => {
        if (pairsPayload.status === "success") {
          setPairs(pairsPayload.data);
        }

        if (singlesPayload.status === "success") {
          setSingles(singlesPayload.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="py-40 text-neutral-950">
      <div className="mx-auto max-w-7xl px-6">
        

        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <DarkButton isMedium isCentered
            onClick={() => {
              window.location.href = "/klub/vysledky-soutezi";
            }}
          >
            Výsledky soutěží
          </DarkButton>
        </div>

        <h1 className="mb-12 text-3xl font-bold uppercase tracking-wide text-neutral-800 my-10">
            Naše páry
          </h1>

        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse border-y border-neutral-200 bg-neutral-50"
              />
            ))}
          </div>
        ) : (
          <>
            <section className="border-t border-neutral-300">
              {pairs.map((pair) => (
                <article
                  key={pair.pair_id}
                  className="border-b border-neutral-300 px-4 py-9 md:px-24"
                >
                  <h2 className="text-xl font-semibold italic leading-snug md:text-2xl">
                    <PersonName person={pair.dancer1} />{" "}
                    <span aria-hidden="true">&amp;</span>{" "}
                    <PersonName person={pair.dancer2} />
                  </h2>

                  <Categories
                    lat={pair.category_lat}
                    stt={pair.category_stt}
                  />
                </article>
              ))}
            </section>

            {singles.length > 0 && (
              <section className="mt-16 border-t border-neutral-300 pt-9">
                <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-neutral-800">
                  Tanečníci bez páru
                </h2>

                <div className="grid gap-px border-t border-neutral-300 sm:grid-cols-2">
                  {singles.map((dancer) => (
                    <article
                      key={dancer.idt}
                      className="border-b border-neutral-300 px-4 py-7 md:px-8"
                    >
                      <h3 className="text-lg font-semibold italic">
                        {dancer.name}{" "}
                        <strong className="font-bold">{dancer.surname}</strong>
                      </h3>

                      <Categories
                        lat={dancer.category_lat}
                        stt={dancer.category_stt}
                      />
                    </article>
                  ))}
                </div>
              </section>
            )}

            {!loading && pairs.length === 0 && singles.length === 0 && (
              <p className="border-y border-neutral-300 px-4 py-10 text-center text-neutral-500">
                Aktuálně nemáme zveřejněné žádné taneční páry.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}