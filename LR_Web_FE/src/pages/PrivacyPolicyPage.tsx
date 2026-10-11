import React from "react";
import { PartnersSection } from "../components/ui/PartnersSection";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      <article className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="mb-4 text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-3 inline-block">
          ZÁSADY OCHRANY OSOBNÍCH ÚDAJŮ (GDPR) A INFORMACE O COOKIES
        </h1>

        <p className="mt-4 text-sm text-neutral-500">
          Poslední aktualizace: {new Date().toLocaleDateString("cs-CZ")} | V souladu s nařízením (EU) 2016/679 (GDPR) a § 89 zákona č. 127/2005 Sb.
        </p>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed text-base">
          {/* 1. Správce */}
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              1. Identifikace správce osobních údajů
            </h2>
            <p>
              Správcem vašich osobních údajů je:
            </p>
            <div className="mt-3 p-4 bg-neutral-50 border border-neutral-200 text-sm space-y-1">
              <p><strong>Název:</strong> LR Cosmetic dance team, z. s.</p>
              <p><strong>IČO:</strong> 65889758</p>
              <p><strong>Sídlo:</strong> Čkalovova 942/2, 708 00 Ostrava – Poruba, Česká republika</p>
              <p><strong>Zápis v rejstříku:</strong> Krajský soud v Ostravě, oddíl L, vložka 3782</p>
              <p><strong>E-mail:</strong> <a href="mailto:cep.lukas@seznam.cz" className="underline">cep.lukas@seznam.cz</a></p>
              <p><strong>Telefon:</strong> <a href="tel:+420728145154" className="underline">+420 728 145 154</a></p>
            </div>
          </section>

          {/* 2. Zpracování údajů */}
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              2. Účel a právní základ zpracování
            </h2>
            <p className="mb-3">
              Osobní údaje zpracováváme pro následující účely:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-neutral-600">
              <li>
                <strong>Přihlášky do tanečních kurzů, táborů a klubu:</strong> Zpracování je nezbytné pro splnění smlouvy či přihlášky (čl. 6 odst. 1 písm. b) GDPR). Registrace do akcí probíhá přes zabezpečený externí evidenční systém <em>is.pohodlne.info</em>.
              </li>
              <li>
                <strong>Komunikace a vyřizování dotazů:</strong> Využíváme údaje z kontaktního formuláře nebo e-mailu na základě oprávněného zájmu správce (čl. 6 odst. 1 písm. f) GDPR).
              </li>
              <li>
                <strong>Fotografie a videa z veřejných tanečních soutěží a akademií:</strong> Zveřejňovány jsou pro účely prezentace sportovní činnosti spolku na základě oprávněného zájmu, případně na základě souhlasu zákonných zástupců.
              </li>
              <li>
                <strong>Plnění právních povinností:</strong> Účetnictví a evidence dotací (např. NSA – Národní sportovní agentura, statutární město Ostrava).
              </li>
            </ul>
          </section>

          {/* 3. Doba uchování */}
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              3. Doba uchování údajů
            </h2>
            <p className="text-sm text-neutral-600">
              Osobní údaje uchováváme pouze po dobu nezbytnou k naplnění uvedených účelů: po dobu trvání členství, účasti na kurzu či táboře a následně po dobu vyžadovanou platnými právními předpisy (např. daňové a dotační zákony – až 10 let).
            </p>
          </section>

          {/* 4. Soubory cookies */}
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              4. Používání souborů cookies
            </h2>
            <p className="mb-3 text-sm text-neutral-600">
              Naše webové stránky využívají soubory cookies v souladu s § 89 zákona č. 127/2005 Sb. o elektronických komunikacích:
            </p>
            <div className="space-y-3 text-sm text-neutral-600">
              <p>
                <strong>Technické cookies:</strong> Jsou nezbytné pro správné zobrazení a zabezpečení webu. K jejich ukládání není vyžadován souhlas.
              </p>
              <p>
                <strong>Analytické a marketingové cookies:</strong> Využíváme je výhradně na základě vašeho dobrovolného opt-in souhlasu uděleného v cookie liště.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open_cookie_settings"));
                }}
                className="inline-block border border-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
              >
                Upravit nastavení cookies ›
              </button>
            </div>
          </section>

          {/* 5. Práva subjektu údajů */}
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              5. Vaše práva dle GDPR
            </h2>
            <p className="mb-3 text-sm text-neutral-600">
              Jako subjekt údajů máte právo na:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-neutral-600">
              <li>Právo na přístup ke svým osobním údajům (čl. 15 GDPR)</li>
              <li>Právo na opravu nepřesných údajů (čl. 16 GDPR)</li>
              <li>Právo na výmaz údajů („právo být zapomenut“, čl. 17 GDPR)</li>
              <li>Právo na omezení zpracování (čl. 18 GDPR)</li>
              <li>Právo vznést námitku proti zpracování (čl. 21 GDPR)</li>
              <li>Právo podat stížnost u Úřadu pro ochranu osobních údajů (ÚOOÚ, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.gov.cz)</li>
            </ul>
          </section>
        </div>
      </article>

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};
