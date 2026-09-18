# Application Design — `hspip-lab` (minimal depth, consolidated)

**Date**: 2026-08-19 · **Depth**: Minimal (single isolated frontend app). Consolidates
components / component-methods / services / dependencies into one doc per the adaptive
principle. **No clarifying questions** — the approved requirements determine every
boundary below; all five design-question categories were evaluated and none held a
blocking ambiguity.

**Guiding decision:** a **framework-agnostic core** (`core/`, `scene/`, `state/`,
`data/` — pure TS + imperative three.js, no React) under a **thin React shell**
(`ui/`). This satisfies NFR-6: porting to the later Astro/React Learn island re-skins
only `ui/`; the math, rendering, and state modules move unchanged.

---

## 1. Components (layers, responsibilities, interfaces)

| # | Component | Layer | Responsibility | Depends on |
|---|---|---|---|---|
| C1 | `core/hsp-math.ts` | Core (pure) | The Hansen metric: Ra, RED, plot-space transform, nearest-N, plot box, axis ticks | `core/types` |
| C2 | `core/grading.ts` | Core (pure) | The **coloring engine**: auto grade from RED + apply manual overrides → `GradedSolvent[]` | C1, `core/types` |
| C3 | `core/seed.ts` | Core (pure) | Seed selection = **water + 4 nearest** solvents to the active polymer | C1 |
| C4 | `core/validation.ts` | Core (pure) | Custom-polymer input validation + bounds (SECURITY-05) | `core/types` |
| C5 | `core/types.ts` | Core | Shared types (`Hsp`, `Solvent`, `Polymer`, `Grade`, `GradedSolvent`, `AppState`) | — |
| C6 | `data/build-data.ts` | Data (build-time Node) | CSV → `solvents.json` / `polymers.json` (+ family grouping). Run at build. | CSVs |
| C7 | `data/load.ts` | Data (runtime) | Load bundled JSON → typed, indexed corpus (by key / family) | C5 |
| C8 | `scene/SceneController.ts` | Scene (three.js) | Owns renderer/scene/camera/OrbitControls; renders polymers (violet core + translucent Ro sphere), solvents (translucent graded points), axes+unit ticks, grid/box; hover raycast; `resetView` | three.js, C1, C5 |
| C9 | `scene/markers.ts` | Scene (three.js) | Geometry/material factories: sphere, point, **axis unit-tick labels** (canvas-texture sprites), transparency config | three.js, C1 |
| C10 | `state/store.ts` | State (pure/observable) | Single source of truth + orchestration; actions; derives `GradedSolvent[]` via C2 | C2, C3, C7 |
| C11 | `ui/App.tsx` | Shell (React) | Layout: control panel + canvas + legend; wires store to components | C10, C12–C17 |
| C12 | `ui/SceneCanvas.tsx` | Shell (React) | Instantiates `SceneController` in a ref/effect; pushes store state → scene; lifts hover → tooltip | C8, C10 |
| C13 | `ui/PolymerPicker.tsx` | Shell (React) | Searchable, **family-grouped** polymer select + **custom-polymer form** | C10, C4, C7 |
| C14 | `ui/PolymerList.tsx` | Shell (React) | The ≤3 active polymers; set-active; remove | C10 |
| C15 | `ui/SolventSearch.tsx` | Shell (React) | Search 1180; add/remove; bulk "add N nearest" / "add family" | C10 |
| C16 | `ui/SolventList.tsx` | Shell (React) | Added solvents with RED + auto grade + **override control (0/1/2/auto)** + remove | C10 |
| C17 | `ui/Legend.tsx` | Shell (React) | Grade/color legend + RED explanation | — |
| C18 | `main.tsx` + `index.html` | Shell | Vite entry / React mount | C11 |

---

## 2. Component Methods (key signatures — business rules detailed in Functional Design)

```ts
// C1 core/hsp-math.ts
hansenDistance(a: Hsp, b: Hsp): number                       // sqrt(4Δd² + Δp² + Δh²)
relativeEnergyDifference(polymer: Hsp, solvent: Hsp, r0: number): number | null
toPlotSpace(p: Hsp): Vec3                                     // (2d, p, h)
fromPlotSpace(q: Vec3): Hsp
nearestByRa<T extends Hsp>(target: Hsp, cands: T[], n: number): (T & {ra:number})[]
plotBox(points: Hsp[]): Box; axisTicks(box, axis, count): Tick[]

// C2 core/grading.ts
redToGrade(red: number | null, tol?: number): Grade | null   // 0 (<1-tol) | 1 (±tol) | 2 (>1+tol)
gradeColor(grade: Grade): ColorToken                          // 0→green 1→amber 2→red
gradeSolvents(active: Polymer|null, solvents: Solvent[], overrides: Map<id,Grade>): GradedSolvent[]

// C3 core/seed.ts
seedForPolymer(active: Polymer, corpus: Solvent[]): Solvent[] // water + 4 nearest by Ra

// C4 core/validation.ts
validateCustomPolymer(input: RawPolymerInput): Result<Polymer, ValidationError[]>

// C8 scene/SceneController.ts
mount(canvas): void; resize(): void; dispose(): void
setPolymers(polymers: Polymer[], activeId: id): void
setSolvents(graded: GradedSolvent[]): void
resetView(): void; onHover(cb: (payload|null)=>void): void

// C10 state/store.ts  (actions)
init(corpus): void
selectPolymer(id) / addCustomPolymer(input) / setActive(id) / removePolymer(id)   // ≤3 enforced
addSolvent(id) / removeSolvent(id) / addNearest(n) / addFamily(name)
setOverride(solventId, grade|'auto') / seedActive() / reset()
getGraded(): GradedSolvent[]   // derived via C2
```

---

## 3. Services & Orchestration

There is **one orchestration layer — the store (C10)** — deliberately, not a scatter of
controllers. Logical "services" are the pure modules it composes:

- **DataService** = C7 (`load.ts`): supplies the 1180/466 corpus at init.
- **GradingService** = C2 + C1: turns (active polymer, added solvents, overrides) into colored, RED-annotated points.
- **SceneService** = C8 (`SceneController`): the only thing that talks to three.js/WebGL.

Orchestration flow (one direction, predictable):

```
 user action (React ui/) ──▶ store.action() ──▶ store recomputes derived state
                                                   │  (GradingService: auto grade + overrides)
                                                   ▼
                          SceneCanvas effect ──▶ SceneController.setPolymers/ setSolvents
                                                   │
                                                   ▼
                                              three.js renders
   hover (raycast) ◀── SceneController.onHover ──▶ store/ui tooltip
```

---

## 4. Component Dependency Graph (data flow)

```
        ┌──────────────────────── ui/ (React shell) ────────────────────────┐
        │ PolymerPicker  PolymerList  SolventSearch  SolventList  Legend     │
        │        \           |            |             /                     │
        │         \          |            |            /       SceneCanvas    │
        │          ▼         ▼            ▼           ▼            │          │
        └────────────────────  state/store (C10)  ────────────────┼──────────┘
                       │  composes                                 │ pushes state
             ┌─────────┼───────────────┐                          ▼
             ▼         ▼                ▼                 scene/SceneController (C8)
     core/grading  core/seed     data/load (C7)          + scene/markers (C9)
        (C2)        (C3)              ▲                          │ uses
          │ uses      │ uses          │ built by                 ▼
          ▼           ▼          data/build-data (C6)        core/hsp-math (C1)
     core/hsp-math (C1) ◀───────  from curation/hsp-*.csv
          │
          ▼
     core/types (C5)  ◀── core/validation (C4)
```

**Communication patterns:** unidirectional (UI → store → scene); the scene never mutates
state except via the hover callback. No component imports React except `ui/`. No
component imports three.js except `scene/`. `core/` imports neither — it is the portable,
property-tested heart.

---

## 5. Testable Properties (handoff to Functional Design / PBT)

- **Metric identity (PBT-03):** `plotDistance(toPlotSpace(a), toPlotSpace(b)) == hansenDistance(a,b)`.
- **Round-trip (PBT-02):** `fromPlotSpace(toPlotSpace(p)) == p`.
- **RED scaling (PBT-03):** `RED(poly, solv, r0) == hansenDistance(poly,solv)/r0`; halving r0 doubles RED.
- **Grade monotonicity (PBT-03):** `redToGrade` is non-decreasing in RED (0→1→2); boundaries land in "partial".
- **Nearest ordering (PBT-03):** `nearestByRa` returns an Ra-sorted prefix; length = min(n, corpus).
- **Seed shape (PBT-03):** `seedForPolymer` returns water + exactly ≤4 others, all distinct, sorted by Ra.
- **Validation (PBT-03/SECURITY-05):** `validateCustomPolymer` rejects non-finite / out-of-range δ,r0 and accepts in-range.

---

## 6. Design Decisions

- **Core/shell split** — the four non-`ui/` layers are framework-agnostic so the later Learn island is a re-skin (NFR-6), and the Hansen math is unit/property-testable in isolation (NFR-5).
- **Imperative three.js inside a React effect** (not react-three-fiber) — react-three-fiber would be a new dependency; plain three.js in a ref'd canvas is the standard, dependency-free pattern and matches the legacy app's approach.
- **Single store as orchestrator** — avoids the "five parallel controllers" smell; one predictable data flow; trivially portable to the island's own state.
- **Transparency** — spheres use `transparent:true, opacity≈0.18, depthWrite:false`; points `opacity≈0.85`; renderer sorts transparent objects back-to-front, so overlaps show through (the thing SVG could not do).
- **Axis unit ticks** — rendered as canvas-texture sprites (billboarded) so δD/δP/δH values in MPa^0.5 stay legible at every rotation.
