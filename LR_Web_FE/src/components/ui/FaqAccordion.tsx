import React, { useState, FC } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FaqAccordion: FC<FaqAccordionProps> = ({
  items,
  title = "Často kladené dotazy (FAQ)",
  subtitle = "Vše, co potřebujete vědět před první taneční lekcí nebo soustředěním.",
  className = "",
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={`mx-auto max-w-4xl py-12 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl font-bold uppercase tracking-wide text-neutral-900 md:text-3xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-neutral-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `faq-btn-${index}`;
          const panelId = `faq-panel-${index}`;

          return (
            <div key={index} className="group">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full min-h-[52px] items-center justify-between py-4 text-left font-semibold text-neutral-900 hover:text-black transition-colors focus-visible:outline-2 focus-visible:outline-neutral-900"
              >
                <span className="text-base sm:text-lg pr-4">{item.question}</span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-xl text-neutral-500 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm sm:text-base leading-relaxed text-neutral-700 whitespace-pre-line">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
