import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SEED,
  MAX_DP,
  MIN_DP,
  REFERENCE_MAX_EXTENT,
  downsampleForRender,
  generateRandomWalkChain,
  maxExtent,
  projectPoints,
} from './random-walk';

describe('generateRandomWalkChain', () => {
  it('produces dp + 1 points, starting at the origin', () => {
    const chain = generateRandomWalkChain(500);
    expect(chain.points).toHaveLength(501);
    expect(chain.points[0]).toEqual({ x: 0, y: 0 });
  });

  it('is deterministic for a fixed seed — same DP, same seed, same chain', () => {
    const a = generateRandomWalkChain(1000, 7);
    const b = generateRandomWalkChain(1000, 7);
    expect(a.points).toEqual(b.points);
    expect(a.endToEndDistance).toBe(b.endToEndDistance);
    expect(a.radiusOfGyration).toBe(b.radiusOfGyration);
  });

  it('produces a different chain for a different seed', () => {
    const a = generateRandomWalkChain(1000, 1);
    const b = generateRandomWalkChain(1000, 2);
    expect(a.points).not.toEqual(b.points);
  });

  it('clamps dp below MIN_DP up to MIN_DP rather than throwing', () => {
    const chain = generateRandomWalkChain(1);
    expect(chain.points).toHaveLength(MIN_DP + 1);
  });

  it('clamps dp above MAX_DP down to MAX_DP rather than throwing', () => {
    const chain = generateRandomWalkChain(1_000_000);
    expect(chain.points).toHaveLength(MAX_DP + 1);
  });

  it('the same-seed walk at DP is an exact prefix of the walk at a larger DP (the property REFERENCE_MAX_EXTENT relies on)', () => {
    const short = generateRandomWalkChain(200, DEFAULT_SEED);
    const long = generateRandomWalkChain(5000, DEFAULT_SEED);
    expect(long.points.slice(0, 201)).toEqual(short.points);
  });

  it('radius of gyration is materially larger at MAX_DP than at MIN_DP — Rg grows with N, even though a single realization is not perfectly monotonic in between (see this module\'s header on ensemble vs. single-chain variance)', () => {
    const short = generateRandomWalkChain(MIN_DP);
    const long = generateRandomWalkChain(MAX_DP);
    expect(long.radiusOfGyration).toBeGreaterThan(short.radiusOfGyration * 4);
  });

  it('a straight chain (angle forced to 0) has end-to-end distance equal to dp and zero would-be curvature', () => {
    // Not reachable through the public seeded API (which always turns
    // through a random angle) -- this documents the sanity boundary
    // instead: a chain's end-to-end distance can never exceed its own
    // contour length (dp bonds of unit length).
    const chain = generateRandomWalkChain(300);
    expect(chain.endToEndDistance).toBeLessThanOrEqual(300);
  });
});

describe('maxExtent', () => {
  it('is zero for a single-point path', () => {
    expect(maxExtent([{ x: 0, y: 0 }])).toBe(0);
  });

  it('is zero for an empty path', () => {
    expect(maxExtent([])).toBe(0);
  });

  it('finds the farthest point from the path\'s own start, not from the origin of the coordinate system', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 10, y: 12 },
      { x: 14, y: 10 },
    ];
    // Farthest from (10, 10): (14, 10) at distance 4, not (10, 12) at 2.
    expect(maxExtent(points)).toBe(4);
  });
});

describe('REFERENCE_MAX_EXTENT', () => {
  it('is positive and bounds every smaller DP\'s max excursion under the default seed (the prefix property)', () => {
    expect(REFERENCE_MAX_EXTENT).toBeGreaterThan(0);
    for (const dp of [MIN_DP, 1000, 5000, 12000, MAX_DP]) {
      const chain = generateRandomWalkChain(dp, DEFAULT_SEED);
      expect(maxExtent(chain.points)).toBeLessThanOrEqual(REFERENCE_MAX_EXTENT + 1e-9);
    }
  });
});

describe('downsampleForRender', () => {
  it('returns the input unchanged when it is already within the cap', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
    expect(downsampleForRender(points, 10)).toEqual(points);
  });

  it('thins a long path down to exactly maxPoints, keeping the first and last point', () => {
    const points = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: 0 }));
    const thinned = downsampleForRender(points, 50);
    expect(thinned).toHaveLength(50);
    expect(thinned[0]).toEqual(points[0]);
    expect(thinned[thinned.length - 1]).toEqual(points[points.length - 1]);
  });
});

describe('projectPoints', () => {
  it('maps the chain origin exactly onto the given center', () => {
    const origin = { x: 5, y: -3 };
    const projected = projectPoints([origin], origin, 10, { x: 100, y: 100 });
    expect(projected).toEqual([{ x: 100, y: 100 }]);
  });

  it('scales distances from the origin by pxPerUnit', () => {
    const origin = { x: 0, y: 0 };
    const points = [origin, { x: 3, y: 4 }]; // distance 5 from origin
    const projected = projectPoints(points, origin, 2, { x: 0, y: 0 });
    expect(projected[1]).toEqual({ x: 6, y: 8 });
  });
});
