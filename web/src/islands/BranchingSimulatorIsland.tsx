// FE-8 step 3 — BranchingSimulator. Ported IN CONCEPT from the legacy
// `src/components/BranchingSimulator.tsx` (frozen reference, not edited):
// the mechanism -- more/longer branches disrupt chain packing, which
// lowers crystallinity and density -- is the same. The interaction is not:
// see lib/learn/branching.ts's header for why the legacy continuous
// "branch amount" slider was replaced with a discrete choice between the
// three real PE architectures (linear/long-chain-branched/short-chain-
// branched). That file also carries the trend model; this island is the
// thin view over it (same split as StateSimulatorIsland/thermal.ts).
//
// R7 (step-3 brief): this tool's family scope is `polyolefins` (hdpe, ldpe,
// lldpe, pp all qualify -- see lib/learn/family-scope.ts). Unlike step 1's
// tools, the mechanism itself needs no fetch to explain -- what DOES need
// one is confirming the family actually has a material on the live site
// before claiming the scope applies at all. While that is unresolved
// (`loading`) or the family turns out to be empty/unreachable (`error`, or
// zero materials), the island renders nothing rather than a shell -- never
// a flash of content that then disappears.
//
// §C (never present an invented number in the site's real datasheet
// register): the architecture trend (packing/crystallinity/density) is
// rendered ONLY as relative low/medium/high bars, never a %, g/cm3 or °C.
// The one place a real number appears is the optional "compare with a real
// polyolefin" panel, which reads `density`/`crystallinity` straight from
// the database via fetch-learn-materials.ts's numericPoint() -- same
// cited/uncited note pattern as every other island -- and is visually
// separated (its own note block, not a trend-bar row) so the two registers
// are never confused.

// FE-8 foundation layer, part 1 — owner, verbatim: "pay attention, when
// entering from a polymer datasheet, all defaults must be this polymer."
// Bound through lib/learn/material-context.ts's shared hook, but SCOPING
// WINS OVER SEEDING here specifically: the seed effect below only ever
// looks at `materials`, the family-filtered list this island already built
// for the picker (unchanged), never the shared hook's raw unfiltered
// catalog. So arriving with e.g. `?material=pvc` (not a polyolefin) simply
// finds no match in `materials` and seeds nothing -- there is no second,
// unscoped path that could override that, by construction rather than by
// an extra check. When the bound material's `chainType` maps cleanly onto
// one of the three PE architectures (`chainTypeToArchitecture`,
// branching.ts), the architecture toggle is seeded too -- PP's
// 'isotactic' and any unmapped chain type leave the toggle at its current
// setting instead of guessing (see branching.ts's header on why).
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { materialHasBranchingRelevance } from '../lib/learn/family-scope';
import {
  branchingTrend,
  branchLayout,
  chainTypeToArchitecture,
  PE_ARCHITECTURES,
  type PEArchitecture,
  type TrendBand,
} from '../lib/learn/branching';

interface BranchingSimulatorIslandProps {
  locale: Locale;
}

const ARCH_KEYS: Record<PEArchitecture, { label: MessageKey; desc: MessageKey }> = {
  linear: {
    label: 'learn.branching.architecture.linear.label',
    desc: 'learn.branching.architecture.linear.desc',
  },
  longChainBranched: {
    label: 'learn.branching.architecture.longChainBranched.label',
    desc: 'learn.branching.architecture.longChainBranched.desc',
  },
  shortChainBranched: {
    label: 'learn.branching.architecture.shortChainBranched.label',
    desc: 'learn.branching.architecture.shortChainBranched.desc',
  },
};

const TREND_ROW_KEYS: { field: 'packing' | 'crystallinity' | 'density'; label: MessageKey }[] = [
  { field: 'packing', label: 'learn.branching.trend.packing' },
  { field: 'crystallinity', label: 'learn.branching.trend.crystallinity' },
  { field: 'density', label: 'learn.branching.trend.density' },
];

const BAND_KEY: Record<TrendBand, MessageKey> = {
  low: 'learn.band.low',
  medium: 'learn.band.medium',
  high: 'learn.band.high',
};

// Bar fill width comes from the trend's own 0-1 `level` (branching.ts), not
// from its band word. The three columns deliberately differ WITHIN one
// architecture -- see the TRENDS comment for why LDPE and LLDPE differ in
// which property is depressed. Floored so "low" still reads as a bar rather
// than blank.
const MIN_FILL_PCT = 12;
function fillPct(level: number): number {
  return Math.round(MIN_FILL_PCT + level * (96 - MIN_FILL_PCT));
}

export default function BranchingSimulatorIsland({ locale }: BranchingSimulatorIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [architecture, setArchitecture] = useState<PEArchitecture>('linear');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const seededRef = useRef(false);

  const materials = allMaterials.filter((m) => materialHasBranchingRelevance(m.family));

  // Seeding happens against `materials` (already family-scoped) -- see this
  // file's header on why that, not the raw catalog, is what makes scoping
  // win over seeding here. Must stay above the R7 early return below (rules
  // of hooks: every hook runs on every render, in the same order).
  useEffect(() => {
    if (seededRef.current || fetchStatus !== 'ready') return;
    seededRef.current = true;
    const bound = boundMaterial && materials.find((m) => m.slug === boundMaterial.slug);
    if (!bound) return;
    setSelectedSlug(bound.slug);
    const mappedArchitecture = chainTypeToArchitecture(bound.chainType);
    if (mappedArchitecture) setArchitecture(mappedArchitecture);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `materials` is
    // re-derived every render from `allMaterials`; including it would refire
    // this effect on every fetch-driven re-render before `seededRef` can
    // guard it. `fetchStatus`/`boundMaterial` are the only real triggers.
  }, [fetchStatus, boundMaterial]);

  // R7: nothing while unresolved, nothing if the family turns out empty.
  if (fetchStatus !== 'ready' || materials.length === 0) return null;

  const selected = materials.find((m) => m.slug === selectedSlug) ?? null;
  const trend = branchingTrend(architecture);
  const branches = branchLayout(architecture);
  const archCopy = ARCH_KEYS[architecture];

  return (
    <div className="learn-tool" data-testid="branching-simulator" id="branching-simulator">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.branching.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.branching.intro')}</p>
      </div>

      <div
        className="branching-arch-select"
        role="group"
        aria-label={t(locale, 'learn.branching.architectureLabel')}
      >
        {PE_ARCHITECTURES.map((arch) => (
          <button
            key={arch}
            type="button"
            className={`branching-arch-btn${arch === architecture ? ' is-active' : ''}`}
            aria-pressed={arch === architecture}
            onClick={() => setArchitecture(arch)}
            data-testid={`branching-arch-${arch}`}
          >
            {t(locale, ARCH_KEYS[arch].label)}
          </button>
        ))}
      </div>
      <p className="learn-note" data-testid="branching-arch-desc">
        {t(locale, archCopy.desc)}
      </p>

      <div className="branching-chain" aria-hidden="true">
        <div className="branching-chain-svg-wrap" dir="ltr">
          <svg
            className="branching-chain-svg"
            viewBox="0 0 400 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <line x1="10" y1="50" x2="390" y2="50" className="branching-backbone" />
            {branches.map((b, i) => {
              const x = 10 + b.position * 380;
              const len = b.kind === 'long' ? 32 : 16;
              const y2 = 50 + b.side * len;
              return (
                <line
                  key={i}
                  x1={x}
                  y1="50"
                  x2={x}
                  y2={y2}
                  className={
                    b.kind === 'long' ? 'branching-branch-long' : 'branching-branch-short'
                  }
                />
              );
            })}
          </svg>
        </div>
        <div className="branching-legend">
          <span className="branching-legend-item">
            <span className="branching-legend-swatch branching-legend-swatch-backbone" />
            {t(locale, 'learn.branching.legend.backbone')}
          </span>
          <span className="branching-legend-item">
            <span className="branching-legend-swatch branching-legend-swatch-short" />
            {t(locale, 'learn.branching.legend.shortBranch')}
          </span>
          <span className="branching-legend-item">
            <span className="branching-legend-swatch branching-legend-swatch-long" />
            {t(locale, 'learn.branching.legend.longBranch')}
          </span>
        </div>
      </div>

      <div className="branching-trend" data-testid="branching-trend">
        <p className="learn-label">{t(locale, 'learn.branching.trendHeading')}</p>
        {TREND_ROW_KEYS.map(({ field, label }) => (
          <div className="branching-trend-row" key={field}>
            <span className="branching-trend-label">{t(locale, label)}</span>
            <div className="branching-trend-bar">
              <div
                className="branching-trend-bar-fill"
                style={{ inlineSize: `${fillPct(trend[field].level)}%` }}
                data-testid={`branching-trend-${field}-fill`}
              />
            </div>
            <span className="branching-trend-band num" dir="ltr">
              {t(locale, BAND_KEY[trend[field].band])}
            </span>
          </div>
        ))}
        <p className="learn-note">{t(locale, 'learn.branching.illustrativeNote')}</p>
      </div>

      <p className="learn-note">{t(locale, 'learn.branching.ppNote')}</p>

      <div className="learn-field">
        <label className="learn-label" htmlFor="branching-material">
          {t(locale, 'learn.branching.materialLabel')}
        </label>
        <select
          id="branching-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          data-testid="branching-material-select"
        >
          <option value="">{t(locale, 'learn.branching.materialDefault')}</option>
          {materials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {locale === 'fa' ? m.nameFa : m.nameEn}
            </option>
          ))}
        </select>
        {selected && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="branching-bound-note">
            {t(locale, 'learn.branching.boundNote').replace(
              '{material}',
              locale === 'fa' ? selected.nameFa : selected.nameEn,
            )}
          </p>
        )}
        {selected &&
          boundMaterial?.slug === selected.slug &&
          chainTypeToArchitecture(selected.chainType) === architecture && (
            <p className="learn-hint" data-testid="branching-bound-architecture-note">
              {t(locale, 'learn.branching.boundArchitectureNote').replace(
                '{material}',
                locale === 'fa' ? selected.nameFa : selected.nameEn,
              )}
            </p>
          )}
      </div>

      {selected && (
        <div className="branching-real-data" data-testid="branching-real-data">
          {selected.chainType && (
            <p className="learn-note">
              {t(locale, 'learn.branching.chainTypeLabel')}:{' '}
              <span className="num" dir="ltr">
                {selected.chainType}
              </span>
            </p>
          )}
          {selected.density && (
            <p className="learn-note" data-testid="branching-density">
              {t(locale, 'learn.branching.densityLabel')}:{' '}
              <span className="num" dir="ltr">
                {selected.density.display}
              </span>
              {!selected.density.cited && ` (${t(locale, 'learn.branching.uncited')})`}
            </p>
          )}
          {selected.crystallinity && (
            <p className="learn-note" data-testid="branching-crystallinity">
              {t(locale, 'learn.branching.crystallinityLabel')}:{' '}
              <span className="num" dir="ltr">
                {selected.crystallinity.display}
              </span>
              {!selected.crystallinity.cited && ` (${t(locale, 'learn.branching.uncited')})`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
