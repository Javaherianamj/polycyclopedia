// FE-8 foundation layer, step 1 of the MAP/GRAPH/NOTEBOOK build-out — THE
// shared material context every Learn tool (and every future Learn surface)
// binds to. Owner, verbatim: "pay attention, when entering from a polymer
// datasheet, all defaults must be this polymer."
//
// Before this file, `getMaterialParam` (lib/learn/learn-url-state.ts) was
// read independently inside HansenSpaceIsland alone — the other four
// islands (StateSimulator, DPCalculator, BranchingSimulator,
// TacticitySimulator) never looked at the URL at all and always opened on
// their illustrative default, no matter how a reader arrived. That is
// exactly the gap this module closes: ONE hook, called the same way by
// every island (and, per this unit's brief, by MAP/GRAPH/NOTEBOOK later),
// so "read the bound slug" and "resolve it against the live catalog" are
// never reimplemented a sixth or seventh time.
//
// WHAT THIS MODULE DELIBERATELY DOES NOT DO: decide whether a given tool
// should seed itself from the resolved material. That decision is
// tool-specific in two different ways --
//
//   1. PROPERTY scope — does this material even have the data this tool
//      needs (Tg for StateSimulator, Mn+M0 for DPCalculator, ...)? Each
//      island already knows its own `LearnMaterial` field to check
//      (`.thermal`, `.molecular`, ...) — duplicating that here would just
//      move the coupling, not remove it.
//   2. FAMILY scope — does this material even belong to the tool's
//      family at all (tacticity for a polyethylene: never)?
//      `lib/learn/family-scope.ts` already owns that rule, and it must
//      stay the only place it is encoded (its own header explains why
//      family-key-only gating breaks for tacticity). This module does not
//      duplicate or re-derive it.
//
// So the contract is narrow and honest: this hook answers "which material,
// if any, did the reader arrive bound to" — never "should tool X use it".
// Each island still asks "is boundMaterial one of the materials I already
// consider eligible" using ITS OWN eligibility list (which is either the
// full catalog, a property-filtered subset, or a family-scope-filtered
// subset) — so an ineligible bound material is silently not found in that
// list and the tool falls back to its illustrative default. That is what
// "scoping wins over seeding" means in practice: no separate override path
// exists for it to win over.
//
// A resolved-but-ineligible bound material is NOT an error and is not
// reported as one by this hook — `boundMaterial` simply holds whatever the
// catalog has under that slug (or null), and it is up to each island
// whether that material is USABLE for it. An absent or unknown slug also
// never throws (R7 posture, same as the rest of Learn): `boundMaterial` is
// `null`, and every consuming island's existing "no material chosen" branch
// already handles that render path correctly — there was never a second
// branch to add.

import { useEffect, useState } from 'react';
import { fetchLearnMaterials, type LearnMaterial } from './fetch-learn-materials';
import { getMaterialParam } from './learn-url-state';

export type LearnFetchStatus = 'loading' | 'ready' | 'error';

export interface LearnMaterialContext {
  /** Mirrors `fetchLearnMaterials()`'s own status: 'loading' until the
   * catalog fetch settles, 'error' on a real network/API failure, 'ready'
   * otherwise (including "fetched zero materials", which is a valid,
   * non-error catalog state — R7 applies to individual tool dependencies,
   * not to this shared fetch). */
  status: LearnFetchStatus;
  /** The full catalog, unfiltered. Each island applies its own
   * property/family filter on top of this — this hook does not pre-filter,
   * so no island's eligibility rule is baked into a shared shape. */
  materials: LearnMaterial[];
  /** The raw `?material=` slug from the URL, read once on mount, or
   * `undefined` on a plain `/learn` visit. Exposed mainly for islands that
   * want to distinguish "no slug was ever supplied" from "a slug was
   * supplied but didn't resolve" (HansenSpaceIsland's boundNote vs.
   * boundNoHansenNote pair is exactly that distinction). */
  boundSlug: string | undefined;
  /** `boundSlug` resolved against `materials`, or `null` when the slug is
   * absent OR names a material this catalog doesn't have. Never throws — an
   * unrecognised or stale slug (a hand-edited URL, a since-removed
   * material) degrades to `null` exactly like "no slug at all" (part 1 of
   * the FE-8 foundation-layer brief: "keeps working ... when it names an
   * unknown/absent material"). */
  boundMaterial: LearnMaterial | null;
}

/** Pure resolver, split out from the hook below so the "does this slug
 * resolve" logic is unit-testable without mounting React or mocking fetch.
 * `materials` is deliberately typed `readonly` — this function only reads
 * it, and every caller passes either the live catalog or an island's own
 * already-filtered subset (see this file's header on why filtering stays
 * with the island, not here). */
export function resolveBoundMaterial(
  materials: readonly LearnMaterial[],
  boundSlug: string | undefined,
): LearnMaterial | null {
  if (!boundSlug) return null;
  return materials.find((m) => m.slug === boundSlug) ?? null;
}

/**
 * The shared hook. Every Learn island calls this once, the same way:
 *
 *   const { status, materials, boundMaterial } = useLearnMaterialContext();
 *
 * Two independent effects, deliberately not merged into one:
 *   - reading `window.location.search` is synchronous and instant, but only
 *     possible after mount (Astro islands render their first pass with no
 *     `window`, same as every other client-side URL read in this codebase
 *     — see HansenSpaceIsland's identical guard before this hook existed).
 *   - fetching the catalog is asynchronous and network-bound.
 * Keeping them separate means the bound slug is known immediately on
 * mount (before the fetch resolves), which matters to nothing here today
 * but costs nothing either, and avoids coupling two concerns that would
 * otherwise need to be re-split the first time a caller wants one without
 * the other.
 */
export function useLearnMaterialContext(): LearnMaterialContext {
  const [materials, setMaterials] = useState<LearnMaterial[]>([]);
  const [status, setStatus] = useState<LearnFetchStatus>('loading');
  const [boundSlug, setBoundSlug] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setBoundSlug(getMaterialParam(params));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLearnMaterials().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStatus('error');
        return;
      }
      setMaterials(result.data);
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    materials,
    boundSlug,
    boundMaterial: resolveBoundMaterial(materials, boundSlug),
  };
}
