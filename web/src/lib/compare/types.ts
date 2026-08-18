// FE-6 compare — the shared type contract.
//
// Written before the implementation agents start, so the API shape, the pure
// difference/ordering logic, and the table UI are all held to one definition
// by the compiler. Mirrors
// `aidlc-docs/construction/fe-6/functional-design/business-rules.md`;
// keep the two in step.
//
// The central idea, per the owner: TYPOGRAPHY encodes magnitude and is always
// on (a bigger number is a fact); COLOUR encodes better/worse and appears only
// once an application is selected (better is a judgement that needs a context).

import type { PropertyKey, ValueBand } from '../search/types';

export type { PropertyKey, ValueBand };

/** Materials and grade classes are both comparable subjects (CR14). */
export type CompareSubjectKind = 'material' | 'grade_class';

export interface CompareSubject {
  kind: CompareSubjectKind;
  /** Stable id used in URLs: "ldpe" or "ldpe/film". */
  ref: string;
  materialSlug: string;
  /** Present only when kind === 'grade_class'. */
  gradeClassKey?: string;
  nameFa: string;
  nameEn: string;
  familyKey: string;
}

/**
 * Test conditions that make two measurements of the "same" property
 * incomparable — e.g. {basis: 'yield'} vs {basis: 'break'}, {load_kg: 2.16}
 * vs {load_kg: 21.6}. Real in the seeded data today. CR11 gives each its own
 * row rather than silently merging them.
 */
export type Conditions = Record<string, string | number>;

/** Stable key for a (property, conditions) pair — the true row identity. */
export type CompareRowKey = string;

export interface CompareCell {
  subjectRef: string;
  band: ValueBand;
  /** value_typical ?? midpoint(min,max) — used for ordering and typography. */
  representative: number;
  /** CR18 — whether this particular value carries a citation. */
  isCited: boolean;
}

// ------------------------------------------------------------------ polarity

/**
 * CR5. `not_relevant` is a real editorial answer meaning "this property does
 * not bear on this application" — distinct from "nobody has decided yet",
 * which is simply an absent row.
 */
export type Polarity = 'higher_is_better' | 'lower_is_better' | 'not_relevant';

export interface Application {
  key: string;
  nameFa: string;
  nameEn: string;
}

export interface PolarityRule {
  applicationKey: string;
  propertyKey: PropertyKey;
  polarity: Polarity;
  /** CR6 — editorial reasoning, never a citation. Rendered on demand. */
  rationaleFa: string | null;
  rationaleEn: string | null;
}

// ---------------------------------------------------------------- table model

/** CR9 — a percentage is only printed when it is physically meaningful. */
export type DeltaKind = 'relative_percent' | 'absolute';

export interface CompareRow {
  rowKey: CompareRowKey;
  propertyKey: PropertyKey;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  unit: string | null;
  /** CR11 — rendered in the row label, always. Empty object = unconditioned. */
  conditions: Conditions;
  /** CR7 — group chip, so structure survives difference-ordering. */
  groupKey: string;
  groupNameFa: string;
  groupNameEn: string;

  cells: CompareCell[];

  /** CR8 — range-normalised spread, 0..1. The ordering key. */
  differenceScore: number;
  /** CR9 — what to show the reader, and in which form. */
  deltaKind: DeltaKind;
  deltaValue: number;
  /** CR10 — bands overlap, so there is no meaningful winner. */
  isOverlapping: boolean;
  /** CR18 — some cells cited, some not; the comparison is uneven. */
  hasCitationAsymmetry: boolean;
}

export type CompareSortMode = 'difference' | 'grouped';

export interface CompareState {
  subjectRefs: string[];
  /** CR4 — undefined means no polarity colour anywhere. */
  applicationKey?: string;
  sortMode: CompareSortMode;
  hideIdenticalRows: boolean;
}

export interface CompareTable {
  subjects: CompareSubject[];
  rows: CompareRow[];
}

// ------------------------------------------------------- presentation ramps

/**
 * CR1/CR3 — the typographic ramp. `emphasis` is the cell's position within its
 * own row's value span, 0 (smallest in row) to 1 (largest). The UI maps it
 * onto a BOUNDED font-size range and bolds only the 1.0 cell; it must never
 * be mapped to a hue.
 */
export interface CellEmphasis {
  subjectRef: string;
  emphasis: number;
  isLargest: boolean;
}

/** CR3 — the bounds the UI must respect, in multiples of the body base size. */
export const EMPHASIS_MIN_SCALE = 1.0;
export const EMPHASIS_MAX_SCALE = 1.35;

/**
 * CR9 — below this magnitude, or across a sign change, a relative percentage
 * is not printed and the absolute delta is used instead.
 */
export const RELATIVE_PERCENT_MIN_ABS = 1e-9;
