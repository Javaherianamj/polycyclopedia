import { describe, expect, it } from 'vitest';
import { applySliderChange, clearSliderFilter } from './slider-filters';

const density = { observedMin: 0.915, observedMax: 0.975 };

describe('applySliderChange', () => {
  it('creates a filter entry when the new range narrows the full observed extent', () => {
    const next = applySliderChange({}, 'density', { min: 0.94, max: 0.975 }, density);
    expect(next).toEqual({ density: { propertyKey: 'density', min: 0.94, max: 0.975 } });
  });

  it('never mutates the map it was given', () => {
    const prev = {};
    applySliderChange(prev, 'density', { min: 0.94, max: 0.975 }, density);
    expect(prev).toEqual({});
  });

  it('updates an existing narrowed entry on a further drag', () => {
    const prev = { density: { propertyKey: 'density', min: 0.94, max: 0.975 } };
    const next = applySliderChange(prev, 'density', { min: 0.95, max: 0.96 }, density);
    expect(next.density).toEqual({ propertyKey: 'density', min: 0.95, max: 0.96 });
  });

  // The exact reported bug: dragging back to the full observed range must
  // delete the entry, not write a full-width one that still hard-excludes
  // every subject lacking a recorded value for the property.
  it('deletes the entry when dragged back to exactly the full observed range', () => {
    const prev = { density: { propertyKey: 'density', min: 0.94, max: 0.975 } };
    const next = applySliderChange(prev, 'density', { min: 0.915, max: 0.975 }, density);
    expect(next).toEqual({});
    expect('density' in next).toBe(false);
  });

  it('deletes the entry when the range is wider than the observed bounds on both sides', () => {
    const prev = { density: { propertyKey: 'density', min: 0.94, max: 0.975 } };
    const next = applySliderChange(prev, 'density', { min: 0.9, max: 1.0 }, density);
    expect(next).toEqual({});
  });

  it('keeps a filter entry when only one side reaches the bound', () => {
    // min at the observed floor, max still short of the observed ceiling —
    // still a real constraint (excludes anything above 0.96).
    const next = applySliderChange({}, 'density', { min: 0.915, max: 0.96 }, density);
    expect(next).toEqual({ density: { propertyKey: 'density', min: 0.915, max: 0.96 } });
  });

  it('leaves other properties untouched', () => {
    const prev = { tg: { propertyKey: 'tg', min: -120, max: -115 } };
    const next = applySliderChange(prev, 'density', { min: 0.94, max: 0.975 }, density);
    expect(next.tg).toEqual({ propertyKey: 'tg', min: -120, max: -115 });
    expect(next.density).toEqual({ propertyKey: 'density', min: 0.94, max: 0.975 });
  });

  it('touching a slider and never narrowing it (drag starts and ends at full range) never creates an entry', () => {
    // Simulates the "untouched" and "touched but stayed at full range" cases
    // being identical, per the module's whole point.
    const next = applySliderChange({}, 'density', { min: 0.915, max: 0.975 }, density);
    expect(next).toEqual({});
  });
});

describe('clearSliderFilter', () => {
  it('removes an active entry for the given property', () => {
    const prev = {
      density: { propertyKey: 'density', min: 0.94, max: 0.975 },
      tg: { propertyKey: 'tg', min: -120, max: -115 },
    };
    const next = clearSliderFilter(prev, 'density');
    expect(next).toEqual({ tg: { propertyKey: 'tg', min: -120, max: -115 } });
  });

  it('is a no-op (returns an equivalent, still-new object) when the property was never active', () => {
    const prev = { tg: { propertyKey: 'tg', min: -120, max: -115 } };
    const next = clearSliderFilter(prev, 'density');
    expect(next).toEqual(prev);
    expect(next).not.toBe(prev);
  });

  it('never mutates the map it was given', () => {
    const prev = { density: { propertyKey: 'density', min: 0.94, max: 0.975 } };
    clearSliderFilter(prev, 'density');
    expect(prev).toEqual({ density: { propertyKey: 'density', min: 0.94, max: 0.975 } });
  });
});

describe('applySliderChange + clearSliderFilter: many filters touched and restored', () => {
  it('reaches the exact empty map after every touched property is either dragged back to full range or cleared', () => {
    let state: Record<string, { propertyKey: string; min: number; max: number }> = {};

    // Narrow three different properties.
    state = applySliderChange(state, 'tg', { min: -30, max: 100 }, { observedMin: -50, observedMax: 200 });
    state = applySliderChange(state, 'tensile_strength', { min: 10, max: 30 }, { observedMin: 0, observedMax: 100 });
    state = applySliderChange(state, 'density', { min: 0.94, max: 0.96 }, density);
    expect(Object.keys(state).sort()).toEqual(['density', 'tensile_strength', 'tg']);

    // Restore two by dragging back to full range, clear the third explicitly.
    state = applySliderChange(state, 'tg', { min: -50, max: 200 }, { observedMin: -50, observedMax: 200 });
    state = applySliderChange(
      state,
      'tensile_strength',
      { min: 0, max: 100 },
      { observedMin: 0, observedMax: 100 },
    );
    state = clearSliderFilter(state, 'density');

    expect(state).toEqual({});
  });
});
