// FE-6 — the marquee surface. Renders the assembled `CompareRow[]` (already
// ordered/filtered by the caller via the logic agent's `sortRows`/
// `filterHiddenRows`) as one wide table.
//
// THE SPLIT THIS COMPONENT MUST NOT COLLAPSE (business-rules.md's "central
// decision"): typography (bold + font-size, from `computeEmphasis`) encodes
// magnitude and is ALWAYS on; colour (the `cmp-cell-better`/`cmp-cell-worse`
// classes) encodes polarity and appears ONLY when `applicationKey` is set,
// the row has a real polarity judgement, the row isn't CR10-overlapping, and
// the row isn't a zero-span tie. `emphasis` never drives a colour and
// `polarity` never drives a font-size — two different props, two different
// CSS properties, never crossed.
//
// CR15: the property-name column (<th scope="row">) is the ONE sanctioned
// R27 exception — sticky, so it stays put while subject columns scroll
// under `.cmp-table-scroll`'s own overflow-x, never the page body's.
import { useMemo } from 'react';
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import { computeEmphasis } from '../../lib/compare/emphasis';
import {
  EMPHASIS_MAX_SCALE,
  EMPHASIS_MIN_SCALE,
  type CompareCell,
  type CompareRow,
  type CompareSubject,
} from '../../lib/compare/types';
import type { RowPolarity } from './fetch-compare';
import { formatConditions, formatDelta, formatRange } from './format';

interface CompareTableProps {
  rows: CompareRow[];
  subjects: CompareSubject[];
  polarityByRowKey: Map<string, RowPolarity>;
  applicationKey: string | undefined;
  locale: Locale;
}

function emphasisStyle(emphasis: number, isLargest: boolean): React.CSSProperties {
  const scale = EMPHASIS_MIN_SCALE + (EMPHASIS_MAX_SCALE - EMPHASIS_MIN_SCALE) * emphasis;
  return {
    fontSize: `${scale.toFixed(3)}em`,
    fontWeight: isLargest ? 700 : 400,
  };
}

/**
 * CR4/CR5/CR6/CR10 — the ONE place polarity turns into a CSS class. Returns
 * null (no colour) whenever any of the gates fail; never falls back to a
 * "neutral" colour of its own, because a fifth colour would itself be a
 * silent claim.
 */
function polarityClass(
  row: CompareRow,
  cell: CompareCell,
  polarity: RowPolarity | undefined,
  applicationKey: string | undefined,
): 'better' | 'worse' | null {
  if (!applicationKey || !polarity || polarity.polarity === 'not_relevant') return null;
  if (row.isOverlapping || row.differenceScore === 0) return null;
  const reps = row.cells.map((c) => c.representative);
  const best = polarity.polarity === 'higher_is_better' ? Math.max(...reps) : Math.min(...reps);
  return cell.representative === best ? 'better' : 'worse';
}

export function CompareTable({
  rows,
  subjects,
  polarityByRowKey,
  applicationKey,
  locale,
}: CompareTableProps) {
  const emphasisByRow = useMemo(() => {
    const map = new Map<string, Map<string, { emphasis: number; isLargest: boolean }>>();
    for (const row of rows) {
      const list = computeEmphasis(row);
      map.set(row.rowKey, new Map(list.map((e) => [e.subjectRef, e])));
    }
    return map;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="state-empty" data-testid="compare-table-empty">
        {t(locale, 'compare.emptyRows')}
      </div>
    );
  }

  return (
    <div className="cmp-table-scroll" data-testid="compare-table-scroll">
      <p className="cmp-mobile-hint" aria-hidden="true">
        {t(locale, 'compare.mobileHint')}
      </p>
      <table className="cmp-table" data-testid="compare-table">
        <caption className="sr-only">{t(locale, 'compare.tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col" className="cmp-th-property">
              {t(locale, 'compare.propertyColumn')}
            </th>
            {subjects.map((subject) => (
              <th
                scope="col"
                key={subject.ref}
                data-testid={`compare-table-subject-${subject.ref}`}
              >
                {locale === 'fa' ? subject.nameFa : subject.nameEn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cellsBySubject = new Map(row.cells.map((c) => [c.subjectRef, c]));
            const emphasisBySubject = emphasisByRow.get(row.rowKey) ?? new Map();
            const polarity = polarityByRowKey.get(row.rowKey);
            const conditionText = formatConditions(row.conditions);
            const groupName = locale === 'fa' ? row.groupNameFa : row.groupNameEn;
            const propertyName = locale === 'fa' ? row.nameFa : row.nameEn;

            // CR7 reorder animation (see CompareIsland.tsx's `changeSortMode`)
            // -- a stable, CSS-ident-safe name per row so the View
            // Transitions API can match this <tr> across a sort-mode change.
            const rowStyle = {
              viewTransitionName: `cmp-row-${row.rowKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
            } as React.CSSProperties;

            return (
              <tr key={row.rowKey} data-testid={`compare-row-${row.rowKey}`} style={rowStyle}>
                <th scope="row" className="cmp-th-property cmp-row-head">
                  <span
                    className="cmp-row-group-chip"
                    data-testid={`compare-row-group-${row.rowKey}`}
                  >
                    {groupName}
                  </span>
                  <span className="cmp-row-name">
                    {propertyName}
                    {row.symbol ? (
                      <span className="cmp-row-symbol" dir="ltr">
                        {' '}
                        ({row.symbol})
                      </span>
                    ) : null}
                    {conditionText ? (
                      <span className="cmp-row-conditions"> ({conditionText})</span>
                    ) : null}
                  </span>

                  {row.isOverlapping ? (
                    <span
                      className="cmp-row-overlap"
                      data-testid={`compare-row-overlap-${row.rowKey}`}
                    >
                      {t(locale, 'compare.notMeaningfullyDifferent')}
                    </span>
                  ) : (
                    <span className="cmp-row-delta" data-testid={`compare-row-delta-${row.rowKey}`}>
                      {t(locale, 'compare.deltaLabel')}:{' '}
                      {formatDelta(row.deltaKind, row.deltaValue, row.unit)}
                    </span>
                  )}

                  {row.hasCitationAsymmetry ? (
                    <span
                      className="cmp-row-citation-flag"
                      data-testid={`compare-row-citation-flag-${row.rowKey}`}
                    >
                      {t(locale, 'compare.citationMixed')}
                    </span>
                  ) : null}

                  {polarity && applicationKey ? (
                    <details className="cmp-polarity-rationale">
                      <summary>{t(locale, 'compare.polarityRationale')}</summary>
                      <p>{locale === 'fa' ? polarity.rationaleFa : polarity.rationaleEn}</p>
                    </details>
                  ) : null}
                </th>

                {subjects.map((subject) => {
                  const cell = cellsBySubject.get(subject.ref);
                  if (!cell) {
                    return (
                      <td
                        key={subject.ref}
                        className="cmp-cell cmp-cell-missing"
                        data-testid={`compare-cell-${row.rowKey}-${subject.ref}`}
                      >
                        {t(locale, 'compare.notCurated')}
                      </td>
                    );
                  }

                  const emphasis = emphasisBySubject.get(subject.ref) ?? {
                    emphasis: 0,
                    isLargest: false,
                  };
                  const pClass = polarityClass(row, cell, polarity, applicationKey);
                  const classNames = ['cmp-cell'];
                  if (pClass) classNames.push(`cmp-cell-${pClass}`);

                  return (
                    <td
                      key={subject.ref}
                      className={classNames.join(' ')}
                      data-testid={`compare-cell-${row.rowKey}-${subject.ref}`}
                    >
                      <span
                        className="cmp-cell-value"
                        style={emphasisStyle(emphasis.emphasis, emphasis.isLargest)}
                        dir="ltr"
                      >
                        {formatRange(cell.band.valueMin, cell.band.valueMax, row.unit)}
                      </span>
                      {pClass ? (
                        <span className="cmp-cell-polarity-mark" aria-hidden="true">
                          {pClass === 'better' ? '▲' : '▼'}
                        </span>
                      ) : null}
                      {pClass ? (
                        <span className="sr-only">
                          {pClass === 'better'
                            ? t(locale, 'compare.polarityBetter')
                            : t(locale, 'compare.polarityWorse')}
                        </span>
                      ) : null}
                      <span
                        className={`cmp-cell-cited ${cell.isCited ? 'cmp-cell-cited-yes' : 'cmp-cell-cited-no'}`}
                        title={
                          cell.isCited
                            ? t(locale, 'compare.citedMark')
                            : t(locale, 'compare.uncitedMark')
                        }
                        aria-label={
                          cell.isCited
                            ? t(locale, 'compare.citedMark')
                            : t(locale, 'compare.uncitedMark')
                        }
                      >
                        {cell.isCited ? '§' : '?'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
