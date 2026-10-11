import type { FC } from "react";
import { TeamSection } from "../components/ui/TeamSection";
import { PartnersSection } from "../components/ui/PartnersSection";

export const AboutPage: FC = () => {
  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      {/* 1. SEKCE: HISTORIE */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="mb-10 text-2xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
          HISTORIE
        </h1>

        <div className="space-y-6 text-[20px] font-light leading-[1.6] text-neutral-500 md:text-[21px]">
          <p className="grid grid-cols-[22px_1fr] gap-x-5">
            <span
              aria-hidden="true"
              className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
            >
              ›
            </span>
            <span>
              Taneční klub <strong className="font-semibold text-neutral-700">LR Dance team</strong> založil{" "}
              <strong className="font-semibold text-neutral-700">Zdeněk Chlopčík</strong> v roce 1997.
              Vyrostlo zde spoustu kvalitních soutěžních párů světové úrovně. Vychovali jsme mistry
              České Republiky ve všech kategoriích – Junior I., Junior II., Mládež, Dospělí.
              Také se můžeme pyšnit několikanásobným titulem mistrů ČR v družstvech.
            </span>
          </p>

          <p className="grid grid-cols-[22px_1fr] gap-x-5">
            <span
              aria-hidden="true"
              className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500"
            >
              ›
            </span>
            <span>
              V roce 2000 jsme se rozrostli o <strong className="font-semibold text-neutral-700">taneční školu Carmen</strong>,
              která se zaměřuje na výuku dětí v mateřských a základních školách a snaží se vést děti
              k pozitivnímu postoji k pohybu zábavnou formou.
            </span>
          </p>
        </div>
      </section>

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      {/* 2. SEKCE: NÁŠ TÝM */}
      <TeamSection />

      {/* DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      {/* 3. SEKCE: PARTNEŘI */}
      <PartnersSection />
    </main>
  );
};
