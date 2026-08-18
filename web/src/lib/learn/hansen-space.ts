// FE-8 step 4 — Hansen solubility-space plot. Pure geometry/domain logic,
// no DOM, no React: HansenSpaceIsland.tsx renders what this module computes.
//
// REVISED 2026-08-14 per owner correction: "for hsb i need the 3d one, like
// HSPIP software and its output". The three fixed 2D projections this module
// originally shipped were a deliberate call at the time, but the owner's
// actual ask was a true, rotatable 3D scatter — HSPIP's own output — not
// three flat panels. This revision replaces the 2D projection helpers
// (`HANSEN_PROJECTIONS`, `scaleX`/`scaleY`) with a single 3D scene
// projection (`project3D`) and keeps the parts of the old design that were
// never about "2D vs 3D" in the first place: `hansenDistance` (ranking is
// dimension-agnostic) and `axisDomain` (still how each axis's padded range
// is computed, now feeding the 3D normalisation below instead of a 2D scale).
//
// LIBRARY CHOICE, decided again under the corrected brief: hand-rolled SVG
// with rotation, not Three.js/react-three-fiber. R24 permits a heavy library
// on Learn (it does not require one), and Learn's JS budget is unbounded, so
// this was a real choice, not a constraint-forced one. Reasons, weighed
// against measured cost rather than taste:
//
//   - The legacy prototype this replaces (repo root
//     src/components/Hansen3DChart.tsx) is ITSELF hand-rolled orthographic
//     projection SVG with drag-to-rotate -- proof the technique already
//     produces "like HSPIP" output without a library, in this exact
//     codebase, before this revision existed.
//   - The content is ~10-2,000 points (however many solvents the reader
//     opts into, see the island's header) plus at most one polymer marker --
//     nowhere near the point/mesh counts that justify a WebGL renderer's
//     fixed cost. A software-projected SVG scene stays well under 100 nodes
//     for any realistic selection.
//   - Adding Three.js (commonly 150-600 kB gzipped depending on modules)
//     would be pure downside here: no feature this tool needs (lighting,
//     meshes, textures, a depth buffer for large point clouds) that
//     matrix-rotate-and-paint's-algorithm doesn't already give a scene this
//     small. Measured cost of the hand-rolled version is in this unit's
//     build-and-test record; it is the same order of magnitude as the 2D
//     version it replaces, not a new order of magnitude the way a 3D
//     library would be.
//
// THE HONEST DATA SHAPE this module exists to serve, REVISED 2026-08-16 (b)
// when the `hsp_correlation` table landed. hansen_d/p/h are columns on
// ~1,180 solvent rows (the content). For MATERIALS there are now two
// possible sources of a position, and they are not equal:
//
//   1. A linked `hsp_correlation` row -- one of Hansen's own published
//      sphere fits (Handbook Appendix A, Table A.2), carrying a centre
//      (dD, dP, dH) AND an interaction radius Ro, both citable to a printed
//      page. 12 of the current catalog have one.
//   2. `hansen_d/p/h` property_definition values on the material itself.
//      Only LDPE and HDPE carry these, and both are `status='unsourced'`.
//
// Where both exist the SOURCED correlation wins, and the discrepancy is
// surfaced rather than silently resolved.
//
// The previous version of this paragraph asserted, as standing design, that
// no Ro sphere is ever drawn. That was true of the data at the time and is
// no longer true of the data now. What has NOT changed is the rule it was
// serving: R7 forbids an INVENTED radius, not a radius. A sphere renders
// only where a real linked correlation supplies Ro; every other material
// keeps the point-only rendering and says so (`learn.hansen.noRoNote`).
// `relativeEnergyDifference` returns `null` rather than a number for a
// non-positive or non-finite Ro precisely so that a caller cannot
// accidentally paint a degenerate sphere instead of no sphere.
//
// Drawing that sphere at all is only possible because of the metric fix
// recorded below: under the old per-axis normalisation a Hansen sphere was
// a data-dependent ellipse on screen, i.e. undrawable honestly at any
// radius. See `projectSphere`.
//
// REVISED 2026-08-16 — THE METRIC FIX, per owner report that the tool "is
// showing the solvents in wrong places". It was, and for a reason worth
// recording so it is never reintroduced.
//
// The bug: the previous `normalizeAxis`/`HansenDomains` pair mapped each of
// the three axes onto [-0.5, 0.5] using THAT AXIS'S OWN min/max. Three
// different divisors means three different pixels-per-MPa^0.5, so screen
// distance bore no fixed relationship to Hansen distance Ra. This module
// was simultaneously ranking solvents by a correct Ra (`hansenDistance`,
// with its 4x dispersion weight) and drawing them under a scaling that
// contradicted that ranking -- the #1 nearest solvent could render further
// from the polymer than the #5. Worse, the island recomputed those domains
// over only the SELECTED solvents, so adding one solvent silently moved
// every point already on screen.
//
// The fix, and why it is the conventional one: plot in (2*dD, dP, dH) on a
// SINGLE SHARED linear scale. Then
//
//     dx^2 + dy^2 + dz^2  =  4*ddD^2 + ddP^2 + ddH^2  =  Ra^2
//
// so Ra IS the Euclidean norm of plot space. Three consequences follow, and
// all three are things the old model could not offer at any price:
//   1. On-screen distance means Ra, at every rotation. Picture and ranking
//      can no longer disagree.
//   2. Rotation is an isometry, so a sphere of radius Ro projects to a true
//      CIRCLE of radius Ro*pixelsPerUnit under every rotation -- which is
//      what makes the solubility sphere drawable at all. Under per-axis
//      normalisation it was a data-dependent ellipse, i.e. undrawable
//      honestly.
//   3. The box is computed once over the whole solvent corpus, so points
//      stop moving when the reader changes the selection.
//
// `normalizeAxis` and `HansenDomains` are DELETED rather than deprecated.
// They are only correct under the broken model, and leaving them exported
// is an open invitation to reintroduce the bug. `HansenPlotPoint` is a
// distinct type from `HansenPoint` for the same reason: mixing raw Hansen
// coordinates with plot coordinates is precisely the confusion that caused
// this, and the type checker should be the thing that catches it, not a
// reader.

export interface HansenPoint {
  d: number;
  p: number;
  h: number;
}

export type HansenAxis = 'd' | 'p' | 'h';

/** The standard Hansen 4x weight on the dispersion term, expressed as the
 * axis STRETCH (sqrt(4) = 2) that makes Ra a plain Euclidean norm.
 *
 * This constant is the single source of truth for that weighting: both
 * `hansenDistance` and `toPlotSpace` derive from it, so the metric used to
 * rank solvents and the metric used to draw them cannot drift apart. They
 * did drift before this constant existed, which is the whole reason the
 * plot was wrong (see this file's header). */
export const D_AXIS_WEIGHT = 2;

/** The published Hansen "distance" between two points in solubility space.
 * The factor of 4 on the dispersion (δD) term is the standard Hansen
 * convention (Hansen 2007), not a free parameter this module invented --
 * it corrects for δD's systematically larger numeric range compared to
 * δP/δH so that no single axis dominates the distance purely because of
 * its units.
 *
 * Since the 2026-08-16 metric fix this is no longer merely a ranking
 * function: it is the same distance the picture draws, because plot space
 * is defined (in `toPlotSpace`) to make it so. */
export function hansenDistance(a: HansenPoint, b: HansenPoint): number {
  return Math.sqrt(
    D_AXIS_WEIGHT ** 2 * (a.d - b.d) ** 2 + (a.p - b.p) ** 2 + (a.h - b.h) ** 2,
  );
}

/** A point in PLOT space: (2*δD, δP, δH), still MPa^0.5.
 *
 * Deliberately a DIFFERENT type from `HansenPoint`. Passing one where the
 * other belongs is the exact mistake that produced the wrong-positions bug,
 * so it is made a compile error rather than a comment. */
export interface HansenPlotPoint {
  x: number;
  y: number;
  z: number;
}

/** Raw Hansen coordinates -> plot space, where Ra is the Euclidean norm. */
export function toPlotSpace(p: HansenPoint): HansenPlotPoint {
  return { x: p.d * D_AXIS_WEIGHT, y: p.p, z: p.h };
}

/** Plot space -> raw Hansen coordinates. Used for axis ticks, which must be
 * labelled in δD, not 2δD. */
export function fromPlotSpace(q: HansenPlotPoint): HansenPoint {
  return { d: q.x / D_AXIS_WEIGHT, p: q.y, h: q.z };
}

/** Straight-line distance in plot space. Equal to `hansenDistance` on the
 * corresponding raw points, by construction -- a property the tests assert
 * directly, since it is the whole basis of the fix. */
export function plotDistance(a: HansenPlotPoint, b: HansenPlotPoint): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export interface AxisDomain {
  min: number;
  max: number;
}

/** Domain for one axis across a set of points, padded by a fraction of the
 * observed range so the outermost points don't sit on the scene's border.
 * Falls back to a fixed [0, 10] span when every value is identical (or the
 * set is empty) rather than dividing by a zero range. */
export function axisDomain(values: number[], paddingFraction = 0.08): AxisDomain {
  if (values.length === 0) return { min: 0, max: 10 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * paddingFraction;
  return { min: min - pad, max: max + pad };
}

export function axisValue(point: HansenPoint, axis: HansenAxis): number {
  return axis === 'd' ? point.d : axis === 'p' ? point.p : point.h;
}

/** Ranks `candidates` by Hansen distance to `target`, closest first. Used
 * by HansenSpaceIsland's "closest solvents" panel once a material with a
 * real hansen point is selected, and to power its quick-add suggestions
 * for the reader's solvent selection (§2 of the island's header). */
export function nearestByHansenDistance<T extends HansenPoint>(
  target: HansenPoint,
  candidates: T[],
  limit: number,
): (T & { distance: number })[] {
  return candidates
    .map((c) => ({ ...c, distance: hansenDistance(target, c) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/** A CUBIC bounding volume in plot space: identical span on all three axes.
 * "Cubic" is the load-bearing word -- it is what lets one scale factor
 * serve all three axes, which is what makes the picture metric. A
 * non-cubic box would silently reintroduce per-axis scaling. */
export interface HansenPlotBox {
  min: HansenPlotPoint;
  max: HansenPlotPoint;
  center: HansenPlotPoint;
  /** Edge length in MPa^0.5. Identical on all three axes by construction. */
  span: number;
}

/** The padded, CUBIC plot-space box enclosing `points`.
 *
 * Each axis gets its padded extent from `axisDomain` (unchanged, still
 * tested), then all three are widened to the largest of the three spans and
 * re-centred on their own midpoint. Widening rather than shrinking is what
 * guarantees every input point stays inside. */
export function plotBox(points: HansenPoint[], paddingFraction = 0.08): HansenPlotBox {
  const q = points.map(toPlotSpace);
  const dx = axisDomain(
    q.map((v) => v.x),
    paddingFraction,
  );
  const dy = axisDomain(
    q.map((v) => v.y),
    paddingFraction,
  );
  const dz = axisDomain(
    q.map((v) => v.z),
    paddingFraction,
  );
  const span = Math.max(dx.max - dx.min, dy.max - dy.min, dz.max - dz.min);
  return boxFromCenters(
    { x: (dx.min + dx.max) / 2, y: (dy.min + dy.max) / 2, z: (dz.min + dz.max) / 2 },
    span,
  );
}

function boxFromCenters(center: HansenPlotPoint, span: number): HansenPlotBox {
  const half = span / 2;
  return {
    min: { x: center.x - half, y: center.y - half, z: center.z - half },
    max: { x: center.x + half, y: center.y + half, z: center.z + half },
    center,
    span,
  };
}

/** Grows `box` -- staying cubic -- until a sphere of `radius` about `center`
 * fits inside it.
 *
 * Needed because the corpus box knows nothing about Ro: a polymer sitting
 * near the edge of the solvent cloud with an Ro of ~8 would have its
 * solubility sphere clipped by the wireframe cube and the viewport. Easy to
 * overlook, because it only misbehaves once real Ro data exists. */
export function expandBoxForSphere(
  box: HansenPlotBox,
  center: HansenPoint,
  radius: number,
): HansenPlotBox {
  const c = toPlotSpace(center);
  const r = Number.isFinite(radius) && radius > 0 ? radius : 0;
  const lo = {
    x: Math.min(box.min.x, c.x - r),
    y: Math.min(box.min.y, c.y - r),
    z: Math.min(box.min.z, c.z - r),
  };
  const hi = {
    x: Math.max(box.max.x, c.x + r),
    y: Math.max(box.max.y, c.y + r),
    z: Math.max(box.max.z, c.z + r),
  };
  const span = Math.max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z);
  return boxFromCenters(
    { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2, z: (lo.z + hi.z) / 2 },
    span,
  );
}

/** Scene pixels per MPa^0.5 -- THE number that makes the picture metric, and
 * the on-screen radius of a solubility sphere of radius Ro. Because the box
 * is cubic, it is a single scalar rather than one value per axis. */
export function pixelsPerUnit(box: HansenPlotBox, scale: number): number {
  return box.span === 0 ? 0 : scale / box.span;
}

export interface Rotation {
  /** Degrees, rotation about the vertical (Z) axis. */
  azimuthDeg: number;
  /** Degrees, rotation about the horizontal (X) axis, clamped by the caller
   * to +/-85 so the scene never flips through the pole. */
  elevationDeg: number;
}

export interface Point2 {
  x: number;
  y: number;
}

export interface Projected3D extends Point2 {
  /** Camera-space depth AFTER rotation, in normalised (-0.5..0.5-ish) units
   * -- not a pixel value. Larger means closer to the viewer. Used purely to
   * paint's-algorithm-sort the scene; never shown to the reader. */
  depth: number;
}

/** Maps a plot-space point into box-normalised [-0.5, 0.5] coordinates,
 * using THE SAME divisor (`box.span`) on all three axes.
 *
 * That shared divisor is the entire fix. The function it replaced took a
 * per-axis domain and therefore used three different divisors. */
export function normalizePlot(q: HansenPlotPoint, box: HansenPlotBox): HansenPlotPoint {
  if (box.span === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: (q.x - box.center.x) / box.span,
    y: (q.y - box.center.y) / box.span,
    z: (q.z - box.center.z) / box.span,
  };
}

/** Projects a plot-space point into 2D scene coordinates under a rotation:
 * the rotate-then-orthographic-project technique the legacy prototype used
 * (see this file's header), now fed by a uniformly scaled cubic box.
 *
 * Because the scaling is uniform, the rotation is an ISOMETRY -- distances
 * are preserved up to the single factor `pixelsPerUnit(box, scale)`. Pure,
 * no DOM, no state. */
export function projectPlot(
  q: HansenPlotPoint,
  box: HansenPlotBox,
  rotation: Rotation,
  center: Point2,
  scale: number,
): Projected3D {
  const n = normalizePlot(q, box);
  const nx = n.x;
  const ny = n.y;
  const nz = n.z;

  const az = (rotation.azimuthDeg * Math.PI) / 180;
  const el = (rotation.elevationDeg * Math.PI) / 180;

  // Rotate around the vertical (azimuth) axis first.
  const rx = nx * Math.cos(az) - ny * Math.sin(az);
  const ry0 = nx * Math.sin(az) + ny * Math.cos(az);
  const rz0 = nz;

  // Then around the horizontal (elevation) axis.
  const ry = ry0 * Math.cos(el) - rz0 * Math.sin(el);
  const rz = ry0 * Math.sin(el) + rz0 * Math.cos(el);

  return {
    x: center.x + rx * scale,
    // SVG's y axis points down; flip so larger ry (screen-up) plots higher.
    y: center.y - ry * scale,
    depth: rz,
  };
}

/** `projectPlot` for callers holding raw Hansen coordinates -- i.e. every
 * data point. Convenience only; the conversion is the one-liner
 * `toPlotSpace`, routed through a single place so no caller is tempted to
 * inline it and drop the 2x on δD. */
export function project3D(
  point: HansenPoint,
  box: HansenPlotBox,
  rotation: Rotation,
  center: Point2,
  scale: number,
): Projected3D {
  return projectPlot(toPlotSpace(point), box, rotation, center, scale);
}

// ---------------------------------------------------------------------------
// The solubility sphere: RED, its bands, and the projection.
//
// This lives in the SAME module as `hansenDistance` on purpose. RED is Ra
// divided by Ro; if the Ra that colours a dot ever stopped being the Ra that
// places it, the picture would lie in exactly the way the metric fix above
// exists to prevent. One metric, one place.
// ---------------------------------------------------------------------------

/** RED — the Relative Energy Difference, Ra/Ro. Below 1 the solvent lies
 * inside the polymer's published solubility sphere; above 1, outside.
 *
 * Returns `null`, not a number, when `r0` is non-positive or non-finite.
 * That is the important part of this signature: a caller handed `null`
 * renders "no sphere", whereas a caller handed `Infinity` or `NaN` would
 * quietly paint a degenerate circle at a radius nothing in the database
 * supports. R7 is enforced by the return type, not by a comment asking
 * callers to check. */
export function relativeEnergyDifference(
  polymer: HansenPoint,
  solvent: HansenPoint,
  r0: number,
): number | null {
  if (!Number.isFinite(r0) || r0 <= 0) return null;
  return hansenDistance(polymer, solvent) / r0;
}

/** Half-width of the "boundary" band around RED = 1, i.e. 0.9 to 1.1.
 *
 * This number is justified by the DATA'S OWN PRECISION, not by taste. The
 * published interaction radii this feature draws (Hansen Handbook, Table
 * A.2) are quoted to one decimal place on a scale of roughly 5 to 15, and a
 * refit of the same polymer against a different solvent set routinely moves
 * Ro by several percent. A tolerance narrower than ~10% would therefore let
 * the colour flip between "dissolves" and "does not" on a difference
 * smaller than the radius's own quoted precision -- fabricated confidence,
 * which is the same failure mode R7 names, arriving through the legend
 * instead of through a number. The band exists so the reader is told
 * "too close to call" where the data genuinely cannot call it. */
export const RED_BOUNDARY_TOLERANCE = 0.1;

export type RedBand = 'good' | 'boundary' | 'poor';

/** Buckets a RED value into the three bands the legend names. The
 * boundaries themselves (exactly 1 - tolerance and exactly 1 + tolerance)
 * belong to `'boundary'`: an exact hit on the edge of a band that means
 * "indistinguishable from the edge" cannot honestly be read as either
 * confident answer. */
export function redBand(red: number, tolerance = RED_BOUNDARY_TOLERANCE): RedBand {
  if (red < 1 - tolerance) return 'good';
  if (red <= 1 + tolerance) return 'boundary';
  return 'poor';
}

export interface ProjectedSphere {
  /** Scene-pixel centre. */
  cx: number;
  cy: number;
  /** Scene-pixel radius. IDENTICAL under every rotation -- see below. */
  r: number;
  /** Camera-space depth of the sphere's CENTRE, in the same normalised
   * units `Projected3D.depth` uses, so it sorts against the data points. */
  depth: number;
  /** The sphere's radius expressed in those same depth units, so a caller
   * can place its near and far hemispheres at `depth ± depthRadius` in the
   * one painter's-algorithm sort. */
  depthRadius: number;
}

/** Projects a solubility sphere of radius `r0` about `center`.
 *
 * `r` is a single scalar rather than an ellipse's two semi-axes, and that
 * is the whole payoff of the metric rewrite: plot space is uniformly
 * scaled, so rotation is an isometry, so the silhouette of a sphere is a
 * TRUE CIRCLE of radius `r0 * pixelsPerUnit(box, scale)` at every azimuth
 * and elevation. `rotation` is accepted but only ever affects `cx`, `cy`
 * and `depth` -- never `r`. Under the pre-fix per-axis normalisation the
 * same sphere was a rotation-dependent ellipse, which is why the sphere
 * feature could not ship before that fix landed.
 *
 * `depth` and `depthRadius` exist so the caller can emit the sphere as TWO
 * entries in its existing far-to-near sort -- a filled back hemisphere at
 * `depth - depthRadius` and a stroked front shell at `depth + depthRadius`
 * -- letting solvent dots sort BETWEEN them. That is what makes an interior
 * solvent paint over the back of the sphere and under its front, which is
 * the only depth cue that reads as "inside" in a renderer with no z-buffer. */
export function projectSphere(
  center: HansenPoint,
  r0: number,
  box: HansenPlotBox,
  rotation: Rotation,
  sceneCenter: Point2,
  scale: number,
): ProjectedSphere {
  const projected = project3D(center, box, rotation, sceneCenter, scale);
  return {
    cx: projected.x,
    cy: projected.y,
    r: r0 * pixelsPerUnit(box, scale),
    depth: projected.depth,
    depthRadius: box.span === 0 ? 0 : r0 / box.span,
  };
}

export interface AxisTick {
  /** Position along the axis in PLOT units (δD ticks are 2δD here). */
  plotValue: number;
  /** The same tick in the units a reader understands: δD, δP or δH. */
  hansenValue: number;
}

/** Evenly spaced ticks for one axis, carrying BOTH the plot coordinate to
 * draw at and the Hansen value to label it with.
 *
 * This exists so the island never divides by `D_AXIS_WEIGHT` inline. The
 * d-axis plots 2δD; a tick drawn at plot 34 must be labelled "17". Doing
 * that arithmetic in JSX is exactly the kind of thing that silently
 * regresses, so it lives here, where it is tested. */
export function axisTicks(box: HansenPlotBox, axis: HansenAxis, count = 4): AxisTick[] {
  const min = axis === 'd' ? box.min.x : axis === 'p' ? box.min.y : box.min.z;
  const max = axis === 'd' ? box.max.x : axis === 'p' ? box.max.y : box.max.z;
  const divisor = axis === 'd' ? D_AXIS_WEIGHT : 1;
  return Array.from({ length: count + 1 }, (_, i) => {
    const plotValue = min + ((max - min) * i) / count;
    return { plotValue, hansenValue: plotValue / divisor };
  });
}

/** Any two-point reference segment in PLOT space -- axis lines, box edges,
 * grid lines, drop lines. One shape, since they differ only in purpose. */
export interface PlotSegment {
  start: HansenPlotPoint;
  end: HansenPlotPoint;
}

export interface PlotAxisLine extends PlotSegment {
  axis: HansenAxis;
}

/** The three axis lines to draw, each running from the box's shared "near"
 * corner (all three minimums) out to that one axis's maximum, with the
 * other two held at their minimum -- the same convention the legacy
 * prototype used, now anchored to the cubic plot box. */
export function axisLines(box: HansenPlotBox): PlotAxisLine[] {
  const corner: HansenPlotPoint = { x: box.min.x, y: box.min.y, z: box.min.z };
  return [
    { axis: 'd', start: corner, end: { ...corner, x: box.max.x } },
    { axis: 'p', start: corner, end: { ...corner, y: box.max.y } },
    { axis: 'h', start: corner, end: { ...corner, z: box.max.z } },
  ];
}

/** The 12 edges of the plot box -- the faint wireframe cube HSPIP-style 3D
 * views draw around the scene so a reader has a depth reference even before
 * rotating. Since the metric fix this really is a cube, not a
 * data-dependent cuboid. Pure geometry, no visual styling. */
export function boundingBoxEdges(box: HansenPlotBox): PlotSegment[] {
  const dVals = [box.min.x, box.max.x] as const;
  const pVals = [box.min.y, box.max.y] as const;
  const hVals = [box.min.z, box.max.z] as const;

  const corner = (di: 0 | 1, pi: 0 | 1, hi: 0 | 1): HansenPlotPoint => ({
    x: dVals[di],
    y: pVals[pi],
    z: hVals[hi],
  });

  const edges: PlotSegment[] = [];
  const bits: (0 | 1)[] = [0, 1];

  // Edges varying h, d/p fixed.
  for (const di of bits) {
    for (const pi of bits) {
      edges.push({ start: corner(di, pi, 0), end: corner(di, pi, 1) });
    }
  }
  // Edges varying p, d/h fixed.
  for (const di of bits) {
    for (const hi of bits) {
      edges.push({ start: corner(di, 0, hi), end: corner(di, 1, hi) });
    }
  }
  // Edges varying d, p/h fixed.
  for (const pi of bits) {
    for (const hi of bits) {
      edges.push({ start: corner(0, pi, hi), end: corner(1, pi, hi) });
    }
  }

  return edges;
}

/** The gridded "floor + two back walls" HSPiP draws around its 3D scatter so
 * a reader can read a point's depth without rotating: three faces meeting at
 * the domains' near corner (all three minimums -- same corner `axisLines`
 * and `boundingBoxEdges` already anchor to), each subdivided into a
 * `divisions`-cell grid. Bare bounding-box edges (the existing
 * `boundingBoxEdges`) tell you a point is INSIDE the cube; a gridded plane
 * additionally tells you WHERE on that face, the actual depth cue HSPiP's
 * screenshots rely on and the thing bare edges can't give you.
 *
 * Deliberately only 3 faces (not all 6): the far three would sit behind the
 * scene from every reasonable viewing angle and just add clutter/cost for
 * lines a reader can't usefully read. `divisions=4` keeps the line count at
 * 3 faces * 2 directions * (divisions+1) = 30 -- trivial for SVG, dense
 * enough to read position, sparse enough not to fight the data points for
 * attention. */
export function gridPlaneLines(box: HansenPlotBox, divisions = 4): PlotSegment[] {
  const stepsOf = (min: number, max: number): number[] =>
    Array.from({ length: divisions + 1 }, (_, i) => min + ((max - min) * i) / divisions);

  const dSteps = stepsOf(box.min.x, box.max.x);
  const pSteps = stepsOf(box.min.y, box.max.y);
  const hSteps = stepsOf(box.min.z, box.max.z);

  const lines: PlotSegment[] = [];

  // Floor: h held at its minimum, gridded across d and p.
  for (const x of dSteps) {
    lines.push({ start: { x, y: box.min.y, z: box.min.z }, end: { x, y: box.max.y, z: box.min.z } });
  }
  for (const y of pSteps) {
    lines.push({ start: { x: box.min.x, y, z: box.min.z }, end: { x: box.max.x, y, z: box.min.z } });
  }

  // Back wall: d held at its minimum, gridded across p and h.
  for (const y of pSteps) {
    lines.push({ start: { x: box.min.x, y, z: box.min.z }, end: { x: box.min.x, y, z: box.max.z } });
  }
  for (const z of hSteps) {
    lines.push({ start: { x: box.min.x, y: box.min.y, z }, end: { x: box.min.x, y: box.max.y, z } });
  }

  // Side wall: p held at its minimum, gridded across d and h.
  for (const x of dSteps) {
    lines.push({ start: { x, y: box.min.y, z: box.min.z }, end: { x, y: box.min.y, z: box.max.z } });
  }
  for (const z of hSteps) {
    lines.push({ start: { x: box.min.x, y: box.min.y, z }, end: { x: box.max.x, y: box.min.y, z } });
  }

  return lines;
}

/** A single vertical "drop line" from a plotted point straight down to the
 * floor grid (h at its minimum, d/p unchanged) -- the other HSPiP depth cue:
 * even with the gridded floor in place, a lone point floating in the cube is
 * still ambiguous about where over the floor it sits until something
 * connects it down to a legible plane. One drop line per plotted point,
 * computed here (pure) so HansenSpaceIsland only has to project and draw
 * it, same division of labour as every other geometry helper in this
 * module. */
export function dropLine(point: HansenPoint, box: HansenPlotBox): PlotSegment {
  const q = toPlotSpace(point);
  return { start: q, end: { x: q.x, y: q.y, z: box.min.z } };
}
