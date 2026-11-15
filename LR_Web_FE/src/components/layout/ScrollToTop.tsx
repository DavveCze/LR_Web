import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Zajišťuje automatické a spolehlivé odscrollování okna na začátek (0, 0)
 * při každé změně cesty (URL) v rámci React Routeru na desktopu i mobilních zařízeních.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
