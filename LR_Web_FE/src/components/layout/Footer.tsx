import type { FC } from "react";

export const Footer: FC = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white py-8 text-center text-sm text-neutral-500">
      <p>© {new Date().getFullYear()} LR Dance Team Ostrava. Všechna práva vyhrazena.</p>
    </footer>
  );
};