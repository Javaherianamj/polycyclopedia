# Requirements — `hspip-lab` (from-scratch HSPiP 3D solubility tool)

**Status**: Requirements Analysis complete — awaiting approval
**Date**: 2026-08-19
**Unit**: `hspip-lab` (new)
**Depth**: Standard → Comprehensive (novel visualization, from-scratch, but single persona)

---

## 1. Intent Analysis

| Field | Value |
|---|---|
| **User request** | Build a Hansen Solubility Parameters (HSPiP-style) 3D tool from scratch — better than the original — with real 3D movement, unit-labeled axes, a translucent solubility sphere around a chosen polymer, and solvents graded 0–2 and color-coded. Run it standalone to play with; make it a Learn module later. Suggest 10 expansion ideas. |
| **Request type** | New Feature (new unit; net-new tool, not a modification of the existing one) |
| **Scope estimate** | Single Component (self-contained standalone app now; a Learn island later) |
| **Complexity** | Moderate → Complex (real-time WebGL 3D, interaction model, Hansen math, 466×1180 dataset) |
| **Clarity** | Clear (11 clarifying questions answered) |

**Explicitly OUT of scope now**: touching the current `HansenSpaceIsland` tool ("leave it"); integrating into the Learn page ("don't add the module yet"). The new tool is **standalone first**.

---

## 2. Reverse-Engineering Findings (the current tool, and why "from scratch")

- **Current tool**: `web/src/islands/HansenSpaceIsland.tsx` + `web/src/lib/learn/hansen-space.ts`. A hand-rolled **360×320 SVG** orthographic projection using painter's-algorithm depth sorting (no z-buffer). Fakes 3D with a wireframe cube, gridded floor/walls, and per-point drop-lines.
- **Its central limitation**: it draws a solubility sphere **only for the 12 catalog materials** linked to an `hsp_correlation` row (its "R7 forbids an invented radius" posture). Everything else is a bare point.
- **Why that limitation is now moot**: the handbook data below gives a **real, sourced Ro for all 466 polymers** — so a sphere can be drawn for any of them without inventing anything.
- **Why WebGL, not the SVG approach**: true translucency + real occlusion ("dots partly visible through each other") needs a depth buffer, which SVG painter's-algorithm cannot provide honestly at scale. `three.js` gives real orbit/zoom/pan, real alpha blending, and a rotation-invariant sphere for free.

---

## 3. Data (verified, ready)

| Source CSV | Rows | Fields | Note |
|---|---|---|---|
| `curation/hsp-solvents.csv` | **1180 solvents** | δD, δP, δH (all), molar_volume (1166), name, CAS | **Exact import source** of DB `solvent` table (`import_solvents.py`) |
| `curation/hsp-polymers.csv` | **466 polymers** | δD, δP, δH, **Ro** (all; range 1.0–28.3), name, family/section (68 families) | **Exact import source** of DB `hsp_correlation` table (`import_hsp_correlations.py`) |

**Q7 caveat resolved**: the CSVs *are* the DB's Hansen data (the DB is imported from them). Bundling them as static JSON is identical data — and exposes all 466 polymers, not the 12 the old tool linked.

---

## 4. Functional Requirements

### 4.1 Core visualization (v1 / MVP — "the thing to play with now")

- **FR-1 — Real 3D scene.** Render an interactive 3D Hansen space (δD, δP, δH). Full 3D movement: **orbit** (drag), **zoom** (scroll), **pan**. `three.js` + OrbitControls. *(Q8 tech)*
- **FR-2 — Unit-labeled axes.** Three axes labeled **δD / δP / δH** with numeric **tick labels in MPa^0.5**, always legible while rotating. Include a reference grid/box for depth. *(explicit "units on the 3d fields axes")*
- **FR-3 — Metric correctness.** Plot in (2·δD, δP, δH) on a single shared scale so on-screen distance equals the Hansen distance Ra `= sqrt(4·ΔδD² + ΔδP² + ΔδH²)` and the Ro sphere projects to a true sphere at every angle. *(reuse the proven metric from `hansen-space.ts`)*
- **FR-4 — Choose a polymer.** Pick from the 466 handbook polymers via a **searchable list grouped by the 68 families**. *(Q-context)*
- **FR-5 — Custom polymer.** Also add a **user-defined polymer**: name + δD + δP + δH + Ro, validated and bounded. Used for article-style samples (e.g. "A1") not in the handbook. *(Q4=A)*
- **FR-6 — Solubility sphere.** Draw a **translucent sphere of radius Ro** centered on the polymer, with a distinct **violet polymer core** marker at the center. *(Q3=A, "sphere around the polymer cord")*
- **FR-7 — Multiple polymers (capped).** Support **up to 3 polymer spheres** at once; exactly **one is "active"** and drives solvent grading/colors. Others render as context spheres. *(Q5=B "with a limit — be realistic")* — the deeper miscibility analytics (common-solvent highlighting, intersection math) is deferred (idea #9).
- **FR-8 — Add solvents.** Start with a **seed set of 5**: **water + the 4 nearest solvents (lowest Ra) to the active polymer**; user can freely **search, add, and remove** any of the 1180. *(Q6 custom answer)*
- **FR-9 — Bulk add helpers.** "Add the N nearest to the active polymer" and "add a whole family/class". *(Q6-A helpers)*
- **FR-10 — Solvent grading (the coloring engine).** Each added solvent gets a grade **0/1/2**, **auto-computed from RED** against the active polymer and **manually overridable** per solvent: *(Q1=A, Q2=C — this is idea #1, kept as core because Q2 mandates it)*
  - **0 = dissolves well** (RED < 0.9) → **Green**
  - **1 = partial** (0.9 ≤ RED ≤ 1.1, "too close to call") → **Amber**
  - **2 = does not dissolve** (RED > 1.1) → **Red**
  - Thresholds reuse the existing, precision-justified `RED_BOUNDARY_TOLERANCE = 0.1`; adjustable.
- **FR-11 — Color scheme.** 3 solvent colors (green/amber/red) + violet polymer, per FR-10; **every marker slightly translucent** so overlapping dots are partially visible through one another. Color is never the *only* channel (shape/label backup) for accessibility. *(Q3=A + "a bit transparent" + "not the article's blue/red scheme")*
- **FR-12 — Solvent list panel.** A side panel listing each added solvent with its RED, auto grade, and an **override control** (set 0/1/2 by hand) and a remove button. *(required by the Q2=C override UX; NOT the full export table of idea #10, which stays deferred)*
- **FR-13 — Reset / recenter view.** One-click reset of camera and (optionally) the solvent set.

### 4.2 Deferred to later planned stages (user: "1–6 nice, but later stage of plan, not the beginning")

- **FR-L1 (idea 2)** — Inverse **"fit the sphere" solver**: derive a new polymer's δD/δP/δH + Ro from a set of scored solvents (HSPiP's Sphere program; how "A1" was made).
- **FR-L2 (idea 3)** — **Solvent blend/mixture designer**: volume-weighted HSP of 2+ solvents, movable blend point + live RED (article "mix 1…11").
- **FR-L3 (idea 4)** — **Optimal-solvent finder** over the full 1180 library (rank by RED, one-click add best-N inside the sphere).
- **FR-L4 (idea 5)** — **Teas fractional ternary diagram** (2D companion).
- **FR-L5 (idea 6)** — **Synchronized 2D projections + draggable slice plane**.

### 4.3 Parked for later discussion (user: "7–10 we discuss later")

Idea 7 (molar-volume-aware sizing + RED-number), idea 8 (temperature slider), idea 9 (multi-polymer miscibility analytics — natural extension of FR-7), idea 10 (ranked table + CSV/PNG export + shareable URL state).

---

## 5. Non-Functional Requirements

- **NFR-1 — Standalone & isolated.** Runs on its own (proposed `hspip-lab/` at repo root), served locally for interactive play. Does **not** import from or modify `web/` (Astro site) or the legacy root `src/` React app.
- **NFR-2 — Performance.** Smooth interaction (≥ 30 fps target) while orbiting with the seed set; the full 1180-point library must be searchable instantly and addable without frame drops. Loading the bundled JSON must be near-instant.
- **NFR-3 — No new dependencies.** Use the already-pinned `three@0.185.1`. *(SECURITY-10; owner's standing "no new deps" preference)*
- **NFR-4 — Accessibility.** Grade is conveyed by more than hue (shape/label/RED value), honoring the site's colorblind-safe posture.
- **NFR-5 — Correctness is testable.** The Hansen math (Ra, RED, plot-space transform, nearest-N, blend average when it lands) is pure and unit-/property-tested.
- **NFR-6 — Future portability to a Learn island.** Keep the Hansen math and data-shaping in framework-agnostic modules so the later Learn-module wrapping is a re-skin, not a rewrite.
- **NFR-7 — Both themes / i18n readiness.** Not required for the throwaway-play phase, but the design should not hard-block later light/dark + fa/en support.

---

## 6. Assumptions & Contradiction Resolutions (please confirm at the gate)

1. **Scoring direction (Q1=A)** wins over the article's numbers: **0 = dissolves, 2 = does not**. The article's Table 4 (where 2 = best) is treated as the reversed convention.
2. **Idea #1 vs "defer 1–6" (Q2=C vs Q8):** the **auto-from-RED + manual-override coloring engine is CORE v1**, because Q2=C explicitly requires it and solvents cannot be "colored by grade" without it. "Defer 1–6" is applied to ideas **2–6** (the additional analysis tools). *If you actually wanted v1 to be manual-grading-only, say so and I'll move auto-RED to a later stage.*
3. **Multi-sphere (Q5=B) vs deferring idea #9:** v1 supports **displaying up to 3 spheres with one active polymer** driving colors; the **miscibility analytics** (intersection, common-solvent highlighting) is the deferred idea #9. Proposed cap = **3**; adjustable.
4. **Seed solvents (Q6):** water + **4 nearest by Ra** to the active polymer, then fully editable.
5. **Location:** new standalone app at repo root (`hspip-lab/`), Vite-served; final path confirmed in Workflow Planning.

---

## 7. Extension Compliance (Requirements Analysis stage)

Per unit `hspip-lab`, confirming project defaults (Q9/Q10/Q11 = A):

| Extension | Enabled | Stage-relevant assessment |
|---|---|---|
| **Security Baseline** | **Yes** | Mostly **N/A** for a static client-side read-only tool (no data store, auth, network intermediaries, sessions). **Applicable & carried to Construction**: SECURITY-05 (validate/bound custom-polymer numeric inputs), SECURITY-09 (no stack traces to user), SECURITY-10 (pinned deps / lock file / no new deps), SECURITY-15 (fail-safe error handling + error boundary). SECURITY-04 (CSP/security headers) becomes applicable when it is served as a real page/Learn module. No blocking findings at this stage. |
| **Resiliency Baseline** | No | N/A (client-side visualization). |
| **Property-Based Testing** | **Partial** (PBT-02, 03, 07, 08, 09) | Carried to Construction. Strong fits: **PBT-02** round-trip (`toPlotSpace`↔`fromPlotSpace`; later URL-state serialize↔deserialize), **PBT-03** invariants (Ra == plot distance; RED monotonic in Ra; sphere radius rotation-invariant; nearest-N ordering), **PBT-07** domain generators (valid HSP triples & Ro), **PBT-08** shrinking/seed, **PBT-09** framework = **fast-check + Vitest**. No blocking findings at this stage. |

---

## 8. Key requirements summary

A standalone, WebGL (three.js) HSPiP-style tool over the full **466-polymer / 1180-solvent** handbook data: pick (or hand-enter) a polymer, see its **translucent Ro sphere + violet core**, start with **water + 4 nearest solvents**, add/remove any solvent, and see each solvent **auto-graded 0/1/2 by RED (green/amber/red, translucent) with manual override** — all in a freely **orbitable 3D scene with unit-labeled δD/δP/δH axes**, supporting **up to 3 polymer spheres**. Five analysis tools (fit-sphere, blend, optimal-solvent, Teas, 2D-slice) are planned for later stages; four more ideas are parked.
