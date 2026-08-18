// L2 — «نقشه» / MAP (lab-concepts-spec.md). The modulus–temperature master
// curve IS the menu: a draggable marker on the curve swaps the tray of
// tools beneath it by physical regime, and a separate section holds the
// tools that are genuinely not temperature-dependent rather than forcing
// them onto the curve (the spec's own words: "being honest about what does
// not fit is part of the design").
//
// PHYSICS lives in lib/learn/thermal.ts (already built for StateSimulator,
// reused here rather than re-derived — see modulus-curve.ts's header) and
// lib/learn/modulus-curve.ts (this concept's own curve model). REGION-TO-
// TOOL gating lives in lib/learn/map-tray.ts. This file is deliberately
// "thin" per the build brief: state, geometry-to-pixels, DOM events and
// i18n only.
//
// THE ONE THING THIS FILE MUST NEVER DO: draw a curve from illustrative
// constants. Unlike StateSimulatorIsland (which has a textbook-plausible
// unattributed default so the tool always works even with no material
// picked), MAP has NO default material — the spec's whole point is that
// this specific material's real Tg/Tm/Td produce the shape. So the island
// has no plot at all until a material with `.thermal` is selected, and it
// says so honestly rather than falling back to a fake curve (R5/R7).
//
// RTL DECISION (build brief: "the axis direction is a real decision, not an
// accident"): the plot itself — the SVG, its marker, its numeric axis — is
// forced `dir="ltr"` regardless of page locale, exactly like
// StateSimulatorIsland's `.state-sim-slider-wrap` and the FE-0 prototype
// this ports from. Temperature increasing left-to-right and modulus
// increasing upward is the universal convention every polymer engineer
// reads this exact chart type in, in either language — mirroring it for
// Persian would make the chart WRONG, not merely relocalised (R6 already
// draws this same line for numerals; a whole chart is the same principle at
// a larger scale). Every surrounding text element (labels, readout, tray)
// stays fully logical/RTL-aware.
//
// ACCESSIBILITY (R30): the marker is a real HTML <button role="slider">,
// not an SVG element with a hand-rolled hit box. Two reasons: (1) a fixed
// 44px CSS pointer target is trivial to guarantee on an HTML element and
// fragile on an SVG shape that is scaled by a responsive viewBox — an SVG
// circle sized to look right at 900px doesn't stay 44px on a 320px screen;
// (2) native keyboard focus and :focus-visible styling are simpler to get
// right on a <button> than on an SVG element (which needs tabIndex plumbing
// and cross-browser focus-ring quirks). The SVG draws the marker's visual
// LINE only (non-interactive); the button supplies the touch target, the
// visible dot (via CSS), and all keyboard/pointer handling, positioned over
// the SVG by percentage so it tracks the same coordinate space exactly.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import type { LearnMaterial } from '../lib/learn/fetch-learn-materials';
import { buildMaterialParam } from '../lib/learn/learn-url-state';
import { classifyPhase, type ThermalPhase, type ThermalThresholds } from '../lib/learn/thermal';
import {
  buildModulusCurve,
  curveLogEAt,
  fmtModulus,
  type ModulusCurveModel,
} from '../lib/learn/modulus-curve';
import { ALL_MAP_TOOLS, isToolActive, type MapToolKey } from '../lib/learn/map-tray';

interface MapIslandProps {
  locale: Locale;
}

const ROOM_TEMP = 25;

// ------------------------------------------------------------------ geometry
//
// The SVG's own internal coordinate system. Fixed regardless of the
// material's actual temperature range — xOf/yOf below remap real units into
// this box, so the same viewBox always fits whatever range sliderRange()
// produced (a few hundred degrees for HDPE, a couple hundred for PMMA).
const VB_W = 900;
const VB_H = 460;
const MARGIN = { l: 62, r: 20, t: 22, b: 50 };
const PLOT_W = VB_W - MARGIN.l - MARGIN.r;
const PLOT_H = VB_H - MARGIN.t - MARGIN.b;

const RAMP_VAR: Record<ThermalPhase, string> = {
  glass: 'var(--ramp-glass)',
  rubber: 'var(--ramp-rubber)',
  melt: 'var(--ramp-melt)',
  burn: 'var(--ramp-burn)',
};

function phaseLabelKeys(phase: ThermalPhase, amorphous: boolean): { title: MessageKey; desc: MessageKey } {
  if (phase === 'glass') return { title: 'learn.map.phase.glass.title', desc: 'learn.map.phase.glass.desc' };
  if (phase === 'rubber') return { title: 'learn.map.phase.rubber.title', desc: 'learn.map.phase.rubber.desc' };
  if (phase === 'burn') return { title: 'learn.map.phase.burn.title', desc: 'learn.map.phase.burn.desc' };
  return amorphous
    ? { title: 'learn.map.phase.meltAmorphous.title', desc: 'learn.map.phase.meltAmorphous.desc' }
    : { title: 'learn.map.phase.meltCrystalline.title', desc: 'learn.map.phase.meltCrystalline.desc' };
}

const TOOL_LABEL_KEY: Record<MapToolKey, MessageKey> = {
  izodImpact: 'learn.map.tray.izodImpact.label',
  crystallinityDensity: 'learn.map.tray.crystallinityDensity.label',
  branchingSimulator: 'learn.map.tray.branchingSimulator.label',
  tensileElongation: 'learn.map.tray.tensileElongation.label',
  mfi: 'learn.map.tray.mfi.label',
  processTemp: 'learn.map.tray.processTemp.label',
  burnNote: 'learn.map.tray.burnNote.label',
};

function isChipLocked(tool: MapToolKey, selected: LearnMaterial): boolean {
  switch (tool) {
    case 'izodImpact':
      return !selected.izodImpact;
    case 'tensileElongation':
      return !selected.tensileStrength && !selected.elongationAtBreak;
    case 'mfi':
      return !selected.mfi;
    case 'processTemp':
      return !selected.processTemp;
    // crystallinityDensity/branchingSimulator are navigation links into
    // SCALE's own tools, which already render their own honest empty state
    // for a material lacking their data — a second "locked" layer here
    // would just duplicate that message one page early. burnNote needs no
    // material-specific data at all.
    default:
      return false;
  }
}

const OFF_CURVE_TOOLS = [
  { id: 'hansen-space', labelKey: 'learn.map.offcurve.hansen.label', hintKey: 'learn.map.offcurve.hansen.hint' },
  { id: 'dp-calculator', labelKey: 'learn.map.offcurve.dp.label', hintKey: 'learn.map.offcurve.dp.hint' },
  { id: 'chain-coil', labelKey: 'learn.map.offcurve.chainCoil.label', hintKey: 'learn.map.offcurve.chainCoil.hint' },
  {
    id: 'tacticity-simulator',
    labelKey: 'learn.map.offcurve.tacticity.label',
    hintKey: 'learn.map.offcurve.tacticity.hint',
  },
] as const satisfies readonly { id: string; labelKey: MessageKey; hintKey: MessageKey }[];

/** "Nice" x-axis tick spacing for whatever temperature range this material's
 * thresholds produced (sliderRange()'s span varies a great deal — a few
 * hundred degrees for one material, close to a thousand for another). Picks
 * the candidate step whose resulting tick COUNT is closest to 6, which is
 * plainly presentational (nobody claims these round numbers are landmarks)
 * so it lives here rather than in modulus-curve.ts. */
function pickXStep(range: number): number {
  const target = range / 6;
  const candidates = [10, 20, 25, 50, 100, 150, 200, 250, 500];
  return candidates.reduce((best, c) => (Math.abs(c - target) < Math.abs(best - target) ? c : best));
}

function buildXTicks(tMin: number, tMax: number): number[] {
  const step = pickXStep(tMax - tMin);
  const start = Math.ceil(tMin / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= tMax; v += step) ticks.push(v);
  return ticks;
}

function fmtYTick(y: number): string {
  const gpa = Math.pow(10, y);
  return gpa >= 1 ? String(Math.round(gpa)) : gpa.toFixed(Math.max(0, -Math.round(y)));
}

interface Band {
  phase: ThermalPhase;
  from: number;
  to: number;
}

/** Region bands drawn behind the curve, derived from the SAME thresholds
 * object `classifyPhase` reads — never from the curve's own control points
 * — so the coloured bands and the marker's reported phase can never drift
 * apart from each other. */
function computeBands(thresholds: ThermalThresholds, amorphous: boolean, tMin: number, tMax: number): Band[] {
  const bands: Band[] = [{ phase: 'glass', from: tMin, to: thresholds.tg }];
  let meltStart = thresholds.tg;
  if (!amorphous && thresholds.tm != null) {
    bands.push({ phase: 'rubber', from: thresholds.tg, to: thresholds.tm });
    meltStart = thresholds.tm;
  }
  const meltEnd = thresholds.degradationTemp ?? tMax;
  bands.push({ phase: 'melt', from: meltStart, to: meltEnd });
  if (thresholds.degradationTemp != null) {
    bands.push({ phase: 'burn', from: thresholds.degradationTemp, to: tMax });
  }
  return bands;
}

/** Splits the model's already-piecewise-linear control points into a solid
 * run (up to `dashFrom`, or everything when there is none) and a dashed run
 * after it — see modulus-curve.ts's `dashFrom` doc for why only a REAL
 * degradation temperature earns a dashed tail. Because the curve is a
 * polyline, not a sampled continuous function, splitting the point list is
 * exact; no resampling is needed. */
function splitForDash(model: ModulusCurveModel): { solid: { t: number; logE: number }[]; dashed: { t: number; logE: number }[] } {
  if (model.dashFrom == null) return { solid: model.points, dashed: [] };
  const cut = model.dashFrom;
  const cutLogE = curveLogEAt(model, cut);
  const solid = model.points.filter((p) => p.t <= cut);
  if (solid[solid.length - 1]?.t !== cut) solid.push({ t: cut, logE: cutLogE });
  const dashed = [{ t: cut, logE: cutLogE }, ...model.points.filter((p) => p.t > cut)];
  return { solid, dashed };
}

function pathFrom(points: { t: number; logE: number }[], xOf: (t: number) => number, yOf: (y: number) => number): string {
  if (points.length === 0) return '';
  return 'M' + points.map((p) => `${xOf(p.t).toFixed(1)},${yOf(p.logE).toFixed(1)}`).join(' L');
}

export default function MapIsland({ locale }: MapIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [temp, setTemp] = useState<number>(ROOM_TEMP);
  const seededRef = useRef(false);
  const draggingRef = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Seeds the picker to the bound material EVEN when it has no thermal data
  // on record — a deliberate departure from StateSimulator/DPCalculator's
  // "only seed when the tool can actually use it" rule. Here, seeding
  // anyway is what LETS the honest empty state name the right material
  // ("PA6 has no Tg on record") instead of silently degrading to an
  // anonymous, unbound "pick a material" screen when the reader arrived
  // from a real datasheet link (owner: "all defaults must be this
  // polymer" — including when the honest answer is "this polymer has
  // nothing to show here").
  useEffect(() => {
    if (seededRef.current || fetchStatus !== 'ready') return;
    seededRef.current = true;
    if (boundMaterial) setSelectedSlug(boundMaterial.slug);
  }, [fetchStatus, boundMaterial]);

  const selected = allMaterials.find((m) => m.slug === selectedSlug) ?? null;

  const thresholds: ThermalThresholds | null = selected?.thermal
    ? {
        tg: selected.thermal.tg.value,
        tm: selected.thermal.tm?.value ?? null,
        degradationTemp: selected.thermal.degradationTemp?.value ?? null,
      }
    : null;

  const model = useMemo(
    () => (thresholds ? buildModulusCurve(thresholds, selected?.youngModulus?.value ?? null) : null),
    [thresholds, selected],
  );

  function seedTempFor(nextModel: ModulusCurveModel) {
    setTemp(Math.min(nextModel.tMax, Math.max(nextModel.tMin, ROOM_TEMP)));
  }

  useEffect(() => {
    if (model) seedTempFor(model);
  }, [selectedSlug]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-seed on a material CHANGE, not on every model recompute (dragging must not reset itself)

  function handleMaterialChange(slug: string) {
    setSelectedSlug(slug);
  }

  const materialsWithThermal = allMaterials.filter((m) => m.thermal != null);
  const materialsWithoutThermal = allMaterials.filter((m) => m.thermal == null);
  const materialName = (m: LearnMaterial) => (locale === 'fa' ? m.nameFa : m.nameEn);

  const phase: ThermalPhase | null = thresholds ? classifyPhase(temp, thresholds) : null;
  const labels = phase && model ? phaseLabelKeys(phase, model.amorphous) : null;

  // ---------------------------------------------------------------- geometry
  const xOf = (t: number) => (model ? MARGIN.l + ((t - model.tMin) / (model.tMax - model.tMin)) * PLOT_W : 0);
  let yMin = -1;
  let yMax = 1;
  if (model) {
    const values = model.points.map((p) => p.logE);
    yMax = Math.ceil((Math.max(...values) + 0.3) * 2) / 2;
    yMin = Math.floor((Math.min(...values) - 0.3) * 2) / 2;
  }
  const yOf = (y: number) => MARGIN.t + ((yMax - y) / (yMax - yMin)) * PLOT_H;

  function clampTemp(v: number): number {
    if (!model) return v;
    return Math.min(model.tMax, Math.max(model.tMin, v));
  }

  function tempFromClientX(clientX: number): number | null {
    if (!model || !frameRef.current) return null;
    const rect = frameRef.current.getBoundingClientRect();
    if (rect.width === 0) return null;
    const frac = (clientX - rect.left) / rect.width;
    return model.tMin + frac * (model.tMax - model.tMin);
  }

  function handleFramePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-map-marker]')) return;
    const v = tempFromClientX(e.clientX);
    if (v != null) setTemp(clampTemp(v));
  }

  function handleMarkerPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    const v = tempFromClientX(e.clientX);
    if (v != null) setTemp(clampTemp(v));
  }

  function handleMarkerPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingRef.current) return;
    const v = tempFromClientX(e.clientX);
    if (v != null) setTemp(clampTemp(v));
  }

  function handleMarkerPointerUp() {
    draggingRef.current = false;
  }

  function handleMarkerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!model) return;
    const step = e.shiftKey ? 25 : 5;
    if (e.key === 'ArrowRight') {
      setTemp((v) => clampTemp(v + step));
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setTemp((v) => clampTemp(v - step));
      e.preventDefault();
    } else if (e.key === 'Home') {
      setTemp(model.tMin);
      e.preventDefault();
    } else if (e.key === 'End') {
      setTemp(model.tMax);
      e.preventDefault();
    }
  }

  const uncited = t(locale, 'learn.map.uncited');
  function landmarkText(label: string, point: { value: number; cited: boolean; display: string | null } | null): string | null {
    if (!point) return null;
    const value = point.display ?? String(point.value);
    return point.cited ? `${label}: ${value}` : `${label}: ${value} (${uncited})`;
  }

  return (
    <div className="map-body" data-testid="map-island" id="map-island">
      <div className="learn-field">
        <label className="learn-label" htmlFor="map-material">
          {t(locale, 'learn.map.materialLabel')}
        </label>
        <select
          id="map-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => handleMaterialChange(e.target.value)}
          data-testid="map-material-select"
        >
          <option value="">{t(locale, 'learn.map.materialDefault')}</option>
          {materialsWithThermal.length > 0 && (
            <optgroup label={t(locale, 'learn.map.materialGroupPlottable')}>
              {materialsWithThermal.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {materialName(m)}
                </option>
              ))}
            </optgroup>
          )}
          {materialsWithoutThermal.length > 0 && (
            <optgroup label={t(locale, 'learn.map.materialGroupNoData')}>
              {materialsWithoutThermal.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {materialName(m)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {fetchStatus === 'loading' && (
          <span className="learn-hint" role="status" aria-live="polite">
            {t(locale, 'learn.map.materialLoading')}
          </span>
        )}
        {fetchStatus === 'error' && <span className="learn-hint">{t(locale, 'learn.map.materialError')}</span>}
        {/* Gated on `thresholds` (not just `selected`) — this note claims a
            map WAS drawn from real data, which is only true when there is a
            Tg to draw from. For a bound material with no thermal data at
            all, the "no thermal data" empty state below already names the
            material and explains why nothing renders; saying "this map is
            drawn from X's real data" right above a section that draws
            nothing would directly contradict it (caught while verifying
            ?material=ps, which has zero property values on record). */}
        {selected && thresholds && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="map-bound-note">
            {t(locale, 'learn.map.boundNote').replace('{material}', materialName(selected))}
          </p>
        )}
        {!selected && fetchStatus === 'ready' && (
          <p className="learn-note" data-testid="map-no-selection">
            {t(locale, 'learn.map.noSelectionNote')}
          </p>
        )}
      </div>

      {selected && !thresholds && (
        <div className="state-empty" data-testid="map-no-thermal">
          <strong>{t(locale, 'learn.map.noThermalTitle').replace('{material}', materialName(selected))}</strong>
          <p>{t(locale, 'learn.map.noThermalBody')}</p>
        </div>
      )}

      {selected && thresholds && model && phase && labels && (
        <>
          <div className="plot-wrap">
            <div
              className="map-plot-frame"
              dir="ltr"
              ref={frameRef}
              onPointerDown={handleFramePointerDown}
            >
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="map-plot"
                role="img"
                aria-label={t(locale, 'learn.map.plotAriaLabel').replace('{material}', materialName(selected))}
              >
                {computeBands(thresholds, model.amorphous, model.tMin, model.tMax).map((b) => (
                  <rect
                    key={b.phase}
                    x={xOf(b.from)}
                    y={MARGIN.t}
                    width={Math.max(0, xOf(b.to) - xOf(b.from))}
                    height={PLOT_H}
                    fill={RAMP_VAR[b.phase]}
                    className="map-band"
                  />
                ))}

                {Array.from({ length: Math.floor(yMax) - Math.ceil(yMin) + 1 }, (_, i) => Math.ceil(yMin) + i).map(
                  (y) => (
                    <g key={y}>
                      <line x1={MARGIN.l} x2={VB_W - MARGIN.r} y1={yOf(y)} y2={yOf(y)} className="map-gridline" />
                      <text x={MARGIN.l - 10} y={yOf(y) + 4} className="map-axis-y num" textAnchor="end">
                        {fmtYTick(y)}
                      </text>
                    </g>
                  ),
                )}

                <line
                  x1={MARGIN.l}
                  x2={VB_W - MARGIN.r}
                  y1={VB_H - MARGIN.b}
                  y2={VB_H - MARGIN.b}
                  className="map-axis-line"
                />
                <line x1={MARGIN.l} x2={MARGIN.l} y1={MARGIN.t} y2={VB_H - MARGIN.b} className="map-axis-line" />

                {buildXTicks(model.tMin, model.tMax).map((tt) => (
                  <text
                    key={tt}
                    x={xOf(tt)}
                    y={VB_H - MARGIN.b + 20}
                    className="map-axis-x num"
                    textAnchor="middle"
                  >
                    {Math.round(tt)}
                  </text>
                ))}

                {(
                  [
                    ['Tg', thresholds.tg],
                    ['Tm', thresholds.tm],
                    ['Td', thresholds.degradationTemp],
                  ] satisfies [string, number | null][]
                )
                  .filter((r): r is [string, number] => r[1] != null)
                  .map(([label, tv]) => (
                    <g key={label}>
                      <line x1={xOf(tv)} x2={xOf(tv)} y1={MARGIN.t} y2={VB_H - MARGIN.b} className="map-refline" />
                      <text x={xOf(tv)} y={MARGIN.t - 7} className="map-ref-label" textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  ))}

                {!model.amorphous && thresholds.tm != null && (
                  <text
                    x={(xOf(thresholds.tg) + xOf(thresholds.tm)) / 2}
                    y={yOf(curveLogEAt(model, (thresholds.tg + thresholds.tm) / 2)) - 14}
                    className="map-plateau-label"
                    textAnchor="middle"
                  >
                    {t(locale, 'learn.map.plateauLabel')}
                  </text>
                )}

                {(() => {
                  const { solid, dashed } = splitForDash(model);
                  return (
                    <>
                      <path d={pathFrom(solid, xOf, yOf)} className="map-curve-solid" fill="none" />
                      {dashed.length > 0 && (
                        <path d={pathFrom(dashed, xOf, yOf)} className="map-curve-dashed" fill="none" />
                      )}
                    </>
                  );
                })()}

                {model.anchoredPhase != null && (
                  <circle
                    cx={xOf(ROOM_TEMP)}
                    cy={yOf(curveLogEAt(model, ROOM_TEMP))}
                    r={4.5}
                    className="map-anchor-dot"
                  />
                )}

                <line
                  x1={xOf(temp)}
                  x2={xOf(temp)}
                  y1={MARGIN.t}
                  y2={VB_H - MARGIN.b}
                  className="map-marker-line"
                  style={{ ['--region-c' as string]: RAMP_VAR[phase] }}
                />

                <text
                  x={MARGIN.l - 46}
                  y={MARGIN.t + 4}
                  className="map-axis-title"
                  transform={`rotate(-90 ${MARGIN.l - 46} ${MARGIN.t + 4})`}
                >
                  {t(locale, 'learn.map.axisYLabel')}
                </text>
                <text x={VB_W - MARGIN.r} y={VB_H - 6} className="map-axis-title" textAnchor="end">
                  {t(locale, 'learn.map.axisXLabel')}
                </text>
              </svg>

              <button
                type="button"
                data-map-marker
                className="map-marker-btn"
                style={
                  {
                    left: `${(xOf(temp) / VB_W) * 100}%`,
                    top: `${(yOf(curveLogEAt(model, temp)) / VB_H) * 100}%`,
                    ['--region-c' as string]: RAMP_VAR[phase],
                  } as CSSProperties
                }
                role="slider"
                aria-orientation="horizontal"
                aria-valuemin={Math.round(model.tMin)}
                aria-valuemax={Math.round(model.tMax)}
                aria-valuenow={Math.round(temp)}
                aria-valuetext={`${Math.round(temp)}°C — ${t(locale, labels.title)}`}
                aria-label={t(locale, 'learn.map.markerLabel')}
                onPointerDown={handleMarkerPointerDown}
                onPointerMove={handleMarkerPointerMove}
                onPointerUp={handleMarkerPointerUp}
                onPointerCancel={handleMarkerPointerUp}
                onKeyDown={handleMarkerKeyDown}
                data-testid="map-marker"
              />
            </div>
          </div>

          <div className="readout">
            <div className="readout-main">
              <span className="ro-temp num" dir="ltr">
                {Math.round(temp)}
              </span>
              <span className="ro-unit" dir="ltr">
                °C
              </span>
              <span
                className="ro-state"
                style={{ background: RAMP_VAR[phase], color: 'var(--on-phase)' }}
                data-testid="map-phase-label"
              >
                {t(locale, labels.title)}
              </span>
            </div>
            <div className="readout-sub">
              <span>{t(locale, 'learn.map.approxModulusLabel')}</span>
              <b className="num" dir="ltr" data-testid="map-modulus-readout">
                {fmtModulus(curveLogEAt(model, temp))}
              </b>
            </div>
            <p className="ro-sentence" data-testid="map-phase-sentence">
              {t(locale, labels.desc)}
            </p>
            <p className="learn-note">
              <a href={`/${locale}/learn?${buildMaterialParam(selected.slug)}#state-simulator`}>
                {t(locale, 'learn.map.stateSimulatorLink')}
              </a>
            </p>

            <p className="ro-caption" data-testid="map-landmarks">
              {t(locale, 'learn.map.landmarksPrefix')}{' '}
              <span dir="ltr" className="num">
                {[
                  landmarkText('Tg', selected.thermal?.tg ?? null),
                  landmarkText('Tm', selected.thermal?.tm ?? null),
                  landmarkText('Td', selected.thermal?.degradationTemp ?? null),
                ]
                  .filter((s): s is string => s != null)
                  .join(' · ')}
              </span>
            </p>
            <p className="ro-caption">{t(locale, 'learn.map.shapeNote')}</p>
            <p className="ro-caption" data-testid="map-anchor-note">
              {model.anchoredPhase != null && selected.youngModulus
                ? t(locale, 'learn.map.anchoredNote')
                    .replace('{material}', materialName(selected))
                    .replace('{value}', fmtModulus(Math.log10(selected.youngModulus.value)))
                : t(locale, 'learn.map.unanchoredNote').replace('{material}', materialName(selected))}
            </p>
          </div>

          <div className="tray" id="map-tray">
            <h2 className="tray-title">{t(locale, 'learn.map.trayTitle')}</h2>
            <div className="tray-grid">
              {ALL_MAP_TOOLS.map((tool) => {
                const active = isToolActive(tool, phase);
                const locked = isChipLocked(tool, selected);
                return (
                  <div
                    key={tool}
                    className={`mchip${active ? ' is-active' : ' is-dim'}${locked ? ' is-locked' : ''}`}
                    data-testid={`map-tray-chip-${tool}`}
                  >
                    <span className="mchip-label">{t(locale, TOOL_LABEL_KEY[tool])}</span>
                    <TrayChipBody tool={tool} locale={locale} selected={selected} uncited={uncited} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {selected && (
        <div className="offcurve">
          <h2 className="tray-title">{t(locale, 'learn.map.offcurveTitle')}</h2>
          <p className="learn-tool-intro">{t(locale, 'learn.map.offcurveIntro')}</p>
          <div className="tray-grid">
            {OFF_CURVE_TOOLS.map((o) => (
              <a
                key={o.id}
                className="mchip off"
                href={`/${locale}/learn?${buildMaterialParam(selected.slug)}#${o.id}`}
                data-testid={`map-offcurve-${o.id}`}
              >
                <span className="mchip-label">{t(locale, o.labelKey)}</span>
                <p className="mchip-note">{t(locale, o.hintKey)}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TrayChipBodyProps {
  tool: MapToolKey;
  locale: Locale;
  selected: LearnMaterial;
  uncited: string;
}

/** The chip's inner content — either a real-data stat, a navigation link
 * into one of SCALE's own tools, a locked/missing-data reason, or (for
 * `burnNote`) a plain informational sentence. Kept as its own component
 * rather than a function returning JSX inline in the map so each branch's
 * `key`-bearing JSX stays simple to read. */
function TrayChipBody({ tool, locale, selected, uncited }: TrayChipBodyProps) {
  const missingReason = t(locale, 'learn.map.tray.missing').replace(
    '{material}',
    locale === 'fa' ? selected.nameFa : selected.nameEn,
  );
  const materialParam = buildMaterialParam(selected.slug);

  switch (tool) {
    case 'izodImpact':
      return selected.izodImpact ? (
        <p className="mchip-note num" dir="ltr">
          {selected.izodImpact.display ?? selected.izodImpact.value}
          {!selected.izodImpact.cited && ` (${uncited})`}
        </p>
      ) : (
        <p className="mchip-reason">{missingReason}</p>
      );
    case 'crystallinityDensity':
      return (
        <a className="mchip-link" href={`/${locale}/learn?${materialParam}#crystallinity-density`}>
          {t(locale, 'learn.map.tray.crystallinityDensity.cta')}
        </a>
      );
    case 'branchingSimulator':
      return (
        <a className="mchip-link" href={`/${locale}/learn?${materialParam}#branching-simulator`}>
          {t(locale, 'learn.map.tray.branchingSimulator.cta')}
        </a>
      );
    case 'tensileElongation':
      return selected.tensileStrength || selected.elongationAtBreak ? (
        <p className="mchip-note num" dir="ltr">
          {[selected.tensileStrength?.display, selected.elongationAtBreak?.display].filter(Boolean).join(' · ')}
        </p>
      ) : (
        <p className="mchip-reason">{missingReason}</p>
      );
    case 'mfi':
      return selected.mfi ? (
        <p className="mchip-note num" dir="ltr">
          {selected.mfi.display}
        </p>
      ) : (
        <p className="mchip-reason">{missingReason}</p>
      );
    case 'processTemp':
      return selected.processTemp ? (
        <p className="mchip-note num" dir="ltr">
          {selected.processTemp.display}
        </p>
      ) : (
        <p className="mchip-reason">{missingReason}</p>
      );
    case 'burnNote':
      return <p className="mchip-note">{t(locale, 'learn.map.tray.burnNote.note')}</p>;
  }
}
