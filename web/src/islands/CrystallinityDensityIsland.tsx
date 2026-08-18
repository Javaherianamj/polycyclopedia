// FE-8 foundation layer, Part 2 — the 10⁻⁶-station (spherulite) content the
// FE-0 spec named ("crystallinity ↔ density readout",
// lab-concepts-spec.md's Stations table) and nobody built. Owner, verbatim:
// "where are the figures and plots you talked about!"
//
// This is a READOUT, not a simulator — see lib/learn/spherulite-readout.ts's
// header for why there is no slider here: crystallinity and density are
// properties of a specific measured grade, and the live catalog only has
// BOTH values on record for three materials today (checked against the
// running API before writing this, not assumed). Showing those three,
// honestly captioned with how many of the catalog's materials that really
// is, is the whole tool — inventing a fourth point or a fitted trend line
// to make the chart look fuller is exactly what R5/R7 forbid.
//
// MATERIAL CONTEXT (part 1 of this unit's brief): unlike StateSimulator or
// DPCalculator there is no input to seed — every row is already real data
// for a real material, all shown at once, not one at a time behind a
// picker. So "when entering from a polymer datasheet, all defaults must be
// this polymer" is satisfied by HIGHLIGHTING the bound material's row
// (when it has both values) rather than by seeding a control. A bound
// material without both values on record is named explicitly
// (`boundNoDataNote`) so its absence from the table reads as a stated gap,
// not a silent omission.
import { useMemo } from 'react';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/t';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { spheruliteReadoutRows } from '../lib/learn/spherulite-readout';

interface CrystallinityDensityIslandProps {
  locale: Locale;
}

function materialName(name: { nameFa: string; nameEn: string }, locale: Locale): string {
  return locale === 'fa' ? name.nameFa : name.nameEn;
}

export default function CrystallinityDensityIsland({ locale }: CrystallinityDensityIslandProps) {
  const { status, materials, boundMaterial } = useLearnMaterialContext();

  const rows = useMemo(() => spheruliteReadoutRows(materials), [materials]);
  const boundInRows = boundMaterial ? rows.some((r) => r.slug === boundMaterial.slug) : false;

  return (
    <div className="learn-tool" data-testid="crystallinity-density" id="crystallinity-density">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.spherulite.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.spherulite.intro')}</p>
      </div>

      {status === 'loading' && (
        <span className="learn-hint" role="status" aria-live="polite">
          {t(locale, 'learn.spherulite.materialLoading')}
        </span>
      )}

      {status === 'ready' && boundMaterial && boundInRows && (
        <p className="learn-note" data-testid="spherulite-bound-note">
          {t(locale, 'learn.spherulite.boundHighlightNote').replace(
            '{material}',
            materialName(boundMaterial, locale),
          )}
        </p>
      )}
      {status === 'ready' && boundMaterial && !boundInRows && (
        <p className="learn-hint" data-testid="spherulite-bound-no-data-note">
          {t(locale, 'learn.spherulite.boundNoDataNote').replace(
            '{material}',
            materialName(boundMaterial, locale),
          )}
        </p>
      )}

      {status === 'ready' && rows.length === 0 && (
        <p className="learn-hint" data-testid="spherulite-empty">
          {t(locale, 'learn.spherulite.emptyNote')}
        </p>
      )}

      {status === 'ready' && rows.length > 0 && (
        <>
          <div className="spherulite-table-wrap">
            <table className="spherulite-table" data-testid="spherulite-table">
              <thead>
                <tr>
                  <th scope="col">{t(locale, 'learn.spherulite.materialCol')}</th>
                  <th scope="col">{t(locale, 'learn.spherulite.densityCol')}</th>
                  <th scope="col">{t(locale, 'learn.spherulite.crystallinityCol')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.slug}
                    className={boundMaterial?.slug === row.slug ? 'is-bound' : undefined}
                    data-testid={`spherulite-row-${row.slug}`}
                  >
                    <th scope="row">{materialName(row, locale)}</th>
                    <td className="num" dir="ltr">
                      {row.density.display}
                      {!row.density.cited && ` (${t(locale, 'learn.spherulite.uncited')})`}
                    </td>
                    <td className="num" dir="ltr">
                      {row.crystallinity.display}
                      {!row.crystallinity.cited && ` (${t(locale, 'learn.spherulite.uncited')})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="learn-hint" data-testid="spherulite-coverage-note">
            {t(locale, 'learn.spherulite.coverageNote')
              .replace('{count}', String(rows.length))
              .replace('{total}', String(materials.length))}
          </p>
        </>
      )}
    </div>
  );
}
