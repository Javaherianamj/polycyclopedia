# Requirements Verification Questions — `hspip-lab` (from-scratch HSPiP 3D tool)

Answer each question by filling the letter after the `[Answer]:` tag. If none fit,
pick the last option (Other) and describe your choice. You can also add free notes
under any answer. When you're done, say "done".

**Context I already confirmed (no need to answer, just FYI):**

- Data is ready: **1180 solvents** (all δD/δP/δH; 1166 with molar volume) and
  **466 polymers**, every one with δD/δP/δH **and a real Ro radius** (1.0–28.3),
  across 68 handbook families. So a sphere can be drawn for *any* polymer, not
  just 12 like the old tool.
- `three.js` (real WebGL, orbit/zoom/pan, true depth + transparency) is already a
  dependency — no new install needed.
- This will be **standalone** first (run here so you can play with it), a Learn
  module **later**. The current `HansenSpaceIsland` tool is left untouched.

---

## Question 1 — Direction of the 0–2 solvent grade (there is a contradiction to settle)

You said **0 = dissolves well, 2 = does not dissolve**. But the Table 4 you shared
uses the *opposite*: DMF has **score 2** with RED 0.30 (deep inside the sphere =
great solvent), and water has **score 0** with RED 3.03 (far outside = non-solvent).
So in that article **higher = better**. Which convention should the tool use?

A) **0 = dissolves well, 1 = partial, 2 = does not dissolve** (your description; I'll treat the article's numbers as reversed)

B) **2 = dissolves well, 1 = partial, 0 = does not dissolve** (matches the Table 4 article exactly)

C) Use a **1 = dissolves, 0 = does not** two-level scale (classic Hansen fit), with a middle "partial" as a third option

X) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 2 — How does each solvent get its grade/color?

A) **Manual** — I assign 0/1/2 to each solvent I add (like the article's experimental scores)

B) **Automatic from RED** — the tool computes RED from the chosen polymer's Ro and buckets each solvent into 3 colors (inside / boundary / outside)

C) **Both (recommended)** — auto-suggest the grade from RED, but let me override any solvent by hand, so I can plot real experimental scores against the theoretical sphere and see where they disagree

X) Other (please describe after [Answer]: tag below)

[Answer]:
C
## Question 3 — Color scheme (3 translucent solvent colors + 1 polymer color)

You said the article's blue-in/red-out scheme is *not* what you want, and all dots
should be slightly transparent so overlaps show through.

A) **Green = dissolves / Amber = partial / Red = does-not-dissolve**, polymer as a distinct **violet** core inside a neutral translucent sphere (colorblind-aware via shape + label too)

B) **Colorblind-safe ramp**: Teal = dissolves / Yellow = partial / Magenta = does-not, polymer as a white/bright core

C) I'll give you **exact hex colors** for each of the 4 (describe under Other)

X) Other (please describe after [Answer]: tag below)

[Answer]:
A
## Question 4 — Can I add a custom polymer (not just the 466 handbook ones)?

The article's "sample A1" isn't in the handbook — it was fit from experiments.

A) **Yes (recommended)** — besides the 466 handbook polymers, let me type in a custom center (δD, δP, δH) + Ro and name it

B) No — only the 466 handbook polymers

X) Other (please describe after [Answer]: tag below)

[Answer]:
A
## Question 5 — One polymer at a time, or several spheres at once?

A) **One polymer + its sphere at a time** (matches "choose the polymer, then add solvents") — recommended for the first version

B) Allow **2+ polymer spheres together** (for blend/miscibility reasoning) from the start

X) Other (please describe after [Answer]: tag below)

[Answer]:
B(but there must be a limit-be realistic)
## Question 6 — What's on screen when solvents start out?

A) **Start empty**; I search & add solvents one by one, plus bulk helpers ("add the N nearest", "add a whole family")

B) **Preload a common ~30-solvent set**, then let me edit it

X) Other (please describe after [Answer]: tag below)

[Answer]:
start with 5, water and 4 most reachable solvents. and let user edit it
## Question 7 — Data source for the standalone playground

A) **Bundle the two CSVs as static JSON** (recommended) — no database/API needed, loads instantly, fully offline-playable

B) Read from the **running local API/DB** instead

X) Other (please describe after [Answer]: tag below)

[Answer]:
A(if its the same as db)
## Question 8 — Which of the 10 expansion ideas do you want in the FIRST playable build?

These are grounded in real HSPiP features + published HSP papers. Mark which to
build **now (v1)** vs **later** — e.g. write `now: 1,3,4,10` in the Answer, or "all",
or "core only". Full descriptions are in the chat message and below in brief:

1. **RED auto-grade + manual override** (ties to Q1/Q2 — the coloring engine)
2. **Inverse "fit the sphere" solver** — derive a NEW polymer's δD/δP/δH + Ro from scored solvents (HSPiP's core Sphere program; exactly how "sample A1" was made)
3. **Solvent blend/mixture designer** — volume-weighted HSP of 2+ solvents, movable blend point + live RED (covers the article's "mix 1…11")
4. **Optimal-solvent finder** — rank the full 1180 library by RED for the chosen polymer, one-click add the best N inside the sphere
5. **Teas fractional ternary diagram** — the classic 2D triangle (f_d/f_p/f_h) companion view
6. **Synchronized 2D projections + draggable slice plane** (δD–δP, δD–δH, δP–δH) for precise reading
7. **Molar-volume-aware dot sizing + "RED number" size correction** (small molecules dissolve better at equal RED)
8. **Temperature slider** — shift solvent HSP with T (Hansen's dδ/dT), watch the solubility window move
9. **Multi-polymer / miscibility mode** — overlay spheres, highlight solvents common to both (sphere intersection)
10. **Ranked data table + CSV/PNG export + shareable URL state** (Ra, RED, in/out, molar volume per solvent)

X) Other (please describe after [Answer]: tag below)

[Answer]:
1-6 are nice but put them as later stage of plan not from the beginig, 7-10 we discuss later. 
---

## Extension opt-ins (project already has defaults — confirm or override)

Your project's standing config is **Security = Yes, Resiliency = No, PBT = Partial**.
Since this is a standalone visual playground, I'll assume the same unless you change it.

## Question 9 — Security extension for `hspip-lab`?

A) Keep project default (**Yes** — enforce security rules; low cost here since it's a static, read-only client tool)

B) No — skip for this experimental playground

X) Other (please describe after [Answer]: tag below)

[Answer]:
A
## Question 10 — Resiliency baseline for `hspip-lab`?

A) Keep project default (**No** — client-side visualization, no infra/availability targets)

B) Yes — apply the resiliency baseline

X) Other (please describe after [Answer]: tag below)

[Answer]:
A
## Question 11 — Property-based testing for `hspip-lab`?

The Hansen math (Ra, RED, blend averaging, sphere-fit) is pure-function heavy —
a good PBT fit.

A) Keep project default (**Partial** — PBT for the pure HSP math + round-trips only) — recommended

B) Yes — full PBT

C) No — skip PBT for this playground

X) Other (please describe after [Answer]: tag below)

[Answer]:
A