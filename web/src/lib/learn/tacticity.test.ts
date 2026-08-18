import { describe, expect, it } from 'vitest';
import {
  classifyArrangement,
  DEFAULT_SEQUENCE,
  ISOTACTIC_SEQUENCE,
  SYNDIOTACTIC_SEQUENCE,
  tacticityTrend,
  TACTICITY_MODES,
  toggleAt,
} from './tacticity';

describe('classifyArrangement', () => {
  it('classifies the all-same-side sequence as isotactic', () => {
    expect(classifyArrangement(ISOTACTIC_SEQUENCE)).toBe('isotactic');
  });

  it('classifies the strictly-alternating sequence as syndiotactic', () => {
    expect(classifyArrangement(SYNDIOTACTIC_SEQUENCE)).toBe('syndiotactic');
  });

  it('classifies the default illustrative sequence as atactic', () => {
    expect(classifyArrangement(DEFAULT_SEQUENCE)).toBe('atactic');
  });

  it('reclassifies live as the reader toggles one unit at a time', () => {
    // Start isotactic, flip the last unit -> no longer every-same-side, and
    // not alternating either (positions 0-5 are all +1) -> atactic.
    const flipped = toggleAt(ISOTACTIC_SEQUENCE, 7);
    expect(classifyArrangement(flipped)).toBe('atactic');

    // Flipping every OTHER position of an all-+1 sequence produces the
    // alternating pattern -> syndiotactic.
    let seq = ISOTACTIC_SEQUENCE;
    for (let i = 1; i < seq.length; i += 2) seq = toggleAt(seq, i);
    expect(classifyArrangement(seq)).toBe('syndiotactic');
  });
});

describe('toggleAt', () => {
  it('flips exactly the targeted index and leaves the rest untouched', () => {
    const next = toggleAt(DEFAULT_SEQUENCE, 2);
    expect(next[2]).toBe(DEFAULT_SEQUENCE[2] * -1);
    next.forEach((v, i) => {
      if (i !== 2) expect(v).toBe(DEFAULT_SEQUENCE[i]);
    });
  });

  it('does not mutate the input sequence', () => {
    const before = [...DEFAULT_SEQUENCE];
    toggleAt(DEFAULT_SEQUENCE, 0);
    expect(DEFAULT_SEQUENCE).toEqual(before);
  });
});

describe('tacticityTrend', () => {
  it('gives atactic no crystallinity and no melting point', () => {
    expect(tacticityTrend('atactic')).toEqual({
      crystallinity: 'none',
      meltingPoint: 'none',
      clarity: 'clear',
    });
  });

  it('gives both stereoregular forms a real melting point, unlike atactic', () => {
    expect(tacticityTrend('isotactic').meltingPoint).toBe('present');
    expect(tacticityTrend('syndiotactic').meltingPoint).toBe('present');
    expect(tacticityTrend('atactic').meltingPoint).toBe('none');
  });

  it('covers exactly the three modes', () => {
    expect(TACTICITY_MODES).toEqual(['atactic', 'isotactic', 'syndiotactic']);
  });
});
