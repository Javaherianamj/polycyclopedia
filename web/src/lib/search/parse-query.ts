// Pure text-query parser for the free-text search box (business-logic-model.md
// §3, BR3/BR4/BR9). No DOM, no fetch, no globals — mirrors the pure-logic
// split in `web/src/components/catalog/filter-logic.ts`.
//
// Grammar (BR4 — English tokens + canonical units only, on both locales):
//   comparison:  <alias><op><number>            e.g. "tg>100"   (no spaces)
//   range:       <alias> <number>-<number>      e.g. "tensile 40-80" (two
//                                                whitespace-separated tokens)
//   range (glued): <alias>=<number>-<number>    e.g. "tg=100-160" (one token)
//
// `op` is one of `>`, `>=`, `<`, `<=`, `=`, matched longest-first so `>=`/`<=`
// never get truncated to `>`/`<` with a dangling `=`.
//
// Anything that doesn't fit — an alias nobody recognizes, or a number that
// doesn't parse — becomes `{kind:'unrecognized', raw}` (BR9): dropped from
// the active filter set, never a hard error, never silently discarded either
// (the raw token survives for the UI's "unrecognized: <token>" hint).

import type { Operator, ParsedToken, PropertyKey, SearchIndexProperty } from './types';

const NUMBER = String.raw`-?\d+(?:\.\d+)?`;
const ALIAS = String.raw`[A-Za-z][A-Za-z0-9_]*`;

// Ops ordered longest-first so the regex alternation doesn't stop at `>`
// before trying `>=`.
const COMPARISON_RE = new RegExp(`^(${ALIAS})(>=|<=|>|<|=)(${NUMBER})$`);
const GLUED_RANGE_RE = new RegExp(`^(${ALIAS})=(${NUMBER})-(${NUMBER})$`);
const BARE_ALIAS_RE = new RegExp(`^(${ALIAS})$`);
const NUMBER_RANGE_RE = new RegExp(`^(${NUMBER})-(${NUMBER})$`);

/**
 * Builds an alias -> propertyKey lookup from every property's `aliasTokens`
 * (BR3 — derived mechanically, never hand-maintained). Matching is
 * case-insensitive (a convenience for typing, not a grammar extension — the
 * canonical alias strings themselves are still English/ASCII per BR4).
 *
 * [own call] If two properties' aliases collide (documented as not
 * happening in the current 55-property registry — business-rules.md's
 * "Alias collisions" note), the first property in the input array wins.
 * This function never throws on collision; it's a silent first-wins map,
 * consistent with the design note that the full key always disambiguates.
 */
function buildAliasMap(properties: SearchIndexProperty[]): Map<string, PropertyKey> {
  const map = new Map<string, PropertyKey>();
  for (const property of properties) {
    for (const alias of property.aliasTokens) {
      const lower = alias.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, property.key);
      }
    }
  }
  return map;
}

function toNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Swaps min/max if the author typed them backwards. [own call] — see
 * parse-query.test.ts "a range whose min > max" for the rationale: treating
 * it as a valid, normalized range is friendlier than discarding otherwise
 * well-formed input, and matches how `[min, max]` is inclusive/order-free
 * everywhere else in this codebase (property_value.value_min/max). */
function normalizeRange(a: number, b: number): { min: number; max: number } {
  return a <= b ? { min: a, max: b } : { min: b, max: a };
}

export function parseQuery(raw: string, properties: SearchIndexProperty[]): ParsedToken[] {
  const aliasMap = buildAliasMap(properties);
  const rawTokens = raw.trim().split(/\s+/).filter((t) => t.length > 0);

  const tokens: ParsedToken[] = [];
  let i = 0;

  while (i < rawTokens.length) {
    const current = rawTokens[i];

    // 1) Glued range: "tg=100-160"
    const glued = current.match(GLUED_RANGE_RE);
    if (glued) {
      const propertyKey = aliasMap.get(glued[1].toLowerCase());
      const a = toNumber(glued[2]);
      const b = toNumber(glued[3]);
      if (propertyKey !== undefined && a !== null && b !== null) {
        const { min, max } = normalizeRange(a, b);
        tokens.push({ kind: 'range', propertyKey, min, max });
        i += 1;
        continue;
      }
    }

    // 2) Comparison: "tg>100"
    const comparison = current.match(COMPARISON_RE);
    if (comparison) {
      const propertyKey = aliasMap.get(comparison[1].toLowerCase());
      const value = toNumber(comparison[3]);
      if (propertyKey !== undefined && value !== null) {
        tokens.push({
          kind: 'comparison',
          propertyKey,
          op: comparison[2] as Operator,
          value,
        });
        i += 1;
        continue;
      }
    }

    // 3) Two-token range: "tensile" "40-80"
    const bareAlias = current.match(BARE_ALIAS_RE);
    if (bareAlias && i + 1 < rawTokens.length) {
      const propertyKey = aliasMap.get(bareAlias[1].toLowerCase());
      const numberRange = rawTokens[i + 1].match(NUMBER_RANGE_RE);
      if (propertyKey !== undefined && numberRange) {
        const a = toNumber(numberRange[1]);
        const b = toNumber(numberRange[2]);
        if (a !== null && b !== null) {
          const { min, max } = normalizeRange(a, b);
          tokens.push({ kind: 'range', propertyKey, min, max });
          i += 2;
          continue;
        }
      }
    }

    // 4) Unrecognized — a single raw token, never dropped silently (BR9).
    tokens.push({ kind: 'unrecognized', raw: current });
    i += 1;
  }

  return tokens;
}
