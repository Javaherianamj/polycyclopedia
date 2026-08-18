// Pure URL <-> SearchState codec (R13 — shareable URLs; domain-entities.md's
// `URLSearchState`). No DOM, no fetch, no globals — the thin wiring script
// (frontend-components.md's "URL sync") calls these around
// `history.replaceState`/`location.search`; this module never touches either
// itself, matching the pure-logic/thin-DOM split `filter-logic.ts` set.
//
// Encoding: one `propertyKey=min-max` param per active filter, `q` carries
// `rawQueryText` verbatim (so BR9's "unrecognized: <token>" hints survive a
// reload once the caller re-runs `parseQuery` on it), `from` is BR13's
// pre-fill source material slug.
//
// [own call] `unrecognizedTokens` is never round-tripped through the URL.
// It's a derived value (the output of `parseQuery(rawQueryText, properties)`
// run against whatever the *current* property registry recognizes), not an
// independent fact about the search — storing it in the URL would let a
// stale copy disagree with what the parser says today. `decodeSearchState`
// always returns `unrecognizedTokens: []`; the caller (`SearchIsland`, once
// properties has loaded) recomputes it from `rawQueryText` via `parseQuery`.
// This mirrors the domain-entities.md note that `q`/`rawQueryText` is "the
// raw text, not [something] to recompute filters [from]" — same logic
// applies to the hint list.

import type { ActiveFilter, PropertyKey, SearchState } from './types';

const RANGE_RE = /^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/;
const RESERVED_KEYS = new Set(['q', 'from']);

function formatNumber(n: number): string {
  // Plain decimal formatting — every value in this domain is a normal
  // finite measurement (canonical-unit property bound), never large enough
  // to need scientific notation.
  return String(n);
}

/** Encodes a `SearchState` as URL query params (R13). Pure — returns a new
 * `URLSearchParams`, never mutates one in place. */
export function encodeSearchState(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();

  for (const filter of state.filters) {
    // One param per active filter (per-spec); if `state.filters` somehow
    // carries two entries for the same property (not expected — callers are
    // meant to hand this already-merged state, see match.ts's own
    // intersection step for the place that reconciles duplicates), the last
    // one wins, same last-write-wins semantics `URLSearchParams.set` always
    // has.
    params.set(filter.propertyKey, `${formatNumber(filter.min)}-${formatNumber(filter.max)}`);
  }

  if (state.rawQueryText !== '') {
    params.set('q', state.rawQueryText);
  }

  return params;
}

/**
 * Decodes URL query params into a `SearchState`. Pure and defensive — a
 * hand-edited or stale URL never throws; any param that isn't a well-formed
 * `min-max` range is silently skipped from the filter set (the same "never
 * a hard error" posture BR9 takes for the text-query parser, applied here
 * to the URL itself).
 *
 * `unrecognizedTokens` is always `[]` here — see the module doc comment.
 */
export function decodeSearchState(params: URLSearchParams): SearchState {
  const filters: ActiveFilter[] = [];

  for (const [key, value] of params.entries()) {
    if (RESERVED_KEYS.has(key)) continue;

    const match = value.match(RANGE_RE);
    if (!match) continue;

    const min = Number(match[1]);
    const max = Number(match[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue;

    filters.push({ propertyKey: key as PropertyKey, min: Math.min(min, max), max: Math.max(min, max) });
  }

  return {
    filters,
    rawQueryText: params.get('q') ?? '',
    unrecognizedTokens: [],
  };
}

/**
 * BR13 — the pre-fill source material slug, read once on load. Kept in this
 * module (not `SearchState`, per `domain-entities.md`'s `URLSearchState`
 * shape, which carries `from` alongside but outside the filter/q pair) so
 * every URL-param concern lives in one file. The caller is responsible for
 * "consumed once" — i.e. stripping `from` out of the URL after applying the
 * pre-fill, via its own `history.replaceState` call.
 */
export function getPrefillSlug(params: URLSearchParams): string | undefined {
  return params.get('from') ?? undefined;
}
