// FE-8 step 4 revision — the URL-state contract for tying a Learn tool to
// "the polymer we have our page dedicated to" (the owner's own phrase).
// Mirrors `search/url-state.ts`'s `from` (BR13 pre-fill slug) and
// `compare/url-state.ts`'s `subjects` conventions exactly: one small pure
// codec, `URLSearchParams` in and out, defensive decoding that never throws
// on a hand-edited or stale URL. Kept in its own module for the same reason
// `search/url-state.ts` keeps `from` alongside its filters -- every
// URL-param concern for a surface lives in one file.
//
// `LearnBridge.astro` (web/src/components/datasheet/LearnBridge.astro)
// writes `?material={slug}` onto its `/{locale}/learn#{anchor}` links so a
// reader arriving from a material's datasheet page lands on Learn already
// bound to that material -- HansenSpaceIsland is the first tool to read it,
// but the param is generic (not `hansenMaterial`) so a later Learn tool can
// reuse the same contract without inventing a second one.

const MATERIAL_KEY = 'material';

/** Reads the pre-fill material slug from a Learn route's URL, or
 * `undefined` when absent -- same "read once on load, caller strips it
 * after applying" contract as `search/url-state.ts`'s `getPrefillSlug`. */
export function getMaterialParam(params: URLSearchParams): string | undefined {
  return params.get(MATERIAL_KEY) ?? undefined;
}

/** Builds the `?material=...` query string a datasheet-side link appends
 * ahead of its `#{anchor}` fragment. Pure string building, no `URL`/`window`
 * access, so `LearnBridge.astro` (server-rendered, no DOM) can call it too. */
export function buildMaterialParam(slug: string): string {
  return `${MATERIAL_KEY}=${encodeURIComponent(slug)}`;
}
