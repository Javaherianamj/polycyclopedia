// Pure typographic-emphasis ramp — CR1/CR2/CR3. No DOM, no fetch, no
// globals. This module owns ONLY the magnitude half of the owner's central
// idea (typography = magnitude, always on; colour = better/worse, only with
// an application selected, CR4/CR5 — that half lives elsewhere and is never
// touched here). `emphasis` must never be mapped to a hue by anything in
// this file, and the tests below assert that shape (a bare 0..1 magnitude
// number, no polarity/goodness field anywhere in the return type).

import type { CellEmphasis, CompareRow } from './types';

/**
 * Rows whose largest value is at least this many times their smallest switch
 * to a logarithmic ramp. One order of magnitude is the point at which linear
 * position starts collapsing the small end of a row into an indistinguishable
 * clump (measured on real MFI data — see `computeEmphasis`).
 */
export const LOG_SCALE_MIN_RATIO = 10;

/**
 * CR1/CR3 — one `CellEmphasis` per cell in the row, `emphasis` 0 (smallest
 * representative value in the row) to 1 (largest). The UI is responsible for
 * mapping that 0..1 number onto the bounded `EMPHASIS_MIN_SCALE`..
 * `EMPHASIS_MAX_SCALE` font-size range (CR3) and bolding `isLargest` cells;
 * this function only produces the position.
 *
 * [own call, revised] Linear position by default; LOGARITHMIC when the row
 * spans orders of magnitude and every value is strictly positive.
 *
 * The first pass here chose linear everywhere, reasoning that CR3's bounded
 * 1.0x–1.35x output prevents any degenerate *visual* result whatever scale
 * feeds it. Measuring a real row disproved that: on MFI across HDPE grade
 * classes (0.25 to 37.5 g/10min), 5 of 8 cells landed inside a 1.00–1.09em
 * band — visually identical type for values up to ~30x apart. The ramp was
 * not merely less expressive than log, it was carrying no information at
 * all across most of the row, which fails CR1's purpose ("show their size
 * difference with font size and bold") even though it satisfied CR3's
 * letter.
 *
 * So the scale is now chosen per row:
 *   - every value > 0 AND max/min >= LOG_SCALE_MIN_RATIO  ->  log10 position
 *   - otherwise                                           ->  linear position
 *
 * The guards are not incidental. `min > 0` is required because log is
 * undefined at and below zero, and real data crosses it: `brittleness_temp`
 * runs -140 to -76 degC. The ratio threshold keeps ordinary rows — where
 * linear is the more faithful reading of "proportionally" — on exactly the
 * behaviour they had before, so this change only ever affects rows that
 * were previously degenerate.
 *
 * `isLargest` is unaffected by the choice of scale: the largest value is
 * the largest value either way.
 */
export function computeEmphasis(row: CompareRow): CellEmphasis[] {
  const { cells } = row;

  if (cells.length === 0) {
    return [];
  }

  if (cells.length === 1) {
    // [own call] A single value is trivially the row's own maximum — there
    // is nothing to scale down relative to, so it renders at full emphasis
    // rather than an arbitrary/ambiguous 0.
    return [{ subjectRef: cells[0].subjectRef, emphasis: 1, isLargest: true }];
  }

  const reps = cells.map((c) => c.representative);
  const min = Math.min(...reps);
  const max = Math.max(...reps);

  if (min === max) {
    // [own call] Every subject ties (zero-span row, CR7's zero-span
    // definition). Rather than bolding every cell (emphasis 1, which would
    // visually shout "all maximal" for a row with no real distinguishing
    // magnitude) or shrinking every cell to nothing, every cell gets
    // emphasis 0 and `isLargest: false`: CR1's bold treatment marks THE
    // largest value, and with a genuine tie there is no single largest to
    // mark. The row renders at uniform base size — "nothing stands out
    // here" is the truthful typographic statement for a tied row.
    return cells.map((c) => ({ subjectRef: c.subjectRef, emphasis: 0, isLargest: false }));
  }

  // See the doc comment: log only where it is both defined and needed.
  const useLog = min > 0 && max / min >= LOG_SCALE_MIN_RATIO;

  if (useLog) {
    const logMin = Math.log10(min);
    const logSpan = Math.log10(max) - logMin;
    return cells.map((c) => ({
      subjectRef: c.subjectRef,
      emphasis: (Math.log10(c.representative) - logMin) / logSpan,
      isLargest: c.representative === max,
    }));
  }

  const span = max - min;
  return cells.map((c) => {
    const emphasis = (c.representative - min) / span;
    return { subjectRef: c.subjectRef, emphasis, isLargest: c.representative === max };
  });
}
