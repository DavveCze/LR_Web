import { useEffect, useState, type FC } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/o-nas", label: "O nás" },
  { to: "/aktuality", label: "Aktuality" },
  { to: "/prihlaska", label: "Přihláška" },
  { to: "/kurzy", label: "Nabídka kurzů" },
  { to: "/klub", label: "LR Dance" },
  { to: "/carmen", label: "Carmen" },
  { to: "/tabory", label: "Tábory" },
  { to: "/kalendar", label: "Kalendář akcí" },
  { to: "/kontakt", label: "Kontakt" },
];

export const Header: FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-neutral-900/95 py-3 shadow-md backdrop-blur"
          : "bg-gradient-to-b from-black/50 to-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6">
        <NavLink to="/" className="flex items-center gap-2 text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
          <span className="border-b border-white/80 pb-0.5 text-sm font-semibold tracking-wide">
            Domů
          </span>
        </NavLink>

        <nav className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 md:flex">
          {navItems.map((item, i) => (
            <span key={item.to} className="flex items-center gap-4">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-white ${
                    isActive ? "text-white" : "text-neutral-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
              {i < navItems.length - 1 && (
                <span className="text-neutral-500">/</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
};