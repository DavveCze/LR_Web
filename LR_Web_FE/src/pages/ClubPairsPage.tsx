import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DarkButton } from "../components/ui/ButtonPrefab";
import { PageHeader } from "../components/layout/PageHeader";
import { apiUrl } from "../api/client";

const API_URL = apiUrl('dancers.php');

type Person = {
  id: number;
  name: string;
  surname: string;
};

type DancePair = {
  pair_id: number;
  is_solo?: boolean;
  dancer1: Person;
  dancer2: Person | null;
  category_lat: string | null;
  category_stt: string | null;
  points: number;
  finals: boolean;
  points_lat?: number;
  finals_lat?: number;
  points_stt?: number;
  finals_stt?: number;
};

type SingleDancer = {
  idt: number;
  name: string;
  surname: string;
  category_lat: string | null;
  category_stt: string | null;
  points_lat?: number;
  finals_lat?: number;
  points_stt?: number;
  finals_stt?: number;
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
  pointsLat,
  finalsLat,
  pointsStt,
  finalsStt,
}: {
  lat: string | null;
  stt: string | null;
  pointsLat?: number;
  finalsLat?: number;
  pointsStt?: number;
  finalsStt?: number;
}) {
  if (!lat && !stt) {
    return null;
  }

  const formatStats = (points?: number, finals?: number) => {
    if ((points ?? 0) === 0 && (finals ?? 0) === 0) {
      return null;
    }
    const p = points ?? 0;
    const f = finals ?? 0;
    return `(${p} b, ${f} F)`;
  };

  const latStats = formatStats(pointsLat, finalsLat);
  const sttStats = formatStats(pointsStt, finalsStt);

  return (
    <p className="mt-4 text-base tracking-wide text-neutral-900">
      {lat && (
        <>
          LAT <strong>{lat}</strong>
          {latStats && <span className="ml-1.5 text-sm font-normal text-neutral-600">{latStats}</span>}
        </>
      )}

      {lat && stt && <span className="mx-2 text-neutral-400">|</span>}

      {stt && (
        <>
          STT <strong>{stt}</strong>
          {sttStats && <span className="ml-1.5 text-sm font-normal text-neutral-600">{sttStats}</span>}
        </>
      )}
    </p>
  );
}

export function ClubPairsPage() {
  const navigate = useNavigate();
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
    <div>
      <PageHeader title="Naše páry" />
      <main className="py-10 text-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex justify-end">
            <DarkButton
              onClick={() => {
                navigate("/klub/vysledky-soutezi");
              }}
            >
              Výsledky soutěží
            </DarkButton>
          </div>

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
                    <PersonName person={pair.dancer1} />
                    {pair.dancer2 ? (
                      <>
                        {" "}
                        <span aria-hidden="true">&amp;</span>{" "}
                        <PersonName person={pair.dancer2} />
                      </>
                    ) : (
                      <span className="ml-3 not-italic inline-block rounded bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 border border-neutral-200">
                        Sólo
                      </span>
                    )}
                  </h2>

                  <Categories
                    lat={pair.category_lat}
                    stt={pair.category_stt}
                    pointsLat={pair.points_lat}
                    finalsLat={pair.finals_lat}
                    pointsStt={pair.points_stt}
                    finalsStt={pair.finals_stt}
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
                        pointsLat={dancer.points_lat}
                        finalsLat={dancer.finals_lat}
                        pointsStt={dancer.points_stt}
                        finalsStt={dancer.finals_stt}
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
  </div>
);
}