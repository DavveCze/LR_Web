import React from 'react';
import { RegistrationComponent } from './RegistrationComponent';

export interface RegistrationItem {
  id: number;
  headline: string;
  content?: string | null;
  link?: string | null;
  cost?: string | null;
  isActive: boolean;
}

interface RegistrationCategoryProps {
  headline: string;
  components: RegistrationItem[];
}

export const RegistrationCategory: React.FC<RegistrationCategoryProps> = ({
  headline,
  components,
}) => {
  const activeComponents = components.filter((component) => component.isActive);

  if (activeComponents.length === 0) {
    return null;
  }

  return (
    <section className="mb-16 max-w-[920px] sm:mx-auto">
      <h2 className="py-5 sm:py-8 text-center text-2xl sm:text-[34px] font-bold leading-tight text-neutral-800">
        {headline}
      </h2>

      <div className="border-b border-[#d7d7d7]">
        {activeComponents.map((component) => (
          <RegistrationComponent key={component.id} {...component} />
        ))}
      </div>
    </section>
  );
};