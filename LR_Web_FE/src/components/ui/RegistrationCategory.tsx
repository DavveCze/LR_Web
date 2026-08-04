import React from "react";
import { RegistrationComponent } from "./RegistrationComponent";

interface RegistrationCategoryProps {
  headline: string;
  components: { headline: string; content: string; link: string; cost: string; isActive: boolean }[];
}

export const RegistrationCategory: React.FC<RegistrationCategoryProps> = ({
  headline,
  components,
}) => {
  return (
    <div className="registration-category">
      <h2>{headline}</h2>
      <div className="registration-components">
        {components.map((component, index) =>
          component.isActive ? (
            <RegistrationComponent key={index} {...component} />
          ) : null
        )}
      </div>
    </div>
  );
};

