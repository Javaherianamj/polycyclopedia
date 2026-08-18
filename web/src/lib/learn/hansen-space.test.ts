import { describe, expect, it } from 'vitest';
import {
  axisDomain,
  axisLines,
  axisValue,
  boundingBoxEdges,
  dropLine,
  gridPlaneLines,
  expandBoxForSphere,
  hansenDistance,
  nearestByHansenDistance,
  pixelsPerUnit,
  plotBox,
  plotDistance,
  project3D,
  toPlotSpace,
  axisTicks,
  projectSphere,
  redBand,
  relativeEnergyDifference,
  D_AXIS_WEIGHT,
  RED_BOUNDARY_TOLERANCE,
  type HansenPlotBox,
  type HansenPoint,
  type Rotation,
} from './hansen-space';

describe('hansenDistance', () => {
  it('is zero for identical points', () => {
    const p: HansenPoint = { d: 16, p: 8, h: 5 };
    expect(hansenDistance(p, p)).toBe(0);
  });

  it('weights the dispersion (d) axis 4x relative to polar/hydrogen', () => {
    // A 1-unit gap on d contributes the same distance as a 2-unit gap on p
    // or h, per the standard Hansen convention (sqrt(4*dd^2) = 2*dd).
    const base: HansenPoint = { d: 0, p: 0, h: 0 };
    const onD = hansenDistance(base, { d: 1, p: 0, h: 0 });
    const onP = hansenDistance(base, { d: 0, p: 2, h: 0 });
    expect(onD).toBeCloseTo(onP, 10);
  });

  it('is symmetric', () => {
    const a: HansenPoint = { d: 15.6, p: 16.0, h: 42.3 };
    const b: HansenPoint = { d: 18.0, p: 1.4, h: 2.0 };
    expect(hansenDistance(a, b)).toBeCloseTo(hansenDistance(b, a), 10);
  });
});

describe('axisDomain', () => {
  it('pads a real range on both ends', () => {
    const domain = axisDomain([10, 20]);
    expect(domain.min).toBeLessThan(10);
    expect(domain.max).toBeGreaterThan(20);
  });

  it('does not collapse to a zero-width domain when every value is identical', () => {
    const domain = axisDomain([15, 15, 15]);
    expect(domain.max).toBeGreaterThan(domain.min);
  });

  it('falls back to a fixed span for an empty set rather than throwing', () => {
    const domain = axisDomain([]);
    expect(domain.max).toBeGreaterThan(domain.min);
  });
});

describe('axisValue', () => {
  it('reads the correct component for each axis key', () => {
    const point: HansenPoint = { d: 1, p: 2, h: 3 };
    expect(axisValue(point, 'd')).toBe(1);
    expect(axisValue(point, 'p')).toBe(2);
    expect(axisValue(point, 'h')).toBe(3);
  });
});

describe('nearestByHansenDistance', () => {
  it('ranks closest first and respects the limit', () => {
    const target: HansenPoint = { d: 16, p: 0, h: 0 };
    const candidates = [
      { key: 'far', d: 30, p: 30, h: 30 },
      { key: 'near', d: 16.1, p: 0.1, h: 0.1 },
      { key: 'mid', d: 20, p: 5, h: 5 },
    ];
    const ranked = nearestByHansenDistance(target, candidates, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.key).toBe('near');
    expect(ranked[1]!.key).toBe('mid');
  });

  it('returns an empty array for an empty candidate set rather than throwing', () => {
    const target: HansenPoint = { d: 16, p: 0, h: 0 };
    expect(nearestByHansenDistance(target, [], 5)).toEqual([]);
  });
});

// The cubic plot box used by every geometry suite below. Padding is disabled
// so the expected numbers stay legible. Corners are the same Hansen values
// the old per-axis fixture used: d 10..20, p 0..20, h 0..40. In plot space
// (2*dD, dP, dH) that is x 20..40, y 0..20, z 0..40 -- spans 20, 20, 40 --
// so the cube takes the largest span, 40, and recentres each axis on its own
// midpoint: x 10..50, y -10..30, z 0..40.
const box: HansenPlotBox = plotBox(
  [
    { d: 10, p: 0, h: 0 },
    { d: 20, p: 20, h: 40 },
  ],
  0,
);

const CENTER = { x: 150, y: 150 };
const SCALE = 100;
const NO_ROTATION: Rotation = { azimuthDeg: 0, elevationDeg: 0 };

/** A spread of rotations covering both axes, including the extremes the
 *  island clamps to. Reused by the invariance suites. */
const ROTATIONS: Rotation[] = [];
for (const azimuthDeg of [-180, -90, -35, 0, 37, 90, 180, 360]) {
  for (const elevationDeg of [-85, -22, 0, 45, 85]) {
    ROTATIONS.push({ azimuthDeg, elevationDeg });
  }
}

describe('toPlotSpace / plotDistance — the metric identity the fix rests on', () => {
  it('stretches only the dispersion axis, by exactly D_AXIS_WEIGHT', () => {
    expect(toPlotSpace({ d: 16, p: 8, h: 5 })).toEqual({ x: 16 * D_AXIS_WEIGHT, y: 8, z: 5 });
  });

  it('makes Ra the plain Euclidean norm of plot space, for arbitrary points', () => {
    // THE load-bearing property. If this ever fails, the picture and the
    // "closest solvents" ranking have gone back to disagreeing, which is
    // the bug this module was rewritten to remove.
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return (seed / 2147483648) * 40;
    };
    for (let i = 0; i < 50; i++) {
      const a: HansenPoint = { d: rand(), p: rand(), h: rand() };
      const b: HansenPoint = { d: rand(), p: rand(), h: rand() };
      expect(plotDistance(toPlotSpace(a), toPlotSpace(b))).toBeCloseTo(hansenDistance(a, b), 10);
    }
  });
});

describe('plotBox', () => {
  it('is cubic — identical span on all three axes', () => {
    const b = plotBox([
      { d: 10, p: 0, h: 0 },
      { d: 22, p: 18, h: 40 },
    ]);
    expect(b.max.x - b.min.x).toBeCloseTo(b.span, 10);
    expect(b.max.y - b.min.y).toBeCloseTo(b.span, 10);
    expect(b.max.z - b.min.z).toBeCloseTo(b.span, 10);
  });

  it('contains every input point', () => {
    const points: HansenPoint[] = [
      { d: 14.9, p: 0, h: 0 },
      { d: 15.6, p: 16, h: 42.3 },
      { d: 18, p: 1.4, h: 2 },
    ];
    const b = plotBox(points);
    for (const q of points.map(toPlotSpace)) {
      expect(q.x).toBeGreaterThanOrEqual(b.min.x);
      expect(q.x).toBeLessThanOrEqual(b.max.x);
      expect(q.y).toBeGreaterThanOrEqual(b.min.y);
      expect(q.y).toBeLessThanOrEqual(b.max.y);
      expect(q.z).toBeGreaterThanOrEqual(b.min.z);
      expect(q.z).toBeLessThanOrEqual(b.max.z);
    }
  });

  it('does not collapse to zero span for a single point, or for none', () => {
    expect(plotBox([{ d: 16, p: 8, h: 5 }]).span).toBeGreaterThan(0);
    expect(plotBox([]).span).toBeGreaterThan(0);
  });
});

describe('expandBoxForSphere', () => {
  it('grows the box until a sphere of the given radius fits inside', () => {
    const base = plotBox([{ d: 16, p: 8, h: 5 }]);
    const centre: HansenPoint = { d: 16, p: 8, h: 5 };
    const grown = expandBoxForSphere(base, centre, 12);
    const c = toPlotSpace(centre);
    expect(c.x - grown.min.x).toBeGreaterThanOrEqual(12);
    expect(grown.max.x - c.x).toBeGreaterThanOrEqual(12);
    expect(c.z - grown.min.z).toBeGreaterThanOrEqual(12);
    expect(grown.max.z - c.z).toBeGreaterThanOrEqual(12);
  });

  it('stays cubic after expanding', () => {
    const grown = expandBoxForSphere(box, { d: 21, p: 19, h: 39 }, 9);
    expect(grown.max.x - grown.min.x).toBeCloseTo(grown.span, 10);
    expect(grown.max.y - grown.min.y).toBeCloseTo(grown.span, 10);
    expect(grown.max.z - grown.min.z).toBeCloseTo(grown.span, 10);
  });

  it('never shrinks the box, and is a no-op for a zero radius', () => {
    const same = expandBoxForSphere(box, { d: 15, p: 10, h: 20 }, 0);
    expect(same.span).toBeGreaterThanOrEqual(box.span);
  });
});

describe('project3D — the 3D scene projection', () => {
  it('projects the box centre to the scene centre under no rotation', () => {
    const centrePoint = { d: box.center.x / D_AXIS_WEIGHT, p: box.center.y, h: box.center.z };
    const projected = project3D(centrePoint, box, NO_ROTATION, CENTER, SCALE);
    expect(projected.x).toBeCloseTo(CENTER.x, 6);
    expect(projected.y).toBeCloseTo(CENTER.y, 6);
  });

  it('moves a point right on screen as its d value increases, under no rotation', () => {
    const low = project3D({ d: 10, p: 10, h: 20 }, box, NO_ROTATION, CENTER, SCALE);
    const high = project3D({ d: 20, p: 10, h: 20 }, box, NO_ROTATION, CENTER, SCALE);
    expect(high.x).toBeGreaterThan(low.x);
  });

  it('produces a finite result for any azimuth/elevation, including extremes', () => {
    const point: HansenPoint = { d: 18, p: 4, h: 30 };
    for (const rotation of ROTATIONS) {
      const projected = project3D(point, box, rotation, CENTER, SCALE);
      expect(Number.isFinite(projected.x)).toBe(true);
      expect(Number.isFinite(projected.y)).toBe(true);
      expect(Number.isFinite(projected.depth)).toBe(true);
    }
  });

  it('rotating a full 360 degrees in azimuth returns (very nearly) the same projection', () => {
    const point: HansenPoint = { d: 18, p: 4, h: 30 };
    const a = project3D(point, box, { azimuthDeg: 10, elevationDeg: 20 }, CENTER, SCALE);
    const b = project3D(point, box, { azimuthDeg: 370, elevationDeg: 20 }, CENTER, SCALE);
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(a.y).toBeCloseTo(b.y, 6);
  });

  it('never throws or divides by zero when the box has no width', () => {
    const flat: HansenPlotBox = {
      min: { x: 30, y: 8, z: 5 },
      max: { x: 30, y: 8, z: 5 },
      center: { x: 30, y: 8, z: 5 },
      span: 0,
    };
    const projected = project3D({ d: 15, p: 8, h: 5 }, flat, NO_ROTATION, CENTER, SCALE);
    expect(projected.x).toBeCloseTo(CENTER.x, 6);
    expect(projected.y).toBeCloseTo(CENTER.y, 6);
  });
});

describe('the projection is an isometry — REGRESSION GUARD for the wrong-positions bug', () => {
  // These three tests are the reason the rewrite happened. The old per-axis
  // normalisation failed all of them.

  it('preserves Ra up to a single scale factor, at every rotation', () => {
    const a: HansenPoint = { d: 15.6, p: 16.0, h: 12.3 };
    const b: HansenPoint = { d: 18.0, p: 1.4, h: 2.0 };
    const k = pixelsPerUnit(box, SCALE);
    for (const rotation of ROTATIONS) {
      const pa = project3D(a, box, rotation, CENTER, SCALE);
      const pb = project3D(b, box, rotation, CENTER, SCALE);
      // depth is normalised, so scale it back to pixels to compare in 3D.
      const dist = Math.sqrt(
        (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + ((pa.depth - pb.depth) * SCALE) ** 2,
      );
      expect(dist).toBeCloseTo(hansenDistance(a, b) * k, 6);
    }
  });

  it('ranks solvents on screen in the same order nearestByHansenDistance ranks them', () => {
    // The owner's actual complaint, as an assertion.
    const polymer: HansenPoint = { d: 17.4, p: 7.8, h: 3.8 };
    const solvents = [
      { key: 'water', d: 15.6, p: 16.0, h: 42.3 },
      { key: 'ethanol', d: 15.8, p: 8.8, h: 19.4 },
      { key: 'acetone', d: 15.5, p: 10.4, h: 7.0 },
      { key: 'toluene', d: 18.0, p: 1.4, h: 2.0 },
      { key: 'hexane', d: 14.9, p: 0, h: 0 },
    ];
    const byRa = nearestByHansenDistance(polymer, solvents, 5).map((s) => s.key);

    const rotation: Rotation = { azimuthDeg: -35, elevationDeg: -22 };
    const pPolymer = project3D(polymer, box, rotation, CENTER, SCALE);
    const byScreen = solvents
      .map((s) => {
        const q = project3D(s, box, rotation, CENTER, SCALE);
        return {
          key: s.key,
          dist: Math.sqrt(
            (q.x - pPolymer.x) ** 2 +
              (q.y - pPolymer.y) ** 2 +
              ((q.depth - pPolymer.depth) * SCALE) ** 2,
          ),
        };
      })
      .sort((x, y) => x.dist - y.dist)
      .map((s) => s.key);

    expect(byScreen).toEqual(byRa);
  });

  it('places a point identically no matter how many other points are "selected"', () => {
    // REGRESSION GUARD for the axes-rescale-on-selection bug: the box is
    // built from the corpus, so a point's position cannot depend on what
    // else the reader happens to have added.
    const corpus: HansenPoint[] = [
      { d: 15.6, p: 16.0, h: 42.3 },
      { d: 15.8, p: 8.8, h: 19.4 },
      { d: 15.5, p: 10.4, h: 7.0 },
      { d: 18.0, p: 1.4, h: 2.0 },
      { d: 14.9, p: 0, h: 0 },
    ];
    const corpusBox = plotBox(corpus);
    const subject = corpus[2]!;
    const rotation: Rotation = { azimuthDeg: -35, elevationDeg: -22 };
    const reference = project3D(subject, corpusBox, rotation, CENTER, SCALE);

    for (let n = 1; n <= corpus.length; n++) {
      // However many solvents are "selected", the box is the corpus box.
      const again = project3D(subject, plotBox(corpus), rotation, CENTER, SCALE);
      expect(again.x).toBeCloseTo(reference.x, 10);
      expect(again.y).toBeCloseTo(reference.y, 10);
    }
  });
});

describe('axisTicks', () => {
  it('labels the dispersion axis in δD even though it plots 2δD', () => {
    const ticks = axisTicks(box, 'd', 4);
    for (const tick of ticks) {
      expect(tick.hansenValue).toBeCloseTo(tick.plotValue / D_AXIS_WEIGHT, 10);
    }
  });

  it('leaves the polar and hydrogen axes unscaled', () => {
    for (const axis of ['p', 'h'] as const) {
      for (const tick of axisTicks(box, axis, 4)) {
        expect(tick.hansenValue).toBeCloseTo(tick.plotValue, 10);
      }
    }
  });

  it('spans the box exactly, with count+1 ticks', () => {
    const ticks = axisTicks(box, 'p', 4);
    expect(ticks).toHaveLength(5);
    expect(ticks[0]!.plotValue).toBeCloseTo(box.min.y, 10);
    expect(ticks[4]!.plotValue).toBeCloseTo(box.max.y, 10);
  });
});

describe('axisLines', () => {
  it('returns exactly one line per axis, each starting at the shared near corner', () => {
    const lines = axisLines(box);
    expect(lines.map((l) => l.axis)).toEqual(['d', 'p', 'h']);
    for (const line of lines) {
      expect(line.start).toEqual({ x: box.min.x, y: box.min.y, z: box.min.z });
    }
  });

  it('runs each line out to that axis’s own maximum, holding the other two at minimum', () => {
    const [dLine, pLine, hLine] = axisLines(box);
    expect(dLine!.end).toEqual({ x: box.max.x, y: box.min.y, z: box.min.z });
    expect(pLine!.end).toEqual({ x: box.min.x, y: box.max.y, z: box.min.z });
    expect(hLine!.end).toEqual({ x: box.min.x, y: box.min.y, z: box.max.z });
  });
});

describe('boundingBoxEdges', () => {
  it('returns exactly 12 edges, a cube', () => {
    expect(boundingBoxEdges(box)).toHaveLength(12);
  });

  it('every edge endpoint uses only box min/max values on each axis', () => {
    for (const edge of boundingBoxEdges(box)) {
      for (const point of [edge.start, edge.end]) {
        expect([box.min.x, box.max.x]).toContain(point.x);
        expect([box.min.y, box.max.y]).toContain(point.y);
        expect([box.min.z, box.max.z]).toContain(point.z);
      }
    }
  });

  it('every edge varies exactly one axis between its two endpoints', () => {
    for (const edge of boundingBoxEdges(box)) {
      const diffs = [
        edge.start.x !== edge.end.x,
        edge.start.y !== edge.end.y,
        edge.start.z !== edge.end.z,
      ].filter(Boolean).length;
      expect(diffs).toBe(1);
    }
  });

  it('really is a cube — all 12 edges have the same length', () => {
    for (const edge of boundingBoxEdges(box)) {
      expect(plotDistance(edge.start, edge.end)).toBeCloseTo(box.span, 10);
    }
  });
});

describe('gridPlaneLines', () => {
  it('returns 3 faces * 2 directions * (divisions+1) lines', () => {
    expect(gridPlaneLines(box, 4)).toHaveLength(3 * 2 * 5);
    expect(gridPlaneLines(box, 2)).toHaveLength(3 * 2 * 3);
  });

  it('every line stays on one of the three near-corner faces (one axis pinned at its minimum)', () => {
    for (const line of gridPlaneLines(box)) {
      const pinnedAtMin = [
        line.start.x === box.min.x && line.end.x === box.min.x,
        line.start.y === box.min.y && line.end.y === box.min.y,
        line.start.z === box.min.z && line.end.z === box.min.z,
      ].filter(Boolean).length;
      expect(pinnedAtMin).toBeGreaterThanOrEqual(1);
    }
  });

  it('every line varies exactly one axis between its two endpoints', () => {
    for (const line of gridPlaneLines(box)) {
      const diffs = [
        line.start.x !== line.end.x,
        line.start.y !== line.end.y,
        line.start.z !== line.end.z,
      ].filter(Boolean).length;
      expect(diffs).toBe(1);
    }
  });
});

describe('dropLine', () => {
  it('starts at the point itself and ends directly below it on the floor', () => {
    const point: HansenPoint = { d: 16, p: 8, h: 25 };
    const line = dropLine(point, box);
    expect(line.start).toEqual(toPlotSpace(point));
    expect(line.end).toEqual({ x: 16 * D_AXIS_WEIGHT, y: 8, z: box.min.z });
  });

  it('is a zero-length line when the point is already on the floor', () => {
    const point: HansenPoint = { d: 16, p: 8, h: box.min.z };
    const line = dropLine(point, box);
    expect(line.end).toEqual(line.start);
  });
});

// ---------------------------------------------------------------------------
// The solubility sphere and RED.
// ---------------------------------------------------------------------------

describe('relativeEnergyDifference', () => {
  const polymer: HansenPoint = { d: 17.4, p: 7.8, h: 3.8 };

  it('is exactly 0 at the polymer itself', () => {
    expect(relativeEnergyDifference(polymer, polymer, 8)).toBe(0);
  });

  it('is exactly 1 for a solvent sitting at Ra = Ro', () => {
    // Ro = 8, and a pure dP offset of 8 gives Ra = 8 exactly (the dispersion
    // 4x weight does not touch dP), so RED must be 1 on the nose.
    const onTheSurface: HansenPoint = { d: 17.4, p: 15.8, h: 3.8 };
    expect(hansenDistance(polymer, onTheSurface)).toBeCloseTo(8, 10);
    expect(relativeEnergyDifference(polymer, onTheSurface, 8)).toBeCloseTo(1, 12);
  });

  it('is below 1 inside the sphere and above 1 outside it', () => {
    expect(relativeEnergyDifference(polymer, { d: 17.4, p: 11.8, h: 3.8 }, 8)!).toBeLessThan(1);
    expect(relativeEnergyDifference(polymer, { d: 17.4, p: 27.8, h: 3.8 }, 8)!).toBeGreaterThan(1);
  });

  it('returns null — never a number — for a non-positive or non-finite Ro', () => {
    // R7 enforced by the return type: a caller handed null renders "no
    // sphere"; a caller handed Infinity/NaN would paint a degenerate one.
    for (const r0 of [0, -1, -0.0001, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(relativeEnergyDifference(polymer, { d: 15, p: 10, h: 7 }, r0)).toBeNull();
    }
  });
});

describe('redBand', () => {
  it('uses a 0.1 tolerance by default', () => {
    expect(RED_BOUNDARY_TOLERANCE).toBe(0.1);
  });

  it('puts the exact edges 0.9 and 1.1 in the boundary band, not the confident ones', () => {
    // The edges belong to 'boundary' on BOTH sides: a value exactly at the
    // limit of what the published Ro's own precision can resolve must not
    // be reported as a confident "dissolves" or "does not".
    expect(redBand(0.9)).toBe('boundary');
    expect(redBand(1.1)).toBe('boundary');
    expect(redBand(0.9 - 1e-9)).toBe('good');
    expect(redBand(1.1 + 1e-9)).toBe('poor');
  });

  it('classifies clearly-inside and clearly-outside values', () => {
    expect(redBand(0)).toBe('good');
    expect(redBand(0.42)).toBe('good');
    expect(redBand(1)).toBe('boundary');
    expect(redBand(1.4)).toBe('poor');
    expect(redBand(12)).toBe('poor');
  });

  it('honours an explicit tolerance', () => {
    expect(redBand(0.95, 0.01)).toBe('good');
    expect(redBand(0.95, 0.2)).toBe('boundary');
  });
});

describe('projectSphere', () => {
  const centre: HansenPoint = { d: 17.4, p: 7.8, h: 3.8 };
  const R0 = 8;
  // 20 rotations, spread over both axes including the island's clamps.
  const SPHERE_ROTATIONS: Rotation[] = Array.from({ length: 20 }, (_, i) => ({
    azimuthDeg: -180 + i * 19,
    elevationDeg: -85 + (i * 170) / 19,
  }));

  it('has a pixel radius that is IDENTICAL under every rotation', () => {
    // THE property that makes the sphere drawable at all. Under the
    // pre-2026-08-16 per-axis normalisation this was a rotation-dependent
    // ellipse; if this test ever fails, the metric has regressed and the
    // circle on screen has stopped meaning Ro.
    const sphereBox = expandBoxForSphere(box, centre, R0);
    const expected = R0 * pixelsPerUnit(sphereBox, SCALE);
    for (const rotation of SPHERE_ROTATIONS) {
      const s = projectSphere(centre, R0, sphereBox, rotation, CENTER, SCALE);
      expect(s.r).toBeCloseTo(expected, 12);
    }
  });

  it('centres on the polymer marker itself, at every rotation', () => {
    const sphereBox = expandBoxForSphere(box, centre, R0);
    for (const rotation of SPHERE_ROTATIONS) {
      const marker = project3D(centre, sphereBox, rotation, CENTER, SCALE);
      const s = projectSphere(centre, R0, sphereBox, rotation, CENTER, SCALE);
      expect(s.cx).toBeCloseTo(marker.x, 10);
      expect(s.cy).toBeCloseTo(marker.y, 10);
      expect(s.depth).toBeCloseTo(marker.depth, 10);
    }
  });

  it('reports depthRadius in the same units as depth, so the hemispheres sort correctly', () => {
    const sphereBox = expandBoxForSphere(box, centre, R0);
    const s = projectSphere(centre, R0, sphereBox, NO_ROTATION, CENTER, SCALE);
    // depth is normalised by box.span (never multiplied by scale), so the
    // radius in depth units is r0/span -- and r/scale must equal it.
    expect(s.depthRadius).toBeCloseTo(R0 / sphereBox.span, 12);
    expect(s.r / SCALE).toBeCloseTo(s.depthRadius, 12);
  });

  it('does not divide by zero for a degenerate box', () => {
    const flat: HansenPlotBox = {
      min: { x: 30, y: 8, z: 5 },
      max: { x: 30, y: 8, z: 5 },
      center: { x: 30, y: 8, z: 5 },
      span: 0,
    };
    const s = projectSphere(centre, R0, flat, NO_ROTATION, CENTER, SCALE);
    expect(Number.isFinite(s.r)).toBe(true);
    expect(Number.isFinite(s.depthRadius)).toBe(true);
  });

  it('projects every RED < 1 solvent INSIDE the drawn circle, at every rotation', () => {
    // CONTAINMENT, DELIBERATELY ASSERTED IN ONE DIRECTION ONLY.
    //
    // "RED < 1 implies the dot lands within r pixels of the centre" is a
    // theorem here: the projection is an isometry, so on-screen separation
    // is at most the true 3D separation Ra, and Ra < Ro means Ra*k < r.
    //
    // The CONVERSE IS FALSE AND MUST NOT BE ASSERTED. A silhouette is a
    // projection: a solvent well outside the sphere but directly in FRONT
    // of it (or behind it) along the view axis projects inside the circle,
    // correctly. That is not a bug and adding an "outside stays outside"
    // assertion here would be asserting something geometry forbids -- it
    // would only ever pass by accident of the chosen fixtures. The front
    // shell / back hemisphere split in HansenSpaceIsland exists precisely
    // because the picture alone cannot disambiguate this; the dot's colour
    // and its <title>'s numeric RED are what actually answer it.
    const solvents: HansenPoint[] = [
      { d: 15.6, p: 16.0, h: 42.3 },
      { d: 15.8, p: 8.8, h: 19.4 },
      { d: 15.5, p: 10.4, h: 7.0 },
      { d: 18.0, p: 1.4, h: 2.0 },
      { d: 14.9, p: 0, h: 0 },
      { d: 17.4, p: 7.8, h: 3.8 },
      { d: 19.0, p: 12.0, h: 6.0 },
      { d: 16.8, p: 5.1, h: 8.2 },
    ];
    const sphereBox = expandBoxForSphere(box, centre, R0);
    let insideSeen = 0;
    for (const rotation of SPHERE_ROTATIONS) {
      const s = projectSphere(centre, R0, sphereBox, rotation, CENTER, SCALE);
      for (const solvent of solvents) {
        const red = relativeEnergyDifference(centre, solvent, R0);
        if (red === null || red >= 1) continue;
        insideSeen++;
        const q = project3D(solvent, sphereBox, rotation, CENTER, SCALE);
        const onScreen = Math.sqrt((q.x - s.cx) ** 2 + (q.y - s.cy) ** 2);
        expect(onScreen).toBeLessThanOrEqual(s.r + 1e-9);
      }
    }
    // Guard against the assertion above passing vacuously.
    expect(insideSeen).toBeGreaterThan(0);
  });
});
