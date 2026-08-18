// Pure URL <-> CompareState codec (CR17 — shareable URLs, same mechanism as
// FE-5/R13). No DOM, no fetch, no globals — mirrors
// `search/url-state.ts`'s conventions exactly: one query param per field,
// `URLSearchParams` in and out, defensive decoding that never throws on a
// hand-edited or stale URL (unrecognized/malformed values are silently
// dropped in favour of a safe default, same posture `search/url-state.ts`
// takes for a malformed `propertyKey=min-max` range).

import type { CompareSortMode, CompareState } from './types';

const SUBJECTS_KEY = 'subjects';
const APPLICATION_KEY = 'app';
const SORT_KEY = 'sort';
const HIDE_IDENTICAL_KEY = 'hide';

const SORT_MODES: readonly CompareSortMode[] = ['difference', 'grouped'];
const DEFAULT_SORT_MODE: CompareSortMode = 'difference';

// [own call] Subject refs ("ldpe" or "ldpe/film" — slash-separated
// material/grade-class slugs, per `CompareSubject.ref`) are joined with a
// comma into a single `subjects` param, matching how `search/url-state.ts`
// keeps one param per logical field rather than one per list entry. This
// relies on refs never containing a comma themselves — true today (slugs and
// grade-class keys are lowercase-dash identifiers) and consistent with how
// `search/url-state.ts` already assumes `propertyKey` never contains `=` or
// `-` beyond the range separator it parses around. A slash inside a ref
// needs no special handling: `URLSearchParams` percent-encodes the whole
// param value on output and decodes it back on input, so `/` round-trips
// like any other character.
function isValidSortMode(value: string): value is CompareSortMode {
  return (SORT_MODES as readonly string[]).includes(value);
}

/** Encodes a `CompareState` as URL query params (CR17). Pure — returns a new
 * `URLSearchParams`, never mutates one in place. */
export function encodeCompareState(state: CompareState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.subjectRefs.length > 0) {
    params.set(SUBJECTS_KEY, state.subjectRefs.join(','));
  }

  if (state.applicationKey !== undefined) {
    params.set(APPLICATION_KEY, state.applicationKey);
  }

  // Sort mode always round-trips explicitly, even though 'difference' is
  // also the decode-time default: an explicit param survives a future
  // default change, and it keeps encode/decode symmetric (what you encode
  // is what you read back) rather than relying on the reader to know today's
  // default.
  params.set(SORT_KEY, state.sortMode);

  if (state.hideIdenticalRows) {
    params.set(HIDE_IDENTICAL_KEY, '1');
  }

  return params;
}

/**
 * Decodes URL query params into a `CompareState`. Defensive: a missing or
 * malformed `sort` falls back to `'difference'`; a missing `subjects` or
 * `app` decodes to an empty list / `undefined` rather than throwing; an
 * empty ref produced by e.g. a stray leading/trailing comma is dropped.
 */
export function decodeCompareState(params: URLSearchParams): CompareState {
  const subjectsRaw = params.get(SUBJECTS_KEY) ?? '';
  const subjectRefs = subjectsRaw === '' ? [] : subjectsRaw.split(',').filter((ref) => ref !== '');

  const applicationKey = params.get(APPLICATION_KEY) ?? undefined;

  const sortParam = params.get(SORT_KEY) ?? '';
  const sortMode = isValidSortMode(sortParam) ? sortParam : DEFAULT_SORT_MODE;

  const hideIdenticalRows = params.get(HIDE_IDENTICAL_KEY) === '1';

  return { subjectRefs, applicationKey, sortMode, hideIdenticalRows };
}
