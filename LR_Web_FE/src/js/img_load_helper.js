const DEFAULT_ASSET_PATH = '/assets/imgs';

// IMPORTANT: quality ordering is ascending — 1 = lowest quality (smallest file),
// 3 = highest quality (largest file). Always prefer the highest number first.
const LEVELS = [1, 2, 3];
const BEST_LEVEL = Math.max(...LEVELS);
const WORST_LEVEL = Math.min(...LEVELS);

// Max acceptable load time (ms) per quality level. Higher quality naturally
// takes longer, so the allowance grows as level increases.
const DEFAULT_THRESHOLDS = {
  1: 90,
  2: 180,
  3: 350,
};

const existenceCache = new Map(); // src -> boolean
const bestLevelCache = new Map(); // assetKey -> level

function buildCandidates(baseName, assetPath, pageFolder) {
  const normalizedAssetPath = assetPath.replace(/\/$/, '');
  const normalizedPageFolder = pageFolder.replace(/^\//, '').replace(/\/$/, '');
  const folderPath = normalizedPageFolder
    ? `${normalizedAssetPath}/${normalizedPageFolder}`
    : normalizedAssetPath;

  return LEVELS.reduce((acc, level) => {
    acc[level] = `${folderPath}/${baseName}_${level}.webp`;
    return acc;
  }, {});
}

function assetKey(baseName, assetPath, pageFolder) {
  return `${assetPath}::${pageFolder}::${baseName}`;
}

async function checkExists(src) {
  if (existenceCache.has(src)) return existenceCache.get(src);
  try {
    const response = await fetch(src, { method: 'HEAD' });
    const exists = response.ok;
    existenceCache.set(src, exists);
    return exists;
  } catch {
    existenceCache.set(src, false);
    return false;
  }
}

function loadImageWithTiming(src, hardTimeoutMs = 5000) {
  return new Promise((resolve) => {
    const img = new Image();
    const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let finished = false;

    const finish = (loaded) => {
      if (finished) return;
      finished = true;
      const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      resolve({ loaded, time: Math.max(0, end - start) });
    };

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = src;
    setTimeout(() => finish(false), hardTimeoutMs);
  });
}

/**
 * Returns available quality levels, ordered from BEST (highest number)
 * to WORST (lowest number). Missing variants are skipped silently.
 */
async function getAvailableLevels(candidates) {
  const checks = await Promise.all(
    LEVELS.map(async (level) => ({ level, exists: await checkExists(candidates[level]) }))
  );
  return checks
    .filter((c) => c.exists)
    .map((c) => c.level)
    .sort((a, b) => b - a); // descending: best quality first
}

/**
 * Resolves the best-quality asset variant the current connection can
 * comfortably load. Quality levels ascend with number: 1 = lowest, 3 = highest.
 *
 * Behaviour:
 * - Skips missing quality variants (e.g. only _1 and _2 exist, no _3).
 * - Always attempts the highest available quality first, degrading only
 *   if it loads too slowly.
 * - Caches the resolved level per asset so later calls (e.g. a background
 *   refresh loop) resume near the last known-good quality and naturally
 *   retry for an upgrade instead of re-probing from scratch.
 *
 * @param {string} baseName
 * @param {string} [assetPath]
 * @param {string} [pageFolder]
 * @param {{ thresholds?: Record<number, number>, preferredLevel?: number }} [options]
 * @returns {Promise<string>}
 */
export async function ensureLoadedImg(baseName, assetPath = DEFAULT_ASSET_PATH, pageFolder = '', options = {}) {
  const candidates = buildCandidates(baseName, assetPath, pageFolder);
  const key = assetKey(baseName, assetPath, pageFolder);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };

  const availableLevels = await getAvailableLevels(candidates); // best -> worst
  if (availableLevels.length === 0) {
    return candidates[BEST_LEVEL]; // nothing exists — let <img> show a broken-image fallback
  }

  const bestAvailable = availableLevels[0];
  const cachedLevel = bestLevelCache.get(key);
  // Always try to reach the highest available quality; if we previously
  // succeeded at a lower level, start there and try to upgrade from it.
  const startLevel = options.preferredLevel ?? Math.max(cachedLevel ?? WORST_LEVEL, WORST_LEVEL);

  // Order candidates from bestAvailable down to startLevel-ish, always
  // giving the top quality the first shot.
  const tryOrder = [...availableLevels]; // already best -> worst

  let fallback = null; // fastest successfully loaded candidate, even if over threshold

  for (const level of tryOrder) {
    const src = candidates[level];
    const { loaded, time } = await loadImageWithTiming(src);

    if (!loaded) continue;

    const thresh = thresholds[level] ?? Infinity;
    if (time <= thresh) {
		console.log(`Loaded ${src} in ${time.toFixed(2)}ms (within threshold of ${thresh}ms)`);
      bestLevelCache.set(key, level);
      return src;
    }

    if (!fallback || time < fallback.time) {
      fallback = { level, src, time };
    }
  }

  if (fallback) {
    bestLevelCache.set(key, fallback.level);
    return fallback.src;
  }

  return candidates[bestAvailable];
}

export function getCachedLevel(baseName, assetPath = DEFAULT_ASSET_PATH, pageFolder = '') {
  return bestLevelCache.get(assetKey(baseName, assetPath, pageFolder)) ?? null;
}

export default {
  ensureLoadedImg,
  getCachedLevel,
};