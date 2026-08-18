// FE-8 foundation layer, Part 2 — the 10⁻⁹-station live element the FE-0
// spec required and nobody built (lab-concepts-spec.md, L1/SCALE, "One live
// element (required)"): a DP slider (100–20 000) that redraws a 2D
// random-walk chain and reports its end-to-end distance and radius of
// gyration, visibly denser as DP rises. Owner, verbatim, on the wider gap
// this closes: "where are the figures and plots you talked about!"
//
// PHYSICS MODEL — a freely-jointed chain, 2D, unit bond length, uniform
// random turn angle at every step. This is the textbook random-walk model
// the spec cites (`Rg ∝ √N`): no bond-angle constraint, no excluded volume,
// no persistence length. That is a deliberate simplification, not a
// shortcut taken by accident — reproducing a REAL chain's Rg in physical
// units (nm) would need a persistence length and an excluded-volume
// exponent this database does not carry for any material, and inventing
// those constants is exactly what R5/R7 forbid. So distances here are
// reported in BOND LENGTHS (dimensionless multiples of one C–C-scale unit
// step), never nanometres — the island's copy says so explicitly
// (`learn.chain.unitNote`), the same "real quantity, honestly scoped unit"
// posture the rest of Learn uses.
//
// DETERMINISM — `generateRandomWalkChain` takes a seed and is otherwise
// pure. A seeded PRNG (mulberry32: 4 lines, no dependency) replaces
// `Math.random()` for exactly the reason this file's header calls out
// first in the build brief: "a walk that reshuffles on every render reads
// as noise, not as physics." Dragging the slider to the same DP twice, or
// re-rendering for any reason, must draw the identical chain.
//
// SAME-SEED PREFIX PROPERTY (this is what makes the fixed render scale in
// the island exact, not a guessed safety margin): `mulberry32(seed)`
// restarts the identical deterministic sequence every call, so
// `generateRandomWalkChain(100, seed)` consumes exactly the first 100 draws
// of the SAME stream `generateRandomWalkChain(20000, seed)` consumes 20 000
// of. The shorter walk's points are therefore an exact prefix of the
// longer walk's points, which means the longer walk's farthest excursion
// from the origin (`maxExtent`) is an upper bound for EVERY shorter walk
// drawn with the same seed, not just typically but by construction. The
// island uses this to fix one render scale (calibrated to `MAX_DP`) that
// every DP in range provably fits inside — see `REFERENCE_MAX_EXTENT`.
//
// WHY A SINGLE REALIZATION IS ALLOWED TO WOBBLE — `Rg ∝ √N` is an ENSEMBLE
// law: the AVERAGE Rg over many independent chains of length N grows as
// √N. One specific drawn chain is one sample from that ensemble and its Rg
// can plateau or dip locally as N grows (a long stretch that happens to
// fold back near itself is a real, physically valid conformation, not a
// bug) -- this file's own test suite observes exactly that around
// N≈2 000–14 000 with the chosen seed and asserts only the honest claim
// (materially higher at the far end of the range), not strict
// monotonicity. The visible "denser coil" cue the spec asks for does not
// depend on Rg growing smoothly: the island's FIXED pixel-per-unit scale
// means more DP always means more points/segments drawn inside
// (at most) the same visual area, which reads as density regardless of
// this run's particular Rg curve. `learn.chain.varianceNote` says this
// outright rather than pretending the number is smoother than it is.

export interface Vec2 {
  x: number;
  y: number;
}

export interface RandomWalkChain {
  /** Full-resolution walk, `dp + 1` points (the origin plus one per bond).
   * Never downsampled here -- `endToEndDistance`/`radiusOfGyration` are
   * computed from this, and downsampling before measuring would quietly
   * change the reported physics to match the drawing instead of the other
   * way around. */
  points: Vec2[];
  /** |last point − first point|, in bond lengths. */
  endToEndDistance: number;
  /** RMS distance of every point from the chain's own centroid, in bond
   * lengths -- the standard definition of Rg for a chain of point masses
   * (uniform mass per point, freely-jointed model, no per-atom weighting
   * this database has no basis to supply). */
  radiusOfGyration: number;
}

export const MIN_DP = 100;
export const MAX_DP = 20000;

/** Arbitrary fixed constant -- ANY fixed seed satisfies the determinism
 * requirement equally well; this one has no physical meaning and was not
 * tuned beyond confirming (this file's test suite) that it produces a
 * legible, non-degenerate coil across the full DP range. */
export const DEFAULT_SEED = 20260814;

/** mulberry32 -- a 32-bit PRNG in four lines, chosen over `Math.random()`
 * specifically because it is seedable (determinism, see header) and over
 * adding a dependency because the project constraint is "no new
 * dependencies" and this is the entire algorithm. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function next(): number {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clampDP(dp: number): number {
  return Math.round(Math.min(MAX_DP, Math.max(MIN_DP, dp)));
}

/**
 * Draws one freely-jointed 2D random-walk chain: `dp` unit-length bonds,
 * each turning through a uniformly random angle from the previous one
 * (no correlation between consecutive bond directions -- the simplest
 * random walk, and the one `Rg ∝ √N` is textbook-derived for).
 *
 * @param dp Degree of polymerisation -- number of bonds. Clamped to
 *   [MIN_DP, MAX_DP] rather than throwing, so a slider that briefly reports
 *   an out-of-range value (drag overshoot) degrades to the nearest valid
 *   chain instead of crashing the island.
 * @param seed Defaults to `DEFAULT_SEED`. Exposed as a parameter (not
 *   hardcoded) purely so the test suite can probe other seeds without a
 *   second code path.
 */
export function generateRandomWalkChain(dp: number, seed: number = DEFAULT_SEED): RandomWalkChain {
  const n = clampDP(dp);
  const rng = mulberry32(seed);
  const points: Vec2[] = new Array(n + 1);
  let x = 0;
  let y = 0;
  points[0] = { x, y };
  for (let i = 1; i <= n; i++) {
    const theta = rng() * Math.PI * 2;
    x += Math.cos(theta);
    y += Math.sin(theta);
    points[i] = { x, y };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const endToEndDistance = Math.hypot(last.x - first.x, last.y - first.y);

  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const centroidX = sumX / points.length;
  const centroidY = sumY / points.length;
  let sumSquareDist = 0;
  for (const p of points) {
    sumSquareDist += (p.x - centroidX) ** 2 + (p.y - centroidY) ** 2;
  }
  const radiusOfGyration = Math.sqrt(sumSquareDist / points.length);

  return { points, endToEndDistance, radiusOfGyration };
}

/** Farthest any point on the path strays from the chain's own start
 * (`points[0]`, not the centroid -- this is the quantity that has to fit
 * inside the SVG viewBox, and the viewBox is centred on the start point).
 * Used both by the island (to size the fixed render scale) and by this
 * file's own tests (to confirm the same-seed prefix bound holds). */
export function maxExtent(points: readonly Vec2[]): number {
  if (points.length === 0) return 0;
  const origin = points[0];
  let max = 0;
  for (const p of points) {
    const d = Math.hypot(p.x - origin.x, p.y - origin.y);
    if (d > max) max = d;
  }
  return max;
}

// Computed once at module load (one 20 000-step walk, sub-millisecond) and
// reused by every island render -- see this file's header for why this
// exact number, not a guessed safety margin, is what makes the fixed render
// scale provably contain every DP in [MIN_DP, MAX_DP] drawn with the same
// default seed.
export const REFERENCE_MAX_EXTENT = maxExtent(generateRandomWalkChain(MAX_DP, DEFAULT_SEED).points);

/**
 * Thins a chain down to at most `maxPoints` evenly-spaced points for SVG
 * rendering, always keeping the first and last point. The PHYSICS
 * (`endToEndDistance`/`radiusOfGyration`) is always computed from the full
 * chain before this runs -- this function exists purely so a 20 000-bond
 * chain does not become a 20 000-segment `<polyline>`; the two concerns
 * (measure vs. draw) are kept in separate functions on purpose.
 */
export function downsampleForRender(points: readonly Vec2[], maxPoints: number): Vec2[] {
  if (maxPoints < 2 || points.length <= maxPoints) return [...points];
  const out: Vec2[] = new Array(maxPoints);
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    out[i] = points[Math.round(i * step)];
  }
  return out;
}

/**
 * Maps chain-space points (bond-length units, origin at the chain's own
 * start) to SVG pixel space: `chainOrigin` is subtracted (so the chain's
 * start sits at `center` regardless of which DP is drawn), then scaled by
 * `pxPerUnit`, then offset to `center`. Pure coordinate arithmetic, no
 * randomness and no knowledge of `dp` -- the caller decides `pxPerUnit`
 * (the island derives it from `REFERENCE_MAX_EXTENT`, see the header).
 */
export function projectPoints(
  points: readonly Vec2[],
  chainOrigin: Vec2,
  pxPerUnit: number,
  center: Vec2,
): Vec2[] {
  return points.map((p) => ({
    x: center.x + (p.x - chainOrigin.x) * pxPerUnit,
    y: center.y + (p.y - chainOrigin.y) * pxPerUnit,
  }));
}
