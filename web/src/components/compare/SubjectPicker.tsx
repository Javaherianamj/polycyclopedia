// FE-6 — CR14/CR16: add/remove materials AND grade classes, N-way, uncapped.
// The candidate list is the same static search index FE-5 already ships
// (`search-materials.json`), not a new API call — see fetch-compare.ts's
// header for why subject identity is resolved from there.
import { useMemo, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { SearchIndexData } from '../search/fetch-index';
import type { CompareSubject } from '../../lib/compare/types';

interface Candidate {
  ref: string;
  nameFa: string;
  nameEn: string;
  materialNameFa: string;
  materialNameEn: string;
  isGradeClass: boolean;
}

interface SubjectPickerProps {
  index: SearchIndexData;
  subjects: CompareSubject[];
  subjectRefs: string[];
  onAdd: (ref: string) => void;
  onRemove: (ref: string) => void;
  onClear: () => void;
  locale: Locale;
}

export function SubjectPicker({
  index,
  subjects,
  subjectRefs,
  onAdd,
  onRemove,
  onClear,
  locale,
}: SubjectPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const candidates = useMemo<Candidate[]>(() => {
    const materialCandidates: Candidate[] = index.materials.map((m) => ({
      ref: m.slug,
      nameFa: m.nameFa,
      nameEn: m.nameEn,
      materialNameFa: m.nameFa,
      materialNameEn: m.nameEn,
      isGradeClass: false,
    }));
    const materialByslug = new Map(index.materials.map((m) => [m.slug, m]));
    const gradeCandidates: Candidate[] = index.gradeClasses.map((g) => {
      const material = materialByslug.get(g.materialSlug);
      return {
        ref: `${g.materialSlug}/${g.key}`,
        nameFa: g.nameFa,
        nameEn: g.nameEn,
        materialNameFa: material?.nameFa ?? g.materialSlug,
        materialNameEn: material?.nameEn ?? g.materialSlug,
        isGradeClass: true,
      };
    });
    return [...materialCandidates, ...gradeCandidates];
  }, [index]);

  const selectedSet = useMemo(() => new Set(subjectRefs), [subjectRefs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => !selectedSet.has(c.ref))
      .filter((c) => {
        if (q === '') return true;
        const name = locale === 'fa' ? c.nameFa : c.nameEn;
        const materialName = locale === 'fa' ? c.materialNameFa : c.materialNameEn;
        return (
          name.toLowerCase().includes(q) ||
          materialName.toLowerCase().includes(q) ||
          c.ref.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [candidates, selectedSet, query, locale]);

  function pick(ref: string) {
    onAdd(ref);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="cmp-subjects" data-testid="compare-subject-picker">
      <h2 className="cmp-panel-heading">{t(locale, 'compare.subjectsHeading')}</h2>

      <ul className="cmp-subject-chips" data-testid="compare-subject-chips">
        {subjects.map((subject) => {
          const name = locale === 'fa' ? subject.nameFa : subject.nameEn;
          return (
            <li
              key={subject.ref}
              className="cmp-subject-chip"
              data-testid={`compare-subject-chip-${subject.ref}`}
            >
              <span>{name}</span>
              <button
                type="button"
                className="cmp-subject-remove"
                aria-label={t(locale, 'compare.removeSubject').replace('{name}', name)}
                onClick={() => onRemove(subject.ref)}
                data-testid={`compare-subject-remove-${subject.ref}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cmp-add-subject">
        <label className="cmp-add-subject-label" htmlFor="compare-add-subject-input">
          {t(locale, 'compare.addSubject')}
        </label>
        <div className="cmp-add-subject-combo">
          <input
            id="compare-add-subject-input"
            type="text"
            className="cmp-add-subject-input"
            placeholder={t(locale, 'compare.addSubjectPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            data-testid="compare-add-subject-input"
          />
          {open ? (
            <ul className="cmp-add-subject-list" data-testid="compare-add-subject-list">
              {filtered.length === 0 ? (
                <li className="cmp-add-subject-empty">{t(locale, 'compare.noMatches')}</li>
              ) : (
                filtered.map((c) => (
                  <li key={c.ref}>
                    <button
                      type="button"
                      className="cmp-add-subject-option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(c.ref);
                      }}
                      data-testid={`compare-add-subject-option-${c.ref}`}
                    >
                      <span>{locale === 'fa' ? c.nameFa : c.nameEn}</span>
                      {c.isGradeClass ? (
                        <span className="cmp-add-subject-option-meta">
                          {locale === 'fa' ? c.materialNameFa : c.materialNameEn}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </div>

      {subjects.length > 0 ? (
        <button
          type="button"
          className="cmp-clear-all"
          onClick={onClear}
          data-testid="compare-clear-all"
        >
          {t(locale, 'compare.removeAll')}
        </button>
      ) : null}
    </div>
  );
}
