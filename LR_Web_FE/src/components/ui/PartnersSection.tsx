import React, { useState, useEffect } from "react";
import { apiUrl } from "../../api/client";

export interface PartnerLogo {
  id: string;
  name: string;
  logo: string;
  url?: string;
  position?: "left" | "right-top" | "right-bottom" | "grid";
}

export interface PartnerNotice {
  id: string;
  logo?: string;
  title: string;
  paragraphs: string[];
  thanksText?: string;
}

export interface PartnersContent {
  title: string;
  mainLogos: PartnerLogo[];
  notices: PartnerNotice[];
}

export const DEFAULT_PARTNERS_CONTENT: PartnersContent = {
  title: "PARTNEŘI",
  mainLogos: [
    {
      id: "csts",
      name: "Český svaz tanečního sportu",
      logo: "/assets/imgs/partners/csts_logo_1.webp",
      url: "https://csts.cz",
      position: "left",
    },
    {
      id: "ostrava",
      name: "Statutární město Ostrava",
      logo: "/assets/imgs/partners/ostrava_logo_1.webp",
      url: "https://ostrava.cz",
      position: "right-top",
    },
    {
      id: "nsa",
      name: "Národní sportovní agentura",
      logo: "/assets/imgs/partners/nsa_logo_1.webp",
      url: "https://nsa.gov.cz",
      position: "right-bottom",
    },
  ],
  notices: [
    {
      id: "nsa-dotace",
      logo: "/assets/imgs/partners/nsa_logo_1.webp",
      title: "Podpora Národní sportovní agentury",
      paragraphs: [
        "Spolek LR Cosmetic dance team, z. s. obdržel v roce [2026] dotaci od Národní sportovní agentury ve výši 248 400 Kč.",
        "Dotace je využívána na podporu sportovní činnosti a rozvoj tanečního sportu.",
      ],
      thanksText: "Za poskytnutou podporu děkujeme.",
    },
  ],
};

interface PartnersSectionProps {
  className?: string;
  editable?: boolean;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({
  className = "",
  editable = false,
}) => {
  const [content, setContent] = useState<PartnersContent>(DEFAULT_PARTNERS_CONTENT);
  const [draft, setDraft] = useState<PartnersContent>(DEFAULT_PARTNERS_CONTENT);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Načtení uložených partnerů z backendu
  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl("content.php?page=partners"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data === "object" && data.title) {
          setContent(data as PartnersContent);
          setDraft(data as PartnersContent);
        }
      })
      .catch(() => {
        // Fallback na výchozí data
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setDraft(JSON.parse(JSON.stringify(content)));
    setIsEditing(true);
    setStatusMessage(null);
  };

  const handleCancelEdit = () => {
    setDraft(JSON.parse(JSON.stringify(content)));
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch(apiUrl("content.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "partners",
          content: draft,
        }),
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se uložit data na server.");
      }

      setContent(draft);
      setIsEditing(false);
      setStatusMessage("Partneři a popisky byli úspěšně uloženi.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Chyba při ukládání.");
    } finally {
      setIsSaving(false);
    }
  };

  // Správa log v editoru
  const updateLogo = (index: number, patch: Partial<PartnerLogo>) => {
    const updated = [...draft.mainLogos];
    updated[index] = { ...updated[index], ...patch };
    setDraft({ ...draft, mainLogos: updated });
  };

  const addLogo = () => {
    const newLogo: PartnerLogo = {
      id: `partner-${Date.now()}`,
      name: "Nový partner",
      logo: "/assets/imgs/partners/ostrava_logo_1.webp",
      url: "",
      position: "grid",
    };
    setDraft({ ...draft, mainLogos: [...draft.mainLogos, newLogo] });
  };

  const removeLogo = (index: number) => {
    const updated = draft.mainLogos.filter((_, i) => i !== index);
    setDraft({ ...draft, mainLogos: updated });
  };

  // Správa textových bloků v editoru
  const updateNotice = (index: number, patch: Partial<PartnerNotice>) => {
    const updated = [...draft.notices];
    updated[index] = { ...updated[index], ...patch };
    setDraft({ ...draft, notices: updated });
  };

  const addNotice = () => {
    const newNotice: PartnerNotice = {
      id: `notice-${Date.now()}`,
      logo: "/assets/imgs/partners/logo_nsa_barevne-pozitivni_rgb_1.webp",
      title: "Nový dotační nebo sponzorský program",
      paragraphs: ["Zde doplňte text oznámení nebo popis projektu."],
      thanksText: "Za poskytnutou podporu děkujeme.",
    };
    setDraft({ ...draft, notices: [...draft.notices, newNotice] });
  };

  const removeNotice = (index: number) => {
    const updated = draft.notices.filter((_, i) => i !== index);
    setDraft({ ...draft, notices: updated });
  };

  // Třídění log pro zobrazení dle cílového vizuálu z fotky
  const leftLogo = content.mainLogos.find((l) => l.position === "left") || content.mainLogos[0];
  const rightTopLogo =
    content.mainLogos.find((l) => l.position === "right-top") ||
    (content.mainLogos.length > 1 ? content.mainLogos[1] : null);
  const rightBottomLogo =
    content.mainLogos.find((l) => l.position === "right-bottom") ||
    (content.mainLogos.length > 2 ? content.mainLogos[2] : null);

  const extraLogos = content.mainLogos.filter(
    (l) => l.id !== leftLogo?.id && l.id !== rightTopLogo?.id && l.id !== rightBottomLogo?.id
  );

  return (
    <section
      className={`mx-auto max-w-5xl px-6 py-12 font-sans ${className}`}
      aria-label="Partneři"
    >
      {/* HLAVIČKA SEKCE S PŘEPÍNAČEM EDITACE */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900">
          {content.title}
        </h2>

        {editable && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs uppercase tracking-wider font-semibold text-neutral-400 hover:text-neutral-900 transition-colors px-3 py-1.5 border border-dashed border-neutral-300 hover:border-neutral-900 rounded-sm"
            title="Upravit partnery a dotační popisky"
          >
            ✎ Upravit partnery
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 text-xs font-semibold bg-neutral-100 border border-neutral-300 text-neutral-800">
          {statusMessage}
        </div>
      )}

      {/* HORIZONTÁLNÍ DĚLÍCÍ ČÁRA */}
      <div className="mt-4 mb-12 border-t border-neutral-300" />

      {/* === REŽIM EDITACE (FORMULÁŘ PRO SPRÁVU PARTNERŮ) === */}
      {isEditing ? (
        <div className="mb-12 border-2 border-neutral-900 bg-neutral-50 p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
            <h3 className="text-lg font-bold uppercase tracking-wider text-neutral-900">
              Správa partnerů a dotačních popisků
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-neutral-900 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSaving ? "Ukládám..." : "💾 Uložit změny"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="border border-neutral-400 bg-white text-neutral-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100"
              >
                ✕ Zrušit
              </button>
            </div>
          </div>

          {/* Titulek sekce */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Nadpis sekce
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          {/* Seznam log */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Partner Loga ({draft.mainLogos.length})
              </h4>
              <button
                type="button"
                onClick={addLogo}
                className="text-xs font-semibold uppercase tracking-wider bg-neutral-200 px-3 py-1.5 hover:bg-neutral-300"
              >
                + Přidat partnera
              </button>
            </div>

            <div className="space-y-4">
              {draft.mainLogos.map((logo, idx) => (
                <div key={logo.id} className="border border-neutral-300 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-neutral-500">
                      Partner #{idx + 1}: {logo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLogo(idx)}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Odstranit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-600">Název partnera</label>
                      <input
                        type="text"
                        value={logo.name}
                        onChange={(e) => updateLogo(idx, { name: e.target.value })}
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600">Cesta k logu (obrázek)</label>
                      <input
                        type="text"
                        value={logo.logo}
                        onChange={(e) => updateLogo(idx, { logo: e.target.value })}
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600">Webový odkaz (volitelné)</label>
                      <input
                        type="text"
                        value={logo.url || ""}
                        onChange={(e) => updateLogo(idx, { url: e.target.value })}
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600">Pozice v rozvržení</label>
                      <select
                        value={logo.position || "grid"}
                        onChange={(e) =>
                          updateLogo(idx, { position: e.target.value as PartnerLogo["position"] })
                        }
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs bg-white"
                      >
                        <option value="left">Vlevo (hlavní velké logo)</option>
                        <option value="right-top">Vpravo nahoře</option>
                        <option value="right-bottom">Vpravo dole</option>
                        <option value="grid">Další v mřížce</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seznam dotačních popisků */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Textové bloky a dotační deklarace ({draft.notices.length})
              </h4>
              <button
                type="button"
                onClick={addNotice}
                className="text-xs font-semibold uppercase tracking-wider bg-neutral-200 px-3 py-1.5 hover:bg-neutral-300"
              >
                + Přidat dotační blok
              </button>
            </div>

            <div className="space-y-4">
              {draft.notices.map((notice, idx) => (
                <div key={notice.id} className="border border-neutral-300 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-neutral-500">
                      Blok #{idx + 1}: {notice.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNotice(idx)}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Odstranit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-600">Nadpis bloku</label>
                      <input
                        type="text"
                        value={notice.title}
                        onChange={(e) => updateNotice(idx, { title: e.target.value })}
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600">Cesta k logu instituce</label>
                      <input
                        type="text"
                        value={notice.logo || ""}
                        onChange={(e) => updateNotice(idx, { logo: e.target.value })}
                        className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600">
                      Odstavce textu (každý odstavec na nový řádek)
                    </label>
                    <textarea
                      rows={4}
                      value={notice.paragraphs.join("\n\n")}
                      onChange={(e) =>
                        updateNotice(idx, {
                          paragraphs: e.target.value
                            .split("\n\n")
                            .map((p) => p.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600">Závěrečné poděkování</label>
                    <input
                      type="text"
                      value={notice.thanksText || ""}
                      onChange={(e) => updateNotice(idx, { thanksText: e.target.value })}
                      className="mt-1 w-full border border-neutral-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* === HLAVNÍ LOGA PARTNERŮ (CÍLOVÝ VIZUÁL Z FOTKY) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* LEVÝ SLOUPEC: VELKÉ LOGO (ČSTS) */}
        {leftLogo && (
          <div className="flex items-center justify-center p-4">
            {leftLogo.url ? (
              <a
                href={leftLogo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-200 hover:scale-102"
              >
                <img
                  src={leftLogo.logo}
                  alt={leftLogo.name}
                  className="max-h-80 md:max-h-96 w-auto object-contain mx-auto"
                  loading="lazy"
                />
              </a>
            ) : (
              <img
                src={leftLogo.logo}
                alt={leftLogo.name}
                className="max-h-80 md:max-h-96 w-auto object-contain mx-auto"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* PRAVÝ SLOUPEC: DVA LOGA VERTIKÁLNĚ NAD SEBOU (OSTRAVA & NSA) */}
        <div className="flex flex-col items-center justify-center space-y-12 md:space-y-16 p-4">
          {/* Horní logo (Ostrava) */}
          {rightTopLogo && (
            <div className="w-full flex justify-center">
              {rightTopLogo.url ? (
                <a
                  href={rightTopLogo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-200 hover:scale-105"
                >
                  <img
                    src={rightTopLogo.logo}
                    alt={rightTopLogo.name}
                    className="max-h-20 md:max-h-24 w-auto object-contain mx-auto"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={rightTopLogo.logo}
                  alt={rightTopLogo.name}
                  className="max-h-20 md:max-h-24 w-auto object-contain mx-auto"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Dolní logo (Národní sportovní agentura) */}
          {rightBottomLogo && (
            <div className="w-full flex justify-center">
              {rightBottomLogo.url ? (
                <a
                  href={rightBottomLogo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-200 hover:scale-105"
                >
                  <img
                    src={rightBottomLogo.logo}
                    alt={rightBottomLogo.name}
                    className="max-h-36 md:max-h-44 w-auto object-contain mx-auto"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={rightBottomLogo.logo}
                  alt={rightBottomLogo.name}
                  className="max-h-36 md:max-h-44 w-auto object-contain mx-auto"
                  loading="lazy"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* PŘÍPADNÁ DALŠÍ LOGA V MŘÍŽCE */}
      {extraLogos.length > 0 && (
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 items-center justify-items-center">
          {extraLogos.map((logo) => (
            <div key={logo.id} className="flex h-24 w-full items-center justify-center p-3">
              {logo.url ? (
                <a
                  href={logo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-200 hover:scale-105"
                >
                  <img
                    src={logo.logo}
                    alt={logo.name}
                    className="max-h-16 max-w-full object-contain"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={logo.logo}
                  alt={logo.name}
                  className="max-h-16 max-w-full object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* DĚLÍCÍ ČÁRA MEZI LOGY A DOTAČNÍMI POPISKY */}
      {content.notices.length > 0 && (
        <div className="my-14 border-t border-neutral-300" />
      )}

      {/* === DOTAČNÍ DEKLARACE A SPECIÁLNÍ POPISKY (CÍLOVÝ VIZUÁL Z FOTKY) === */}
      <div className="space-y-12">
        {content.notices.map((notice) => (
          <div
            key={notice.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
          >
            {/* Logo instituce vlevo */}
            {notice.logo && (
              <div className="md:col-span-3 flex justify-center md:justify-start pt-1">
                <img
                  src={notice.logo}
                  alt={notice.title}
                  className="w-28 md:w-36 max-h-32 object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {/* Textový obsah dotace vpravo */}
            <div
              className={`${
                notice.logo ? "md:col-span-9" : "md:col-span-12"
              } space-y-4`}
            >
              <h3 className="text-base md:text-lg font-bold text-neutral-900">
                {notice.title}
              </h3>

              {notice.paragraphs.map((p, pIdx) => (
                <p
                  key={pIdx}
                  className="text-sm md:text-base text-neutral-600 font-light leading-relaxed"
                >
                  {p}
                </p>
              ))}

              {notice.thanksText && (
                <p className="text-sm md:text-base text-neutral-600 font-light pt-2 text-center md:text-left">
                  {notice.thanksText}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
