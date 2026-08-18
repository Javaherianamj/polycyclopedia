// Figure 1's geometry — the static schematic zig-zag chain, with a
// branched variant, ported from `design/fe-0/lab/notebook.js`'s
// `figure1Svg()`. Pure path math, not physics: this is an illustration
// for teaching, never a measured or simulated structure (the figure's own
// caption says so — see `LearnNotebook.astro`).
//
// BUG FIX ported forward, not just the shape: the FE-0 prototype computed
// each branch's anchor point with its own COPY of the zig-zag's y-sign
// formula (`i % 2 === 0 ? 10 : -10`), and that copy had the wrong parity —
// the prototype's own comment records catching a real off-by-one there
// ("Vertex i (i>=1) is the endpoint drawn by loop iteration i-1... put
// every branch 20px off the line it was meant to sit on"). Porting the
// fixed constant forward would only be a fix until the next edit drifts
// the two formulas apart again. This module removes the DUPLICATION
// instead: `chainVertices()` is the one and only place a vertex's (x, y)
// is computed, `chainPathD()` and `branchPathD()` both read from its
// output, so there is no second formula left to go out of sync.
export interface ChainPoint {
  x: number;
  y: number;
}

const STEP_X = 26;
const START_X = 20;
const ZIGZAG_Y = 10;
/** 11 line segments after the starting point, matching the FE-0
 * prototype's own chain length exactly (`design/fe-0/lab/notebook.js`). */
const SEGMENT_COUNT = 11;

/** Every vertex of the zig-zag chain, index 0 = the starting point. Both
 * `chainPathD` (the visible polyline) and `branchPathD` (a branch's
 * anchor) read from this SAME array, so a branch anchor can never drift
 * from the line it is meant to sit on. */
export function chainVertices(y: number): ChainPoint[] {
  const points: ChainPoint[] = [{ x: START_X, y }];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const x = START_X + i * STEP_X + STEP_X;
    const yy = y + (i % 2 === 0 ? -ZIGZAG_Y : ZIGZAG_Y);
    points.push({ x, y: yy });
  }
  return points;
}

/** SVG path `d` for the visible zig-zag polyline. */
export function chainPathD(y: number): string {
  const points = chainVertices(y);
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

/** Which vertex indices carry a branch, in the branched (LDPE) variant —
 * ported unchanged from the FE-0 prototype's own choice of `[3, 5, 8]`,
 * which is purely a "make it look reasonably branched" layout decision,
 * not a fact about any real chain. */
export const BRANCH_VERTEX_INDICES: readonly number[] = [3, 5, 8];

/** SVG path `d` for one short branch stroke anchored at `chainVertices(y)
 * [vertexIndex]` — reads the SAME point the visible chain line was drawn
 * through, by construction (see this module's header). */
export function branchPathD(y: number, vertexIndex: number): string {
  const v = chainVertices(y)[vertexIndex];
  if (!v) throw new Error(`chain-schematic: vertex index ${vertexIndex} is out of range`);
  return `M${v.x},${v.y} l14,-16 l10,4`;
}
