/** Shared deterministic helpers for plates and barcodes (identical on server and client). */

export const DEFAULT_SEED = 932598536;

/** Stateless integer hashing: returns a stable value in [0, 1) for (seed, index). */
export function sample(seed: number, index: number) {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

/** FNV-1a 32-bit hash of a string. */
export function hashString(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Stable per-entry plate seed. */
export function seedFromSlug(slug: string) {
  return hashString(slug);
}
