import { describe, expect, it } from 'vitest';
import { ALL_MAP_TOOLS, isToolActive, trayToolsForPhase, type MapToolKey } from './map-tray';
import type { ThermalPhase } from './thermal';

const PHASES: ThermalPhase[] = ['glass', 'rubber', 'melt', 'burn'];

describe('trayToolsForPhase', () => {
  it('gives the glassy region exactly the low-temperature toughness tool', () => {
    expect(trayToolsForPhase('glass')).toEqual(['izodImpact']);
  });

  it('gives the rubbery/crystalline plateau the three plateau-relevant tools', () => {
    expect(trayToolsForPhase('rubber')).toEqual([
      'crystallinityDensity',
      'branchingSimulator',
      'tensileElongation',
    ]);
  });

  it('gives the melt/flow region the two processing tools', () => {
    expect(trayToolsForPhase('melt')).toEqual(['mfi', 'processTemp']);
  });

  it('gives the degradation region only the burn note', () => {
    expect(trayToolsForPhase('burn')).toEqual(['burnNote']);
  });
});

describe('ALL_MAP_TOOLS', () => {
  it('contains every tool exactly once, across all four regions', () => {
    const seen = new Set<MapToolKey>();
    for (const tool of ALL_MAP_TOOLS) {
      expect(seen.has(tool)).toBe(false);
      seen.add(tool);
    }
    expect(ALL_MAP_TOOLS.length).toBe(7);
  });

  it('is exactly the union of every phase-specific list', () => {
    const union = new Set(PHASES.flatMap((p) => trayToolsForPhase(p)));
    expect(new Set(ALL_MAP_TOOLS)).toEqual(union);
  });
});

describe('isToolActive', () => {
  it('is true only for the phase a tool actually belongs to', () => {
    for (const phase of PHASES) {
      for (const tool of ALL_MAP_TOOLS) {
        expect(isToolActive(tool, phase)).toBe(trayToolsForPhase(phase).includes(tool));
      }
    }
  });

  it('rubber-region tools are never active for a phase an amorphous material can reach', () => {
    // classifyPhase never returns 'rubber' for an amorphous material (see
    // thermal.test.ts) -- this asserts the consequence at the tray level:
    // those three chips are permanently dim for glass/melt/burn.
    for (const tool of trayToolsForPhase('rubber')) {
      expect(isToolActive(tool, 'glass')).toBe(false);
      expect(isToolActive(tool, 'melt')).toBe(false);
      expect(isToolActive(tool, 'burn')).toBe(false);
    }
  });
});
