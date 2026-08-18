import { describe, expect, it } from 'vitest';
import { branchLayout, branchingTrend, chainTypeToArchitecture, PE_ARCHITECTURES } from './branching';

describe('branchingTrend', () => {
  it('ranks linear (HDPE-like) highest on packing, crystallinity and density', () => {
    const hdpe = branchingTrend('linear');
    const ldpe = branchingTrend('longChainBranched');
    const lldpe = branchingTrend('shortChainBranched');
    for (const field of ['packing', 'crystallinity', 'density'] as const) {
      expect(hdpe[field].level).toBeGreaterThan(ldpe[field].level);
      expect(hdpe[field].level).toBeGreaterThan(lldpe[field].level);
    }
    expect(hdpe.packing.band).toBe('high');
  });

  it('ranks long-chain branched (LDPE-like) lowest on packing and density', () => {
    const ldpe = branchingTrend('longChainBranched');
    const lldpe = branchingTrend('shortChainBranched');
    expect(ldpe.packing.level).toBeLessThan(lldpe.packing.level);
    expect(ldpe.density.level).toBeLessThan(lldpe.density.level);
    expect(ldpe.packing.band).toBe('low');
  });

  // The whole reason the model carries numeric levels rather than one band
  // per architecture. LLDPE's many short comonomer branches disrupt lamellar
  // growth more effectively than LDPE's fewer long ones, so LLDPE is
  // typically LESS crystalline -- yet still DENSER, because LDPE's
  // long-chain branching creates more free volume. Which property is
  // depressed differs between the two, and a single shared band hid that.
  it('captures the LDPE/LLDPE inversion: LDPE more crystalline but less dense', () => {
    const ldpe = branchingTrend('longChainBranched');
    const lldpe = branchingTrend('shortChainBranched');
    expect(ldpe.crystallinity.level).toBeGreaterThan(lldpe.crystallinity.level);
    expect(ldpe.density.level).toBeLessThan(lldpe.density.level);
  });

  it('never renders all three columns at one magnitude within an architecture', () => {
    // Three identical bars read as one quantity drawn three times -- the
    // defect this model was changed to fix.
    for (const arch of PE_ARCHITECTURES) {
      const t = branchingTrend(arch);
      const levels = new Set([t.packing.level, t.crystallinity.level, t.density.level]);
      expect(levels.size).toBeGreaterThan(1);
    }
  });

  it('covers exactly the three real PE architectures, no continuous slider stand-in', () => {
    expect(PE_ARCHITECTURES).toEqual(['linear', 'longChainBranched', 'shortChainBranched']);
  });
});

describe('branchLayout', () => {
  it('draws zero branches for linear', () => {
    expect(branchLayout('linear')).toEqual([]);
  });

  it('draws only long branches for the long-chain-branched architecture', () => {
    const layout = branchLayout('longChainBranched');
    expect(layout.length).toBeGreaterThan(0);
    expect(layout.every((b) => b.kind === 'long')).toBe(true);
  });

  it('draws only short branches for the short-chain-branched architecture, and more of them than LDPE', () => {
    const scb = branchLayout('shortChainBranched');
    const lcb = branchLayout('longChainBranched');
    expect(scb.every((b) => b.kind === 'short')).toBe(true);
    expect(scb.length).toBeGreaterThan(lcb.length);
  });

  it('every branch position stays within the backbone (0, 1)', () => {
    for (const architecture of PE_ARCHITECTURES) {
      for (const branch of branchLayout(architecture)) {
        expect(branch.position).toBeGreaterThan(0);
        expect(branch.position).toBeLessThan(1);
      }
    }
  });
});

describe('chainTypeToArchitecture', () => {
  it('maps the three seeded PE chain types to their architecture', () => {
    expect(chainTypeToArchitecture('linear_pure')).toBe('linear');
    expect(chainTypeToArchitecture('branched_long_short')).toBe('longChainBranched');
    expect(chainTypeToArchitecture('linear_short_branched')).toBe('shortChainBranched');
  });

  it('returns null for a non-PE-architecture chain type (e.g. PP\'s tacticity descriptor) rather than guessing', () => {
    expect(chainTypeToArchitecture('isotactic')).toBeNull();
  });

  it('returns null for an unrecognised or absent chain type', () => {
    expect(chainTypeToArchitecture('something_new')).toBeNull();
    expect(chainTypeToArchitecture(null)).toBeNull();
  });
});
