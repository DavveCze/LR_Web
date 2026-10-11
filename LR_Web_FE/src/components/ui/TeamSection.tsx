import React from "react";

export interface TeamMember {
  name: string;
  role: string;
  specialization?: string;
  photo: string;
}

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Lukáš Čep",
    role: "Trenér",
    specialization: "LAT, STT",
    photo: "/assets/imgs/treneri/cep_1.webp",
  },
  {
    name: "Markéta Dostálová",
    role: "Trenér",
    specialization: "LAT, STT",
    photo: "/assets/imgs/treneri/marki_1.webp",
  },
  {
    name: "Vašek Masaryk",
    role: "Trenér",
    specialization: "LAT",
    photo: "/assets/imgs/treneri/masaryk_1.webp",
  },
  {
    name: "Klára Chovančíková",
    role: "Trenér",
    specialization: "LAT",
    photo: "/assets/imgs/treneri/chovancikova_1.webp",
  },
  {
    name: "Lucie Skopalíková",
    role: "Trenér, Administrativa",
    specialization: "LAT, STT",
    photo: "/assets/imgs/treneri/skopalikova_1.webp",
  },
  {
    name: "Richard Bolek",
    role: "Webmaster",
    specialization: "",
    photo: "/assets/imgs/treneri/bolek_1.webp",
  },
];

interface TeamSectionProps {
  title?: string;
  members?: TeamMember[];
  className?: string;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  title = "NÁŠ TÝM",
  members = DEFAULT_TEAM_MEMBERS,
  className = "",
}) => {
  return (
    <section className={`mx-auto max-w-5xl px-6 py-12 ${className}`}>
      {/* NADPIS SEKCE */}
      <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900">
        {title}
      </h2>

      {/* DĚLÍCÍ ČÁRA POD NADPISEM */}
      <div className="mt-6 mb-12 border-t border-neutral-300" />

      {/* GRID ČLENŮ TÝMU (3 SLOUPCE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-14 gap-x-8">
        {members.map((member) => (
          <div key={member.name} className="flex flex-col items-center">
            {/* KULATÁ FOTOGRAFIE */}
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden aspect-square bg-neutral-100 shadow-xs">
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>

            {/* JMÉNO */}
            <h3 className="mt-4 text-center text-lg md:text-xl font-bold text-neutral-900">
              {member.name}
            </h3>

            {/* SEZNAM ROLÍ A SPECIALIZACÍ */}
            <ul className="mt-2 w-full max-w-[240px] space-y-1 text-sm md:text-base">
              {/* 1. ŘÁDEK: ROLE */}
              <li className="relative flex items-center justify-center text-center">
                <span
                  aria-hidden="true"
                  className="absolute left-2 text-neutral-400 font-light select-none text-base"
                >
                  ›
                </span>
                <span className="text-neutral-500 font-normal">
                  {member.role}
                </span>
              </li>

              {/* 2. ŘÁDEK: SPECIALIZACE (TUČNĚ) */}
              {member.specialization && (
                <li className="relative flex items-center justify-center text-center">
                  <span
                    aria-hidden="true"
                    className="absolute left-2 text-neutral-400 font-light select-none text-base"
                  >
                    ›
                  </span>
                  <strong className="text-neutral-800 font-bold">
                    {member.specialization}
                  </strong>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
