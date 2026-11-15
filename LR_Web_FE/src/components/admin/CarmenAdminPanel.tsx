import React, { useEffect, useState } from "react";
import { getPageContent, savePageContent } from "../../api/client";
import { ImagePickerInput } from "./ImagePickerInput";
import { DEFAULT_CARMEN_DATA, type CarmenContent } from "../../constants/carmenData";

export const CarmenAdminPanel: React.FC = () => {
  const [data, setData] = useState<CarmenContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tabory" | "tabor" | "primestsky" | "vikend" | "fotogalerie">("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getPageContent<Partial<CarmenContent>>("carmen")
      .then((json) => {
        if (json && typeof json === "object") {
          setData({
            overview: { ...DEFAULT_CARMEN_DATA.overview, ...(json.overview || {}) },
            tabory: { ...DEFAULT_CARMEN_DATA.tabory, ...(json.tabory || {}) },
            tabor: { ...DEFAULT_CARMEN_DATA.tabor, ...(json.tabor || {}) },
            primestsky: { ...DEFAULT_CARMEN_DATA.primestsky, ...(json.primestsky || {}) },
            vikend: { ...DEFAULT_CARMEN_DATA.vikend, ...(json.vikend || {}) },
            fotogalerie: {
              title: json.fotogalerie?.title || DEFAULT_CARMEN_DATA.fotogalerie.title,
              albums: Array.isArray(json.fotogalerie?.albums)
                ? json.fotogalerie.albums
                : DEFAULT_CARMEN_DATA.fotogalerie.albums,
            },
          });
        } else {
          setData(DEFAULT_CARMEN_DATA);
        }
      })
      .catch(() => {
        setData(DEFAULT_CARMEN_DATA);
        setMessage({ type: "error", text: "Nepodařilo se načíst obsah sekce Carmen, použita výchozí data." });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);

    try {
      await savePageContent("carmen", data);
      setMessage({ type: "success", text: "Změny sekce Carmen byly úspěšně uloženy!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Chyba při ukládání.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 bg-white rounded shadow text-gray-500">Načítám správu sekce Carmen…</div>;
  }

  if (!data) {
    return <div className="p-6 bg-white rounded shadow text-red-500">Data pro sekci Carmen nejsou dostupná.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="p-6 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 bg-neutral-50">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Správa Taneční školy CARMEN</h2>
          <p className="text-sm text-neutral-600">
            Editace textů, externích odkazů na přihlášky (is.pohodlne.info), plakátů a fotek ve slideshow.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-2.5 rounded font-semibold text-sm transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit změny Carmen"}
        </button>
      </div>

      {message && (
        <div
          className={`px-6 py-3 text-sm font-medium ${
            message.type === "success" ? "bg-green-50 text-green-800 border-b border-green-200" : "bg-red-50 text-red-800 border-b border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Taby editoru */}
      <div className="flex border-b border-neutral-200 bg-neutral-100 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "overview"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          O Carmen & Slideshow
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tabory")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "tabory"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Tábory (Rozcestník)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tabor")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "tabor"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Spací tábor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("primestsky")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "primestsky"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Příměstský tábor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vikend")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "vikend"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Taneční víkend
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fotogalerie")}
          className={`px-5 py-3 border-b-2 transition ${
            activeTab === "fotogalerie"
              ? "border-neutral-900 text-neutral-900 bg-white font-bold"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Fotogalerie
        </button>
      </div>

      <div className="p-6">
        {/* 1. O CARMEN & SLIDESHOW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Hlavní titulek</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.overview.title}
                onChange={(e) =>
                  setData({
                    ...data,
                    overview: { ...data.overview, title: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Odkaz Facebook skupina</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                  value={data.overview.facebookUrl}
                  onChange={(e) =>
                    setData({
                      ...data,
                      overview: { ...data.overview, facebookUrl: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Cílový odkaz tlačítka Fotogalerie</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                  value={data.overview.galleryUrl}
                  onChange={(e) =>
                    setData({
                      ...data,
                      overview: { ...data.overview, galleryUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-2">Textové odrážky Carmen</label>
              <div className="space-y-3">
                {data.overview.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="font-bold text-neutral-500 pt-2">{idx + 1}.</span>
                    <textarea
                      rows={2}
                      className="w-full border border-neutral-300 p-2 rounded text-sm"
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...data.overview.bullets];
                        newBullets[idx] = e.target.value;
                        setData({
                          ...data,
                          overview: { ...data.overview, bullets: newBullets },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-base font-bold text-neutral-800 mb-3">Fotografie ve Slideshow</h3>
              <div className="space-y-3">
                {data.overview.slideshow.map((slide, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded">
                    <div className="flex-1 min-w-[280px]">
                      <ImagePickerInput
                        value={slide.src}
                        placeholder="Cesta k obrázku (/assets/imgs/...)"
                        defaultFolder="carmen"
                        onChange={(val) => {
                          const newSlides = [...data.overview.slideshow];
                          newSlides[idx].src = val;
                          setData({
                            ...data,
                            overview: { ...data.overview, slideshow: newSlides },
                          });
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input
                        type="text"
                        className="w-full border border-neutral-300 p-1.5 rounded text-xs"
                        value={slide.alt || ""}
                        placeholder="Popis fotky (alt)"
                        onChange={(e) => {
                          const newSlides = [...data.overview.slideshow];
                          newSlides[idx].alt = e.target.value;
                          setData({
                            ...data,
                            overview: { ...data.overview, slideshow: newSlides },
                          });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlides = data.overview.slideshow.filter((_, i) => i !== idx);
                        setData({
                          ...data,
                          overview: { ...data.overview, slideshow: newSlides },
                        });
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
                    >
                      Odstranit
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setData({
                      ...data,
                      overview: {
                        ...data.overview,
                        slideshow: [
                          ...data.overview.slideshow,
                          { src: "/assets/imgs/carmen/mascot_1.webp", alt: "Nová fotka" },
                        ],
                      },
                    });
                  }}
                  className="mt-2 text-xs font-semibold border border-neutral-400 bg-white px-3 py-1.5 rounded hover:bg-neutral-100"
                >
                  + Přidat fotku do slideshow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. HLAVNÍ STRÁNKA TÁBORY (ROZCESTNÍK) */}
        {activeTab === "tabory" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Titulek stránky</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.tabory?.title || "TÁBORY"}
                onChange={(e) =>
                  setData({
                    ...data,
                    tabory: {
                      ...(data.tabory || {
                        title: "TÁBORY",
                        paragraphs: [],
                      }),
                      title: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Textové odstavce</label>
              <div className="space-y-3">
                {(data.tabory?.paragraphs || [
                  "Naše tábory jsou spojením tradičních a moderních táborů, které se svým osvědčeným týmem vedoucích s mnohaletou táborovou praxí tvoří nezapomenutelné prázdninové dny. Tábory pro děti pořádáme již od roku 2004. Nejen pro menší děti, ale i dospívající teenagery je připraven různorodý zábavný program. Těšit se můžete na nezapomenutelné chvíle strávené v krásné přírodě Beskyd, kde se Vaše děti budou moci zapojit do široké škály aktivit a her, pracují v týmech a nechybějí oblíbené diskotéky. Letní spací tábor pořádáme v RK Budoucnost, Nová Ves – Frýdlant nad Ostravicí, kde máme krásné zázemí s in-line dráhou, kterou využíváme k bruslení a skatu. Příměstské tábory pořádáme v Markvartovicích nedaleko Ostravy, kde již kousíček za městem jsme v úplně jiném světě.",
                  "Zárukou kvality našich táborů jsou spokojené děti, které se každoročně účastní našich letních táborů. Také rodinná atmosféra, která zaručí bezpečí a jistotu, pro děti, které s námi jedou poprvé. Zkrátka nezáleží na tom, kolik ti je let, jestli jsi holka nebo kluk. Na našem táboře si užiješ ty nejlepší prázdninové dny, poznáš nové kamarády a odvezeš si nezapomenutelné zážitky."
                ]).map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <textarea
                      rows={4}
                      className="w-full border border-neutral-300 p-2 rounded text-sm"
                      value={p}
                      onChange={(e) => {
                        const next = [...(data.tabory?.paragraphs || [])];
                        next[idx] = e.target.value;
                        setData({
                          ...data,
                          tabory: {
                            ...(data.tabory || {
                              title: "TÁBORY",
                              paragraphs: [],
                            }),
                            paragraphs: next,
                          },
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (data.tabory?.paragraphs || []).filter((_, i) => i !== idx);
                        setData({
                          ...data,
                          tabory: {
                            ...(data.tabory || {
                              title: "TÁBORY",
                              paragraphs: [],
                            }),
                            paragraphs: next,
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-bold"
                    >
                      Smazat
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(data.tabory?.paragraphs || []), "Nový odstavec"];
                    setData({
                      ...data,
                      tabory: {
                        ...(data.tabory || {
                          title: "TÁBORY",
                          paragraphs: [],
                        }),
                        paragraphs: next,
                      },
                    });
                  }}
                  className="text-xs font-semibold border border-neutral-400 bg-white px-3 py-1.5 rounded hover:bg-neutral-100"
                >
                  + Přidat odstavec
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. SPACÍ TÁBOR */}
        {activeTab === "tabor" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Titulek stránky</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.tabor.title}
                onChange={(e) => setData({ ...data, tabor: { ...data.tabor, title: e.target.value } })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">
                Registrační odkaz (is.pohodlne.info)
              </label>
              <input
                type="url"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.tabor.registrationUrl}
                onChange={(e) =>
                  setData({
                    ...data,
                    tabor: { ...data.tabor, registrationUrl: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Cesta k plakátu tábora</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.tabor.poster}
                onChange={(e) => setData({ ...data, tabor: { ...data.tabor, poster: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Lokalita</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.tabor.location}
                  onChange={(e) => setData({ ...data, tabor: { ...data.tabor, location: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Věk účastníků</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.tabor.age}
                  onChange={(e) => setData({ ...data, tabor: { ...data.tabor, age: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Strava</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.tabor.food}
                  onChange={(e) => setData({ ...data, tabor: { ...data.tabor, food: e.target.value } })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. PŘÍMĚSTSKÝ TÁBOR */}
        {activeTab === "primestsky" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Titulek stránky</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.primestsky.title}
                onChange={(e) => setData({ ...data, primestsky: { ...data.primestsky, title: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">
                  Registrační odkaz ČERVENEC (is.pohodlne.info)
                </label>
                <input
                  type="url"
                  className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                  value={data.primestsky.julyUrl}
                  onChange={(e) =>
                    setData({
                      ...data,
                      primestsky: { ...data.primestsky, julyUrl: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">
                  Registrační odkaz SRPEN (is.pohodlne.info)
                </label>
                <input
                  type="url"
                  className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                  value={data.primestsky.augustUrl}
                  onChange={(e) =>
                    setData({
                      ...data,
                      primestsky: { ...data.primestsky, augustUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Cesta k plakátu tábora</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.primestsky.poster}
                onChange={(e) => setData({ ...data, primestsky: { ...data.primestsky, poster: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Místo konání</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.primestsky.location}
                  onChange={(e) => setData({ ...data, primestsky: { ...data.primestsky, location: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Termíny</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.primestsky.terms}
                  onChange={(e) => setData({ ...data, primestsky: { ...data.primestsky, terms: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">V ceně</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.primestsky.food}
                  onChange={(e) => setData({ ...data, primestsky: { ...data.primestsky, food: e.target.value } })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. TANEČNÍ VÍKEND */}
        {activeTab === "vikend" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Titulek stránky</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.vikend.title}
                onChange={(e) => setData({ ...data, vikend: { ...data.vikend, title: e.target.value } })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">
                Registrační odkaz (is.pohodlne.info)
              </label>
              <input
                type="url"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.vikend.registrationUrl}
                onChange={(e) =>
                  setData({
                    ...data,
                    vikend: { ...data.vikend, registrationUrl: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Fotografie / Plakát víkendu</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.vikend.poster}
                onChange={(e) => setData({ ...data, vikend: { ...data.vikend, poster: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Termín</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.vikend.term}
                  onChange={(e) => setData({ ...data, vikend: { ...data.vikend, term: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Lokalita</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.vikend.location}
                  onChange={(e) => setData({ ...data, vikend: { ...data.vikend, location: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1">Cena</label>
                <input
                  type="text"
                  className="w-full border border-neutral-300 p-2 rounded text-sm"
                  value={data.vikend.price}
                  onChange={(e) => setData({ ...data, vikend: { ...data.vikend, price: e.target.value } })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. FOTOGALERIE */}
        {activeTab === "fotogalerie" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1">Titulek stránky</label>
              <input
                type="text"
                className="w-full border border-neutral-300 p-2.5 rounded text-sm"
                value={data.fotogalerie.title}
                onChange={(e) =>
                  setData({
                    ...data,
                    fotogalerie: { ...data.fotogalerie, title: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-neutral-800">Alba fotogalerie Carmen</label>
              {data.fotogalerie.albums.map((album, idx) => (
                <div key={album.id || idx} className="p-4 border border-neutral-200 rounded bg-neutral-50 flex flex-wrap gap-4 items-start">
                  <div className="flex-1 min-w-[240px] space-y-2">
                    <input
                      type="text"
                      className="w-full border border-neutral-300 p-1.5 rounded text-xs"
                      placeholder="Název alba"
                      value={album.title}
                      onChange={(e) => {
                        const newAlbums = [...data.fotogalerie.albums];
                        newAlbums[idx].title = e.target.value;
                        setData({
                          ...data,
                          fotogalerie: { ...data.fotogalerie, albums: newAlbums },
                        });
                      }}
                    />
                    <input
                      type="url"
                      className="w-full border border-neutral-300 p-1.5 rounded text-xs"
                      placeholder="Odkaz na album (Rajče apod.)"
                      value={album.url}
                      onChange={(e) => {
                        const newAlbums = [...data.fotogalerie.albums];
                        newAlbums[idx].url = e.target.value;
                        setData({
                          ...data,
                          fotogalerie: { ...data.fotogalerie, albums: newAlbums },
                        });
                      }}
                    />
                    <ImagePickerInput
                      label="Obalové foto alba"
                      value={album.image}
                      defaultFolder="carmen"
                      onChange={(val) => {
                        const newAlbums = [...data.fotogalerie.albums];
                        newAlbums[idx].image = val;
                        setData({
                          ...data,
                          fotogalerie: { ...data.fotogalerie, albums: newAlbums },
                        });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAlbums = data.fotogalerie.albums.filter((_, i) => i !== idx);
                      setData({
                        ...data,
                        fotogalerie: { ...data.fotogalerie, albums: newAlbums },
                      });
                    }}
                    className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
                  >
                    Smazat album
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setData({
                    ...data,
                    fotogalerie: {
                      ...data.fotogalerie,
                      albums: [
                        ...data.fotogalerie.albums,
                        {
                          id: `album-${Date.now()}`,
                          title: "Nové album",
                          image: "/assets/imgs/downloaded/carmen_akademie_2023_1.webp",
                          url: "https://www.rajce.idnes.cz/lr-dance/",
                        },
                      ],
                    },
                  });
                }}
                className="text-xs font-semibold border border-neutral-400 bg-white px-3 py-1.5 rounded hover:bg-neutral-100"
              >
                + Přidat album
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
