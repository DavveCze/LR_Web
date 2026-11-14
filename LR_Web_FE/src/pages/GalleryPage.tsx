import React from "react";
import { RajceGallery } from "../components/gallery/RajceGallery";
import { PageHeader } from "../components/layout/PageHeader";

export const GalleryPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Fotogalerie" />
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans text-neutral-800">
        <RajceGallery
          fixedCategory="club"
          title="Fotogalerie Klub LR Dance"
          description="Kompletní archiv fotografií ze soutěží, tréninků a soustředění tanečního klubu LR DANCE TEAM Ostrava."
        />
      </main>
    </div>
  );
};
