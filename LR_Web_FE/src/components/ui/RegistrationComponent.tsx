import React from 'react';
import { DarkButton } from './ButtonPrefab';

type Props = {
  id: number;
  headline: string;
  content?: string | null;
  link?: string | null;
  cost?: string | null;
  isActive: boolean;
  buttonLabel?: string;
};

export const RegistrationComponent: React.FC<Props> = ({
  headline,
  content,
  link,
  cost,
  buttonLabel = 'REGISTRACE',
}) => {
  const button = (
    <DarkButton isFlexible>{buttonLabel}</DarkButton>
  );

  return (
    <article className="flex flex-col gap-5 border-t border-[#d7d7d7] py-6 sm:py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <h3 className="text-xl font-medium leading-tight text-[#3d3d3d] sm:text-[28px]">
          {headline}
        </h3>

        {content && (
          <p className="mt-2 text-[15px] sm:text-[16px] leading-relaxed text-[#666666]">
            {content}
          </p>
        )}

        <p className="mt-2 text-[15px] sm:text-[16px] text-[#666666]">
          {cost ? `Cena: ${cost}` : 'Cena: viz přihláška'}
        </p>
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-full sm:w-auto"
        >
          {button}
        </a>
      ) : (
        <span className="shrink-0 w-full sm:w-auto">{button}</span>
      )}
    </article>
  );
};