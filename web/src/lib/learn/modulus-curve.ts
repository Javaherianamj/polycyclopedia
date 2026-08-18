// L2 — «نقشه» / MAP. Pure curve model for the modulus–temperature master
// curve (lab-concepts-spec.md, "L2 — «نقشه» / MAP"). No React, no fetch, no
// i18n — mirrors thermal.ts's split (physics as plain functions of numbers,
// tested without a DOM) and REUSES thermal.ts directly rather than
// reimplementing phase classification a second time: `classifyPhase` already
// encodes exactly the four regions this plot draws (glass / rubber / melt /
// burn), `isAmorphous` already encodes "does this material even have a real
// crystalline plateau", and `sliderRange` already encodes "how much headroom
// does a temperature axis need below Tg and above Td/Tm". Three sliders and
// one master curve are the same physics; there is no reason to re-derive any
// of the three.
//
// THE DATA-HONESTY SPLIT (this file's whole reason for existing as its own
// module, per the build brief): a value with a temperature UNIT is real --
// Tg, Tm, Td come straight from the database via `ThermalThresholds`, the
// same object StateSimulatorIsland already builds from `LearnMaterial`.
// Everything with a MODULUS unit on this curve, except at most one point, is
// this file's own schematic reading of the spec's qualitative prose ("≈1
// GPa", "roughly one decade", "three-plus decades") -- not a measurement, and
// never presented as one. The one exception is the real `young_modulus`
// value, when the database has it: `buildModulusCurve` uses it to pin
// whichever schematic plateau room temperature (25°C) actually falls on, and
// derives every other plateau from THAT number using the spec's own
// qualitative decade rules -- so a real number, where one exists, replaces a
// guess, but no second guess is dressed up as a second real number.
import {
  classifyPhase,
  isAmorphous,
  sliderRange,
  type ThermalPhase,
  type ThermalThresholds,
} from './thermal';

export interface CurvePoint {
  /** Temperature, °C. */
  t: number;
  /** log10(modulus in GPa). Negative means sub-GPa (rubbery/melt territory);
   * 0 means 1 GPa; positive would mean double-digit GPa (never reached by
   * this schematic model — polymers don't get there). */
  logE: number;
}

export interface ModulusCurveModel {
  /** Control points, temperature-ascending, meant to be linearly
   * interpolated between (see `curveLogEAt`) — a hand-rolled SVG polyline
   * needs nothing smoother, and a spline would imply a precision this model
   * does not have. */
  points: CurvePoint[];
  tMin: number;
  tMax: number;
  /** Whether this material has a real crystalline plateau to draw at all
   * (mirrors `isAmorphous(thresholds)` — exposed here so a caller does not
   * need to re-import `thermal.ts` just to ask the same question this model
   * already answered while building itself). */
  amorphous: boolean;
  /** Temperature beyond which the curve is drawn dashed rather than solid —
   * `null` when this material has no degradation temperature on record at
   * all, in which case NOTHING is dashed (there is no landmark to dash
   * "after"; the honesty burden is carried by copy, not by line style, per
   * the module header). When set, it equals `thresholds.degradationTemp`:
   * even within this already-schematic model, the territory past a real
   * degradation onset is one notch less certain than the territory before
   * it (the material is actively decomposing, not just softening), and the
   * dashed stroke says so at a glance the way `.curve-dashed` already does
   * in the FE-0 prototype this ports from. */
  dashFrom: number | null;
  /** Which physical phase, if any, `youngModulusGPa` was used to anchor.
   * `null` means no real young-modulus value was available (or it was
   * non-positive/nonsensical) and the ENTIRE curve is the schematic default
   * — including its absolute height, not just its shape. A caller uses this
   * to decide which caption to show ("this plateau's height is this
   * material's own measured Young's modulus" vs. "no real modulus was
   * available; every height on this plot is illustrative"). */
  anchoredPhase: ThermalPhase | null;
}

// ---------------------------------------------------------------- constants
//
// Every constant below is a reading of lab-concepts-spec.md's prose, not a
// measurement of any material. Each is commented with the sentence it comes
// from so a future editor can trace a number back to its source instead of
// wondering whether it was measured.

/** "Glassy plateau ≈ 1 GPa below Tg". log10(1) = 0. Schematic DEFAULT only —
 * overridden by a real `young_modulus` when `classifyPhase(25, ...)` says
 * room temperature is itself in the glassy region (Tg above room temp: PMMA,
 * PS, PC, PET...). */
const GLASS_LOG_E_DEFAULT = 0;

/** "drop of roughly one decade through Tg". */
const DROP_TG = 1;

/** "sharp drop of three-plus decades at Tm". */
const DROP_TM = 3.5;

/** No sentence in the spec covers the shape above Td — this is this file's
 * own small, clearly-schematic softening once degradation is underway, kept
 * deliberately modest (a fraction of a decade) so it reads as "still
 * degrading" rather than inventing a second cliff the spec never described. */
const DEGRADE_DROP = 0.3;

/** Schematic transition WIDTH through Tg, °C — fixed rather than derived from
 * any per-material range, because `LearnNumericPoint` collapses a real
 * min/max range to one midpoint number before this module ever sees it (see
 * `fetch-learn-materials.ts`); the real range is shown as text next to the
 * landmark instead (its `.display` string), and the curve's transition WIDTH
 * stays honestly schematic rather than borrowing false precision from a
 * range that was already collapsed away. */
const TG_WINDOW = 10;

/** Schematic transition width through Tm, °C — same reasoning as TG_WINDOW. */
const TM_WINDOW = 8;

/** Schematic width of an amorphous polymer's single wide glass→flow
 * transition, °C. Wider than TG_WINDOW + TM_WINDOW combined on purpose: an
 * amorphous polymer has no crystallites to arrest the softening partway
 * through, so the real physical transition (the "rubbery/viscoelastic"
 * stretch classifyPhase still calls 'melt' for lack of a fourth bucket) is
 * genuinely broader, not just undivided. */
const AMORPHOUS_FLOW_WINDOW = 90;

// ------------------------------------------------------------------- build

function clampPointOrder(points: CurvePoint[]): CurvePoint[] {
  // Defensive only: with real seeded data every branch below already
  // produces an ascending list (each `t` is derived from the previous one
  // plus a positive window), but a future material with landmarks packed
  // unusually close together should degrade to "a slightly odd curve" and
  // never to "a curve that runs backwards in time". Any point that would
  // move `t` backwards is dropped rather than reordered — reordering could
  // silently reassign a `logE` to the wrong temperature, which is worse.
  const out: CurvePoint[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (!prev || p.t > prev.t) out.push(p);
  }
  return out;
}

/**
 * Builds the schematic modulus–temperature curve for one material's real
 * thermal thresholds, optionally anchored by its real Young's modulus.
 *
 * `youngModulusGPa` is a single number (already collapsed from a possible
 * range by `fetch-learn-materials.ts`'s `numericPoint`) — pass `null` when
 * the material has no `mechanical.young_modulus` value at all, which is the
 * common case (10 of 17 seeded materials have no property values whatsoever,
 * and several more that DO have data still lack this specific property).
 */
export function buildModulusCurve(
  thresholds: ThermalThresholds,
  youngModulusGPa: number | null,
): ModulusCurveModel {
  const { tg, tm, degradationTemp } = thresholds;
  const amorphous = isAmorphous(thresholds);
  const { min: tMin, max: tMax } = sliderRange(thresholds);

  let glassLogE = GLASS_LOG_E_DEFAULT;
  let anchoredPhase: ThermalPhase | null = null;
  if (youngModulusGPa != null && youngModulusGPa > 0) {
    const anchorLogE = Math.log10(youngModulusGPa);
    const phase25 = classifyPhase(25, thresholds);
    if (phase25 === 'glass') {
      // Room temperature IS the glassy region for this material (PMMA, PS,
      // PET, PC...) — the real modulus pins the glassy plateau directly.
      glassLogE = anchorLogE;
      anchoredPhase = 'glass';
    } else if (phase25 === 'rubber' || phase25 === 'melt') {
      // Room temperature sits one schematic decade BELOW the glassy plateau
      // (the semicrystalline plateau, or an amorphous polymer's post-Tg
      // territory) — back the glassy plateau out from there so the two stay
      // the spec's stated one decade apart, with the REAL number now living
      // on the plateau that actually contains 25°C rather than on the one
      // that doesn't.
      glassLogE = anchorLogE + DROP_TG;
      anchoredPhase = phase25;
    }
    // phase25 === 'burn' never occurs for any seeded material (Td is always
    // well above room temperature) — if it ever did, anchoring a "plateau"
    // on an already-decomposing sample would be physically meaningless, so
    // the schematic default is kept and anchoredPhase stays null.
  }

  const postTgLogE = glassLogE - DROP_TG;

  const points: CurvePoint[] = [{ t: tMin, logE: glassLogE }, { t: tg, logE: glassLogE }];

  if (!amorphous && tm != null) {
    // SEMICRYSTALLINE: glassy → one-decade drop → the shallow crystalline
    // plateau the crystallites hold up → sharp multi-decade drop at Tm →
    // flow → (if known) degradation.
    const tgEnd = Math.min(tg + TG_WINDOW, tm - 1);
    points.push({ t: tgEnd, logE: postTgLogE });
    const tmStart = Math.max(tm - TM_WINDOW, tgEnd + 1);
    points.push({ t: tmStart, logE: postTgLogE });
    const flowLogE = postTgLogE - DROP_TM;
    points.push({ t: tm, logE: flowLogE });

    if (degradationTemp != null && degradationTemp > tm) {
      points.push({ t: degradationTemp, logE: flowLogE });
      points.push({ t: Math.max(degradationTemp + 1, tMax), logE: flowLogE - DEGRADE_DROP });
    } else {
      points.push({ t: tMax, logE: flowLogE });
    }
  } else {
    // AMORPHOUS (or a material whose Tm is not on record at all — same
    // honest consequence: no crystalline plateau is drawn, because none is
    // known to exist). One wide transition straight from glassy into
    // rubbery/terminal flow, per the module header's AMORPHOUS_FLOW_WINDOW
    // comment.
    const flowLogE = glassLogE - DROP_TG - DROP_TM;
    const flowStart = tg + AMORPHOUS_FLOW_WINDOW;
    points.push({ t: flowStart, logE: flowLogE });

    if (degradationTemp != null && degradationTemp > flowStart) {
      points.push({ t: degradationTemp, logE: flowLogE });
      points.push({ t: Math.max(degradationTemp + 1, tMax), logE: flowLogE - DEGRADE_DROP });
    } else {
      points.push({ t: tMax, logE: flowLogE });
    }
  }

  return {
    points: clampPointOrder(points),
    tMin,
    tMax,
    amorphous,
    dashFrom: degradationTemp,
    anchoredPhase,
  };
}

/** Piecewise-linear read of the model at any temperature, clamped to
 * [tMin, tMax] — the marker's readout calls this on every drag/keypress, and
 * the SVG path string is built by sampling it at a fixed step (see
 * MapIsland.tsx). */
export function curveLogEAt(model: ModulusCurveModel, t: number): number {
  const { points } = model;
  if (points.length === 0) return 0;
  const clamped = Math.min(model.tMax, Math.max(model.tMin, t));
  if (clamped <= points[0].t) return points[0].logE;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      if (b.t === a.t) return b.logE;
      const f = (clamped - a.t) / (b.t - a.t);
      return a.logE + f * (b.logE - a.logE);
    }
  }
  return points[points.length - 1].logE;
}

/** Formats a log10(GPa) value as a human-readable modulus — GPa above 1,
 * MPa between 1 GPa and 1 kPa, scientific notation below that (the burn
 * region's tail can get very small). `dir="ltr"` is applied by the caller
 * (R6 — numerals are always LTR even inside RTL prose), not here — this
 * function returns plain text, no markup. */
export function fmtModulus(logE: number): string {
  const gpa = Math.pow(10, logE);
  if (gpa >= 1) return `${gpa.toFixed(2)} GPa`;
  if (gpa >= 0.001) return `${Math.round(gpa * 1000)} MPa`;
  return `${gpa.toExponential(1)} GPa`;
}
