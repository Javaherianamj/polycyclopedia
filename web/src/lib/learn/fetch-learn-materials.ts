// FE-8 step 1 — the ONLY data both universal-concept islands touch. Neither
// tool NEEDS this to function (both teach the concept with illustrative,
// unattributed numbers by default -- see StateSimulatorIsland/
// DPCalculatorIsland) -- this is strictly the "optionally seed itself from a
// material's real value" bonus the FE-8 brief allows. R7's "renders nothing
// when unmet" therefore applies to the SEED LIST, not the tool: a failed or
// empty fetch just means the material picker offers nothing, not that the
// calculator/simulator disappears.
//
// One fetch pass serves both tools rather than two separate ones -- the
// catalog is small (single digits of materials today) and the browser's own
// HTTP cache de-dupes the underlying GETs even if both islands mount on the
// same page, but a shared module avoids maintaining the extraction logic
// (which property keys mean what) in two places.
//
// FE-8 step 3 extends this same module for the two FAMILY-SPECIFIC tools
// (BranchingSimulatorIsland, TacticitySimulatorIsland). Unlike step 1's
// tools, these DO have a real R7 dependency: whether the tool appears at
// all is a function of `family.key` (see lib/learn/family-scope.ts), which
// only the live catalog can answer -- "is there at least one polyolefin
// material on the site right now" is a fact about the database, not
// something either island can assume. `family`/`chainType` were added for
// exactly that gate. `density`/`crystallinity` were added so
// BranchingSimulator can ground its schematic trend in a REAL, cited-or-not
// number for a chosen material without inventing one (R5/step-3 brief §C) --
// same numericPoint()/cited pattern as tg/tm/mn below, nothing new.
//
// L2/MAP extends this a third time with six more independently-nullable
// numeric points (`youngModulus`, `tensileStrength`, `elongationAtBreak`,
// `izodImpact`, `mfi`, `processTemp`). Same shape as `density`/
// `crystallinity` above, same reason: MapIsland needs each of these as its
// own real-or-absent fact rather than duplicating this extraction logic a
// second time in a MAP-only fetcher (the build brief is explicit: "Consume
// this; do not write a second fetcher"). `youngModulus` additionally does
// double duty as the one real number `lib/learn/modulus-curve.ts` is allowed
// to anchor its otherwise-schematic curve on -- see that module's header.

import { getMaterial, getMaterials } from '../api/client';
import type { ApiResult, MaterialDetail, PropertyValue } from '../api/types';

// Work stream B (Table A.2 import) — hspCorrelation resolution. Deliberately
// its own tiny request helper rather than extending web/src/lib/api/client.ts,
// matching fetch-solvents.ts's precedent (lib/solvents/fetch-solvents.ts) for
// a route this fetch module consumes but does not own end-to-end. This is
// the ONLY file work stream B touches on the frontend — hansen-space.ts and
// HansenSpaceIsland.tsx belong to the concurrent metric-rewrite stream and
// are the actual consumers of `hspCorrelation` once that stream lands.
interface HspCorrelationApiRow {
  key: string;
  handbookNumber: number | null;
  nameRaw: string;
  nameEn: string | null;
  nameFa: string | null;
  section: string | null;
  uncertainty: string | null;
  hansenD: number;
  hansenP: number;
  hansenH: number;
  r0: number;
  status: string;
  materialSlug: string | null;
  cited: boolean;
}

interface HspCorrelationsListResponse {
  data: HspCorrelationApiRow[];
  total: number;
}

function apiBaseUrl(): string {
  return import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
}

/** Fetches every `hsp_correlation` row and returns only the ones linked to a
 * catalog material, keyed by `material.slug`. A network or HTTP failure
 * resolves to an empty map rather than failing the whole batch -- exactly
 * `fetchLearnMaterials`'s existing "skip, don't blank the picker" contract
 * (see that function's own doc comment) -- since every material's
 * `hspCorrelation` is optional (R7: most materials have none). */
async function fetchLinkedHspCorrelations(): Promise<Map<string, HspCorrelationApiRow>> {
  const byMaterialSlug = new Map<string, HspCorrelationApiRow>();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/hsp-correlations`);
  } catch {
    return byMaterialSlug;
  }
  if (!response.ok) return byMaterialSlug;

  let body: HspCorrelationsListResponse;
  try {
    body = (await response.json()) as HspCorrelationsListResponse;
  } catch {
    return byMaterialSlug;
  }

  for (const row of body.data) {
    if (row.materialSlug) byMaterialSlug.set(row.materialSlug, row);
  }
  return byMaterialSlug;
}

/** A single number pulled out of a `PropertyValue`: `valueTypical` when the
 * registry has one, else the midpoint of a range. `cited` is R1's provenance
 * state, carried through so a caller can say "unsourced" rather than
 * silently presenting the number as settled fact -- true for effectively
 * every value in the seeded catalog today (`db/seeds/*`'s citation coverage
 * is still low), which is exactly the case R22 exists for. */
export interface LearnNumericPoint {
  value: number;
  cited: boolean;
  display: string | null;
}

export interface LearnThermalProfile {
  tg: LearnNumericPoint;
  tm: LearnNumericPoint | null;
  degradationTemp: LearnNumericPoint | null;
}

export interface LearnMolecularProfile {
  mn: LearnNumericPoint;
  monomerMolarMass: LearnNumericPoint;
  monomerNameFa: string | null;
  monomerNameEn: string | null;
}

export interface LearnMaterial {
  slug: string;
  nameFa: string;
  nameEn: string;
  /** step 3: the family-scoping gate for BranchingSimulator/
   * TacticitySimulator (lib/learn/family-scope.ts). Always present -- every
   * material has a family in this schema. */
  family: { key: string; nameFa: string; nameEn: string };
  /** step 3: free-text microstructure descriptor ('linear_pure',
   * 'branched_long_short', 'isotactic', ...). Informational only -- it is
   * NOT used for scoping (its vocabulary is not consistent enough across
   * families to gate on; see family-scope.ts's header for why tacticity
   * scoping cannot be family-key-only either). */
  chainType: string | null;
  /** `null` when this material has no `tg` value at all -- StateSimulator
   * cannot classify a phase without a glass transition to anchor on, so such
   * a material is not offered by that tool (R7). */
  thermal: LearnThermalProfile | null;
  /** `null` when either `mn` or `monomer_molar_mass` is missing --
   * DPCalculator's seed needs both (Mn to seed the input, M0 to compute
   * against) or neither. */
  molecular: LearnMolecularProfile | null;
  /** step 3: real, possibly-uncited density -- BranchingSimulator's optional
   * "ground the schematic trend in a real number" panel. `null` when the
   * material has no density value at all. */
  density: LearnNumericPoint | null;
  /** step 3: same, for `academic.crystallinity` -- coverage is much lower
   * than density's (see fetch-learn-materials.test.ts), so this is the one
   * more likely to be `null`. */
  crystallinity: LearnNumericPoint | null;
  /** step 4: Hansen solubility parameters (`academic.hansen_d/p/h`), for
   * HansenSpaceIsland's polymer marker. `null` unless ALL THREE are
   * present -- a partial point has no home in a 3-axis space and R7 forbids
   * guessing the missing one(s). Only 2 of 7 seeded materials (LDPE, HDPE)
   * satisfy this today, both unsourced (`cited` on each axis reflects
   * that honestly rather than the chart pretending otherwise). */
  hansen: { d: LearnNumericPoint; p: LearnNumericPoint; h: LearnNumericPoint } | null;
  /** Work stream B: the published Hansen solubility SPHERE for this
   * material, if Table A.2 (Appendix A of the same Hansen handbook `hansen`
   * above is drawn from) carries a hand-reviewed correlation linked to it
   * via `hsp_correlation.material_id` (see
   * tools/curation/import_hsp_correlations.py's CATALOG_LINKS). Distinct
   * from `hansen` above: that is a bare centre point with no radius, while
   * this carries a real, citable `r0` too -- the pair a solubility sphere
   * needs. `cited` is always true when this is non-null (every imported
   * correlation carries a page citation by construction), kept as an
   * explicit field rather than assumed so a caller never has to special-
   * case this source to get a provenance mark. `null` for every material
   * without a reviewed link (most of them) -- R7 forbids rendering a sphere
   * from a guessed or fuzzy-matched correlation. */
  hspCorrelation: { d: number; p: number; h: number; r0: number; cited: boolean } | null;
  /** L2/MAP: `mechanical.young_modulus`, GPa. The one real number
   * `modulus-curve.ts` is allowed to anchor its schematic curve's ABSOLUTE
   * height on -- see that module's header. `null` for any material without
   * this property (most of them today), in which case the curve falls back
   * to a fully schematic default rather than inventing a height. */
  youngModulus: LearnNumericPoint | null;
  /** L2/MAP: `mechanical.tensile_strength`, MPa -- the plateau-region tray's
   * "real number from this material's own datasheet" chip. */
  tensileStrength: LearnNumericPoint | null;
  /** L2/MAP: `mechanical.elongation_at_break`, % -- shown alongside tensile
   * strength in the plateau-region tray, same "this pairs with tensile
   * strength on a real stress-strain reading" convention the datasheet
   * itself uses. */
  elongationAtBreak: LearnNumericPoint | null;
  /** L2/MAP: `mechanical.izod_impact` -- the glassy-region tray's real-data
   * chip (low-temperature brittleness is the classic Izod story). */
  izodImpact: LearnNumericPoint | null;
  /** L2/MAP: `processing.mfi` -- the flow-region tray's real-data chip. */
  mfi: LearnNumericPoint | null;
  /** L2/MAP: `processing.process_temp` -- the flow-region tray's second
   * real-data chip. Deliberately NOT the fuller per-technique
   * mould_temp/injection_pressure pair `material_process` now carries
   * (db/DATA-GAPS.md G5) -- those are grade/technique-scoped, not a single
   * material-level number, and folding them in would need a technique
   * picker this surface does not have. `process_temp` is the one processing
   * number that is still material-level, so it is the one MAP shows. */
  processTemp: LearnNumericPoint | null;
}

function numericPoint(pv: PropertyValue | undefined): LearnNumericPoint | null {
  if (!pv) return null;
  const value = pv.valueTypical ?? (pv.valueMin != null && pv.valueMax != null
    ? (pv.valueMin + pv.valueMax) / 2
    : (pv.valueMin ?? pv.valueMax));
  if (value == null) return null;
  return { value, cited: pv.citations.length > 0, display: pv.display };
}

function findProperty(
  detail: MaterialDetail,
  groupKey: string,
  propertyKey: string,
): PropertyValue | undefined {
  const group = detail.propertyGroups.find((g) => g.key === groupKey);
  return group?.properties.find((p) => p.key === propertyKey);
}

function toLearnMaterial(
  detail: MaterialDetail,
  hspCorrelationsByMaterialSlug: Map<string, HspCorrelationApiRow>,
): LearnMaterial {
  const tg = numericPoint(findProperty(detail, 'thermal', 'tg'));
  const tm = numericPoint(findProperty(detail, 'thermal', 'tm'));
  const degradationTemp = numericPoint(findProperty(detail, 'thermal', 'degradation_temp'));
  const mn = numericPoint(findProperty(detail, 'academic', 'mn'));
  const monomerMolarMass = numericPoint(findProperty(detail, 'academic', 'monomer_molar_mass'));
  const monomerName = findProperty(detail, 'academic', 'monomer_name');
  const density = numericPoint(findProperty(detail, 'physical', 'density'));
  const crystallinity = numericPoint(findProperty(detail, 'academic', 'crystallinity'));
  const hansenD = numericPoint(findProperty(detail, 'academic', 'hansen_d'));
  const hansenP = numericPoint(findProperty(detail, 'academic', 'hansen_p'));
  const hansenH = numericPoint(findProperty(detail, 'academic', 'hansen_h'));
  const youngModulus = numericPoint(findProperty(detail, 'mechanical', 'young_modulus'));
  const tensileStrength = numericPoint(findProperty(detail, 'mechanical', 'tensile_strength'));
  const elongationAtBreak = numericPoint(findProperty(detail, 'mechanical', 'elongation_at_break'));
  const izodImpact = numericPoint(findProperty(detail, 'mechanical', 'izod_impact'));
  const mfi = numericPoint(findProperty(detail, 'processing', 'mfi'));
  const processTemp = numericPoint(findProperty(detail, 'processing', 'process_temp'));

  const linkedCorrelation = hspCorrelationsByMaterialSlug.get(detail.slug);
  const hspCorrelation = linkedCorrelation
    ? {
        d: linkedCorrelation.hansenD,
        p: linkedCorrelation.hansenP,
        h: linkedCorrelation.hansenH,
        r0: linkedCorrelation.r0,
        cited: linkedCorrelation.cited,
      }
    : null;

  return {
    slug: detail.slug,
    nameFa: detail.nameFa,
    nameEn: detail.nameEn,
    family: detail.family,
    chainType: detail.chainType,
    thermal: tg ? { tg, tm, degradationTemp } : null,
    molecular:
      mn && monomerMolarMass
        ? {
            mn,
            monomerMolarMass,
            // Each locale prefers its own half and falls back to the other,
            // so a value translated on one side only still renders rather
            // than going blank. Before db/migrations/0030 there was a single
            // valueText and both fields got it verbatim, which is how
            // 'اتیلن (Ethylene)' ended up on the English learn page.
            monomerNameFa: monomerName?.valueTextFa ?? monomerName?.valueTextEn ?? null,
            monomerNameEn: monomerName?.valueTextEn ?? monomerName?.valueTextFa ?? null,
          }
        : null,
    density,
    crystallinity,
    hansen: hansenD && hansenP && hansenH ? { d: hansenD, p: hansenP, h: hansenH } : null,
    hspCorrelation,
    youngModulus,
    tensileStrength,
    elongationAtBreak,
    izodImpact,
    mfi,
    processTemp,
  };
}

/**
 * Fetches every material's full detail (needed because `GET /api/materials`'s
 * list shape carries no property values) and extracts only the numbers these
 * two Learn tools care about. Materials the API can't resolve individually
 * are skipped rather than failing the whole batch -- one bad slug should not
 * blank the picker for the rest.
 */
export async function fetchLearnMaterials(): Promise<ApiResult<LearnMaterial[]>> {
  const listResult = await getMaterials({ limit: 100 });
  if (!listResult.ok) return listResult;

  const [details, hspCorrelationsByMaterialSlug] = await Promise.all([
    Promise.all(listResult.data.data.map((m) => getMaterial(m.slug))),
    fetchLinkedHspCorrelations(),
  ]);
  const materials = details
    .filter((r): r is { ok: true; data: MaterialDetail } => r.ok)
    .map((r) => toLearnMaterial(r.data, hspCorrelationsByMaterialSlug));

  return { ok: true, data: materials };
}
