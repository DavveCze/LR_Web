import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api/training-schedule.php";

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
  free: "bg-[#e7f2fb]",
  guided: "bg-[#fff0e6]",
  practice: "bg-[#f9a5ac]",
  fitness: "bg-[#fa9ca5]",
};

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

export function TrainingSchedule() {
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = useMemo(buildTimeSlots, []);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.status === "success") {
          setBlocks(payload.data);
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
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1100px] border border-neutral-800 bg-white">
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

            return (
              <div
                key={day.key}
                className="grid min-h-32 border-b border-neutral-800 last:border-b-0"
                style={{
                  gridTemplateColumns: `72px repeat(${timeSlots.length - 1}, minmax(0, 1fr))`,
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

                    return (
                      <article
                        key={block.id}
                        className={`absolute inset-y-0 flex flex-col items-center justify-center border-x border-neutral-800 px-2 text-center text-sm font-bold text-neutral-950 ${blockClasses[block.block_type]}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      >
                        <span>{block.title}</span>

                        {block.subtitle && (
                          <span className="mt-1 text-xs font-semibold">
                            ({block.subtitle})
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
    </section>
  );
}