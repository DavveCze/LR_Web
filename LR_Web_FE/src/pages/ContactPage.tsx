import React, { useState } from "react";
import { PartnersSection } from "../components/ui/PartnersSection";
import { apiUrl } from "../api/client";

export const ContactPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [timestamp] = useState<number>(() => Math.floor(Date.now() / 1000));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(apiUrl("contact.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          website: honeypot,
          _ts: timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Odeslání zprávy selhalo.");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při odesílání formuláře.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full bg-white font-sans text-neutral-800 pt-36 pb-24">
      {/* HORNÍ DĚLÍCÍ ČÁRA */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-neutral-300" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* TITULEK STRÁNKY */}
        <h1 className="mb-12 text-2xl font-bold uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-900 pb-2 inline-block">
          KONTAKT
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEVÝ SLOUPCE: KDE TRÉNUJEME, KONTAKTY, BANKA */}
          <div className="lg:col-span-7 space-y-12">
            {/* KDE TRÉNUJEME */}
            <div>
              <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">
                Kde trénujeme
              </h2>

              <div className="space-y-4 text-[19px] font-light leading-[1.6] text-neutral-600 md:text-[20px]">
                <div className="grid grid-cols-[22px_1fr] gap-x-5">
                  <span aria-hidden="true" className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500">
                    ›
                  </span>
                  <div>
                    <strong className="font-semibold text-neutral-800">Tělocvična ZŠ Čkalovova</strong>
                    <p className="text-neutral-500 text-base">Čkalovova 942/2, 708 00 Ostrava – Poruba</p>
                  </div>
                </div>

                <div className="grid grid-cols-[22px_1fr] gap-x-5">
                  <span aria-hidden="true" className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500">
                    ›
                  </span>
                  <div>
                    <strong className="font-semibold text-neutral-800">Dům tance Ostrava</strong>
                    <p className="text-neutral-500 text-base">Ostrava – Stará Bělá</p>
                  </div>
                </div>

                <div className="grid grid-cols-[22px_1fr] gap-x-5">
                  <span aria-hidden="true" className="pt-[1px] text-[27px] font-light leading-[1.35] text-neutral-500">
                    ›
                  </span>
                  <div>
                    <strong className="font-semibold text-neutral-800">Kulturní dům Hlučín</strong>
                    <p className="text-neutral-500 text-base">Hlučín</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DĚLÍCÍ ČÁRA */}
            <div className="border-t border-neutral-200" />

            {/* KONTAKTNÍ OSOBY */}
            <div>
              <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">
                Kontaktní osoby
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border border-neutral-200 p-5 bg-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide text-neutral-900">
                    Lukáš Čep
                  </h3>
                  <p className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mt-1">
                    Trenér LAT / STT
                  </p>
                  <div className="mt-4 space-y-1 text-sm text-neutral-700">
                    <p>
                      <strong className="font-medium text-neutral-900">Mobil:</strong>{" "}
                      <a href="tel:+420728145154" className="hover:underline text-neutral-900">
                        +420 728 145 154
                      </a>
                    </p>
                    <p>
                      <strong className="font-medium text-neutral-900">E-mail:</strong>{" "}
                      <a href="mailto:cep.lukas@seznam.cz" className="hover:underline text-neutral-900">
                        cep.lukas@seznam.cz
                      </a>
                    </p>
                  </div>
                </div>

                <div className="border border-neutral-200 p-5 bg-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide text-neutral-900">
                    Lucie Skopalíková
                  </h3>
                  <p className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mt-1">
                    Vedoucí TŠ Carmen & Tábory
                  </p>
                  <div className="mt-4 space-y-1 text-sm text-neutral-700">
                    <p>
                      <strong className="font-medium text-neutral-900">Mobil:</strong>{" "}
                      <a href="tel:+420732268196" className="hover:underline text-neutral-900">
                        +420 732 268 196
                      </a>
                    </p>
                    <p>
                      <strong className="font-medium text-neutral-900">E-mail:</strong>{" "}
                      <a href="mailto:carmen-dance@seznam.cz" className="hover:underline text-neutral-900">
                        carmen-dance@seznam.cz
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DĚLÍCÍ ČÁRA */}
            <div className="border-t border-neutral-200" />

            {/* FAKTURAČNÍ ÚDAJE & BANKA */}
            <div>
              <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">
                Fakturační a bankovní údaje
              </h2>

              <div className="space-y-px border-t border-b border-gray-300">
                <div className="grid grid-cols-2 gap-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">Název spolku</div>
                  <div className="text-sm font-normal text-gray-700 text-right">Spolek LR Cosmetic dance team, z. s.</div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="grid grid-cols-2 gap-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">Sídlo</div>
                  <div className="text-sm font-normal text-gray-700 text-right">Čkalovova 942/2, 708 00 Ostrava – Poruba</div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="grid grid-cols-2 gap-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">IČO</div>
                  <div className="text-sm font-normal text-gray-700 text-right">65889758</div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="grid grid-cols-2 gap-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">Číslo účtu</div>
                  <div className="text-sm font-normal text-gray-700 text-right">1012808781 / 5500 (Raiffeisenbank)</div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="grid grid-cols-2 gap-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">Variabilní symbol</div>
                  <div className="text-sm font-normal text-gray-700 text-right">Rodné číslo účastníka</div>
                </div>
              </div>
            </div>
          </div>

          {/* PRAVÝ SLOUPCE: KONTAKTNÍ FORMULÁŘ */}
          <div className="lg:col-span-5">
            <div className="border border-neutral-200 bg-white p-8">
              <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
                Napište nám
              </h2>
              <p className="mt-3 text-sm text-neutral-600 font-light leading-relaxed">
                Máte dotaz ke kurzům, soustředěním nebo se chcete přijít podívat na trénink? Zanechte nám zprávu.
              </p>

              {sent ? (
                <div className="mt-8 border border-neutral-900 bg-neutral-50 p-6 text-center">
                  <p className="text-lg font-bold text-neutral-900">Děkujeme za vaši zprávu!</p>
                  <p className="mt-2 text-sm text-neutral-600">
                    Zprávu jsme úspěšně přijali a brzy se vám ozveme zpět.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setMessage("");
                    }}
                    className="mt-6 border border-neutral-900 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    Poslat další zprávu
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Honeypot skryté pole */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                      Jméno a příjmení *
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Např. Jan Novák"
                      className="mt-1 w-full border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                      E-mailová adresa *
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vas@email.cz"
                      className="mt-1 w-full border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                      Telefonní číslo
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+420 777 123 456"
                      className="mt-1 w-full border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                      Zpráva / Dotaz *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Váš dotaz..."
                      className="mt-1 w-full border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-block rounded-lg px-6 py-3 text-sm font-medium transition hover:opacity-80 text-white bg-[#393939] border border-white disabled:opacity-50"
                    >
                      {loading ? "Odesílám..." : "Odeslat zprávu >>"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PARTNEŘI */}
      <PartnersSection className="mt-16" />
    </main>
  );
};
