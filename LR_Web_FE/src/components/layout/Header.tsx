import type { CSSProperties, FC } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "O NÁS", href: "/o-nas" },
  { label: "AKTUALITY", href: "/aktuality" },
  { label: "PŘIHLÁŠKA", href: "/prihlaska" },
  {
    label: "NABÍDKA KURZŮ",
    href: "/nabidka-kurzu",
    children: [
      { label: "Mateřské školy", href: "/nabidka-kurzu/materinky" },
      { label: "Základní školy", href: "/nabidka-kurzu/zakladnka" },
      { label: "9. třída", href: "/nabidka-kurzu/konec-skoly" },
      { label: "Střední školy", href: "/nabidka-kurzu/tanecni" },
      { label: "Manž. a přát. páry", href: "/nabidka-kurzu/manzelske" },
      { label: "Mládež", href: "/nabidka-kurzu/mladez" },
      { label: "Sportovní tanec", href: "/nabidka-kurzu/sport" },
    ],
  },
  {
    label: "LR DANCE",
    href: "/klub",
    children: [
      { label: "Trenéři", href: "/klub/treneri" },
      { label: "Rozvrh", href: "/klub/rozvrh" },
      { label: "Naše páry", href: "/klub/pary" },
      { label: "Fotogalerie", href: "/klub/fotogalerie" },
      { label: "Výsledky soutěží", href: "/klub/vysledky-soutezi" },
    ],
  },
  {
    label: "CARMEN",
    href: "/carmen",
    children: [
      { label: "Spací tábor", href: "/carmen/tabor" },
      { label: "Příměstský tábor", href: "/carmen/primestsky" },
      { label: "Víkend", href: "/carmen/vikend" },
      { label: "Fotogalerie Carmen", href: "/carmen/fotogalerie" },
    ],
  },
  { label: "TÁBORY", href: "/tabory" },
  { label: "KALENDÁŘ AKCÍ", href: "/kalendar-akci" },
  { label: "KONTAKT", href: "/kontakt" },
];

interface HeaderProps {
  desktopFontSize?: number;
  mobileFontSize?: number;
  mobileFontRatio?: number;
  activeFontScale?: number;
}

function isPathActive(currentPath: string, href: string, hasChildren = false): boolean {
  if (href === "/") return currentPath === "/";
  if (currentPath === href) return true;

  return hasChildren && currentPath.startsWith(`${href}/`);
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export const Header: FC<HeaderProps> = ({
  desktopFontSize = 15,
  mobileFontSize,
  mobileFontRatio = 0.6,
  activeFontScale = 1.05,
}) => {
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);

  const isHomePage = location.pathname === "/";
  const isHeaderHidden =
    location.pathname === "/login" ||
    location.pathname.startsWith("/dashboard");

  const resolvedMobileFontSize =
    mobileFontSize ?? desktopFontSize * mobileFontRatio;

  const navTextClass = isHomePage ? "text-white" : "text-neutral-900";
  const navMutedTextClass = isHomePage ? "text-white/90" : "text-neutral-800";
  const navHoverTextClass = isHomePage
    ? "hover:text-white"
    : "hover:text-black";
  const dividerClass = isHomePage ? "text-white/40" : "text-neutral-400";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setOpenMobileAccordion(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setOpenMobileAccordion(null);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileAccordion(null);
  };

  if (isHeaderHidden) {
    return null;
  }

  const isHomeActive = isPathActive(location.pathname, "/");

  const headerClassName = [
    "fixed inset-x-0 top-0 z-50",
    "transition-[background-color,box-shadow,color] duration-300",
    isHomePage
      ? isScrolled
        ? "bg-neutral-900/80 shadow-sm shadow-black/25 backdrop-blur-sm"
        : "bg-neutral-900/40"
      : isScrolled
        ? "bg-white shadow-md shadow-black/10"
        : "bg-white",
  ].join(" ");

  const cssVariables = {
    "--nav-font-desktop": `${desktopFontSize}px`,
    "--nav-font-mobile": `${resolvedMobileFontSize}px`,
    "--nav-font-desktop-active": `${desktopFontSize * activeFontScale}px`,
    "--nav-font-mobile-active": `${resolvedMobileFontSize * activeFontScale}px`,
  } as CSSProperties;

  return (
    <header className={headerClassName} style={cssVariables}>
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 md:px-6">
        <Link
          to="/"
          onClick={closeMobileMenu}
          className={`flex items-center gap-2 transition-[color,font-size] duration-200 ${
            isHomeActive
              ? `font-semibold ${navTextClass}`
              : `font-medium ${navMutedTextClass}`
          } ${navHoverTextClass}`}
          style={{
            fontSize: isHomeActive
              ? "clamp(var(--nav-font-mobile-active), 1.1vw + 8px, var(--nav-font-desktop-active))"
              : "clamp(var(--nav-font-mobile), 1.1vw + 8px, var(--nav-font-desktop))",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isHomeActive ? "white" : "black"}
            strokeWidth="1.8"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>

          <span
            className={`border-b pb-0.5 ${
              isHomeActive
                ? isHomePage
                  ? "border-white"
                  : "border-neutral-900"
                : isHomePage
                  ? "border-white/70"
                  : "border-neutral-400"
            } ${isHomeActive ? "text-white" : "text-neutral-900"}`}
          >
            Domů
          </span>
        </Link>

        <ul
          className={`hidden items-center gap-1 font-medium uppercase tracking-wide lg:flex ${navMutedTextClass}`}
        >
          {NAV_ITEMS.map((item, index) => {
            const hasChildren = Boolean(item.children);
            const isActive = isPathActive(
              location.pathname,
              item.href,
              hasChildren,
            );
            const itemFontSize = isActive
              ? "var(--nav-font-desktop-active)"
              : "var(--nav-font-desktop)";

            return (
              <li key={item.href} className="relative flex items-center">
                {index > 0 && (
                  <span className={`mx-2 ${dividerClass}`}>/</span>
                )}

                {item.children ? (
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setOpenDropdown(item.href)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      to={item.href}
                      className={`flex items-center gap-1 py-2 transition-[color,font-size] duration-200 ${
                        isActive
                          ? `font-semibold ${navTextClass}`
                          : navHoverTextClass
                      }`}
                      style={{ fontSize: itemFontSize }}
                    >
                      {item.label}
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown((previous) =>
                          previous === item.href ? null : item.href,
                        )
                      }
                      aria-label={`Zobrazit podmenu ${item.label}`}
                      aria-expanded={openDropdown === item.href}
                      className={`flex items-center py-2 pl-1 transition-colors duration-200 ${navHoverTextClass}`}
                    >
                      <ChevronIcon
                        className={`transition-transform duration-300 ${
                          openDropdown === item.href ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openDropdown === item.href && (
                      <ul className="absolute left-0 top-full min-w-[190px] rounded-md bg-white py-2 text-xs text-neutral-800 shadow-lg shadow-black/15 ring-1 ring-black/5">
                        {item.children.map((child) => {
                          const isChildActive =
                            location.pathname === child.href;

                          return (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                className={`block px-4 py-2 normal-case tracking-normal transition-colors hover:bg-neutral-100 hover:text-black ${
                                  isChildActive
                                    ? "font-semibold text-black"
                                    : "text-neutral-700"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`py-2 transition-[color,font-size] duration-200 ${
                      isActive
                        ? `font-semibold ${navTextClass}`
                        : navHoverTextClass
                    }`}
                    style={{ fontSize: itemFontSize }}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((previous) => !previous)}
          className={`relative z-50 flex h-11 w-11 items-center justify-center lg:hidden ${navTextClass}`}
        >
          <span className="sr-only">
            {isMobileMenuOpen ? "Zavřít menu" : "Otevřít menu"}
          </span>

          <span className="flex h-4 w-6 flex-col justify-between">
            <span
              className={`h-0.5 w-full bg-current transition-transform duration-300 ${
                isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-full bg-current transition-opacity duration-300 ${
                isMobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-full bg-current transition-transform duration-300 ${
                isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        className={`fixed inset-x-0 top-14 z-40 origin-top overflow-y-auto border-t transition-[transform,opacity] duration-300 sm:top-16 lg:hidden ${
          isHomePage
            ? "border-white/10 bg-neutral-900/95 text-white backdrop-blur-sm"
            : "border-neutral-200 bg-white text-neutral-900 shadow-lg shadow-black/10"
        } ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        style={{ maxHeight: "calc(100dvh - 3.5rem)" }}
      >
        <ul
          className={`flex flex-col divide-y px-4 py-2 font-medium uppercase tracking-wide ${
            isHomePage
              ? "divide-white/10 text-white/90"
              : "divide-neutral-200 text-neutral-800"
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const hasChildren = Boolean(item.children);
            const isActive = isPathActive(
              location.pathname,
              item.href,
              hasChildren,
            );
            const itemFontSize = isActive
              ? "var(--nav-font-mobile-active)"
              : "var(--nav-font-mobile)";

            return (
              <li key={item.href}>
                {item.children ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Link
                        to={item.href}
                        onClick={closeMobileMenu}
                        className={`flex-1 py-3 text-left transition-[color,font-size] duration-200 ${
                          isActive
                            ? isHomePage
                              ? "font-semibold text-white"
                              : "font-semibold text-black"
                            : isHomePage
                              ? "hover:text-white"
                              : "hover:text-black"
                        }`}
                        style={{ fontSize: itemFontSize }}
                      >
                        {item.label}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMobileAccordion((previous) =>
                            previous === item.href ? null : item.href,
                          )
                        }
                        aria-label={`Zobrazit podmenu ${item.label}`}
                        aria-expanded={openMobileAccordion === item.href}
                        className="flex h-11 w-11 items-center justify-center"
                      >
                        <ChevronIcon
                          className={`transition-transform duration-300 ${
                            openMobileAccordion === item.href
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    <ul
                      className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ${
                        openMobileAccordion === item.href
                          ? "grid-rows-[1fr]"
                          : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0">
                        {item.children.map((child) => {
                          const isChildActive =
                            location.pathname === child.href;

                          return (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                onClick={closeMobileMenu}
                                className={`block py-2 pl-4 normal-case tracking-normal transition-colors ${
                                  isChildActive
                                    ? isHomePage
                                      ? "font-semibold text-white"
                                      : "font-semibold text-black"
                                    : isHomePage
                                      ? "text-white/75 hover:text-white"
                                      : "text-neutral-600 hover:text-black"
                                }`}
                                style={{
                                  fontSize: isChildActive
                                    ? "var(--nav-font-mobile-active)"
                                    : "var(--nav-font-mobile)",
                                }}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </div>
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={`block py-3 transition-[color,font-size] duration-200 ${
                      isActive
                        ? isHomePage
                          ? "font-semibold text-white"
                          : "font-semibold text-black"
                        : isHomePage
                          ? "hover:text-white"
                          : "hover:text-black"
                    }`}
                    style={{ fontSize: itemFontSize }}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};