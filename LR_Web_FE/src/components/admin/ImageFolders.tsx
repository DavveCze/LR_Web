export type ImageFolderOption = {
  value: string;
  label: string;
  description: string;
};

export const IMAGE_FOLDER_OPTIONS: ImageFolderOption[] = [
  {
    value: 'home_imgs',
    label: 'Domů',
    description: 'Hero sekce, aktuality a obrázky na úvodní stránce.',
  },
  {
    value: 'partners',
    label: 'Partneři',
    description: 'Loga partnerů, sponzorů a dotačních programů.',
  },
  {
    value: 'carmen',
    label: 'Carmen',
    description: 'Fotky a prezentace TŠ Carmen, tábory a akce.',
  },
  {
    value: 'treneri',
    label: 'Trenéři',
    description: 'Profilové fotografie trenérů.',
  },
  {
    value: 'downloaded',
    label: 'Knihovna / Downloaded',
    description: 'Archivní a stažené plakáty, diplomy a soutěžní snímky.',
  },
  {
    value: 'about_imgs',
    label: 'O nás',
    description: 'Fotky pro podstránku O nás.',
  },
  {
    value: 'news_imgs',
    label: 'Aktuality',
    description: 'Fotky pro články a aktuality.',
  },
  {
    value: 'courses_imgs',
    label: 'Kurzy',
    description: 'Fotky pro nabídku kurzů.',
  },
  {
    value: 'registration_imgs',
    label: 'Přihlášky',
    description: 'Fotky pro stránku přihlášek.',
  },
  {
    value: 'club_imgs',
    label: 'Klub',
    description: 'Fotky pro stránku klubu.',
  },
  {
    value: 'camp_imgs',
    label: 'Tábory',
    description: 'Fotky pro tábory a soustředění.',
  },
  {
    value: 'calendar_imgs',
    label: 'Kalendář akcí',
    description: 'Fotky pro kalendář akcí.',
  },
  {
    value: 'contact_imgs',
    label: 'Kontakt',
    description: 'Fotky pro kontaktní stránku.',
  },
];

export const CUSTOM_FOLDER_VALUE = '__custom__';