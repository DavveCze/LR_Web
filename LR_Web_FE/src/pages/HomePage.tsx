import type { FC } from "react";
import { Slideshow } from "../components/ui/Slideshow";

export const HomePage: FC = () => {
  return (
    <main className="bg-white font-sans text-neutral-800">

      {/* HERO — velký obrázek na pozadí, dva nadpisy uprostřed, oddělené linkou */}
      <section
        className="relative flex min-h-[70vh] flex-col items-center justify-center bg-cover bg-center bg-fixed px-6 text-center"
        style={{ backgroundImage: "url('https://picsum.photos/id/1011/1920/1080')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl">
          <h1 className="border-t border-b border-white/70 py-4 text-3xl font-light uppercase tracking-wide text-white md:text-5xl">
            Taneční klub LR DANCE TEAM OSTRAVA
          </h1>
          <h2 className="mt-6 text-2xl font-light uppercase tracking-wide text-white md:text-4xl">
            Taneční škola CARMEN
          </h2>
        </div>
      </section>

      {/* AKTUÁLNÍ DĚNÍ — text vlevo, obrázek/karusel vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-red-600">›</span> Aktuální dění
          </h3>
          <p className="mb-6 text-neutral-700">
            Snažíme se stránky udržovat, proto je dobré sledovat aktuality.
          </p>
          <a
            href="/aktuality"
            className="inline-block bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Aktuality &gt;&gt;
          </a>
        </div>
        <Slideshow images={[{ src: "https://picsum.photos/id/1011/1920/1080", alt: "Aktuality" }]} className="aspect-[8/5] w-full" />
      </section>

      {/* PROFESIONÁLNÍ TANEČNÍ KLUB — plný parallax pruh (background-attachment: fixed) */}
      <section
        className="relative flex min-h-[60vh] items-center bg-cover bg-center bg-fixed px-6 py-24"
        style={{ backgroundImage: "url('https://picsum.photos/id/1062/1920/1080')" }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto max-w-2xl text-white">
          <h2 className="mb-6 text-3xl font-semibold">Profesionální taneční klub</h2>
          <p className="mb-8 leading-relaxed">
            <span className="mr-2 text-red-500">›</span>
            Klub je zaměřen jak na <strong>standardní</strong>, tak <strong>latinskoamerické tance</strong>. Jedním z
            trenérů je také <strong>Václav Masaryk s Klárou Chovančíkovou</strong> – několikanásobný{" "}
            <strong>mistr České republiky</strong> v latinskoamerických tancích. Připoj se a{" "}
            <strong>tancuj s námi</strong>!
          </p>
          <a
            href="/o-nas"
            className="inline-block bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
          >
            &lt;&lt; O klubu
          </a>
        </div>
      </section>

      {/* OD MALÝCH AŽ PO TY VELKÉ — obrázek vlevo, text vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <img
          src="https://picsum.photos/id/1074/800/500"
          alt="Dětský taneční pár na soutěži"
          width={800}
          height={500}
          loading="lazy"
          className="w-full object-cover"
        />
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Od malých až po ty velké</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-red-600">›</span>
            Nabízíme široké <strong>věkové rozpětí</strong>. U nás se najdou děti ze <strong>školky</strong>, ze{" "}
            <strong>školy</strong>, ale také <strong>dospělí tanečníci</strong> různého věku. Neváhejte a{" "}
            <strong>začněte také</strong>!
          </p>
          <a
            href="/kurzy"
            className="inline-block bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            &lt;&lt; Více informací
          </a>
        </div>
      </section>

      {/* TANEČNÍ SOUSTŘEDĚNÍ — text vlevo, obrázek vpravo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Taneční soustředění</h2>
          <p className="mb-8 leading-relaxed text-neutral-700">
            <span className="mr-2 text-red-600">›</span>
            <strong>Několikrát ročně</strong> pořádáme víkendová nebo <strong>týdenní soustředění</strong> zaměřená na{" "}
            <strong>fyzický trénink</strong>, přípravu na velké akce jako MČR a podobně. Soustředění jsou určena pro{" "}
            <strong>všechny věkové kategorie</strong>.
          </p>
          <a
            href="/kalendar"
            className="inline-block bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Kalendář akcí &gt;&gt;
          </a>
        </div>
        <img
          src="https://picsum.photos/id/1039/800/500"
          alt="Chata pro taneční soustředění"
          width={800}
          height={500}
          loading="lazy"
          className="w-full object-cover"
        />
      </section>
    </main>
  );
};