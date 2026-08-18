// L4 — «دفترچه» / NOTEBOOK, figure 2 — the article's one LIVE figure
// (spec: "at least one live figure mid-article... with a note that it
// reads its values from the datasheet"). Reads density and crystallinity
// for whichever material is selected, straight from the live API via the
// SAME shared hook every other Learn tool uses
// (`useLearnMaterialContext`, `lib/learn/material-context.ts`) — no
// second fetcher, no second URL reader (build brief).
//
// WHY A PICKER + READOUT, NOT THE FE-0 PROTOTYPE'S DRAGGABLE SLIDER: the
// prototype (`design/fe-0/lab/notebook.js`) let a reader drag within
// LDPE's own density RANGE to see an illustrative crystallinity estimate
// computed from a hand-drawn linear formula — a reasonable demo for one
// hardcoded material, but generalising it to every material would mean
// either (a) fabricating a density range/slope for materials whose real
// range isn't known at this shape (`LearnMaterial.density` is a single
// reduced point, not a min/max pair — see `fetch-learn-materials.ts`), or
// (b) reusing the LDPE-specific range for a material it doesn't describe.
// Both are exactly what R5 forbids. `CrystallinityDensityIsland.tsx`
// (SCALE's 10⁻⁶ station) already reasoned through this same property pair
// and reached the same conclusion — "there is no mechanism to let a
// reader manipulate here... showing the real numbers side by side is the
// whole tool" — so this figure follows that precedent instead of
// reinventing a fabricated slider. The LIVE part is the picker itself:
// changing the material re-reads real numbers from the database, which
// is a genuinely live action, just not a drag gesture.
//
// HONEST DEGRADE (R7): density and crystallinity are reported
// INDEPENDENTLY. A material with one but not the other (most of the
// catalog) shows the one it has and an explicit "no X on record" note for
// the other — never a blank space that reads as an oversight, and never
// a fabricated placeholder. A material with neither (checked against the
// live API: `pa6` has zero property rows today) shows both notes.
import { useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { notebookFigureState } from '../lib/notebook/figure-density';
import type { LearnNumericPoint } from '../lib/learn/fetch-learn-materials';

interface NotebookFigureIslandProps {
  locale: Locale;
  /** The article's own subject material (`NotebookArticle.materialSlug`)
   * — seeds the picker when nothing is bound via `?material=`, exactly
   * like every other Learn tool's "all defaults must be this polymer"
   * precedent, just seeded from the ARTICLE's default instead of a URL
   * binding when both are absent. */
  defaultMaterialSlug: string;
}

type MarkState = 'sourced' | 'unsourced' | 'nodata';

function markStateOf(point: LearnNumericPoint | null): MarkState {
  if (!point) return 'nodata';
  return point.cited ? 'sourced' : 'unsourced';
}

function markGlyph(state: MarkState): string {
  return state === 'sourced' ? '§' : state === 'unsourced' ? '?' : '×';
}

export default function NotebookFigureIsland({ locale, defaultMaterialSlug }: NotebookFigureIslandProps) {
  const { status, materials, boundMaterial } = useLearnMaterialContext();
  const [selectedSlug, setSelectedSlug] = useState('');
  const seededRef = useRef(false);

  if (!seededRef.current && status === 'ready') {
    seededRef.current = true;
    if (boundMaterial) setSelectedSlug(boundMaterial.slug);
    else if (materials.some((m) => m.slug === defaultMaterialSlug)) setSelectedSlug(defaultMaterialSlug);
    else if (materials[0]) setSelectedSlug(materials[0].slug);
  }

  const selected = materials.find((m) => m.slug === selectedSlug) ?? null;
  const materialName = (m: { nameFa: string; nameEn: string }) => (locale === 'fa' ? m.nameFa : m.nameEn);
  const { density, crystallinity } = notebookFigureState(selected);

  function markAriaLabel(state: MarkState): string {
    if (state === 'sourced') return t(locale, 'value.sourced');
    if (state === 'unsourced') return t(locale, 'value.uncited');
    return t(locale, 'learn.notebook.fig2.markNodata');
  }

  function markPopText(state: MarkState): string {
    if (state === 'sourced') return t(locale, 'value.sourced');
    return t(locale, 'value.uncitedLong');
  }

  function stat(labelKey: MessageKey, point: LearnNumericPoint | null, missingKey: MessageKey, testid: string) {
    if (!point) {
      return (
        <div className="nb-fig2-stat" data-testid={testid}>
          <span className="nb-fig2-stat-label">{t(locale, labelKey)}</span>
          <span className="nb-fig2-stat-missing" data-testid={`${testid}-missing`}>
            {selected ? t(locale, missingKey).replace('{material}', materialName(selected)) : ''}
          </span>
        </div>
      );
    }
    const state = markStateOf(point);
    return (
      <div className="nb-fig2-stat" data-testid={testid}>
        <span className="nb-fig2-stat-label">{t(locale, labelKey)}</span>
        <span className="nb-fig2-stat-value num" dir="ltr">
          {point.display}
          <button type="button" className={`nb-fig-mark st-${state}`} aria-label={markAriaLabel(state)} data-testid={`${testid}-mark`}>
            {markGlyph(state)}
            <span className="nb-fig-pop">{markPopText(state)}</span>
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="nb-fig2" data-testid="notebook-figure-live" id="fig2-mount">
      <div className="nb-fig2-badge">
        <i aria-hidden="true" />
        {t(locale, 'learn.notebook.fig2.liveBadge')}
      </div>

      <div className="learn-field">
        <label className="learn-label" htmlFor="nb-fig2-material">
          {t(locale, 'learn.notebook.fig2.materialLabel')}
        </label>
        <select
          id="nb-fig2-material"
          className="learn-select"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          data-testid="notebook-figure-material-select"
        >
          {materials.map((m) => (
            <option key={m.slug} value={m.slug}>
              {materialName(m)}
            </option>
          ))}
        </select>
        {status === 'loading' && (
          <span className="learn-hint" role="status" aria-live="polite">
            {t(locale, 'learn.notebook.fig2.materialLoading')}
          </span>
        )}
        {status === 'error' && <span className="learn-hint">{t(locale, 'learn.notebook.fig2.materialError')}</span>}
        {selected && boundMaterial?.slug === selected.slug && (
          <p className="learn-note" data-testid="notebook-figure-bound-note">
            {t(locale, 'learn.notebook.fig2.boundNote').replace('{material}', materialName(selected))}
          </p>
        )}
      </div>

      {status === 'ready' && selected && (
        <div className="nb-fig2-readouts">
          {stat('learn.notebook.fig2.densityLabel', density, 'learn.notebook.fig2.densityMissing', 'notebook-figure-density')}
          {stat(
            'learn.notebook.fig2.crystallinityLabel',
            crystallinity,
            'learn.notebook.fig2.crystallinityMissing',
            'notebook-figure-crystallinity',
          )}
        </div>
      )}

      <p className="nb-fig-cap">
        <b>{t(locale, 'learn.notebook.fig2.captionLead')}</b>{' '}
        {t(locale, 'learn.notebook.fig2.caption').replace(
          '{material}',
          selected ? materialName(selected) : t(locale, 'learn.notebook.fig2.materialLoading'),
        )}
      </p>
    </div>
  );
}
