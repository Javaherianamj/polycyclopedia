# Wordmark Animation — specification

**Unit**: FE-0 `visual-identity`
**Decision**: D54 (recorded in `../../inception/plans/frontend-plan.md`)
**Created**: 2026-08-04
**Status**: specified, not built

---

## 1. The idea

The product is **Polypedia**. The domain is **polycyclopedia.ir**, because
`polypedia.ir` was not the name that could be had. The wordmark turns that gap
into the brand's signature gesture rather than living with it as a compromise:

```
   compressed (rest)          expanded

   poly|pedia        ⟷        poly cyclo pedia
   the product name           the address
```

`poly` and `pedia` crack apart at the seam, `cyclo` appears between them in a
different colour, and then the two halves drive back in and squeeze `cyclo` out
until the word reads `polypedia` again.

**Why this is worth building rather than merely acceptable**: the entire thesis
of this project is compression — a scattered handbook literature reduced to
citable atoms. A wordmark whose one gesture _is_ compression states the thesis
before a single sentence is read. It also happens to be a polymer gesture: a
chain extending under load and recoiling when released is the most basic
mechanical behaviour in the subject the site is about. The animation is a
relaxing polymer chain, and that reading should be preserved in the easing (§4).

---

## 2. Structure

Three groups in one SVG, never three separate elements in a layout:

| Group       | Content | Rest state                                     | Expanded state                         |
| ----------- | ------- | ---------------------------------------------- | -------------------------------------- |
| `#wm-poly`  | `poly`  | at origin                                      | translated outward, away from the seam |
| `#wm-cyclo` | `cyclo` | `scaleX(0)`, zero advance width, `aria-hidden` | full width, accent colour              |
| `#wm-pedia` | `pedia` | flush against `poly`                           | translated outward, away from the seam |

The seam is the boundary between `poly` and `pedia` in the rest state. Everything
moves relative to it, symmetrically.

**SVG, not HTML text**, for three reasons: the letterforms must not reflow, the
seam must be sub-pixel stable across the animation, and the compressed and
expanded states must have identical baselines regardless of the font stack that
loads. It also means the wordmark works before webfonts arrive, which matters on
a Persian site loading Estedad (D17).

---

## 3. The two states, and what happens between them

### Expansion — "cracks"

The owner's word was _cracked_, and that word should be taken literally. A smooth
slide would read as a menu opening. A crack reads as material failing.

1. **Fracture** (0 → 15%). A hairline appears at the seam — a 1px jagged path, not a straight line — while nothing has moved yet. Tension before release.
2. **Separation** (15% → 55%). `poly` and `pedia` translate outward, symmetrically. Fast out of the gate, decelerating — the profile of something breaking, not something sliding.
3. **Reveal** (40% → 70%, overlapping separation). `cyclo` scales from `scaleX(0)` to `1` and lifts to the accent colour. It is revealed by the gap opening, so it must never appear before there is room for it.
4. **Settle** (70% → 100%). Overshoot of roughly 2% of the travel, then rest.

### Compression — the important half

`cyclo` must **not** fade out. Fading says "an element was removed". This is the
half of the animation that carries the meaning, and it has to say "material was
compacted":

1. **Drive** (0 → 60%). `poly` and `pedia` translate back toward the seam, accelerating — being pushed, not falling.
2. **Squeeze** (0 → 60%, locked to the drive). `cyclo` scales down on X _in step with the closing gap_, so its letters compress rather than shrink uniformly. `scaleY` stays at 1 throughout. Opacity stays at 1 until the last 10%, and even then it is a consequence of `scaleX` approaching zero, not an independent fade.
3. **Impact** (60% → 85%). The halves meet. A single tight compression of the whole lockup on X — 1–2%, no more — as if the word absorbed the collision.
4. **Recover** (85% → 100%). Back to rest.

If only one thing survives review, it is that `cyclo` is squeezed out, never faded
out. That is the difference between the wordmark meaning something and the
wordmark being an effect.

---

## 4. Motion values

| Property             | Value                           | Reason                                                                 |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Expansion duration   | 520 ms                          | Long enough to read the fracture; short enough not to be a performance |
| Dwell, expanded      | 1800 ms                         | The address must be legible as a word, not a flash                     |
| Compression duration | 380 ms                          | Faster than expansion. Release is always quicker than failure          |
| Dwell, compressed    | 4200 ms                         | The product name is the rest state and should dominate the cycle       |
| Full cycle           | ~6.9 s                          |                                                                        |
| Expansion easing     | `cubic-bezier(0.16, 1, 0.3, 1)` | Sharp departure, long settle — fracture                                |
| Compression easing   | `cubic-bezier(0.7, 0, 0.84, 0)` | Accelerating into the seam — drive                                     |

The compressed dwell being more than twice the expanded dwell is deliberate: the
brand is Polypedia, and the wordmark should read as Polypedia at any random
moment a screenshot is taken.

**These values must be reconciled with the FE-0 motion spec** produced by the
close-out work in `closeout-spec.md`. Where the two disagree, the motion spec
wins and this table is amended — a wordmark is not a reason to hold a second
easing vocabulary.

---

## 5. Where it animates, and how often

The owner asked for a constant loop. There is a real constraint against that in
the site header specifically, and it is worth stating plainly rather than
quietly complying or quietly ignoring:

**WCAG 2.2.2 (Pause, Stop, Hide)** applies to motion that starts automatically,
lasts more than five seconds, and sits alongside other content. A loop in
persistent chrome is exactly that, and this is an encyclopedia — people read long
technical pages on it, with the header in peripheral vision the whole time.

The resolution below keeps the constant loop where it earns its place and
protects the reading surfaces:

| Placement                           | Behaviour                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Homepage hero**                   | Loops continuously, as asked. Large. Paired with a pause control (§6) so the loop is compliant rather than merely present |
| **Persistent site header**          | Plays once on the first page load of a session, then rests compressed. Replays on hover and on keyboard focus             |
| **Datasheet and Learn pages**       | Static, compressed. No automatic motion on a reading surface                                                              |
| **404, holding page, share images** | Static, expanded — the one place the address itself is the message                                                        |

The idea is not diluted by this. It fires where a visitor meets the brand, and
rests where a reader is working.

---

## 6. Non-negotiables

| #   | Requirement                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `@media (prefers-reduced-motion: reduce)` renders the static compressed wordmark. No fracture, no translation, no scale. Not a slower version — none                           |
| 2   | The pause control on the hero is a real, focusable, labelled button, not a hover target                                                                                        |
| 3   | The accessible name is `Polypedia` in both states. `cyclo` is `aria-hidden`; the animation must never change what a screen reader announces                                    |
| 4   | CSS and SVG only. No GSAP, no Three.js, no animation library — R24 keeps heavy libraries out of every Datasheet-route bundle, and the wordmark is in the header of every route |
| 5   | `transform` and `opacity` only. No animation of `width`, `x`, `letter-spacing`, or any layout-triggering property                                                              |
| 6   | No `transition: all`, per R35                                                                                                                                                  |
| 7   | Total added weight under 4 KB, inline. The wordmark may not cost a network request                                                                                             |
| 8   | The layout must not shift between states. Reserve the compressed width; expansion overflows a non-clipping bounding box, it does not push siblings                             |

---

## 7. Open items for FE-0

1. **The accent colour for `cyclo`.** D36 and R33/R34 establish five hues with five
   jobs. If `cyclo` borrows one, readers learn a false association between a brand
   flourish and a semantic meaning. It needs either a sixth brand-only hue or a
   deliberate neutral at a different weight. **This is a real decision and it is
   not made here.**

2. **The Persian wordmark.** The site is Persian-first (R15, RTL-first per R6),
   and the gesture translates structurally intact:

   ```
   پلی|پدیا   ⟷   پلی سیکلو پدیا
   ```

   Direction reverses — expansion pushes outward along the RTL axis. Whether the
   Persian and Latin wordmarks both animate, or Persian is the static lockup with
   Latin carrying the gesture, is undecided.

3. **The Latin typeface.** D17 settled Estedad for Persian. The Latin wordmark
   face is not chosen, and a wordmark with a fracture seam has a real requirement
   of it: the `y` of `poly` and the `p` of `pedia` must sit adjacent without
   colliding, and must not be so tightly kerned that separation looks like a bug.

4. **Whether the fracture line is literal.** §3 specifies a hairline jagged path.
   The alternative is that the crack is implied purely by the motion profile, with
   no drawn artefact. Cheaper, subtler, and possibly better. Needs to be seen both
   ways before it is decided — R20.

---

## 8. Honest status

Nothing here is built. The timings in §4 are chosen from reasoning about what the
gesture should feel like, not measured against a prototype, and animation timing
is exactly the kind of thing that is wrong until it is seen moving. Expect §4 to
change once it exists. The structure in §2, the squeeze-not-fade rule in §3, and
the non-negotiables in §6 are the parts intended to survive that.
