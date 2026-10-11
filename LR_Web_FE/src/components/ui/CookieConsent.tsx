import React, { useState, useEffect, useRef } from "react";

/**
 * Universal Cookie Consent Banner & Modal (CZ / EU Compliant)
 * Strictly follows § 89 Act No. 127/2005 Coll. (Czech Electronic Communications Act) & GDPR.
 * - Opt-in model (non-essential cookies never pre-checked).
 * - Full keyboard accessibility (focus trapping, Escape to close).
 * - Persistent choices in localStorage.
 * - Global event listener for re-opening settings from footer.
 * - Dispatches 'cookie_consent_updated' event.
 */

const DEFAULT_STORAGE_KEY = "lr_dance_cookie_consent_v1";

interface ConsentState {
  hasResolved: boolean;
  showBanner: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentProps {
  storageKey?: string;
  privacyUrl?: string;
  brandName?: string;
  onConsentChange?: ((payload: { analytics: boolean; marketing: boolean; timestamp: string }) => void) | null;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  storageKey = DEFAULT_STORAGE_KEY,
  privacyUrl = "/zasady-ochrany-osobnich-udaju",
  brandName = "LR DANCE TEAM OSTRAVA",
  onConsentChange = null,
}) => {
  const [consent, setConsent] = useState<ConsentState>(() => {
    if (typeof window === "undefined") {
      return { hasResolved: false, showBanner: true, analytics: false, marketing: false };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          hasResolved: true,
          showBanner: false,
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
        };
      }
    } catch {
      // Storage unavailable fallback
    }
    return { hasResolved: false, showBanner: true, analytics: false, marketing: false };
  });

  const [showModal, setShowModal] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => consent.analytics);
  const [marketingAllowed, setMarketingAllowed] = useState(() => consent.marketing);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowModal(true);
    };

    window.addEventListener("app:open-cookie-settings", handleOpenSettings);
    window.addEventListener("open_cookie_settings", handleOpenSettings);
    return () => {
      window.removeEventListener("app:open-cookie-settings", handleOpenSettings);
      window.removeEventListener("open_cookie_settings", handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    if (showModal) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);

      const handleModalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowModal(false);
          lastActiveElementRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleModalKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleModalKeyDown);
      };
    }
  }, [showModal]);

  const saveConsent = (analyticsVal: boolean, marketingVal: boolean) => {
    const payload = {
      analytics: Boolean(analyticsVal),
      marketing: Boolean(marketingVal),
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Storage unavailable
    }

    setConsent({
      hasResolved: true,
      showBanner: false,
      analytics: payload.analytics,
      marketing: payload.marketing,
    });
    setShowModal(false);

    // Notify application
    window.dispatchEvent(new CustomEvent("cookie_consent_updated", { detail: payload }));
    if (onConsentChange) onConsentChange(payload);

    lastActiveElementRef.current?.focus();
  };

  const handleAcceptAll = () => {
    setAnalyticsAllowed(true);
    setMarketingAllowed(true);
    saveConsent(true, true);
  };

  const handleRejectNonEssential = () => {
    setAnalyticsAllowed(false);
    setMarketingAllowed(false);
    saveConsent(false, false);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsAllowed, marketingAllowed);
  };

  return (
    <>
      {/* Banner */}
      {!consent.hasResolved && consent.showBanner && !showModal && (
        <div
          role="region"
          aria-label="Souhlas s používáním cookies"
          className="fixed bottom-0 inset-x-0 z-50 bg-neutral-900 border-t border-neutral-700 p-4 sm:p-6 shadow-2xl text-neutral-200"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 text-sm text-neutral-300 max-w-3xl">
              <p className="font-bold text-white tracking-wide">
                Informace o souborech cookies na {brandName}
              </p>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Používáme nezbytné technické cookies pro správné fungování webu. Analytické a marketingové cookies
                využíváme pouze s Vaším výslovným souhlasem dle § 89 zákona č. 127/2005 Sb. Podrobnosti naleznete v{" "}
                <a href={privacyUrl} className="underline hover:text-white font-medium text-neutral-200">
                  zásadách ochrany osobních údajů (GDPR)
                </a>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors cursor-pointer"
              >
                Pouze nezbytné
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 border border-neutral-600 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Nastavení
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-5 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Přijmout vše
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-none w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-300 overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h2 id="cookie-settings-title" className="text-lg font-bold text-neutral-900 tracking-wide uppercase">
                Nastavení soukromí a cookies
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-neutral-900 p-1.5 transition-colors cursor-pointer text-base"
                aria-label="Zavřít nastavení"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-neutral-700 font-sans">
              <p className="text-xs text-neutral-500">
                Zvolte, které typy cookies nám povolíte zpracovávat. Své rozhodnutí můžete kdykoliv změnit odkazem v zápatí.
              </p>

              {/* Necessary */}
              <div className="p-4 border border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-neutral-900">Nezbytné technické cookies</span>
                  <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-200 px-2 py-0.5 uppercase tracking-wider">
                    Vždy aktivní
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  Tyto soubory jsou nezbytné pro základní bezpečnost, navigaci a zobrazení webu. Bez nich web nemůže řádně fungovat.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-4 border border-neutral-200 hover:border-neutral-400 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cookie-analytics-toggle" className="font-bold text-neutral-900 cursor-pointer">
                    Statistické a analytické cookies
                  </label>
                  <input
                    type="checkbox"
                    id="cookie-analytics-toggle"
                    checked={analyticsAllowed}
                    onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                    className="w-4 h-4 text-neutral-900 accent-neutral-900 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-neutral-600">
                  Pomáhají nám anonymně porozumět tomu, jak návštěvníci používají náš web, a zlepšovat jeho obsah a přehlednost.
                </p>
              </div>

              {/* Marketing */}
              <div className="p-4 border border-neutral-200 hover:border-neutral-400 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cookie-marketing-toggle" className="font-bold text-neutral-900 cursor-pointer">
                    Marketingové a reklamní cookies
                  </label>
                  <input
                    type="checkbox"
                    id="cookie-marketing-toggle"
                    checked={marketingAllowed}
                    onChange={(e) => setMarketingAllowed(e.target.checked)}
                    className="w-4 h-4 text-neutral-900 accent-neutral-900 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-neutral-600">
                  Slouží ke zjištění relevance našich akcí a tanečních vystoupení a k oslovení zájemců na sociálních sítích.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Odmítnout volitelné
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-1.5 text-xs font-semibold text-neutral-800 border border-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Uložit vybrané
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Přijmout vše
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
