// FE-8 foundation layer, Part 2 — the 10⁻⁹-station live element the FE-0
// spec required and nobody had built (lab-concepts-spec.md, L1/SCALE,
// "One live element (required)"): a DP slider that redraws a 2D
// random-walk chain and reports its end-to-end distance and radius of
// gyration, visibly denser as DP rises. Owner, verbatim, on the wider gap
// this closes alongside CrystallinityDensityIsland: "where are the figures
// and plots you talked about!"
//
// All the physics (the seeded PRNG walk, Rg/end-to-end, the fixed render
// scale that provably contains every DP without re-fitting per draw) lives
// in lib/learn/random-walk.ts, tested there without React — this island is
// the thin view over it, same split as every other Learn tool
// (thermal.ts/StateSimulatorIsland, branching.ts/BranchingSimulatorIsland).
//
// MATERIAL CONTEXT (part 1 of this unit's brief — "when entering from a
// polymer datasheet, all defaults must be this polymer"): DP is a
// universal-concept slider like StateSimulator's temperature, not a
// per-material fact, so there is nothing to force-seed the way
// StateSimulator seeds a real Tg. What CAN be seeded honestly is the
// STARTING position: if the reader arrived bound to a material with real
// Mn and a real repeat-unit molar mass on record, the slider starts at
// THAT material's own DPn (`computeDP` from dp.ts, reused rather than
// re-derived) instead of the arbitrary illustrative default — after that
// the slider is exactly as free to move as it always was. A bound material
// missing either value says so (`boundNoDataNote`) rather than silently
// keeping the illustrative start as if it meant something for that
// material.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { computeDP } from '../lib/learn/dp';
import {
  MAX_DP,
  MIN_DP,
  REFERENCE_MAX_EXTENT,
  downsampleForRender,
  generateRandomWalkChain,
  projectPoints,
} from '../lib/learn/random-walk';

interface ChainCoilIslandProps {
  locale: Locale;
}

// Illustrative starting DP when no material is bound (or the bound one has
// no Mn/M0 to seed from) — mid-range enough to already read as a coil, not
// a bare dot, without needing the reader to touch the slider first.
const DEFAULT_DP = 2000;

// One fixed scene, same posture as HansenSpaceIsland's SCENE/CENTER: a
// constant pixel box the SVG's own viewBox maps onto, independent of
// viewport width (R27 — the wrapper handles overflow, not this).
const SCENE = { width: 300, height: 260 };
const CENTER = { x: SCENE.width / 2, y: SCENE.height / 2 };
// 92%: a small margin so the walk's own farthest point (bounded by
// REFERENCE_MAX_EXTENT — see random-walk.ts's header on the same-seed
// prefix property) never touches the viewBox edge.
const VIEW_RADIUS_PX = (Math.min(SCENE.width, SCENE.height) / 2) * 0.92;
const PX_PER_UNIT = VIEW_RADIUS_PX / REFERENCE_MAX_EXTENT;
// SVG segment cap — the physics is always measured from the FULL dp+1
// points (random-walk.ts's `generateRandomWalkChain`); this only thins the
// polyline that gets drawn, so a 20 000-bond chain does not become a
// 20 000-point DOM element.
const MAX_RENDER_POINTS = 600;

function materialName(name: { nameFa: string; nameEn: string }, locale: Locale): string {
  return locale === 'fa' ? name.nameFa : name.nameEn;
}

/** Bond-length numbers, one decimal — these are dimensionless model units
 * (see random-walk.ts's header on why never nm), so `num`/`dir="ltr"` at the
 * call site is what marks them as a formatted quantity, not a currency or
 * measured display value. */
function formatLength(value: number): string {
  return value.toFixed(1);
}

export default function ChainCoilIsland({ locale }: ChainCoilIslandProps) {
  const { status, boundMaterial } = useLearnMaterialContext();

  // Seeded once: the initial DP is derived from the bound material (when
  // it has both Mn and M0) or DEFAULT_DP otherwise. A `useState` initializer
  // function only runs on the FIRST render, which is exactly right here —
  // after that the slider is the reader's, and re-running this on every
  // fetch-status change would fight their own drags the moment the catalog
  // finishes loading a beat after mount.
  const [dp, setDp] = useState(DEFAULT_DP);
  // Guards the one-time seed below from re-firing and overwriting a
  // reader's own slider drag once the catalog settles (a ref, not state,
  // because flipping it must never itself trigger a re-render).
  const seededRef = useRef(false);

  // Applying the seed AFTER mount (once, when the material context settles)
  // rather than in useState's initializer: `boundMaterial` is not known
  // until the URL-param effect inside useLearnMaterialContext runs, which
  // is itself post-mount (no `window` during SSR/first paint — the same
  // constraint every other Learn island's material fetch already works
  // around).
  useEffect(() => {
    if (seededRef.current || status !== 'ready') return;
    seededRef.current = true;
    if (!boundMaterial?.molecular) return;
    const seededDp = computeDP(
      boundMaterial.molecular.mn.value,
      1,
      boundMaterial.molecular.monomerMolarMass.value,
    ).dpN;
    if (seededDp >= MIN_DP) setDp(Math.min(MAX_DP, seededDp));
  }, [status, boundMaterial]);

  const chain = useMemo(() => generateRandomWalkChain(dp), [dp]);
  const renderPoints = useMemo(
    () => downsampleForRender(chain.points, MAX_RENDER_POINTS),
    [chain],
  );
  const projected = useMemo(
    () => projectPoints(renderPoints, chain.points[0], PX_PER_UNIT, CENTER),
    [renderPoints, chain],
  );
  const pathD = useMemo(
    () => projected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
    [projected],
  );
  const start = projected[0];
  const end = projected[projected.length - 1];

  function handleReset() {
    setDp(DEFAULT_DP);
  }

  return (
    <div className="learn-tool" data-testid="chain-coil" id="chain-coil">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.chain.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.chain.intro')}</p>
      </div>

      {status === 'ready' && boundMaterial?.molecular && (
        <p className="learn-note" data-testid="chain-coil-bound-note">
          {t(locale, 'learn.chain.boundNote').replace('{material}', materialName(boundMaterial, locale))}
        </p>
      )}
      {status === 'ready' && boundMaterial && !boundMaterial.molecular && (
        <p className="learn-hint" data-testid="chain-coil-bound-no-data-note">
          {t(locale, 'learn.chain.boundNoDataNote').replace(
            '{material}',
            materialName(boundMaterial, locale),
          )}
        </p>
      )}

      <div className="chain-coil-body">
        <div className="chain-coil-svg-wrap" dir="ltr">
          <svg
            className="chain-coil-svg"
            viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t(locale, 'learn.chain.title')}
            data-testid="chain-coil-svg"
          >
            <path d={pathD} className="chain-coil-path" data-testid="chain-coil-path" />
            {start && <circle cx={start.x} cy={start.y} r={4} className="chain-coil-start" />}
            {end && <circle cx={end.x} cy={end.y} r={4} className="chain-coil-end" data-testid="chain-coil-end" />}
          </svg>
        </div>

        <div className="chain-coil-controls">
          <div className="learn-field">
            <label className="learn-label" htmlFor="chain-coil-dp">
              {t(locale, 'learn.chain.dpLabel')}
            </label>
            <div className="state-sim-readout">
              <span className="state-sim-value num" dir="ltr" data-testid="chain-coil-dp-value">
                {dp.toLocaleString()}
              </span>
              <button
                type="button"
                className="learn-reset"
                onClick={handleReset}
                data-testid="chain-coil-reset"
              >
                {t(locale, 'learn.chain.resetLabel')}
              </button>
            </div>
            <input
              id="chain-coil-dp"
              type="range"
              className="state-sim-slider"
              min={MIN_DP}
              max={MAX_DP}
              step={50}
              value={dp}
              onChange={(e) => setDp(Number(e.target.value))}
              dir="ltr"
              data-testid="chain-coil-slider"
            />
          </div>

          <div className="dp-outputs">
            <div className="dp-output">
              <span className="learn-label">{t(locale, 'learn.chain.endToEndLabel')}</span>
              <span className="dp-output-value num" dir="ltr" data-testid="chain-coil-end-to-end">
                {formatLength(chain.endToEndDistance)}
              </span>
            </div>
            <div className="dp-output">
              <span className="learn-label">{t(locale, 'learn.chain.radiusOfGyrationLabel')}</span>
              <span className="dp-output-value num" dir="ltr" data-testid="chain-coil-rg">
                {formatLength(chain.radiusOfGyration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="learn-hint">{t(locale, 'learn.chain.unitNote')}</p>
      <p className="learn-note">{t(locale, 'learn.chain.varianceNote')}</p>
    </div>
  );
}
