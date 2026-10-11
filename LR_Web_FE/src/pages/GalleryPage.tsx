import React from "react";
import { PartnersSection } from "../components/ui/PartnersSection";
import { RajceGallery } from "../components/gallery/RajceGallery";

export const GalleryPage: React.FC = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-28 font-sans text-neutral-800">
      <RajceGallery
        fixedCategory="club"
        title="Fotogalerie Klub LR Dance"
        description="Kompletní archiv fotografií ze soutěží, tréninků a soustředění tanečního klubu LR DANCE TEAM Ostrava."
      />
      <PartnersSection className="mt-20" />
    </main>
  );
};
