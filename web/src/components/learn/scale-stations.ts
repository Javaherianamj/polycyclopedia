// FE-8 restructure — the station model for the Learn surface.
//
// WHY THIS FILE EXISTS AT ALL: D50 says "scale is the Learn surface's
// organising structure", and the FE-0 spec (aidlc-docs/construction/fe-0/
// lab-concepts-spec.md, L1) is explicit that the page must TEACH before a
// word is read. The teaching happens through the *spacing*: the rail's tick
// positions are proportional to log-distance, so the reader can see that
// chain → lamella is one decade while spherulite → part is three. That
// asymmetry is a fact about polymer science, and it is only expressible if
// the exponents live in data rather than being hand-placed in markup. Hence
// a model file instead of six hardcoded sections.
//
// The exponents and the Persian/English station names come straight from the
// spec's own "Stations (LDPE)" table. They are lengths-of-objects — textbook
// geometry (a C–C bond is ~0.154 nm, a lamella a few tens of nm), not a
// measured property of any grade in this database — so nothing here carries
// a provenance mark, and nothing here is presented as a datasheet value (R5).

import type { MessageKey } from '../../i18n/t';

/** Which object icon the station draws. Kept as a union rather than a free
 * string so a typo is a build error, same posture as MessageKey. */
export type StationIconKind = 'bond' | 'chain' | 'lamella' | 'spherulite' | 'specimen' | 'cycle';

export interface Station {
  /** Stable slug: becomes the section id, so datasheet deep links and the
   * rail's jump targets share one vocabulary. */
  key: string;
  /** Decimal exponent of the object's size in metres. Drives the rail
   * position, the ghost numeral and the readout — see railFraction. */
  exp: number;
  icon: StationIconKind;
  nameKey: MessageKey;
  sentenceKey: MessageKey;
  /** Set ONLY on stations where the FE-0 spec named a tool that this
   * codebase has not built. R7/constraint 6 of the spec: a missing tool is
   * shown as missing, with its real reason, rather than quietly omitted so
   * the page looks complete. */
  gapKey?: MessageKey;
}

export const SCALE_STATIONS: readonly Station[] = [
  {
    // TacticitySimulator lives here rather than at the chain scale on
    // purpose: tacticity is the configuration of a substituent on ONE
    // stereocentre of ONE repeat unit. It is a monomer-scale fact whose
    // consequences (crystallinity, Tm, clarity) only show up three stations
    // later — which is exactly the lesson the zoom is meant to deliver.
    key: 'monomer',
    exp: -10,
    icon: 'bond',
    nameKey: 'learn.scale.station.monomer.name',
    sentenceKey: 'learn.scale.station.monomer.sentence',
  },
  {
    // The spec puts DP and Hansen solubility here, and both are genuinely
    // single-chain questions: how long is the chain, and what dissolves it.
    key: 'chain',
    exp: -9,
    icon: 'chain',
    nameKey: 'learn.scale.station.chain.name',
    sentenceKey: 'learn.scale.station.chain.sentence',
  },
  {
    key: 'lamella',
    exp: -8,
    icon: 'lamella',
    nameKey: 'learn.scale.station.lamella.name',
    sentenceKey: 'learn.scale.station.lamella.sentence',
  },
  {
    // FE-8 foundation layer: the spec's "crystallinity ↔ density readout"
    // is built (CrystallinityDensityIsland, wired in LearnScale.astro) —
    // no `gapKey` here anymore. It is a READOUT, not a simulator: there is
    // no slider to manipulate crystallinity or density, only the live
    // catalog's own real values for the (currently three) materials that
    // have both on record, table-shaped rather than card-shaped because a
    // table is what a "readout" of paired, comparable numbers actually is.
    key: 'spherulite',
    exp: -6,
    icon: 'spherulite',
    nameKey: 'learn.scale.station.spherulite.name',
    sentenceKey: 'learn.scale.station.spherulite.sentence',
  },
  {
    // StateSimulator is a bulk-specimen question — "what state is this
    // material in at this temperature" is answered about a part, not about
    // a molecule — so it belongs here and not at the chain scale, even
    // though the mechanism it teaches is molecular.
    key: 'specimen',
    exp: -3,
    icon: 'specimen',
    nameKey: 'learn.scale.station.specimen.name',
    sentenceKey: 'learn.scale.station.specimen.sentence',
  },
  {
    key: 'lifecycle',
    exp: 0,
    icon: 'cycle',
    nameKey: 'learn.scale.station.lifecycle.name',
    sentenceKey: 'learn.scale.station.lifecycle.sentence',
    gapKey: 'learn.scale.station.lifecycle.gap',
  },
];

const EXP_MIN = -10;
const EXP_MAX = 0;

/** Fraction (0–1) down the rail at which a station's tick sits. Linear in
 * the EXPONENT, which is what makes the rail a log ruler: the drawn distance
 * between two ticks is the number of decades between the objects. */
export function railFraction(exp: number): number {
  return (exp - EXP_MIN) / (EXP_MAX - EXP_MIN);
}
