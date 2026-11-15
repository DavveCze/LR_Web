import { useEffect, useMemo, useState } from "react";
import { getScheduleList } from "../../api/client";

const DAYS = [
  { key: "monday", label: "Pondělí" },
  { key: "tuesday", label: "Úterý" },
  { key: "wednesday", label: "Středa" },
  { key: "thursday", label: "Čtvrtek" },
  { key: "friday", label: "Pátek" },
] as const;

const DAY_START_MINUTES = 16 * 60 + 15; // 16:15
const DAY_END_MINUTES = 21 * 60; // 21:00
const TOTAL_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES;

type BlockType = "free" | "guided" | "practice" | "fitness";

export type TrainingBlock = {
  id: number;
  day_of_week: (typeof DAYS)[number]["key"];
  start_time: string;
  end_time: string;
  title: string;
  subtitle: string | null;
  block_type: BlockType;
  is_active: boolean;
  display_order: number;
};

const blockClasses: Record<BlockType, string> = {
  free: "bg-[#e0f2fe]", // Světle modrá pro volný trénink
  guided: "bg-[#fff0e6]", // Výchozí podklad pro vedený trénink
  practice: "bg-[#fca5a5]", // Odstín červené pro practice
  fitness: "bg-[#f87171]", // Červený odstín pro fyzičku/strečink
};

// Barevné rodiny pro trenéry – každá rodina má odstíny pro odlišení kategorií (např. přípravka vs hobby vs E+D)
type ColorFamily = {
  name: string;
  shades: string[]; // [jemný/světlý, střední, sytější]
};

const TRAINER_FAMILIES: ColorFamily[] = [
  {
    name: "orange",
    shades: ["#ffedd5", "#fed7aa", "#fdba74"], // Lukáš: přípravka, děti HOBBY, děti E+D
  },
  {
    name: "emerald",
    shades: ["#dcfce7", "#bbf7d0", "#86efac"], // Zelenkavá rodina
  },
  {
    name: "yellow",
    shades: ["#fef9c3", "#fef08a", "#fde047"], // Žlutá / zlatá rodina
  },
  {
    name: "purple",
    shades: ["#f3e8ff", "#e9d5ff", "#d8b4fe"], // Fialová / levandulová rodina
  },
  {
    name: "pink",
    shades: ["#fce7f3", "#fbcfe8", "#f472b6"], // Růžová rodina
  },
  {
    name: "teal",
    shades: ["#ccfbf1", "#99f6e4", "#5eead4"], // Tyrkysová rodina
  },
  {
    name: "indigo",
    shades: ["#e0e7ff", "#c7d2fe", "#a5b4fc"], // Indigo rodina
  },
];

/**
 * Automaticky extrahuje jméno trenéra i případnou kategorii (např. "Lukáš" a "děti HOBBY")
 */
function extractTrainerAndCategory(block: TrainingBlock): { trainer: string; category: string } | null {
  if (block.block_type !== "guided") return null;
  const text = (block.subtitle ?? "").trim();
  if (!text) return null;

  const clean = text.replace(/^[()]+|[()]+$/g, "").trim();
  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    const trainer = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const category = parts.slice(1).join(" - ").split("\n")[0].trim();
    return { trainer, category };
  }

  const single = clean.match(/^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽa-záčďéěíňóřšťúůýž]+)/);
  if (single) {
    const trainer = single[1].charAt(0).toUpperCase() + single[1].slice(1).toLowerCase();
    return { trainer, category: "" };
  }

  return null;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildTimeSlots(): number[] {
  const slots: number[] = [];

  for (let time = DAY_START_MINUTES; time <= DAY_END_MINUTES; time += 15) {
    slots.push(time);
  }

  return slots;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

interface BlockLayout {
  top: string;
  height: string;
  hasBottomBorder: boolean;
  isStacked: boolean;
}

interface LayoutItem extends TrainingBlock {
  start: number;
  end: number;
  laneIndex: number;
}

/**
 * Spočítá globální rozvržení (interval graph coloring / lane packing) pro bloky daného dne.
 * Bezpečně řeší překrývající se a navazující bloky tak, aby žádný blok nepřesahoval,
 * neměl nesoulad výšek a zachoval čisté vertikální zarovnání i dělicí čáry.
 */
function computeDayLayout(dayBlocks: TrainingBlock[]): {
  layouts: Map<number, BlockLayout>;
  maxLanes: number;
} {
  if (!dayBlocks.length) {
    return { layouts: new Map(), maxLanes: 1 };
  }

  const items: LayoutItem[] = dayBlocks.map((b) => ({
    ...b,
    start: toMinutes(b.start_time),
    end: toMinutes(b.end_time),
    laneIndex: 0,
  }));

  // Seřadíme podle začátku vzestupně, délky sestupně, display_order a ID
  items.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - a.end ||
      a.display_order - b.display_order ||
      a.id - b.id,
  );

  // Rozdělení do souvislých komponent (shluků), kde se bloky přímo či řetězově překrývají
  const clusters: LayoutItem[][] = [];
  let currCluster: LayoutItem[] = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currCluster.length === 0) {
      currCluster.push(item);
      clusterEnd = item.end;
    } else if (item.start < clusterEnd) {
      currCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    } else {
      clusters.push(currCluster);
      currCluster = [item];
      clusterEnd = item.end;
    }
  }
  if (currCluster.length > 0) {
    clusters.push(currCluster);
  }

  const layouts = new Map<number, BlockLayout>();
  let dayMaxLanes = 1;

  for (const cluster of clusters) {
    // Hladové přiřazení do drah (lanes)
    const lanes: Array<{ endTime: number; items: LayoutItem[] }> = [];

    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i].endTime <= item.start) {
          lanes[i].endTime = item.end;
          lanes[i].items.push(item);
          item.laneIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.laneIndex = lanes.length;
        lanes.push({ endTime: item.end, items: [item] });
      }
    }

    const totalLanes = lanes.length;
    if (totalLanes > dayMaxLanes) {
      dayMaxLanes = totalLanes;
    }

    // Možnost rozšíření (span) do sousedních volných drah pro čisté vyplnění výšky
    for (const item of cluster) {
      let span = 1;
      while (item.laneIndex + span < totalLanes) {
        const nextLane = lanes[item.laneIndex + span];
        const collides = nextLane.items.some(
          (other) =>
            Math.max(item.start, other.start) < Math.min(item.end, other.end),
        );
        if (collides) break;
        span++;
      }

      const topPercent = (100 / totalLanes) * item.laneIndex;
      const heightPercent =
        item.laneIndex + span === totalLanes
          ? 100 - topPercent
          : (100 / totalLanes) * span;
      const hasBottomBorder = item.laneIndex + span < totalLanes;
      const isStacked = totalLanes > 1 && heightPercent < 60;

      layouts.set(item.id, {
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        hasBottomBorder,
        isStacked,
      });
    }
  }

  return { layouts, maxLanes: dayMaxLanes };
}

export function TrainingSchedule({ exportRef }: { exportRef?: React.RefObject<HTMLDivElement | null> } = {}) {
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = useMemo(() => buildTimeSlots(), []);

  // 1. Automaticky zjistí všechny unikátní trenéry a jejich kategorie z rozvrhu
  const trainerData = useMemo(() => {
    const trainersMap: Record<string, string[]> = {};
    const trainerOrder: string[] = [];

    blocks.forEach((b) => {
      const parsed = extractTrainerAndCategory(b);
      if (parsed) {
        if (!trainersMap[parsed.trainer]) {
          trainersMap[parsed.trainer] = [];
          trainerOrder.push(parsed.trainer);
        }
        if (parsed.category && !trainersMap[parsed.trainer].includes(parsed.category)) {
          trainersMap[parsed.trainer].push(parsed.category);
        }
      }
    });

    return { trainersMap, trainerOrder };
  }, [blocks]);

  // 2. Přiřadí každému trenérovi barevnou rodinu a odliší jeho kategorie různými odstíny
  const trainerColorMap = useMemo(() => {
    const colorMap: Record<
      string,
      {
        family: ColorFamily;
        categoryColors: Record<string, string>;
        defaultColor: string;
      }
    > = {};

    trainerData.trainerOrder.forEach((trainerName, idx) => {
      const family = TRAINER_FAMILIES[idx % TRAINER_FAMILIES.length];
      const categories = trainerData.trainersMap[trainerName];
      const categoryColors: Record<string, string> = {};

      if (categories.length <= 1) {
        if (categories.length === 1) {
          categoryColors[categories[0]] = family.shades[1];
        }
      } else {
        categories.forEach((cat, catIdx) => {
          categoryColors[cat] = family.shades[catIdx % family.shades.length];
        });
      }

      colorMap[trainerName] = {
        family,
        categoryColors,
        defaultColor: family.shades[1],
      };
    });

    return colorMap;
  }, [trainerData]);

  // 3. Spočítá robustní intervalové rozvržení pro každý den
  const dayLayouts = useMemo(() => {
    const result: Record<
      string,
      {
        layouts: Map<number, BlockLayout>;
        maxLanes: number;
      }
    > = {};

    DAYS.forEach((day) => {
      const dayBlocks = blocks.filter((b) => b.day_of_week === day.key);
      result[day.key] = computeDayLayout(dayBlocks);
    });

    return result;
  }, [blocks]);

  useEffect(() => {
    getScheduleList()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setBlocks(items);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded bg-neutral-200" />
    );
  }

  return (
    <section className="w-full">
      <p className="block md:hidden text-center text-xs text-neutral-500 mb-2">
        ← Posunutím do strany zobrazíte celý týden →
      </p>
      <div className="bg-white p-2 sm:p-4 rounded-sm">
        <div className="overflow-x-auto pb-2">
          <div ref={exportRef} className="min-w-[1100px] border border-neutral-800 bg-white">
          <div
            className="grid border-b border-neutral-800 bg-neutral-700 text-white"
            style={{
              gridTemplateColumns: `72px repeat(${timeSlots.length - 1}, minmax(0, 1fr))`,
            }}
          >
            <div className="border-r border-neutral-800" />

            {timeSlots.slice(0, -1).map((slot) => (
              <div
                key={slot}
                className="border-r border-neutral-800 py-1 text-center text-xs font-semibold"
              >
                {formatTime(slot)}
              </div>
            ))}
          </div>

          {DAYS.map((day) => {
            const dayBlocks = blocks.filter(
              (block) => block.day_of_week === day.key,
            );
            const { layouts, maxLanes } = dayLayouts[day.key] ?? {
              layouts: new Map<number, BlockLayout>(),
              maxLanes: 1,
            };

            return (
              <div
                key={day.key}
                className="grid border-b border-neutral-800 last:border-b-0"
                style={{
                  gridTemplateColumns: `72px repeat(${timeSlots.length - 1}, minmax(0, 1fr))`,
                  minHeight: `${Math.max(128, maxLanes * 46)}px`,
                }}
              >
                <div className="flex items-center justify-center border-r border-neutral-800 bg-neutral-700 px-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-white [writing-mode:vertical-rl]">
                  {day.label}
                </div>

                <div
                  className="relative col-span-19"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, transparent 0, transparent calc(100% / 19 - 1px), #171717 calc(100% / 19 - 1px), #171717 calc(100% / 19))",
                  }}
                >
                  {dayBlocks.map((block) => {
                    const start = toMinutes(block.start_time);
                    const end = toMinutes(block.end_time);

                    const left = ((start - DAY_START_MINUTES) / TOTAL_MINUTES) * 100;
                    const width = ((end - start) / TOTAL_MINUTES) * 100;
                    const layout = layouts.get(block.id) ?? {
                      top: "0%",
                      height: "100%",
                      hasBottomBorder: false,
                      isStacked: false,
                    };

                    const parsed = extractTrainerAndCategory(block);
                    const trainerInfo = parsed ? trainerColorMap[parsed.trainer] : undefined;
                    const trainerBg = trainerInfo
                      ? (trainerInfo.categoryColors[parsed?.category ?? ""] || trainerInfo.defaultColor)
                      : undefined;

                    return (
                      <article
                        key={block.id}
                        className={`absolute flex flex-col items-center justify-center overflow-hidden border-x border-neutral-800 px-1 text-center font-bold text-neutral-950 ${
                          layout.hasBottomBorder ? "border-b border-neutral-800" : ""
                        } ${!trainerBg ? blockClasses[block.block_type] : ""}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: layout.top,
                          height: layout.height,
                          ...(trainerBg ? { backgroundColor: trainerBg } : {}),
                        }}
                      >
                        <span className={layout.isStacked ? "text-xs font-bold leading-tight" : "text-sm font-bold leading-tight"}>
                          {block.title}
                        </span>

                        {block.subtitle && (
                          <span
                            className={`mt-0.5 font-semibold leading-tight whitespace-pre-line ${
                              layout.isStacked ? "text-[11px]" : "text-xs"
                            }`}
                          >
                            {block.subtitle.startsWith("(") || block.subtitle.includes("\n") || block.subtitle.startsWith("od ")
                              ? block.subtitle
                              : `(${block.subtitle})`}
                          </span>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </section>
  );
}