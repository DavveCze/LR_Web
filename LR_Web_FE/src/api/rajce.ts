import { apiUrl } from './client';

export interface RajceAlbum {
  id: string;
  title: string;
  url: string;
  coverUrl: string;
  date: string;
  category: 'club' | 'carmen';
  tags: string[];
}

export interface RajcePhoto {
  id: string;
  imageUrl: string;
  thumbUrl: string;
  title: string;
  alt: string;
}

export interface RajceAlbumsResponse {
  status: 'success' | 'error';
  count: number;
  albums: RajceAlbum[];
  message?: string;
}

export interface RajceAlbumDetailResponse {
  status: 'success' | 'error';
  title: string;
  count: number;
  photos: RajcePhoto[];
  message?: string;
}

/**
 * Načte seznam fotoalb z Rajče.cz přes backend proxy.
 */
export async function getRajceAlbums(): Promise<RajceAlbum[]> {
  try {
    const res = await fetch(apiUrl('rajce-gallery.php?action=albums'));
    if (!res.ok) {
      throw new Error(`Chyba načítání alb: ${res.status}`);
    }
    const data: RajceAlbumsResponse = await res.json();
    return data.albums || [];
  } catch (error) {
    console.error('Chyba při stahování alb z Rajčete:', error);
    return [];
  }
}

/**
 * Načte kompletní seznam fotografií konkrétního alba.
 */
export async function getRajceAlbumPhotos(albumUrl: string): Promise<RajceAlbumDetailResponse> {
  const endpoint = `rajce-gallery.php?action=album&url=${encodeURIComponent(albumUrl)}`;
  const res = await fetch(apiUrl(endpoint));
  if (!res.ok) {
    throw new Error(`Chyba načítání fotek alba: ${res.status}`);
  }
  const data: RajceAlbumDetailResponse = await res.json();
  return data;
}
