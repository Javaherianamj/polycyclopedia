// The pure seam between "which material is figure 2 currently showing"
// and "what does the live catalog have on record for it" —
// `NotebookFigureIsland.tsx` is deliberately thin (same split every other
// Learn island in this codebase uses) and reads this instead of reaching
// into `LearnMaterial` fields inline, so the mapping is independently
// testable and has one name.
//
// Mirrors `causal-graph.ts`'s `measuredPointFor`, but is its own small
// function rather than a call into that one: `measuredPointFor` switches
// over `DerivedKey` (GRAPH's five-node vocabulary); this figure only ever
// needs two FIXED fields. A `DerivedKey`-shaped switch would be a
// dependency on GRAPH's vocabulary for no shared behaviour.
import type { LearnMaterial, LearnNumericPoint } from '../learn/fetch-learn-materials';

export interface NotebookFigureState {
  density: LearnNumericPoint | null;
  crystallinity: LearnNumericPoint | null;
}

export function notebookFigureState(material: LearnMaterial | null): NotebookFigureState {
  if (!material) return { density: null, crystallinity: null };
  return { density: material.density, crystallinity: material.crystallinity };
}
