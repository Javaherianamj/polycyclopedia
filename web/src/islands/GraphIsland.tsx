// L3 — «شبکه» / GRAPH (lab-concepts-spec.md). A hand-placed, hand-drawn SVG
// causal graph — NOT a force-simulated one (the spec's own words: "~12
// nodes, hand-placed rather than randomly simulated so it is legible and
// stable. Light physics for drag response only"). Dragging any of the three
// structural-cause pucks recomputes five derived-property nodes through the
// pure, documented, unit-tested relations in `lib/learn/causal-graph.ts`,
// which in turn light up (or don't) three terminal outcome nodes.
//
// ALL SCIENCE LIVES IN causal-graph.ts. This file is deliberately thin, the
// same split MapIsland.tsx already established: state, geometry-to-pixels,
// DOM/pointer events and i18n only. Read that module's header FIRST — it
// records three departures from the FE-0 prototype (design/fe-0/lab/
// graph.js) this ports from, each forced by generalising from one hardcoded
// material (LDPE) to the live catalogue:
//
//   1. No `mfi` node — the spec's own derived-property list doesn't have
//      one; Mw's edges reach the film/injection outcomes directly instead.
//   2. Every derived node's illustrative reading is a UNITLESS 0-100
//      TREND, never a fabricated absolute number in real units — that is
//      what keeps this file honest once it can be pointed at ANY material,
//      not just the one whose real bounds the FE-0 mock was hand-anchored
//      to. The REAL measured value (when this material has one) is a
//      completely separate fact, read from the live catalogue and shown
//      with its own provenance mark, side by side but never merged with
//      the trend (build brief: "Do not blur those two into one number").
//   3. Home/End keyboard support on top of FE-0's Up/Down-only pucks (R30).
//
// RTL DECISION (build brief: "a node-link diagram in RTL needs a
// deliberate decision about flow direction — decide, implement, and say
// what you chose"): UNLIKE MapIsland's modulus-temperature axis (which
// stays forced `dir="ltr"` because that specific chart type has one
// universal reading convention every engineer already knows), a causal
// graph's left/right arrangement has no such universal convention — it is
// purely a narrative device ("causes first, outcomes last"), the same
// framing the FE-0 prototype's own header used ("the same direction the
// reader's eye already moves in"). So THIS diagram mirrors per locale: in
// fa the causes sit on the right (reading-first, matching FE-0 exactly) and
// outcomes on the left; in en the whole layout flips so causes are
// reading-first on the left. `causal-graph.ts` keeps every coordinate in
// direction-agnostic "reading order" terms (`col` 0 = read first); `xForCol`
// below is the ONLY place that decides which physical side that is, so the
// two locales never need two separate coordinate tables.
//
// ACCESSIBILITY (R30): every cause is a real HTML <button role="slider">
// (not an SVG shape) laid over the SVG by percentage — same reasoning as
// MapIsland's marker (44px CSS pointer target is trivial on an HTML element
// and fragile on an SVG shape under a responsive viewBox; native focus/
// :focus-visible is simpler to get right). Each one is fully keyboard
// operable (Up/Down nudge, Home/End jump) so dragging is never the only way
// to move the graph. The SVG itself carries `role="img"` with one summary
// label (screen readers do not need to enumerate every <text> node
// individually) — the FULL causal structure is available as genuine text
// in the `<details>` "described list" below the figure, satisfying R30's
// "consider an accessible parallel representation" directly rather than
// leaving the graph as an unlabelled picture.
import { useRef, useState, type CSSProperties } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import type { LearnMaterial } from '../lib/learn/fetch-learn-materials';
import {
  CAUSE_DEFAULTS,
  CAUSE_KEYS,
  CAUSE_LAYOUT,
  CAUSE_STEP,
  DERIVED_KEYS,
  DERIVED_UNIT,
  EDGES,
  OUTCOME_KEYS,
  causePuckY,
  causeValueFromY,
  computeOutcomes,
  computeTrend,
  downstreamOf,
  measuredPointFor,
  nodePoint,
  provenanceMark,
  type CauseKey,
  type CauseState,
  type DerivedKey,
  type GraphEdge,
  type GraphNodeKey,
  type OutcomeKey,
  type ProvenanceMark,
} from '../lib/learn/causal-graph';

interface GraphIslandProps {
  locale: Locale;
}

// ------------------------------------------------------------------ layout
//
// The SVG's own internal coordinate system — matches `.graph-svg-frame`'s
// `aspect-ratio: 1040 / 640` in learn-graph.css exactly, the same "one
// number, two places" contract MapIsland's VB_W/VB_H already uses.
const VB_W = 1040;
const VB_H = 640;

/** `causal-graph.ts`'s `col` (0 = causes, 3 = outcomes) to an x FRACTION of
 * the viewBox, in READING order — 8% inset on each side so labels/circles
 * never crowd the edge. Locale-blind on purpose (see this file's header);
 * `xForCol` below is what turns this into a physical pixel. */
function colFraction(col: number): number {
  return 0.08 + (col / 3) * 0.84;
}

/** THE one function that decides which physical side "reading-first" is.
 * fa (RTL): col 0 (causes) → the RIGHT edge, mirroring the fraction.
 * en (LTR): col 0 (causes) → the LEFT edge, fraction used as-is. */
function xForCol(col: number, locale: Locale): number {
  const ltrX = colFraction(col) * VB_W;
  return locale === 'fa' ? VB_W - ltrX : ltrX;
}

/** `causal-graph.ts` layout fractions already carry their own top/bottom
 * padding (e.g. causes' tracks start at 0.04, derived nodes end at 0.9) —
 * no extra margin needed here, unlike `xForCol`'s inset. */
function yForFrac(frac: number): number {
  return frac * VB_H;
}

function pxPoint(key: GraphNodeKey, causeState: CauseState, locale: Locale): { x: number; y: number } {
  const layout = nodePoint(key, causeState);
  return { x: xForCol(layout.col, locale), y: yForFrac(layout.y) };
}

function quadPoint(
  p0: { x: number; y: number },
  pc: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return { x: a * p0.x + b * pc.x + c * p2.x, y: a * p0.y + b * pc.y + c * p2.y };
}

/** Constant upward bow on every edge — purely cosmetic (matches the FE-0
 * prototype exactly), not encoding anything, so it stays the same
 * regardless of which physical direction the edge happens to run in after
 * `xForCol` mirrors the layout. */
function edgeQuad(e: GraphEdge, causeState: CauseState, locale: Locale) {
  const p0 = pxPoint(e.from, causeState, locale);
  const p2 = pxPoint(e.to, causeState, locale);
  const pc = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 - 24 };
  return { p0, pc, p2 };
}

function edgeKey(e: GraphEdge): string {
  return `${e.from}>${e.to}`;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function reduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** `{token}` substitution with EVERY occurrence replaced, not just the
 * first — several of this concept's i18n strings (rowInfo.withMeasured, the
 * relation sentences) repeat the same token twice, unlike MAP's templates
 * which only ever used each token once and could get away with a single
 * `.replace()` call. */
function fillTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

// -------------------------------------------------------------- i18n maps

const CAUSE_LABEL_KEY: Record<CauseKey, MessageKey> = {
  branching: 'learn.graph.node.branching.label',
  cooling: 'learn.graph.node.cooling.label',
  mw: 'learn.graph.node.mw.label',
};
const CAUSE_HI_KEY: Record<CauseKey, MessageKey> = {
  branching: 'learn.graph.node.branching.hi',
  cooling: 'learn.graph.node.cooling.hi',
  mw: 'learn.graph.node.mw.hi',
};
const CAUSE_LO_KEY: Record<CauseKey, MessageKey> = {
  branching: 'learn.graph.node.branching.lo',
  cooling: 'learn.graph.node.cooling.lo',
  mw: 'learn.graph.node.mw.lo',
};
const DERIVED_LABEL_KEY: Record<DerivedKey, MessageKey> = {
  cryst: 'learn.graph.node.cryst.label',
  density: 'learn.graph.node.density.label',
  tm: 'learn.graph.node.tm.label',
  modulus: 'learn.graph.node.modulus.label',
  tensile: 'learn.graph.node.tensile.label',
};
// cryst deliberately has no entry — it is the one derived property FE-0's
// own prototype also left symbol-less (`sym: null`), no standard one-letter
// symbol is as universally recognised as ρ/Tm/E/σ are for the other four.
const DERIVED_SYM_KEY: Partial<Record<DerivedKey, MessageKey>> = {
  density: 'learn.graph.node.density.sym',
  tm: 'learn.graph.node.tm.sym',
  modulus: 'learn.graph.node.modulus.sym',
  tensile: 'learn.graph.node.tensile.sym',
};
const OUTCOME_LABEL_KEY: Record<OutcomeKey, MessageKey> = {
  film: 'learn.graph.node.film.label',
  inj: 'learn.graph.node.inj.label',
  cable: 'learn.graph.node.cable.label',
};
const OUTCOME_COPY_KEY: Record<OutcomeKey, MessageKey> = {
  film: 'learn.graph.outcomes.film.copy',
  inj: 'learn.graph.outcomes.inj.copy',
  cable: 'learn.graph.outcomes.cable.copy',
};

function nodeLabelKey(key: GraphNodeKey): MessageKey {
  if (key in CAUSE_LABEL_KEY) return CAUSE_LABEL_KEY[key as CauseKey];
  if (key in DERIVED_LABEL_KEY) return DERIVED_LABEL_KEY[key as DerivedKey];
  return OUTCOME_LABEL_KEY[key as OutcomeKey];
}

function markGlyph(mark: ProvenanceMark): string {
  return mark === 'sourced' ? '§' : mark === 'unsourced' ? '?' : '×';
}

function markLabelKey(mark: ProvenanceMark): MessageKey {
  return mark === 'sourced' ? 'learn.graph.markSourced' : mark === 'unsourced' ? 'learn.graph.markUnsourced' : 'learn.graph.markNodata';
}

export default function GraphIsland({ locale }: GraphIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [causeState, setCauseState] = useState<CauseState>(CAUSE_DEFAULTS);
  const seededRef = useRef(false);
  const draggingKeyRef = useRef<CauseKey | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pulseRefs = useRef<Record<string, SVGCircleElement | null>>({});

  // Seeds the picker to the bound material even when it has no derived-node
  // data at all — the same deliberate choice MapIsland's header explains at
  // length (owner: "all defaults must be this polymer", including when the
  // honest answer is a page of "no datasheet row" marks).
  if (!seededRef.current && fetchStatus === 'ready') {
    seededRef.current = true;
    if (boundMaterial) setSelectedSlug(boundMaterial.slug);
  }

  const selected: LearnMaterial | null = allMaterials.find((m) => m.slug === selectedSlug) ?? null;
  const materialName = (m: LearnMaterial) => (locale === 'fa' ? m.nameFa : m.nameEn);

  const trend = computeTrend(causeState);
  const outcomes = computeOutcomes(trend, causeState);

  // --------------------------------------------------------------- pulse
  //
  // Ported near-verbatim from graph.js's own `pulse()` — a hand-rolled rAF
  // tween moving each downstream edge's dot from its start point to its end
  // point over ~480ms, staggered 40ms apart so the flow reads left-to-right
  // (or right-to-left) rather than every edge lighting up at once. Kept
  // imperative (direct `setAttribute` on ref'd circles, not React state)
  // for the same reason MapIsland's drag math is imperative: this is a
  // 60fps loop, and re-rendering the whole component tree on every frame
  // would be wasteful when only a handful of tiny circle attributes change.
  function firePulse(originKey: GraphNodeKey, causeStateAtTrigger: CauseState) {
    if (reduceMotion()) return;
    const downstream = downstreamOf(originKey);
    const full = new Set<GraphNodeKey>([originKey, ...downstream]);
    const relevant = EDGES.filter((e) => full.has(e.from) && full.has(e.to));
    relevant.forEach((e, i) => {
      const el = pulseRefs.current[edgeKey(e)];
      if (!el) return;
      const { p0, pc, p2 } = edgeQuad(e, causeStateAtTrigger, locale);
      const start = performance.now() + i * 40;
      const dur = 480;
      function step(now: number) {
        if (now < start) {
          requestAnimationFrame(step);
          return;
        }
        const frac = clamp01((now - start) / dur);
        const pt = quadPoint(p0, pc, p2, frac);
        el!.setAttribute('cx', String(pt.x));
        el!.setAttribute('cy', String(pt.y));
        el!.style.opacity = frac < 0.92 ? '0.9' : String(0.9 * (1 - (frac - 0.92) / 0.08));
        if (frac < 1) requestAnimationFrame(step);
        else el!.style.opacity = '0';
      }
      requestAnimationFrame(step);
    });
  }

  function applyCauseChange(key: CauseKey, value: number) {
    const next: CauseState = { ...causeState, [key]: value };
    setCauseState(next);
    firePulse(key, next);
  }

  // ------------------------------------------------------------- dragging

  function updateFromClientY(key: CauseKey, clientY: number) {
    const frameEl = frameRef.current;
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    if (rect.height === 0) return;
    const frac = clamp01((clientY - rect.top) / rect.height);
    applyCauseChange(key, causeValueFromY(key, frac));
  }

  function handlePuckPointerDown(key: CauseKey, e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingKeyRef.current = key;
    e.currentTarget.classList.add('is-dragging');
    updateFromClientY(key, e.clientY);
  }
  function handlePuckPointerMove(key: CauseKey, e: React.PointerEvent<HTMLButtonElement>) {
    if (draggingKeyRef.current !== key) return;
    updateFromClientY(key, e.clientY);
  }
  function handlePuckPointerUp(key: CauseKey, e: React.PointerEvent<HTMLButtonElement>) {
    if (draggingKeyRef.current === key) draggingKeyRef.current = null;
    e.currentTarget.classList.remove('is-dragging');
  }

  // R30: dragging is never the only way to operate this. Up/Down nudges by
  // CAUSE_STEP; Home/End jump straight to the track's extremes — the one
  // capability the FE-0 prototype's own puck (Up/Down only) did not have.
  function handlePuckKeyDown(key: CauseKey, e: React.KeyboardEvent<HTMLButtonElement>) {
    const current = causeState[key];
    let next: number | null = null;
    if (e.key === 'ArrowUp') next = clamp01(current + CAUSE_STEP);
    else if (e.key === 'ArrowDown') next = clamp01(current - CAUSE_STEP);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 1;
    if (next === null) return;
    e.preventDefault();
    applyCauseChange(key, next);
  }

  // ---------------------------------------------------------------- text

  function measuredCell(key: DerivedKey) {
    if (!selected) {
      return (
        <span className="graph-row-measured is-empty">{t(locale, 'learn.graph.measuredNoMaterial')}</span>
      );
    }
    const point = measuredPointFor(selected, key);
    const mark = provenanceMark(point);
    if (!point) {
      return (
        <span className="graph-row-measured is-empty">
          {fillTemplate(t(locale, 'learn.graph.measuredMissing'), { material: materialName(selected) })}
        </span>
      );
    }
    return (
      <span className="graph-row-measured num" dir="ltr">
        {point.display ?? point.value}
        <span className={`graph-row-mark st-${mark}`} title={t(locale, markLabelKey(mark))}>
          {markGlyph(mark)}
        </span>
      </span>
    );
  }

  function rowInfoText(key: DerivedKey): string {
    if (!selected) return t(locale, 'learn.graph.rowInfo.noMaterial');
    const point = measuredPointFor(selected, key);
    if (!point) {
      return fillTemplate(t(locale, 'learn.graph.rowInfo.noMeasured'), { material: materialName(selected) });
    }
    const statusLabel = t(locale, point.cited ? 'learn.graph.markSourced' : 'learn.graph.markUnsourced');
    return fillTemplate(t(locale, 'learn.graph.rowInfo.withMeasured'), {
      value: point.display ?? String(point.value),
      unit: DERIVED_UNIT[key],
      material: materialName(selected),
      status: statusLabel,
    });
  }

  const figureAriaLabel = selected
    ? fillTemplate(t(locale, 'learn.graph.figureAriaLabel'), { material: materialName(selected) })
    : t(locale, 'learn.graph.figureAriaLabelGeneric');

  return (
    <div className="graph-body" data-testid="graph-island" id="graph-island">
      <div className="learn-field">
        <label className="learn-label" htmlFor="graph-material">
          {t(locale, 'learn.graph.materialLabel')}
        </label>
        <select
          id="graph-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          data-testid="graph-material-select"
        >
          <option value="">{t(locale, 'learn.graph.materialDefault')}</option>
          {allMaterials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {materialName(m)}
            </option>
          ))}
        </select>
        {fetchStatus === 'loading' && (
          <span className="learn-hint" role="status" aria-live="polite">
            {t(locale, 'learn.graph.materialLoading')}
          </span>
        )}
        {fetchStatus === 'error' && <span className="learn-hint">{t(locale, 'learn.graph.materialError')}</span>}
        {selected && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="graph-bound-note">
            {fillTemplate(t(locale, 'learn.graph.boundNote'), { material: materialName(selected) })}
          </p>
        )}
        {!selected && fetchStatus === 'ready' && (
          <p className="learn-note" data-testid="graph-no-selection">
            {t(locale, 'learn.graph.noSelectionNote')}
          </p>
        )}
      </div>

      <p className="graph-drag-hint">{t(locale, 'learn.graph.dragHint')}</p>

      <div className="graph-stage">
        <div className="graph-figure">
          <div className="graph-legend">
            <span>
              <i className="gsw-cause" />
              {t(locale, 'learn.graph.legend.cause')}
            </span>
            <span>
              <i className="gsw-derived" />
              {t(locale, 'learn.graph.legend.derived')}
            </span>
            <span>
              <i className="gsw-outcome" />
              {t(locale, 'learn.graph.legend.outcome')}
            </span>
          </div>

          <div className="graph-svg-frame" ref={frameRef}>
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="graph-svg"
              role="img"
              aria-label={figureAriaLabel}
              style={{ direction: locale === 'fa' ? 'rtl' : 'ltr' } as CSSProperties}
            >
              <defs>
                <marker
                  id="graph-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" className="gedge-arrow-fill" />
                </marker>
              </defs>

              {EDGES.map((e) => {
                const { p0, pc, p2 } = edgeQuad(e, causeState, locale);
                const mid = quadPoint(p0, pc, p2, 0.52);
                return (
                  <g key={edgeKey(e)}>
                    <path
                      className={`gedge-path${e.sign < 0 ? ' sign-neg' : ''}`}
                      d={`M${p0.x},${p0.y} Q${pc.x},${pc.y} ${p2.x},${p2.y}`}
                      markerEnd="url(#graph-arrow)"
                    />
                    <text
                      className={`gedge-sign ${e.sign > 0 ? 'sign-pos' : 'sign-neg'}`}
                      x={mid.x}
                      y={mid.y - 5}
                    >
                      {e.sign > 0 ? '↑' : '↓'}
                    </text>
                    <circle
                      ref={(el) => {
                        pulseRefs.current[edgeKey(e)] = el;
                      }}
                      className="gedge-pulse"
                      r={4}
                      cx={p0.x}
                      cy={p0.y}
                    />
                  </g>
                );
              })}

              {DERIVED_KEYS.map((key) => {
                const pt = pxPoint(key, causeState, locale);
                const symKey = DERIVED_SYM_KEY[key];
                const label = symKey ? `${t(locale, DERIVED_LABEL_KEY[key])} · ${t(locale, symKey)}` : t(locale, DERIVED_LABEL_KEY[key]);
                const mark = provenanceMark(measuredPointFor(selected, key));
                return (
                  <g className="gnode gnode-derived" key={key}>
                    <circle className="gnode-derived-circle" r={30} cx={pt.x} cy={pt.y} />
                    <text className="gnode-label" x={pt.x} y={pt.y - 42} style={{ unicodeBidi: 'isolate' } as CSSProperties}>
                      {label}
                    </text>
                    <text className="gnode-trend-val num" x={pt.x} y={pt.y + 2}>
                      {Math.round(trend[key] * 100)}%
                    </text>
                    <text className="gnode-sub" x={pt.x} y={pt.y + 16}>
                      {t(locale, 'learn.graph.trendLabel')}
                    </text>
                    <text className="gnode-caption" x={pt.x} y={pt.y + 44}>
                      {t(locale, 'learn.graph.trendCaption')}
                    </text>
                    <g className={`gmark-badge st-${mark}`} transform={`translate(${pt.x + 24}, ${pt.y - 24})`}>
                      <circle r={8} />
                      <text textAnchor="middle" dy="3">
                        {markGlyph(mark)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {OUTCOME_KEYS.map((key) => {
                const pt = pxPoint(key, causeState, locale);
                const suited = outcomes[key];
                return (
                  <g className={`gnode gnode-outcome${suited ? ' is-suited' : ''}`} key={key}>
                    <polygon className={`gnode-outcome-hex${suited ? ' is-suited' : ''}`} points={hexPoints(pt.x, pt.y, 34)} />
                    <text className="gnode-label" x={pt.x} y={pt.y - 2} style={{ unicodeBidi: 'isolate' } as CSSProperties}>
                      {t(locale, OUTCOME_LABEL_KEY[key])}
                    </text>
                    <text className="gnode-sub" x={pt.x} y={pt.y + 14}>
                      {t(locale, suited ? 'learn.graph.outcomeSuited' : 'learn.graph.outcomeUnsuited')}
                    </text>
                  </g>
                );
              })}

              {CAUSE_KEYS.map((key) => {
                const x = xForCol(CAUSE_LAYOUT[key].col, locale);
                const yTop = yForFrac(CAUSE_LAYOUT[key].trackTop);
                const yBottom = yForFrac(CAUSE_LAYOUT[key].trackBottom);
                return (
                  <g className="gnode gnode-cause" key={key}>
                    <line className="gnode-cause-track" x1={x} x2={x} y1={yTop} y2={yBottom} />
                    <text className="gnode-sub" x={x} y={yBottom + 16}>
                      {t(locale, CAUSE_LO_KEY[key])}
                    </text>
                    <text className="gnode-sub" x={x} y={yTop - 8}>
                      {t(locale, CAUSE_HI_KEY[key])}
                    </text>
                    <text className="gnode-label" x={x} y={yTop - 22} fontWeight={600} style={{ unicodeBidi: 'isolate' } as CSSProperties}>
                      {t(locale, CAUSE_LABEL_KEY[key])}
                    </text>
                  </g>
                );
              })}
            </svg>

            {CAUSE_KEYS.map((key) => {
              const x = xForCol(CAUSE_LAYOUT[key].col, locale);
              const y = yForFrac(causePuckY(key, causeState[key]));
              const percentNow = Math.round(causeState[key] * 100);
              return (
                <button
                  key={key}
                  type="button"
                  className="graph-puck-btn"
                  style={{ left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%` } as CSSProperties}
                  role="slider"
                  aria-orientation="vertical"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentNow}
                  aria-valuetext={fillTemplate(t(locale, 'learn.graph.puckValueLabel'), {
                    label: t(locale, CAUSE_LABEL_KEY[key]),
                    percent: String(percentNow),
                  })}
                  aria-label={t(locale, CAUSE_LABEL_KEY[key])}
                  onPointerDown={(e) => handlePuckPointerDown(key, e)}
                  onPointerMove={(e) => handlePuckPointerMove(key, e)}
                  onPointerUp={(e) => handlePuckPointerUp(key, e)}
                  onPointerCancel={(e) => handlePuckPointerUp(key, e)}
                  onKeyDown={(e) => handlePuckKeyDown(key, e)}
                  data-testid={`graph-puck-${key}`}
                />
              );
            })}
          </div>
        </div>

        <aside className="graph-panel">
          <h2>{t(locale, 'learn.graph.panelTitle')}</h2>
          {DERIVED_KEYS.map((key) => {
            const symKey = DERIVED_SYM_KEY[key];
            return (
              <div className="graph-row" key={key} data-testid={`graph-row-${key}`}>
                <div className="graph-row-name">
                  <span>{t(locale, DERIVED_LABEL_KEY[key])}</span>
                  {symKey && <span className="sym">{t(locale, symKey)}</span>}
                </div>
                <div className="graph-row-vals">
                  <div className="graph-row-cell">
                    <span className="graph-row-cell-label">{t(locale, 'learn.graph.measuredLabel')}</span>
                    {measuredCell(key)}
                  </div>
                  <div className="graph-row-cell">
                    <span className="graph-row-cell-label">{t(locale, 'learn.graph.trendLabel')}</span>
                    <span className="graph-row-trend num" dir="ltr" data-testid={`graph-trend-${key}`}>
                      {Math.round(trend[key] * 100)}%
                    </span>
                  </div>
                </div>
                <div className="graph-row-tag">
                  <span>{t(locale, 'learn.graph.trendCaption')}</span>
                  <span className="graph-info" tabIndex={0}>
                    i
                    <span className="pop">{rowInfoText(key)}</span>
                  </span>
                </div>
              </div>
            );
          })}
          <p className="graph-panel-note">{t(locale, 'learn.graph.panelNote')}</p>
        </aside>
      </div>

      <div className="graph-outcomes">
        <h2>{t(locale, 'learn.graph.outcomesTitle')}</h2>
        <div className="graph-outcome-grid">
          {OUTCOME_KEYS.map((key) => (
            <div key={key} className={`goc-card${outcomes[key] ? ' is-suited' : ''}`} data-testid={`graph-outcome-${key}`}>
              <div className="goc-title">
                <span>{t(locale, OUTCOME_LABEL_KEY[key])}</span>
                <span className="goc-flag">{t(locale, outcomes[key] ? 'learn.graph.outcomeSuited' : 'learn.graph.outcomeUnsuited')}</span>
              </div>
              <p>{t(locale, OUTCOME_COPY_KEY[key])}</p>
            </div>
          ))}
        </div>
      </div>

      <details className="graph-relations" data-testid="graph-relations">
        <summary>{t(locale, 'learn.graph.relationsTitle')}</summary>
        <p className="graph-relations-intro">{t(locale, 'learn.graph.relationsIntro')}</p>
        <ul className="graph-relations-list">
          {EDGES.map((e) => (
            <li key={edgeKey(e)}>
              {fillTemplate(t(locale, e.sign > 0 ? 'learn.graph.relation.pos' : 'learn.graph.relation.neg'), {
                from: t(locale, nodeLabelKey(e.from)),
                to: t(locale, nodeLabelKey(e.to)),
              })}
            </li>
          ))}
        </ul>
      </details>

      <div className="graph-closing">
        <p>{t(locale, 'learn.graph.closingNote')}</p>
      </div>
    </div>
  );
}
