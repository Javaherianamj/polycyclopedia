// Publication gating. `material.status` has existed since migration 0003 and
// every one of the 17 materials is still `draft`, but the site rendered them
// all identically to a published one -- so the column was decorative and a
// visitor had no way to tell curated-and-checked from work-in-progress.
//
// Two mechanisms, deliberately separate:
//
//   1. `isPublished()` + a draft badge on the datasheet — always on. Says
//      out loud what the database already knows.
//   2. `publishedOnly()` — a build-time switch, OFF by default. When on,
//      every surface that enumerates materials (static paths, catalog,
//      homepage, sitemap) drops non-published ones, so a real launch is one
//      env var rather than a code change.
//
// Default is off, not on: flipping it today would build a site with zero
// material pages, which is worse than an honest draft badge. It becomes
// useful the moment the first material is promoted to `published`.

/** Material/subject statuses that count as publicly finished. */
const PUBLISHED_STATUSES = new Set(['published']);

export function isPublished(status: string): boolean {
  return PUBLISHED_STATUSES.has(status);
}

/**
 * Whether this build should exclude non-published materials.
 * Set `PUBLIC_PUBLISHED_ONLY=true` in the environment to turn it on.
 */
export function publishedOnly(): boolean {
  return import.meta.env.PUBLIC_PUBLISHED_ONLY === 'true';
}

/**
 * Filters a material list according to the build's publication gate.
 * A no-op when the gate is off, which is the default.
 */
export function gateMaterials<T extends { status: string }>(materials: T[]): T[] {
  if (!publishedOnly()) return materials;
  return materials.filter((material) => isPublished(material.status));
}
