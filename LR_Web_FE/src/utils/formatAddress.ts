/**
 * Pomocná funkce pro sjednocení a zkrácení adresy do požadovaného tvaru:
 * "Název, ulice a č.p., Město/Obec [bez PSČ]"
 * 
 * Odstraňuje:
 * - PSČ (např. "739 11", "708 00", "74401")
 * - Zemi ("Česko", "Česká republika", "Czechia", "Czech Republic")
 * - Přebytečné čárky a vícenásobné mezery
 */
export function formatShortAddress(raw?: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // 1. Odstranit zemi (Česko, Česká republika, Czechia, Czech Republic)
  clean = clean.replace(/,?\s*(?:Česká republika|Česko|Czech Republic|Czechia)\b/giu, "");

  // 2. Odstranit PSČ (5 číslic s mezerou nebo bez)
  clean = clean.replace(/\b\d{3}\s?\d{2}\b/g, "");

  // 3. Odstranit vícenásobné čárky nebo prázdná místa mezi čárkami
  clean = clean.replace(/\s*,\s*(?:,\s*)+/g, ", ");
  clean = clean.replace(/,\s*,/g, ", ");

  // 4. Sjednotit vícenásobné mezery
  clean = clean.replace(/\s{2,}/g, " ");

  // 5. Oříznout čárky a mezery na začátku a konci
  clean = clean.replace(/^[\s,]+|[\s,]+$/g, "");

  return clean.trim();
}
