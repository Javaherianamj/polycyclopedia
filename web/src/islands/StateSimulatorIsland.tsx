// FE-8 step 1 — StateSimulator. Ported from the legacy `src/components/
// StateSimulator.tsx` (frozen reference, not edited): move a temperature
// slider and watch a polymer cross glassy -> rubbery -> melt -> degradation.
// The mechanism is true of every polymer and needs no database value (FE-8
// build brief) -- this is why it is one of the two tools step 1 ships.
//
// Two deliberate departures from the legacy component:
//
// 1. R5 ("nothing inferred, filled to make a layout look complete"): the
//    legacy version always had a real `polymer` prop. This one defaults to
//    an ILLUSTRATIVE example (round textbook numbers, explicitly captioned
//    as not-measured, `learn.state.illustrativeNote`) and only switches to a
//    real material's Tg/Tm/Td when the reader deliberately picks one from
//    `fetchLearnMaterials()`'s optional seed list. It never silently
//    presents an invented number as if it were a specific material's fact.
// 2. R7 ("declares its data dependencies, renders nothing when unmet" --
//    applied per-dependency here, not to the whole tool, per the FE-8 brief):
//    the material picker is the dependency. A failed or empty fetch just
//    means the picker offers only the illustrative example -- the simulator
//    itself always renders and is always interactive.
//
// D37/R34: colour is the --ramp-* sequential scale (tokens/colour.css),
// never the datasheet's status hues (--ok/--act/--warn) -- --ramp-* encodes
// a NUMBER (temperature/phase), which is exactly what R34 reserves it for.
// The one status-palette colour used here is --muted, for the "unsourced"
// tag on a real material's marker (R1/R22) -- provenance state, not
// temperature, so it correctly stays outside --ramp-*.
//
// FE-8 foundation layer, part 1 — owner, verbatim: "pay attention, when
// entering from a polymer datasheet, all defaults must be this polymer."
// Before this revision, this island never looked at the URL at all and
// always opened on the illustrative example, no matter how the reader
// arrived (only HansenSpaceIsland read `?material=`). It now binds through
// `lib/learn/material-context.ts`'s shared hook: a bound material WITH a
// Tg on record seeds `selectedSlug` exactly as if the reader had picked it
// from the dropdown themselves (so the honesty labelling below -- the
// illustrative note only shows for an unselected/illustrative state -- is
// unchanged, not special-cased), and a bound material WITHOUT a Tg says so
// explicitly (`boundNoDataNote`) rather than silently keeping the
// illustrative numbers as if they belonged to it.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import {
  classifyPhase,
  isAmorphous,
  percentAlong,
  sliderRange,
  type ThermalPhase,
  type ThermalThresholds,
} from '../lib/learn/thermal';

interface StateSimulatorIslandProps {
  locale: Locale;
}

// Round, textbook-plausible numbers for a generic semi-crystalline
// thermoplastic -- NOT attributed to any real material (R5). Presented only
// under `learn.state.illustrativeNote`, never as a citable fact.
const ILLUSTRATIVE: ThermalThresholds = { tg: -20, tm: 130, degradationTemp: 300 };

const ROOM_TEMP = 25;

function phaseLabelKey(
  phase: ThermalPhase,
  amorphous: boolean,
): { title: MessageKey; desc: MessageKey } {
  if (phase === 'glass') return { title: 'learn.state.phase.glass.title', desc: 'learn.state.phase.glass.desc' };
  if (phase === 'rubber')
    return { title: 'learn.state.phase.rubber.title', desc: 'learn.state.phase.rubber.desc' };
  if (phase === 'burn') return { title: 'learn.state.phase.burn.title', desc: 'learn.state.phase.burn.desc' };
  return amorphous
    ? { title: 'learn.state.phase.meltAmorphous.title', desc: 'learn.state.phase.meltAmorphous.desc' }
    : { title: 'learn.state.phase.meltCrystalline.title', desc: 'learn.state.phase.meltCrystalline.desc' };
}

const RAMP_VAR: Record<ThermalPhase, string> = {
  glass: 'var(--ramp-glass)',
  rubber: 'var(--ramp-rubber)',
  melt: 'var(--ramp-melt)',
  burn: 'var(--ramp-burn)',
};

export default function StateSimulatorIsland({ locale }: StateSimulatorIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [temp, setTemp] = useState<number>(ROOM_TEMP);
  // Guards the bound-material auto-seed to fire once — see ChainCoilIsland's
  // identical guard for why this is a ref (must not itself trigger a
  // render) and why the seed applies in an effect rather than at
  // useState-init time (the bound material is not known until the shared
  // hook's own post-mount URL-read effect has run).
  const seededRef = useRef(false);

  // This tool's own R7 dependency: the material PICKER needs a Tg to be
  // useful (StateSimulator cannot classify a phase without one), so the
  // dropdown -- and the seeding effect below -- only ever consider
  // materials with `.thermal` on record. The full, unfiltered catalog stays
  // available as `allMaterials` purely to tell a bound-but-Tg-less material
  // apart from an unrecognised slug (`boundNoDataNote` vs. silent fallback).
  const materials = useMemo(() => allMaterials.filter((m) => m.thermal != null), [allMaterials]);

  useEffect(() => {
    if (seededRef.current || fetchStatus !== 'ready') return;
    seededRef.current = true;
    if (boundMaterial?.thermal) setSelectedSlug(boundMaterial.slug);
  }, [fetchStatus, boundMaterial]);

  const selected = materials.find((m) => m.slug === selectedSlug) ?? null;

  const thresholds: ThermalThresholds = useMemo(() => {
    if (selected?.thermal) {
      return {
        tg: selected.thermal.tg.value,
        tm: selected.thermal.tm?.value ?? null,
        degradationTemp: selected.thermal.degradationTemp?.value ?? null,
      };
    }
    return ILLUSTRATIVE;
  }, [selected]);

  const range = useMemo(() => sliderRange(thresholds), [thresholds]);
  const amorphous = isAmorphous(thresholds);
  const phase = classifyPhase(temp, thresholds);
  const labels = phaseLabelKey(phase, amorphous);
  const fillPct = percentAlong(temp, range.min, range.max);
  const color = RAMP_VAR[phase];

  function handleMaterialChange(slug: string) {
    setSelectedSlug(slug);
    const next = materials.find((m) => m.slug === slug) ?? null;
    const nextThresholds: ThermalThresholds = next?.thermal
      ? {
          tg: next.thermal.tg.value,
          tm: next.thermal.tm?.value ?? null,
          degradationTemp: next.thermal.degradationTemp?.value ?? null,
        }
      : ILLUSTRATIVE;
    const nextRange = sliderRange(nextThresholds);
    setTemp(Math.min(nextRange.max, Math.max(nextRange.min, ROOM_TEMP)));
  }

  const tgMarkerPct = percentAlong(thresholds.tg, range.min, range.max);
  const tmMarkerPct = thresholds.tm != null ? percentAlong(thresholds.tm, range.min, range.max) : null;
  const tdMarkerPct =
    thresholds.degradationTemp != null
      ? percentAlong(thresholds.degradationTemp, range.min, range.max)
      : null;

  return (
    <div className="learn-tool" data-testid="state-simulator" id="state-simulator">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.state.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.state.intro')}</p>
      </div>

      <div className="learn-field">
        <label className="learn-label" htmlFor="state-sim-material">
          {t(locale, 'learn.state.materialLabel')}
        </label>
        <select
          id="state-sim-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => handleMaterialChange(e.target.value)}
          data-testid="state-simulator-material-select"
        >
          <option value="">{t(locale, 'learn.state.materialDefault')}</option>
          {materials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {locale === 'fa' ? m.nameFa : m.nameEn}
            </option>
          ))}
        </select>
        {fetchStatus === 'loading' && (
          <span className="learn-hint" role="status" aria-live="polite">
            {t(locale, 'learn.state.materialLoading')}
          </span>
        )}
        {selected && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="state-simulator-bound-note">
            {t(locale, 'learn.state.boundNote').replace(
              '{material}',
              locale === 'fa' ? selected.nameFa : selected.nameEn,
            )}
          </p>
        )}
        {!selected && boundMaterial && !boundMaterial.thermal && (
          <p className="learn-hint" data-testid="state-simulator-bound-no-data-note">
            {t(locale, 'learn.state.boundNoDataNote').replace(
              '{material}',
              locale === 'fa' ? boundMaterial.nameFa : boundMaterial.nameEn,
            )}
          </p>
        )}
        {!selected && (
          <p className="learn-note">{t(locale, 'learn.state.illustrativeNote')}</p>
        )}
      </div>

      <div className="state-sim-body">
        <div className="state-sim-thermo" aria-hidden="true">
          <span className="state-sim-thermo-cap num" dir="ltr">
            {Math.round(range.max)}°C
          </span>
          <div className="state-sim-tube">
            <div
              className="state-sim-fill"
              style={{ height: `${fillPct}%`, background: color }}
            />
          </div>
          <span className="state-sim-thermo-cap num" dir="ltr">
            {Math.round(range.min)}°C
          </span>
        </div>

        <div className="state-sim-controls">
          <div className="state-sim-readout">
            <span className="learn-label" id="state-sim-slider-label">
              {t(locale, 'learn.state.tempLabel')}
            </span>
            <span className="state-sim-value num" style={{ color }} dir="ltr">
              {temp}°C
            </span>
            <button
              type="button"
              className="learn-reset"
              onClick={() => setTemp(ROOM_TEMP)}
              data-testid="state-simulator-reset"
            >
              {t(locale, 'learn.state.resetLabel')}
            </button>
          </div>

          <div className="state-sim-slider-wrap" dir="ltr">
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={2}
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              aria-labelledby="state-sim-slider-label"
              className="state-sim-slider"
              data-testid="state-simulator-slider"
            />
            <div className="state-sim-marks" aria-hidden="true">
              <button
                type="button"
                className="state-sim-mark"
                style={{ insetInlineStart: `${tgMarkerPct}%`, color: 'var(--ramp-glass)' }}
                onClick={() => setTemp(Math.round(thresholds.tg))}
              >
                <span className="state-sim-mark-dot" />
                <span className="state-sim-mark-label num">Tg</span>
              </button>
              {tmMarkerPct != null && (
                <button
                  type="button"
                  className="state-sim-mark"
                  style={{ insetInlineStart: `${tmMarkerPct}%`, color: 'var(--ramp-rubber)' }}
                  onClick={() => setTemp(Math.round(thresholds.tm as number))}
                >
                  <span className="state-sim-mark-dot" />
                  <span className="state-sim-mark-label num">Tm</span>
                </button>
              )}
              {tdMarkerPct != null && (
                <button
                  type="button"
                  className="state-sim-mark"
                  style={{ insetInlineStart: `${tdMarkerPct}%`, color: 'var(--ramp-burn)' }}
                  onClick={() => setTemp(Math.round(thresholds.degradationTemp as number))}
                >
                  <span className="state-sim-mark-dot" />
                  <span className="state-sim-mark-label num">Td</span>
                </button>
              )}
            </div>
          </div>

          {selected?.thermal && (
            <p className="learn-note" data-testid="state-simulator-provenance">
              {!selected.thermal.tg.cited && `Tg: ${t(locale, 'learn.state.uncited')}`}
              {selected.thermal.tm && !selected.thermal.tm.cited && ` · Tm: ${t(locale, 'learn.state.uncited')}`}
              {selected.thermal.degradationTemp &&
                !selected.thermal.degradationTemp.cited &&
                ` · Td: ${t(locale, 'learn.state.uncited')}`}
            </p>
          )}

          <div className="state-sim-phase" style={{ borderInlineStartColor: color }}>
            <p className="state-sim-phase-title" style={{ color }}>
              {t(locale, labels.title)}
            </p>
            <p className="state-sim-phase-desc">{t(locale, labels.desc)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
