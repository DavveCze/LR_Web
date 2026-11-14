import type { FC, ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  className = "",
}) => {
  return (
    <div className={`w-full bg-white pt-16 sm:pt-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4 sm:py-6 md:py-8">
          {/* Logo vlevo: LR Dance */}
          <div className="flex flex-shrink-0 items-center justify-start">
            <img
              src="/assets/imgs/ui/LR_white_background.svg"
              alt="LR Dance Team Ostrava"
              className="h-16 w-auto object-contain sm:h-24 md:h-32 lg:h-36"
            />
          </div>

          {/* Střed: Nadpis stránky */}
          <div className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-4">
            <h1 className="text-2xl font-light uppercase tracking-wider text-neutral-900 sm:text-3xl md:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-neutral-500 sm:text-base md:text-lg">
                {subtitle}
              </p>
            )}
            {children}
          </div>

          {/* Logo vpravo: Carmen */}
          <div className="flex flex-shrink-0 items-center justify-end">
            <img
              src="/assets/imgs/ui/Carmen logo.svg"
              alt="Taneční škola Carmen"
              className="h-16 w-auto object-contain sm:h-24 md:h-32 lg:h-36"
            />
          </div>
        </div>
      </div>

      {/* Dělící linka (štětec / brush) roztažená přes celou šířku */}
      <div className="w-full overflow-hidden leading-none">
        <img
          src="/assets/imgs/ui/Headher.svg"
          alt=""
          className="h-2 w-full object-fill select-none pointer-events-none sm:h-3 md:h-3.5 lg:h-4"
        />
      </div>
    </div>
  );
};
