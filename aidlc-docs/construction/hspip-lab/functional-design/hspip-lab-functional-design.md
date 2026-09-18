# Functional Design — `hspip-lab` (consolidated)

**Date**: 2026-08-19 · **Unit**: `hspip-lab` · Technology-agnostic business logic.
Consolidates domain-entities / business-logic-model / business-rules / frontend-components
into one doc. No blocking questions — the approved requirements + answers determine the
logic; the few implementation choices are recorded as **Decisions (§8)** and the 3 most
notable are flagged for confirmation.

---

## 1. Domain Entities

```ts
type Hsp = { d: number; p: number; h: number };            // MPa^0.5
type Grade = 0 | 1 | 2;                                     // 0 dissolves · 1 partial · 2 no

type Solvent = {
  key: string; nameEn: string; systematicName?: string;
  cas?: string; hsp: Hsp; molarVolume?: number;
};

type Polymer = {
  key: string; name: string; hsp: Hsp; r0: number;
  family?: string; source: 'handbook' | 'custom';
};

type GradedSolvent = {
  solvent: Solvent;
  ra: number | null;          // Hansen distance to the ACTIVE polymer (null if none)
  red: number | null;         // ra / activeR0  (null if none / invalid r0)
  autoGrade: Grade | null;    // from red
  override: Grade | null;     // user-set, or null = "auto"
  grade: Grade | null;        // effective = override ?? autoGrade
};

type PolymerSlot = { polymer: Polymer; active: boolean };   // ≤ 3 slots
type RawPolymerInput = { name: string; d: string; p: string; h: string; r0: string };
```

**Corpus** (bundled JSON, read-only): 1180 `Solvent`, 466 handbook `Polymer` (grouped by
68 families). Ranges observed — solvent δD 9.6–22.6, δP 0–27.6, δH 0–42.7; polymer δD
9.8–28.8, δP −3.4–26.3, δH −0.8–30.6, r0 1.0–28.3 (a few polymer components are slightly
negative; the scene domain accommodates them).

---

## 2. Business-Logic Model (algorithms)

**A. Hansen distance (Ra)** — `hsp-math.hansenDistance(a,b)`
```
Ra = sqrt( 4·(a.d−b.d)² + (a.p−b.p)² + (a.h−b.h)² )     // the 4× on δD is the Hansen convention
```

**B. RED** — `relativeEnergyDifference(polymer, solvent, r0)`
```
RED = Ra(polymer, solvent) / r0        if r0 finite and > 0
    = null                              otherwise
```

**C. Auto-grade from RED** — `redToGrade(red)`, tolerance `TOL = 0.10`
```
red === null           → null   (no active polymer / invalid r0 → neutral marker)
red < 1 − TOL (0.90)   → 0      dissolves        (green)
0.90 ≤ red ≤ 1.10      → 1      partial/boundary (amber)
red > 1 + TOL (1.10)   → 2      does not dissolve (red)
```
`TOL` is a single exported constant (justified by Ro's one-decimal precision; adjustable).

**D. Effective grade** — `grade = override ?? autoGrade`. Override ∈ {0,1,2}; setting
"auto" clears the override.

**E. Seed selection** — `seedForPolymer(active, corpus)` → `Solvent[]` (≤5)
```
1. water := corpus.find(key === 'water')            // δ 15.5/16.0/42.3
2. nearest4 := nearestByRa(active.hsp, corpus \ {water}, 4)   // 4 smallest Ra
3. return [water?, ...nearest4]  (unique, water first; if no water key, return nearest 5)
```

**F. World mapping (why points never move)** — `worldOf(hsp) = (2·d, p, h) · WORLD_SCALE`,
placed in **absolute world coordinates** once. Adding/removing solvents changes *what is in
the scene*, never the coordinates of what's already there (this structurally eliminates the
old SVG tool's "points move on add" bug). The camera/OrbitControls frames; `resetView`
re-aims the camera at the active polymer, it does not rescale the world. Scene domain =
corpus min/max (solvents ∪ handbook polymers) + 8% pad, computed once at init.

**G. Multi-polymer** — ≤3 `PolymerSlot`s, exactly one `active`. The active polymer alone
drives Ra/RED/grade for every solvent. Context (non-active) polymers still draw a violet
core + translucent Ro sphere, rendered fainter than the active one.

**H. Hover** — raycast → nearest marker within a pixel threshold → payload
`{kind, name, hsp, ra?, red?, grade?}`.

---

## 3. Business Rules

- **BR-1** Ra always uses the 4× δD weight (§2A). One implementation, shared by ranking and drawing.
- **BR-2** `red === null` (no active polymer, or r0 ≤ 0/non-finite) ⇒ solvent renders **neutral grey**, never green/amber/red — the tool never fabricates a grade it cannot compute.
- **BR-3** Grade bands = §2C with `TOL = 0.10`; boundary hits (exactly 0.90 / 1.10) belong to grade **1**.
- **BR-4** Override precedence: effective grade = `override ?? autoGrade` (§2D).
- **BR-5** Seeding (§2E) runs **only** when the FIRST polymer is selected while the solvent set is empty, or on an explicit **"Reseed to active"** action. It never silently discards user-added/edited solvents.
- **BR-6** ≤3 polymer slots. Adding a 4th is rejected with a message ("remove one first"). Exactly one slot is active at all times once ≥1 exists.
- **BR-7** Changing the active polymer **recomputes** every solvent's Ra/RED/auto-grade against the new active but **preserves** the solvent set and any manual overrides.
- **BR-8** Custom polymer validation (SECURITY-05): `name` non-empty ≤ 80 chars; `d,p,h` finite ∈ [0, 60]; `r0` finite ∈ (0, 40]. Any violation ⇒ inline field error, no state change.
- **BR-9** Duplicate add is a no-op: adding an already-present solvent, or a polymer whose `key` is already a slot (for a handbook polymer), does nothing except (for a polymer) set it active.
- **BR-10** Fixed world mapping (§2F): a solvent's/polymer's on-screen position is a function of its own HSP only — invariant to what else is in the scene.
- **BR-11** If the `water` key is absent from the corpus, seeding degrades gracefully to the 5 nearest solvents (no crash).
- **BR-12** Custom polymers are session-only (not persisted); reload starts clean. (URL-state persistence is parked idea #10.)

---

## 4. Data Flow (per §3 of the design doc)

`ui action → store.action() → store recomputes GradedSolvent[] (grading uses hsp-math) →
SceneCanvas effect → SceneController.setPolymers/setSolvents → three.js renders`;
`hover → SceneController.onHover → store/ui tooltip`. One direction; the scene never mutates
domain state except via the hover callback.

---

## 5. Frontend Components (hierarchy, props, state, interactions)

```
App (owns store)
├─ ControlPanel
│  ├─ PolymerPicker      search + family-grouped list; "Add custom polymer" form
│  ├─ PolymerList        ≤3 slots; active radio; remove ×; "Reseed to active"
│  ├─ SolventSearch      search 1180 (name/systematic/cas); add; "Add N nearest"; "Add family…"
│  └─ SolventList        rows: dot · name · Ra · RED · grade · override(0/1/2/Auto) · ×
├─ SceneCanvas           three.js host (props: polymers, activeId, graded, onHover)
│  └─ HoverTooltip
└─ Legend                grade swatches (shape+color+label) · polymer swatch · RED note
```

**Component contracts (props / local state / interactions):**

| Component | Key props | Local state | Interactions → store action |
|---|---|---|---|
| `PolymerPicker` | `families`, `polymers` | query, custom-form fields, field errors | `selectPolymer(key)` · `addCustomPolymer(RawPolymerInput)` (validates first) |
| `PolymerList` | `slots` | — | `setActive(key)` · `removePolymer(key)` · `reseedActive()` |
| `SolventSearch` | `solvents`, `activePresent` | query | `addSolvent(key)` · `addNearest(n)` · `addFamily(name)` |
| `SolventList` | `graded: GradedSolvent[]` | — | `removeSolvent(key)` · `setOverride(key, 0/1/2/'auto')` |
| `SceneCanvas` | `polymers`, `activeId`, `graded`, `onHover` | three.js refs | (imperative sync; no store writes except hover) |
| `Legend` | — | — | — |

**Form validation (custom polymer):** on submit, run `validateCustomPolymer` (BR-8); show
per-field errors; only a fully valid input dispatches `addCustomPolymer`. Numeric inputs are
parsed with explicit `Number.isFinite` checks (no `parseFloat` silent-NaN).

**No API integration** — corpus is bundled JSON (Q7); there are no backend endpoints.

---

## 6. Error Handling & Edge Cases (fail-safe, SECURITY-15)

- No active polymer ⇒ solvents grey (BR-2); RED/grade columns show "—".
- Corpus fails to load ⇒ top-level error boundary shows a friendly message, no stack trace (SECURITY-09).
- WebGL unavailable ⇒ detect and show a graceful "WebGL required" notice instead of a blank canvas.
- Custom polymer out of range ⇒ inline error, never added (BR-8).
- Empty solvent set / empty polymer set ⇒ scene renders axes+grid only; no NaN geometry.
- Nearest-N with corpus smaller than N ⇒ returns all, sorted (no over-read).
- `resetView` with no polymer ⇒ aims camera at scene center.
- All three.js resources disposed on unmount (geometries/materials/renderer) — no leak.

---

## 7. Testable Properties (PBT-Partial handoff)

Carried from the design doc §5, to be implemented as fast-check properties on `core/`:
metric identity (`plotDistance == hansenDistance`), plot-space round-trip, RED scaling
(`RED·r0 == Ra`; halving r0 doubles RED), `redToGrade` monotonic non-decreasing in RED,
`nearestByRa` returns an Ra-sorted prefix of correct length, `seedForPolymer` shape (water +
≤4 distinct, Ra-sorted), `validateCustomPolymer` accepts in-range / rejects out-of-range &
non-finite.

---

## 8. Decisions (3 flagged ★ for confirmation; rest are low-risk defaults)

1. ★ **Seed timing (BR-5):** auto-seed only on the *first* polymer selection or an explicit "Reseed" button — never re-seed on active-polymer change, so your edits are never wiped. *(Alternative: reseed every time active changes.)*
2. ★ **Active-switch keeps solvents (BR-7):** switching active recomputes colors but keeps your solvent list. *(Alternative: clear on switch.)*
3. ★ **Multi-polymer cap = 3 (BR-6):** one active + up to two context spheres, context drawn fainter. *(Your "be realistic" limit — adjustable to 2 or 4.)*
4. Grade band `TOL = 0.10`; boundary → grade 1 (reuses the proven, precision-justified threshold).
5. Fixed world mapping (BR-10) instead of rescaling — the structural fix for "points move on add".
6. Custom polymers session-only (BR-12) until parked idea #10 (URL/persistence) lands.
