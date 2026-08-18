import { describe, expect, it } from 'vitest';
import { search } from './match';
import type {
  SearchIndexGradeClass,
  SearchIndexMaterial,
  SearchIndexProperty,
  SearchMaterialsIndex,
  SearchState,
} from './types';

function material(overrides: Partial<SearchIndexMaterial> & { slug: string }): SearchIndexMaterial {
  return {
    nameFa: overrides.slug,
    nameEn: overrides.slug,
    familyKey: 'polyolefins',
    familyNameFa: 'پلی‌الفین‌ها',
    familyNameEn: 'Polyolefins',
    citationCoveragePct: 100,
    values: {},
    ...overrides,
  };
}

function gradeClass(
  overrides: Partial<SearchIndexGradeClass> & { key: string; materialSlug: string },
): SearchIndexGradeClass {
  return {
    nameFa: overrides.key,
    nameEn: overrides.key,
    values: {},
    ...overrides,
  };
}

function emptyState(filters: SearchState['filters']): SearchState {
  return { filters, rawQueryText: '', unrecognizedTokens: [] };
}

const properties: SearchIndexProperty[] = [
  {
    key: 'tg',
    nameFa: 'دمای انتقال شیشه‌ای',
    nameEn: 'Glass Transition Temperature',
    symbol: 'Tg',
    unit: '°C',
    dataType: 'numeric',
    observedMin: -50,
    observedMax: 200,
    aliasTokens: ['tg'],
  },
  {
    key: 'tensile_strength',
    nameFa: 'استحکام کششی',
    nameEn: 'Tensile Strength',
    symbol: null,
    unit: 'MPa',
    dataType: 'numeric',
    observedMin: 0,
    observedMax: 100,
    aliasTokens: ['tensile_strength', 'tensile'],
  },
];

describe('search — zero active filters', () => {
  it('returns empty primary and empty nearMisses (documented [own call])', () => {
    const index: SearchMaterialsIndex = {
      materials: [material({ slug: 'a', values: { tg: { valueMin: 100, valueMax: 120, valueTypical: 110 } } })],
      gradeClasses: [],
    };
    const result = search(emptyState([]), index, properties);
    expect(result).toEqual({ primary: [], nearMisses: [], missingData: [] });
  });
});

describe('search — strict AND / band overlap', () => {
  it('matches a subject whose band overlaps the filter, inclusive on both ends', () => {
    const a = material({ slug: 'a', values: { tg: { valueMin: 100, valueMax: 120, valueTypical: 110 } } });
    const index: SearchMaterialsIndex = { materials: [a], gradeClasses: [] };

    // Touching exactly at the lower edge.
    expect(search(emptyState([{ propertyKey: 'tg', min: 120, max: 150 }]), index, properties).primary).toHaveLength(1);
    // Touching exactly at the upper edge.
    expect(search(emptyState([{ propertyKey: 'tg', min: 50, max: 100 }]), index, properties).primary).toHaveLength(1);
    // No overlap at all.
    expect(search(emptyState([{ propertyKey: 'tg', min: 121, max: 150 }]), index, properties).primary).toHaveLength(0);
  });

  it('never matches a subject with no value at all for a filtered property', () => {
    const noTg = material({ slug: 'no-tg', values: {} });
    const index: SearchMaterialsIndex = { materials: [noTg], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 200 }]), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(0);
    // Item 4 of the fix: the exclusion is still absolute (BR2/BR5 unchanged)
    // but is no longer a silent drop — it's now visible as missingData.
    expect(result.missingData).toHaveLength(1);
    expect(result.missingData[0].material.slug).toBe('no-tg');
    expect(result.missingData[0].missingProperties).toEqual(['tg']);
  });

  it('requires ALL active filters to pass (strict AND across properties)', () => {
    const a = material({
      slug: 'a',
      values: {
        tg: { valueMin: 100, valueMax: 120, valueTypical: 110 },
        tensile_strength: { valueMin: 10, valueMax: 20, valueTypical: 15 },
      },
    });
    const index: SearchMaterialsIndex = { materials: [a], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tg', min: 90, max: 130 },
      { propertyKey: 'tensile_strength', min: 40, max: 80 }, // does not overlap [10,20]
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.primary).toHaveLength(0);
  });

  it('sets matchedProperties to every active filter, deduplicated in first-occurrence order', () => {
    const a = material({
      slug: 'a',
      values: {
        tg: { valueMin: 100, valueMax: 120, valueTypical: 110 },
        tensile_strength: { valueMin: 40, valueMax: 60, valueTypical: 50 },
      },
    });
    const index: SearchMaterialsIndex = { materials: [a], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tensile_strength', min: 30, max: 70 },
      { propertyKey: 'tg', min: 90, max: 130 },
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.primary[0].matchedProperties).toEqual(['tensile_strength', 'tg']);
  });
});

describe('search — BR5: slider + text term on the same property intersect', () => {
  it('intersects two ActiveFilter entries sharing a propertyKey rather than one overriding the other', () => {
    const inRange = material({ slug: 'in-range', values: { tg: { valueMin: 60, valueMax: 70, valueTypical: 65 } } });
    const onlyInWiderRange = material({
      slug: 'only-wider',
      values: { tg: { valueMin: 10, valueMax: 40, valueTypical: 25 } },
    });
    const index: SearchMaterialsIndex = { materials: [inRange, onlyInWiderRange], gradeClasses: [] };

    // Slider says [0,200], text term "tg 50-150" narrows it to [50,150].
    const filters = [
      { propertyKey: 'tg', min: 0, max: 200 },
      { propertyKey: 'tg', min: 50, max: 150 },
    ];
    const result = search(emptyState(filters), index, properties);
    const slugs = result.primary.map((r) => r.material.slug);
    expect(slugs).toEqual(['in-range']);
    expect(slugs).not.toContain('only-wider');
  });

  it('treats a non-overlapping intersection as impossible to satisfy — no crash, no match', () => {
    const a = material({ slug: 'a', values: { tg: { valueMin: 5, valueMax: 8, valueTypical: 6 } } });
    const index: SearchMaterialsIndex = { materials: [a], gradeClasses: [] };
    // [0,10] intersected with [50,60] is empty (min=50 > max=10).
    const filters = [
      { propertyKey: 'tg', min: 0, max: 10 },
      { propertyKey: 'tg', min: 50, max: 60 },
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(0);
  });
});

describe('search — BR5a: near misses', () => {
  it('includes a miss at exactly the 0.2 fraction threshold', () => {
    // filter span = 100; a miss of 20 is exactly missFraction 0.2.
    const subject = material({ slug: 'exact', values: { tg: { valueMin: 120, valueMax: 130, valueTypical: 125 } } });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 100 }]), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].missFraction).toBeCloseTo(0.2);
    expect(result.nearMisses[0].missAbsolute).toBeCloseTo(20);
    expect(result.nearMisses[0].missedProperty).toBe('tg');
  });

  it('excludes a miss just past the 0.2 fraction threshold', () => {
    const subject = material({
      slug: 'just-past',
      values: { tg: { valueMin: 120.0001, valueMax: 130, valueTypical: 125 } },
    });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 100 }]), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(0);
  });

  it('never considers a subject failing 2+ filters, even narrowly, a near miss', () => {
    const subject = material({
      slug: 'double-miss',
      values: {
        tg: { valueMin: 105, valueMax: 105, valueTypical: 105 }, // filter [0,100], miss 5, span 100 -> 0.05
        tensile_strength: { valueMin: 82, valueMax: 82, valueTypical: 82 }, // filter [0,80], miss 2, span 80 -> 0.025
      },
    });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tg', min: 0, max: 100 },
      { propertyKey: 'tensile_strength', min: 0, max: 80 },
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(0);
  });

  it('guards the zero-span filter: only an exact point match passes, any miss disqualifies entirely', () => {
    const exact = material({ slug: 'exact', values: { tg: { valueMin: 45, valueMax: 55, valueTypical: 50 } } });
    const miss = material({ slug: 'miss', values: { tg: { valueMin: 60, valueMax: 70, valueTypical: 65 } } });
    const index: SearchMaterialsIndex = { materials: [exact, miss], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 50, max: 50 }]), index, properties);
    expect(result.primary.map((r) => r.material.slug)).toEqual(['exact']);
    expect(result.nearMisses).toHaveLength(0); // "miss" is disqualified, not a near miss
  });

  it('orders near misses by missFraction ascending (BR10), independent of index order', () => {
    const worst = material({
      slug: 'worst',
      values: { tg: { valueMin: 115, valueMax: 115, valueTypical: 115 } }, // miss 15/100 = 0.15
    });
    const best = material({
      slug: 'best',
      values: { tg: { valueMin: 105, valueMax: 105, valueTypical: 105 } }, // miss 5/100 = 0.05
    });
    const middle = material({
      slug: 'middle',
      values: { tg: { valueMin: 110, valueMax: 110, valueTypical: 110 } }, // miss 10/100 = 0.1
    });
    const index: SearchMaterialsIndex = { materials: [worst, best, middle], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 100 }]), index, properties);
    expect(result.nearMisses.map((r) => r.material.slug)).toEqual(['best', 'middle', 'worst']);
  });
});

describe('search — BR6: grade-class granularity', () => {
  it('reports the grade class, not the material, when the grade class carries its own matching value', () => {
    const ldpe = material({
      slug: 'ldpe',
      values: { tensile_strength: { valueMin: 30, valueMax: 50, valueTypical: 40 } },
    });
    const film = gradeClass({
      key: 'film',
      materialSlug: 'ldpe',
      values: { tensile_strength: { valueMin: 60, valueMax: 70, valueTypical: 65 } },
    });
    const index: SearchMaterialsIndex = { materials: [ldpe], gradeClasses: [film] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );

    // Grade class wins: it is the result, parent still carried for the lockup.
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].gradeClass?.key).toBe('film');
    expect(result.primary[0].material.slug).toBe('ldpe');
  });

  it('suppresses the parent material entirely once its grade class fully matches (BR6, never both)', () => {
    const ldpe = material({
      slug: 'ldpe',
      values: { tensile_strength: { valueMin: 30, valueMax: 50, valueTypical: 40 } }, // would also pass alone
    });
    const film = gradeClass({
      key: 'film',
      materialSlug: 'ldpe',
      values: { tensile_strength: { valueMin: 60, valueMax: 70, valueTypical: 65 } },
    });
    const index: SearchMaterialsIndex = { materials: [ldpe], gradeClasses: [film] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );

    // Exactly one result: the grade class. No bare-material duplicate.
    expect(result.primary).toHaveLength(1);
    const bareMaterialResults = result.primary.filter((r) => r.gradeClass === undefined);
    expect(bareMaterialResults).toHaveLength(0);
  });

  it('reports the material when only the material carries the value (no grade override)', () => {
    const hdpe = material({
      slug: 'hdpe',
      values: { tensile_strength: { valueMin: 45, valueMax: 55, valueTypical: 50 } },
    });
    const index: SearchMaterialsIndex = { materials: [hdpe], gradeClasses: [] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].gradeClass).toBeUndefined();
    expect(result.primary[0].material.slug).toBe('hdpe');
  });

  it('a grade class near-missing does not suppress its parent material strictly matching', () => {
    const hdpe = material({
      slug: 'hdpe',
      values: { tensile_strength: { valueMin: 45, valueMax: 55, valueTypical: 50 } }, // fully inside [40,80]
    });
    const injection = gradeClass({
      key: 'injection',
      materialSlug: 'hdpe',
      values: { tensile_strength: { valueMin: 82, valueMax: 85, valueTypical: 83 } }, // miss 2/40 = 0.05
    });
    const index: SearchMaterialsIndex = { materials: [hdpe], gradeClasses: [injection] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );

    // Material appears in primary (its own value strictly matches)...
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].material.slug).toBe('hdpe');
    expect(result.primary[0].gradeClass).toBeUndefined();

    // ...and the grade class appears, separately, as a near miss.
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].material.slug).toBe('hdpe');
    expect(result.nearMisses[0].gradeClass?.key).toBe('injection');
    expect(result.nearMisses[0].missFraction).toBeCloseTo(0.05);
  });

  it('a grade class with no value for the filtered property never matches (same rule as materials)', () => {
    const ldpe = material({
      slug: 'ldpe',
      values: { tensile_strength: { valueMin: 45, valueMax: 55, valueTypical: 50 } },
    });
    const rotomolding = gradeClass({ key: 'rotomolding', materialSlug: 'ldpe', values: {} });
    const index: SearchMaterialsIndex = { materials: [ldpe], gradeClasses: [rotomolding] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );
    // Material wins by default since its grade class doesn't carry a value.
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].gradeClass).toBeUndefined();
  });
});

describe('search — BR10: natural order for primary results', () => {
  it('preserves index.materials order for primary results (no ranking)', () => {
    const c = material({ slug: 'c', values: { tg: { valueMin: 100, valueMax: 100, valueTypical: 100 } } });
    const a = material({ slug: 'a', values: { tg: { valueMin: 100, valueMax: 100, valueTypical: 100 } } });
    const b = material({ slug: 'b', values: { tg: { valueMin: 100, valueMax: 100, valueTypical: 100 } } });
    const index: SearchMaterialsIndex = { materials: [c, a, b], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 90, max: 110 }]), index, properties);
    expect(result.primary.map((r) => r.material.slug)).toEqual(['c', 'a', 'b']);
  });
});

describe('search — BR5a: primary and nearMisses stay strictly separate', () => {
  it('no subject appears in both sets across a mixed scenario', () => {
    const passer = material({ slug: 'passer', values: { tg: { valueMin: 50, valueMax: 60, valueTypical: 55 } } });
    const nearMisser = material({
      slug: 'near-misser',
      values: { tg: { valueMin: 105, valueMax: 105, valueTypical: 105 } },
    });
    const excluded = material({
      slug: 'excluded',
      values: { tg: { valueMin: 500, valueMax: 600, valueTypical: 550 } },
    });
    const index: SearchMaterialsIndex = { materials: [passer, nearMisser, excluded], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 100 }]), index, properties);

    const primarySlugs = new Set(result.primary.map((r) => r.material.slug));
    const nearMissSlugs = new Set(result.nearMisses.map((r) => r.material.slug));
    const intersection = [...primarySlugs].filter((slug) => nearMissSlugs.has(slug));

    expect(primarySlugs).toEqual(new Set(['passer']));
    expect(nearMissSlugs).toEqual(new Set(['near-misser']));
    expect(intersection).toEqual([]);
  });
});

describe('search — missing-data honesty (item 4 of the filter-persistence fix)', () => {
  it('records the specific missing property, not just that something failed', () => {
    const subject = material({
      slug: 'partial',
      values: { tg: { valueMin: 50, valueMax: 60, valueTypical: 55 } }, // has tg, not tensile_strength
    });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tg', min: 0, max: 100 }, // passes
      { propertyKey: 'tensile_strength', min: 0, max: 80 }, // no value at all
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.primary).toHaveLength(0);
    expect(result.missingData).toHaveLength(1);
    expect(result.missingData[0].missingProperties).toEqual(['tensile_strength']);
  });

  it('does NOT count an impossible (self-contradictory) filter intersection as missing data', () => {
    // Same [own call] as the "treats a non-overlapping intersection..." test
    // above — an empty min>max intersection is a bad FILTER, not a fact
    // about the subject's data, so it must never surface as "no recorded
    // value" (that would blame the material for the reader's/parser's
    // contradictory input).
    const subject = material({ slug: 'has-tg', values: { tg: { valueMin: 5, valueMax: 8, valueTypical: 6 } } });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tg', min: 0, max: 10 },
      { propertyKey: 'tg', min: 50, max: 60 }, // intersects to empty with the filter above
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.missingData).toHaveLength(0);
  });

  it('a subject failing on missing data for one property AND out-of-range on another still reports only the missing one', () => {
    const subject = material({
      slug: 'mixed',
      values: { tg: { valueMin: 500, valueMax: 600, valueTypical: 550 } }, // out of range, not missing
    });
    const index: SearchMaterialsIndex = { materials: [subject], gradeClasses: [] };
    const filters = [
      { propertyKey: 'tg', min: 0, max: 100 }, // out of range
      { propertyKey: 'tensile_strength', min: 0, max: 80 }, // no value at all
    ];
    const result = search(emptyState(filters), index, properties);
    expect(result.missingData).toHaveLength(1);
    expect(result.missingData[0].missingProperties).toEqual(['tensile_strength']);
  });

  it('a passing subject never also appears in missingData, even when a sibling grade class is missing data', () => {
    const ldpe = material({
      slug: 'ldpe',
      values: { tensile_strength: { valueMin: 45, valueMax: 55, valueTypical: 50 } },
    });
    const rotomolding = gradeClass({ key: 'rotomolding', materialSlug: 'ldpe', values: {} });
    const index: SearchMaterialsIndex = { materials: [ldpe], gradeClasses: [rotomolding] };
    const result = search(
      emptyState([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]),
      index,
      properties,
    );
    // Material wins by default (existing BR6 behaviour, unchanged)...
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].gradeClass).toBeUndefined();
    // ...and the grade class that had nothing to offer is now visible,
    // rather than a name that quietly stopped appearing.
    expect(result.missingData).toHaveLength(1);
    expect(result.missingData[0].gradeClass?.key).toBe('rotomolding');
    expect(result.missingData[0].missingProperties).toEqual(['tensile_strength']);
  });

  it('is empty whenever every active filter has full data coverage across all subjects', () => {
    const a = material({ slug: 'a', values: { tg: { valueMin: 50, valueMax: 60, valueTypical: 55 } } });
    const b = material({ slug: 'b', values: { tg: { valueMin: 500, valueMax: 600, valueTypical: 550 } } });
    const index: SearchMaterialsIndex = { materials: [a, b], gradeClasses: [] };
    const result = search(emptyState([{ propertyKey: 'tg', min: 0, max: 100 }]), index, properties);
    expect(result.missingData).toHaveLength(0);
  });
});

// These reproduce the owner's exact reported sequence end-to-end through
// `search()` itself. The slider-state half of the fix (deleting a
// full-range entry rather than writing one) lives in slider-filters.ts and
// is unit-tested there; these confirm the OTHER half of the contract —
// that once a filter is genuinely gone from `SearchState.filters` (whether
// via a slider restored to full range, an explicit clear, or "clear all"),
// `search()` treats that exactly like the filter never existed.
describe('search — regression: the reported "filter comes back, material does not" sequence', () => {
  it('a material excluded by a narrowed filter reappears once that filter is removed from state entirely', () => {
    const lldpe = material({
      slug: 'lldpe',
      values: {
        density: { valueMin: 0.915, valueMax: 0.94, valueTypical: null },
        // A second property so there's something to re-filter on after
        // `density` is removed, proving the material is reachable again —
        // rather than just hitting match.ts's "zero filters -> nothing
        // shown yet" [own call], which would be true regardless of the fix.
        tg: { valueMin: -110, valueMax: -105, valueTypical: -108 },
      },
    });
    const index: SearchMaterialsIndex = { materials: [lldpe], gradeClasses: [] };

    // Narrow: min pushed past lldpe's density max (0.94) -> excluded.
    const narrowed = search(emptyState([{ propertyKey: 'density', min: 0.941, max: 0.975 }]), index, properties);
    expect(narrowed.primary).toHaveLength(0);

    // "Restored to full range" is modelled here the way SearchIsland now
    // actually produces it after the fix: the `density` filter is ABSENT
    // from `state.filters` entirely, not present-but-full-width (that
    // presence, regardless of width, was the bug — see slider-filters.ts).
    const restored = search(emptyState([{ propertyKey: 'tg', min: -200, max: 200 }]), index, properties);
    expect(restored.primary.map((r) => r.material.slug)).toEqual(['lldpe']);
  });

  it('many filters touched and then all removed returns the exact same result set as the initial unfiltered baseline', () => {
    const a = material({
      slug: 'a',
      values: {
        tg: { valueMin: 50, valueMax: 60, valueTypical: 55 },
        tensile_strength: { valueMin: 10, valueMax: 20, valueTypical: 15 },
      },
    });
    const b = material({
      slug: 'b',
      values: { tg: { valueMin: 70, valueMax: 80, valueTypical: 75 } }, // no tensile_strength at all
    });
    const index: SearchMaterialsIndex = { materials: [a, b], gradeClasses: [] };

    // Touch and narrow both sliders — b (missing tensile_strength) drops out
    // entirely, a survives only inside the narrowed band.
    const narrowed = search(
      emptyState([
        { propertyKey: 'tg', min: 50, max: 60 },
        { propertyKey: 'tensile_strength', min: 10, max: 20 },
      ]),
      index,
      properties,
    );
    expect(narrowed.primary.map((r) => r.material.slug)).toEqual(['a']);
    expect(narrowed.missingData.map((r) => r.material.slug)).toEqual(['b']);

    // Both filters removed from state (every slider dragged back to full
    // range, or cleared) — one probe filter re-applied at true full range to
    // get past the "zero filters" cold-load special case and prove both a
    // and b are reachable again, matching a no-filters baseline.
    const restored = search(
      emptyState([{ propertyKey: 'tg', min: -1000, max: 1000 }]),
      index,
      properties,
    );
    expect(restored.primary.map((r) => r.material.slug).sort()).toEqual(['a', 'b']);
    expect(restored.missingData).toHaveLength(0);
  });
});
