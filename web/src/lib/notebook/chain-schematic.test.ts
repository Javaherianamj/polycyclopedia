import { describe, expect, it } from 'vitest';
import { BRANCH_VERTEX_INDICES, branchPathD, chainPathD, chainVertices } from './chain-schematic';

describe('chainVertices', () => {
  it('starts at the given y and has 12 points (1 start + 11 segments)', () => {
    const points = chainVertices(30);
    expect(points).toHaveLength(12);
    expect(points[0]).toEqual({ x: 20, y: 30 });
  });

  it('alternates the zig-zag sign every step', () => {
    const points = chainVertices(0);
    // point[1] is drawn by loop i=0 (even) -> -10; point[2] by i=1 (odd) -> +10
    expect(points[1].y).toBe(-10);
    expect(points[2].y).toBe(10);
    expect(points[3].y).toBe(-10);
  });
});

describe('chainPathD', () => {
  it('starts with an absolute moveto and has 11 lineto commands', () => {
    const d = chainPathD(30);
    expect(d.startsWith('M20,30')).toBe(true);
    expect(d.match(/L/g)).toHaveLength(11);
  });
});

describe('branchPathD — the FE-0 off-by-one this module fixes by construction', () => {
  it('every configured branch anchor lands EXACTLY on a real chain vertex, for every index', () => {
    const y = 30;
    const points = chainVertices(y);
    for (const idx of BRANCH_VERTEX_INDICES) {
      const d = branchPathD(y, idx);
      const [, coords] = d.split('M');
      const [x, yy] = coords.split(' ')[0].split(',').map(Number);
      expect({ x, y: yy }).toEqual(points[idx]);
    }
  });

  it('throws rather than silently drawing a branch off the chain for an out-of-range index', () => {
    expect(() => branchPathD(30, 99)).toThrow();
  });
});
