export interface LoadImageResult {
  loaded: boolean;
  time: number;
}

export interface EnsureLoadedImgOptions {
  thresholds?: Record<number, number>;
  preferredLevel?: number;
}

export declare function ensureLoadedImg(
  baseName: string,
  assetPath?: string,
  pageFolder?: string,
  options?: EnsureLoadedImgOptions
): Promise<string>;

export declare function getCachedLevel(
  baseName: string,
  assetPath?: string,
  pageFolder?: string
): number | null;

declare const _default: {
  ensureLoadedImg: typeof ensureLoadedImg;
  getCachedLevel: typeof getCachedLevel;
};

export default _default;
