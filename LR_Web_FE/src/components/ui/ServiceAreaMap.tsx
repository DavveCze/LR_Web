import React, { FC } from "react";

export interface SatelliteTown {
  name: string;
  x: number;
  y: number;
  textAnchor?: "start" | "middle" | "end";
  textX?: number;
  textY?: number;
}

interface ServiceAreaMapProps {
  eyebrow?: string;
  title?: string;
  badgeText?: string;
  className?: string;
}

export const ServiceAreaMap: FC<ServiceAreaMapProps> = ({
  eyebrow = "Kde trénujeme",
  title = "Působnost v Ostravě a okolí",
  badgeText = "Dostupnost MHD i autem",
  className = "",
}) => {
  const center = { name: "OSTRAVA CENTRUM", x: 250, y: 150 };
  const satellites: SatelliteTown[] = [
    { name: "Poruba", x: 130, y: 110, textAnchor: "middle", textY: 95 },
    { name: "Svinov", x: 170, y: 160, textAnchor: "middle", textY: 175 },
    { name: "Hrabůvka & Jih", x: 240, y: 230, textAnchor: "middle", textY: 245 },
    { name: "Slezská Ostrava", x: 330, y: 120, textAnchor: "middle", textY: 105 },
    { name: "Havířov", x: 390, y: 180, textAnchor: "start", textX: 400, textY: 185 },
    { name: "Frýdek-Místek", x: 310, y: 260, textAnchor: "middle", textY: 275 },
    { name: "Bohumín", x: 290, y: 65, textAnchor: "middle", textY: 53 },
  ];
  const travelRings = [45, 90, 130];

  return (
    <div
      className={`border border-neutral-300 bg-neutral-900 text-white rounded-sm p-6 shadow-md flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
              {eyebrow}
            </p>
          )}
          <h3 className="text-xl font-bold uppercase tracking-wide text-white">{title}</h3>
        </div>
        {badgeText && (
          <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full border border-white/20">
            {badgeText}
          </span>
        )}
      </div>

      {/* Stylized SVG Map Visual */}
      <div
        className="relative w-full aspect-[5/3] rounded-sm overflow-hidden my-2 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800"
        role="img"
        aria-label={`${title} — přehled sálů a dostupnosti`}
      >
        <svg viewBox="0 0 500 300" className="w-full h-full" aria-hidden="true">
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Obrysová silueta regionu */}
          <path
            d="M60 90 Q120 40 220 50 T330 45 T430 75 T460 140 T430 230 T340 280 T230 270 T130 260 T60 190 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="opacity-25"
          />

          {/* Dojezdové kružnice */}
          {travelRings.map((radius, i) => (
            <circle
              key={i}
              cx={center.x}
              cy={center.y}
              r={radius}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              className="opacity-20"
            />
          ))}

          {/* Záře centra */}
          <circle cx={center.x} cy={center.y} r="65" fill="url(#centerGlow)" />

          {/* Spojnice k satelitním městům */}
          {satellites.map((sat, i) => (
            <line
              key={i}
              x1={center.x}
              y1={center.y}
              x2={sat.x}
              y2={sat.y}
              stroke="#ffffff"
              strokeWidth="1"
              className="opacity-30"
            />
          ))}

          {/* Satelitní uzly */}
          {satellites.map((sat, i) => (
            <g key={i}>
              <circle cx={sat.x} cy={sat.y} r="4" fill="#d4d4d4" />
              <text
                x={sat.textX ?? sat.x}
                y={sat.textY ?? sat.y - 10}
                textAnchor={sat.textAnchor ?? "middle"}
                className="fill-neutral-300 text-[11px] font-medium tracking-wide"
              >
                {sat.name}
              </text>
            </g>
          ))}

          {/* Centrální uzel — Taneční centrum */}
          <circle cx={center.x} cy={center.y} r="8" fill="#ffffff" />
          <circle cx={center.x} cy={center.y} r="14" fill="none" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
          <text
            x={center.x}
            y={center.y - 18}
            textAnchor="middle"
            className="fill-white text-[12px] font-bold uppercase tracking-wider"
          >
            {center.name}
          </text>
        </svg>
      </div>

      {/* Footer / Popisek */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
        <p>Taneční sály v Ostravě s výbornou dostupností MHD a parkováním.</p>
        <span className="text-white font-medium">100% soukromí bez cookies</span>
      </div>
    </div>
  );
};
