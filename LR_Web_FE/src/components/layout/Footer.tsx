import type { FC } from "react";
import { Link } from "react-router-dom";

export const Footer: FC = () => {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 py-16 text-neutral-400 font-sans">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* IDENTIFIKACE SPOLKU */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              LR DANCE TEAM OSTRAVA & TŠ CARMEN
            </h3>
            <p className="text-xs leading-relaxed text-neutral-400 max-w-md">
              Taneční klub a škola založená v roce 1997. Vychováváme mistry České republiky
              a vedeme taneční kurzy pro mateřské i základní školy, středoškoláky a dospělé.
            </p>
            <div className="pt-2 text-xs text-neutral-400 space-y-1">
              <p><strong>Spolek:</strong> LR Cosmetic dance team, z. s.</p>
              <p><strong>IČO:</strong> 65889758 | <strong>Sídlo:</strong> Čkalovova 942/2, 708 00 Ostrava – Poruba</p>
              <p className="text-neutral-500">Zapsáno ve spolkovém rejstříku vedeném Krajským soudem v Ostravě, oddíl L, vložka 3782.</p>
            </div>
          </div>

          {/* RYCHLÉ ODKAZY */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Rychlé odkazy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/o-nas" className="hover:text-white transition-colors">
                  O klubu & historie
                </Link>
              </li>
              <li>
                <Link to="/nabidka-kurzu" className="hover:text-white transition-colors">
                  Nabídka kurzů
                </Link>
              </li>
              <li>
                <Link to="/carmen" className="hover:text-white transition-colors">
                  Tábory CARMEN
                </Link>
              </li>
              <li>
                <Link to="/rozvrh" className="hover:text-white transition-colors">
                  Rozvrh tréninků
                </Link>
              </li>
              <li>
                <Link to="/kalendar" className="hover:text-white transition-colors">
                  Kalendář akcí
                </Link>
              </li>
              <li>
                <Link to="/klub/fotogalerie" className="hover:text-white transition-colors">
                  Fotogalerie
                </Link>
              </li>
            </ul>
          </div>

          {/* KONTAKT & ÚČET */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Kontakt & Platby
            </h4>
            <div className="space-y-2 text-xs">
              <p>
                <strong>E-mail:</strong>{" "}
                <a href="mailto:cep.lukas@seznam.cz" className="hover:text-white underline">
                  cep.lukas@seznam.cz
                </a>
              </p>
              <p>
                <strong>Mobil:</strong>{" "}
                <a href="tel:+420728145154" className="hover:text-white underline">
                  +420 728 145 154
                </a>
              </p>
              <p className="pt-2">
                <strong>Bankovní spojení:</strong>
                <br />
                1012808781/5500 (Raiffeisenbank)
              </p>
              <div className="pt-2">
                <Link
                  to="/prihlaska"
                  className="inline-block border border-white/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-neutral-900 transition-colors"
                >
                  Online přihláška ›
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* DOLNÍ PRUH A PRÁVNÍ ODKAZY */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            © {new Date().getFullYear()} LR DANCE TEAM OSTRAVA. Všechna práva vyhrazena.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/zasady-ochrany-osobnich-udaju"
              className="hover:text-neutral-300 transition-colors"
            >
              Zásady ochrany osobních údajů (GDPR)
            </Link>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open_cookie_settings"));
              }}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Nastavení cookies
            </button>
            <Link
              to="/kontakt"
              className="hover:text-neutral-300 transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};