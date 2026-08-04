import { useState } from "react";
import { Link } from "react-router";

const DARK = "#393939";
const WHITE = "#ffffff";

export const ConstructionPage = () => {
    const [isHomeHovered, setIsHomeHovered] = useState(false);
    const [isOldSiteHovered, setIsOldSiteHovered] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center px-4 text-center">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-slate-100 p-8 shadow-xl shadow-black/20">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 text-4xl">
                    🚧
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Probíhá migrace webu
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-600">
                    Pracujeme na novém webu a některé stránky jsou momentálně nedostupné. Omlouváme se za dočasné nepříjemnosti a děkujeme za pochopení.
                </p>

                <p className="mt-4 text-base leading-7 text-slate-600">
                    <b>Původní stránky jsou plně funkční</b>, ale pod jinou doménou. Pokud chcete, můžete se vrátit na starý web a prohlédnout si obsah, který je momentálně nedostupný.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {/* Zpět domů — výchozí tmavé pozadí + bílý text, hover: bílé pozadí + tmavý text */}
                    <Link
                        to="/"
                        onMouseEnter={() => setIsHomeHovered(true)}
                        onMouseLeave={() => setIsHomeHovered(false)}
                        style={{
                            backgroundColor: isHomeHovered ? WHITE : DARK,
                            color: isHomeHovered ? DARK : WHITE,
                            border: `1px solid ${DARK}`,
                            transition: "background-color 200ms ease, color 200ms ease",
                        }}
                        className="inline-block rounded-lg px-4 py-2 text-sm font-semibold"
                    >
                        Zpět domů
                    </Link>

                    {/* Na starý web — výchozí bílé pozadí + tmavý text, hover: tmavé pozadí + bílý text */}
                    <a
                        href="https://lrdance.webnode.cz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setIsOldSiteHovered(true)}
                        onMouseLeave={() => setIsOldSiteHovered(false)}
                        style={{
                            backgroundColor: isOldSiteHovered ? DARK : WHITE,
                            color: isOldSiteHovered ? WHITE : DARK,
                            border: `1px solid ${DARK}`,
                            transition: "background-color 200ms ease, color 200ms ease",
                        }}
                        className="inline-block rounded-lg px-4 py-2 text-sm font-semibold"
                    >
                        Na starý plně funkční web
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ConstructionPage;