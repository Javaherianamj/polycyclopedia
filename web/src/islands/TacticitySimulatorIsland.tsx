// FE-8 step 3 — TacticitySimulator. Ported IN CONCEPT from the legacy
// `src/components/TacticitySimulator.tsx` (frozen reference, not edited):
// the interaction -- an 8-unit chain of clickable side groups that
// auto-classify as atactic/isotactic/syndiotactic, plus three presets -- is
// the same. What was NOT ported: the legacy per-material numeric
// crystallinity/Tm RANGES (see lib/learn/tacticity.ts's header for why --
// they read as real cited datasheet numbers but are not backed by any
// citation, which is the exact trap the step-3 brief's §C warns about).
//
// SCOPE, the single biggest risk of this island (step-3 brief §A): tacticity
// is meaningless for a symmetric monomer with no stereocentre. Ethylene
// (CH2=CH2) is symmetric -- HDPE/LDPE/LLDPE must never see this tool.
// Propylene, styrene, vinyl chloride and methyl methacrylate all carry a
// substituted, stereogenic backbone carbon -- PP, ABS/PS, PVC and PMMA do
// qualify. `lib/learn/family-scope.ts`'s `materialHasTacticity` encodes
// exactly this (family-key for styrenics/vinyls/acrylics, PLUS the one
// documented slug exception for PP inside `polyolefins` -- see that file's
// header for why a family-key-only gate cannot work here). Same R7 posture
// as BranchingSimulatorIsland: nothing renders until the live catalog
// confirms at least one qualifying material exists.
//
// FE-8 foundation layer, part 1 — owner, verbatim: "pay attention, when
// entering from a polymer datasheet, all defaults must be this polymer."
// AND, in the same breath, the reason this file exists at all: scoping
// still wins. Bound through lib/learn/material-context.ts's shared hook,
// but the seed effect below only ever matches against `materials` (already
// filtered by `materialHasTacticity`, unchanged) -- never the shared
// hook's raw catalog -- so arriving with `?material=ldpe` (a real
// material, but symmetric-monomer, no stereocentre) finds no match and
// seeds nothing. There is no separate override path for an ineligible
// bound material to take; it is simply absent from the list this effect
// searches, exactly as it is absent from the picker a human would see.
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { materialHasTacticity } from '../lib/learn/family-scope';
import {
  classifyArrangement,
  DEFAULT_SEQUENCE,
  ISOTACTIC_SEQUENCE,
  SYNDIOTACTIC_SEQUENCE,
  tacticityTrend,
  TACTICITY_MODES,
  toggleAt,
  type SideGroupSequence,
  type TacticityMode,
} from '../lib/learn/tacticity';

interface TacticitySimulatorIslandProps {
  locale: Locale;
}

const MODE_KEYS: Record<TacticityMode, { label: MessageKey; desc: MessageKey }> = {
  atactic: {
    label: 'learn.tacticity.mode.atactic.label',
    desc: 'learn.tacticity.mode.atactic.desc',
  },
  isotactic: {
    label: 'learn.tacticity.mode.isotactic.label',
    desc: 'learn.tacticity.mode.isotactic.desc',
  },
  syndiotactic: {
    label: 'learn.tacticity.mode.syndiotactic.label',
    desc: 'learn.tacticity.mode.syndiotactic.desc',
  },
};

const PRESET_SEQUENCE: Record<TacticityMode, SideGroupSequence> = {
  atactic: DEFAULT_SEQUENCE,
  isotactic: ISOTACTIC_SEQUENCE,
  syndiotactic: SYNDIOTACTIC_SEQUENCE,
};

const CRYSTALLINITY_BAND_KEY: Record<'none' | 'low' | 'medium' | 'high', MessageKey> = {
  none: 'learn.band.none',
  low: 'learn.band.low',
  medium: 'learn.band.medium',
  high: 'learn.band.high',
};

const MELTING_KEY: Record<'none' | 'present', MessageKey> = {
  none: 'learn.tacticity.meltingPoint.none',
  present: 'learn.tacticity.meltingPoint.present',
};

const CLARITY_KEY: Record<'clear' | 'hazy' | 'opaque', MessageKey> = {
  clear: 'learn.tacticity.clarity.clear',
  hazy: 'learn.tacticity.clarity.hazy',
  opaque: 'learn.tacticity.clarity.opaque',
};

export default function TacticitySimulatorIsland({ locale }: TacticitySimulatorIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [sequence, setSequence] = useState<SideGroupSequence>(DEFAULT_SEQUENCE);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const seededRef = useRef(false);

  const materials = allMaterials.filter((m) => materialHasTacticity(m.family, m.slug));

  // Seeded against `materials` (already scoped) -- see this file's header
  // on why that, not the raw catalog, is what makes scoping win over
  // seeding. Must stay above the R7 early return below (rules of hooks).
  useEffect(() => {
    if (seededRef.current || fetchStatus !== 'ready') return;
    seededRef.current = true;
    const bound = boundMaterial && materials.find((m) => m.slug === boundMaterial.slug);
    if (bound) setSelectedSlug(bound.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see
    // BranchingSimulatorIsland's identical note: `materials` is re-derived
    // every render, `seededRef` is the actual guard against refiring.
  }, [fetchStatus, boundMaterial]);

  // R7: nothing while unresolved, nothing if the scoped set turns out empty.
  if (fetchStatus !== 'ready' || materials.length === 0) return null;

  const selected = materials.find((m) => m.slug === selectedSlug) ?? null;
  const mode = classifyArrangement(sequence);
  const trend = tacticityTrend(mode);
  const modeCopy = MODE_KEYS[mode];

  function setPreset(next: TacticityMode) {
    setSequence(PRESET_SEQUENCE[next]);
  }

  function handleToggle(index: number) {
    setSequence((prev) => toggleAt(prev, index));
  }

  return (
    <div className="learn-tool" data-testid="tacticity-simulator" id="tacticity-simulator">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.tacticity.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.tacticity.intro')}</p>
      </div>

      <div
        className="tacticity-mode-select"
        role="group"
        aria-label={t(locale, 'learn.tacticity.modeLabel')}
      >
        {TACTICITY_MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`tacticity-mode-btn${m === mode ? ' is-active' : ''}`}
            aria-pressed={m === mode}
            onClick={() => setPreset(m)}
            data-testid={`tacticity-mode-${m}`}
          >
            <span className="tacticity-mode-btn-label">{t(locale, MODE_KEYS[m].label)}</span>
          </button>
        ))}
      </div>
      <p className="learn-note" data-testid="tacticity-mode-desc">
        {t(locale, modeCopy.desc)}
      </p>

      <div className="tacticity-chain" dir="ltr">
        <p className="learn-hint">{t(locale, 'learn.tacticity.chainHint')}</p>
        <svg
          className="tacticity-chain-svg"
          viewBox="0 0 400 140"
          preserveAspectRatio="xMidYMid meet"
        >
          <line x1="15" y1="70" x2="385" y2="70" className="tacticity-backbone" />
          {sequence.map((side, i) => {
            const x = 30 + i * ((385 - 30) / (sequence.length - 1 || 1));
            const y2 = side === 1 ? 30 : 110;
            return (
              <g
                key={i}
                className="tacticity-unit"
                onClick={() => handleToggle(i)}
                data-testid={`tacticity-unit-${i}`}
              >
                <line x1={x} y1="70" x2={x} y2={y2} className="tacticity-stem" />
                <circle cx={x} cy="70" r="6" className="tacticity-backbone-node" />
                <rect
                  x={x - 11}
                  y={y2 - 9}
                  width="22"
                  height="18"
                  rx="4"
                  className={side === 1 ? 'tacticity-sidegroup-up' : 'tacticity-sidegroup-down'}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tacticity-trend" data-testid="tacticity-trend">
        <p className="learn-label">{t(locale, 'learn.tacticity.trendHeading')}</p>
        <div className="tacticity-trend-row">
          <span className="tacticity-trend-label">
            {t(locale, 'learn.tacticity.trend.crystallinity')}
          </span>
          <span className="tacticity-trend-value num" dir="ltr" data-testid="tacticity-crystallinity">
            {t(locale, CRYSTALLINITY_BAND_KEY[trend.crystallinity])}
          </span>
        </div>
        <div className="tacticity-trend-row">
          <span className="tacticity-trend-label">
            {t(locale, 'learn.tacticity.trend.meltingPoint')}
          </span>
          <span className="tacticity-trend-value num" dir="ltr" data-testid="tacticity-melting">
            {t(locale, MELTING_KEY[trend.meltingPoint])}
          </span>
        </div>
        <div className="tacticity-trend-row">
          <span className="tacticity-trend-label">{t(locale, 'learn.tacticity.trend.clarity')}</span>
          <span className="tacticity-trend-value num" dir="ltr" data-testid="tacticity-clarity">
            {t(locale, CLARITY_KEY[trend.clarity])}
          </span>
        </div>
        <p className="learn-note">{t(locale, 'learn.tacticity.illustrativeNote')}</p>
      </div>

      <div className="learn-field">
        <label className="learn-label" htmlFor="tacticity-material">
          {t(locale, 'learn.tacticity.materialLabel')}
        </label>
        <select
          id="tacticity-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          data-testid="tacticity-material-select"
        >
          <option value="">{t(locale, 'learn.tacticity.materialDefault')}</option>
          {materials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {locale === 'fa' ? m.nameFa : m.nameEn}
            </option>
          ))}
        </select>
        {selectedSlug && boundMaterial?.slug === selectedSlug && (
          <p className="learn-note" data-testid="tacticity-bound-note">
            {t(locale, 'learn.tacticity.boundNote').replace(
              '{material}',
              locale === 'fa' ? boundMaterial.nameFa : boundMaterial.nameEn,
            )}
          </p>
        )}
      </div>

      {selected?.chainType && (
        <p className="learn-note" data-testid="tacticity-chain-type">
          {t(locale, 'learn.tacticity.chainTypeLabel')}:{' '}
          <span className="num" dir="ltr">
            {selected.chainType}
          </span>
        </p>
      )}
    </div>
  );
}
