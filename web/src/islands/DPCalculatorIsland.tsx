// FE-8 step 1 — DPCalculator. Ported from the legacy `src/components/
// DPCalculator.tsx` (frozen reference, not edited): DPn = Mn / M0,
// Mw = Mn x PDI, DPw = Mw / M0. The relationship holds for every polymer and
// needs no database value -- the second of step 1's two universal-concept
// tools.
//
// DATA REALITY (FE-8 build brief): the database holds 3 `mn` values total,
// and the legacy `mnDefaultValue` was a slider *default*, never a real
// measurement. So unlike the datasheet's value atoms, Mn and PDI here are
// ALWAYS reader-entered numbers -- this is a genuine calculator, not a
// reader of curated values (R5: nothing here is presented as a specific
// material's measured fact unless a material was actually picked). M0 (the
// repeat unit's molar mass) starts from ethylene's textbook constant
// (28.05 g/mol -- a definitional atomic-weight sum, not an empirical
// measurement) purely as a plausible starting number; it is just as editable
// as the other two fields.
//
// Bonus (per the FE-8 brief, not a requirement): picking a real material
// from the shared catalog overwrites Mn and M0 with that material's real
// (mostly uncited, R1/R22) values. R7's per-dependency reading applies to
// this picker alone -- the calculator itself needs no fetch to work and
// never blocks on one.
//
// FE-8 foundation layer, part 1 — owner, verbatim: "pay attention, when
// entering from a polymer datasheet, all defaults must be this polymer."
// Bound through lib/learn/material-context.ts's shared hook: a bound
// material WITH both Mn and M0 on record seeds the two input fields exactly
// as `handleMaterialChange` already does for a manual pick (same code path,
// not a second one); a bound material missing either value says so
// (`boundNoDataNote`) instead of leaving the ethylene-constant illustrative
// default looking like it belongs to that material.
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { computeDP } from '../lib/learn/dp';

interface DPCalculatorIslandProps {
  locale: Locale;
}

const DEFAULT_MN = 50000;
const DEFAULT_M0 = 28.05; // ethylene's molar mass -- a constant, not a measurement.
const DEFAULT_PDI = 2.0;

export default function DPCalculatorIsland({ locale }: DPCalculatorIslandProps) {
  const { status: fetchStatus, materials: allMaterials, boundMaterial } = useLearnMaterialContext();
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [mn, setMn] = useState<number>(DEFAULT_MN);
  const [m0, setM0] = useState<number>(DEFAULT_M0);
  const [pdi, setPdi] = useState<number>(DEFAULT_PDI);
  const seededRef = useRef(false);

  const materials = allMaterials.filter((m) => m.molecular != null);

  useEffect(() => {
    if (seededRef.current || fetchStatus !== 'ready') return;
    seededRef.current = true;
    if (boundMaterial?.molecular) {
      setSelectedSlug(boundMaterial.slug);
      setMn(boundMaterial.molecular.mn.value);
      setM0(boundMaterial.molecular.monomerMolarMass.value);
    }
  }, [fetchStatus, boundMaterial]);

  const selected = materials.find((m) => m.slug === selectedSlug) ?? null;
  const monomerName = selected
    ? (locale === 'fa' ? selected.molecular?.monomerNameFa : selected.molecular?.monomerNameEn)
    : null;

  function handleMaterialChange(slug: string) {
    setSelectedSlug(slug);
    const next = materials.find((m) => m.slug === slug) ?? null;
    if (next?.molecular) {
      setMn(next.molecular.mn.value);
      setM0(next.molecular.monomerMolarMass.value);
    }
  }

  function handleReset() {
    setSelectedSlug('');
    setMn(DEFAULT_MN);
    setM0(DEFAULT_M0);
    setPdi(DEFAULT_PDI);
  }

  const { dpN, mw, dpW } = computeDP(mn, pdi, m0);

  return (
    <div className="learn-tool" data-testid="dp-calculator" id="dp-calculator">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.dp.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.dp.intro')}</p>
      </div>

      <div className="learn-field">
        <label className="learn-label" htmlFor="dp-material">
          {t(locale, 'learn.dp.materialLabel')}
        </label>
        <select
          id="dp-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => handleMaterialChange(e.target.value)}
          data-testid="dp-calculator-material-select"
        >
          <option value="">{t(locale, 'learn.dp.materialDefault')}</option>
          {materials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {locale === 'fa' ? m.nameFa : m.nameEn}
            </option>
          ))}
        </select>
        {fetchStatus === 'loading' && (
          <span className="learn-hint" role="status" aria-live="polite">
            {t(locale, 'learn.dp.materialLoading')}
          </span>
        )}
        {selected && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="dp-calculator-bound-note">
            {t(locale, 'learn.dp.boundNote').replace(
              '{material}',
              locale === 'fa' ? selected.nameFa : selected.nameEn,
            )}
          </p>
        )}
        {!selected && boundMaterial && !boundMaterial.molecular && (
          <p className="learn-hint" data-testid="dp-calculator-bound-no-data-note">
            {t(locale, 'learn.dp.boundNoDataNote').replace(
              '{material}',
              locale === 'fa' ? boundMaterial.nameFa : boundMaterial.nameEn,
            )}
          </p>
        )}
        {selected?.molecular && (
          <p className="learn-note" data-testid="dp-calculator-provenance">
            {monomerName ? `${monomerName} — ` : ''}
            {!selected.molecular.mn.cited && `Mn: ${t(locale, 'learn.dp.uncited')}`}
            {!selected.molecular.monomerMolarMass.cited &&
              ` · M0: ${t(locale, 'learn.dp.uncited')}`}
          </p>
        )}
      </div>

      <div className="dp-grid">
        <div className="dp-input">
          <label className="learn-label" htmlFor="dp-mn">
            {t(locale, 'learn.dp.mnLabel')}
          </label>
          <input
            id="dp-mn"
            type="number"
            className="learn-number"
            min={0}
            step={1000}
            value={mn}
            onChange={(e) => setMn(Number(e.target.value))}
            data-testid="dp-calculator-mn-input"
          />
        </div>
        <div className="dp-input">
          <label className="learn-label" htmlFor="dp-m0">
            {t(locale, 'learn.dp.m0Label')}
          </label>
          <input
            id="dp-m0"
            type="number"
            className="learn-number"
            min={0}
            step={0.01}
            value={m0}
            onChange={(e) => setM0(Number(e.target.value))}
            data-testid="dp-calculator-m0-input"
          />
        </div>
        <div className="dp-input">
          <label className="learn-label" htmlFor="dp-pdi">
            {t(locale, 'learn.dp.pdiLabel')}
          </label>
          <input
            id="dp-pdi"
            type="number"
            className="learn-number"
            min={1}
            max={20}
            step={0.1}
            value={pdi}
            onChange={(e) => setPdi(Number(e.target.value))}
            data-testid="dp-calculator-pdi-input"
          />
        </div>
      </div>

      <button type="button" className="learn-reset" onClick={handleReset} data-testid="dp-calculator-reset">
        {t(locale, 'learn.dp.resetLabel')}
      </button>

      <div className="dp-outputs">
        <div className="dp-output">
          <span className="learn-label">{t(locale, 'learn.dp.dpnLabel')}</span>
          <span className="dp-output-value num" dir="ltr">
            {dpN.toLocaleString()}
          </span>
        </div>
        <div className="dp-output">
          <span className="learn-label">{t(locale, 'learn.dp.mwLabel')}</span>
          <span className="dp-output-value num" dir="ltr">
            {mw.toLocaleString()} g/mol
          </span>
        </div>
        <div className="dp-output">
          <span className="learn-label">{t(locale, 'learn.dp.dpwLabel')}</span>
          <span className="dp-output-value num" dir="ltr">
            {dpW.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
