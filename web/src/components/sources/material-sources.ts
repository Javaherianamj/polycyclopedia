// FE-7 — pure logic assembling the per-material "CSV of data with their
// source" (D4, frontend-plan.md §5 FE-7). No network calls here: the whole
// unit is a reshape of data the material-detail page already fetches
// (`MaterialDetail`, already carrying `citations` per value) — frontend-
// plan.md is explicit that both FE-7 surfaces are "views over data FE-2
// already fetches", not a new data source for the per-material half.
//
// Reuses `buildMaterialSections` (lib/pages/material-detail.ts, FE-3) for
// the material-level candidate list rather than re-deriving "which
// properties apply to this material" a second time — that scoping logic
// (field/family applicability) is exactly what decides `missing` vs `does
// not apply here`, and getting it wrong would either invent phantom rows or
// silently drop real ones.
import type {
  Citation,
  GradeClass,
  MaterialDetail,
  PropertyDefinition,
  PropertyGroup,
} from '../../lib/api/types';
import { buildMaterialSections } from '../../lib/pages/material-detail';
import { provenanceState, type ProvenanceState } from '../value-atom/logic';

export interface MaterialSourceRow {
  /** property key, plus a stable suffix for grade-class rows that share a
   * key but differ by conditions (mirrors GradeClassBand.astro's own
   * condition-in-name handling, kept here as a distinct row key instead so
   * two conditioned rows never collide in a React/Astro `key`). */
  rowKey: string;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  conditionLabel: string | null;
  state: ProvenanceState;
  display: string | null;
  citations: Citation[];
}

export interface MaterialSourceGroup {
  key: string;
  nameFa: string;
  nameEn: string;
  rows: MaterialSourceRow[];
}

export interface MaterialSourceGradeClass {
  key: string;
  nameFa: string;
  nameEn: string;
  groups: MaterialSourceGroup[];
}

export interface MaterialSourceData {
  materialGroups: MaterialSourceGroup[];
  gradeClasses: MaterialSourceGradeClass[];
  /** Candidate rows only — material-level + grade-class, `missing` included.
   * Used for the R7 "nothing at all to show" guard, not a coverage figure
   * (CoverageBadge/gradeClassValueCounts already own that number; this is
   * only "is there anything for this table to render"). */
  totalRowCount: number;
}

function conditionLabel(conditions: Record<string, string | number> | null | undefined): string | null {
  if (!conditions) return null;
  const values = Object.values(conditions);
  if (values.length === 0) return null;
  return values.map((v) => String(v)).join(', ');
}

function buildGroupsForRegistry(
  registry: PropertyGroup<PropertyDefinition>[],
  material: Pick<MaterialDetail, 'field' | 'family' | 'propertyGroups'>,
): MaterialSourceGroup[] {
  const sections = buildMaterialSections(registry, material);
  return sections
    .filter((section) => section.rows.length > 0)
    .map((section) => ({
      key: section.key,
      nameFa: section.nameFa,
      nameEn: section.nameEn,
      rows: section.rows.map(({ property, value }) => ({
        rowKey: property.key,
        nameFa: property.nameFa,
        nameEn: property.nameEn,
        symbol: property.symbol,
        conditionLabel: value ? conditionLabel(value.conditions) : null,
        state: provenanceState(value),
        display: value?.display ?? null,
        citations: value?.citations ?? [],
      })),
    }));
}

// D46 — grade classes carry ONLY what was explicitly cited/stated for that
// resin population, never a candidate list with missing rows filled in
// (unlike the material level above). So every row here is `cited` or
// `uncited`, never `missing` — there is nothing to invite a contribution
// for at this level (GradeClassBand.astro's own comment says the same).
function buildGradeClasses(gradeClasses: GradeClass[]): MaterialSourceGradeClass[] {
  return gradeClasses.map((gc) => ({
    key: gc.key,
    nameFa: gc.nameFa,
    nameEn: gc.nameEn,
    groups: gc.propertyGroups
      .filter((group) => group.properties.length > 0)
      .map((group) => ({
        key: group.key,
        nameFa: group.nameFa,
        nameEn: group.nameEn,
        rows: group.properties.map((value) => ({
          rowKey: `${value.key}${conditionLabel(value.conditions) ? `:${conditionLabel(value.conditions)}` : ''}`,
          nameFa: value.nameFa,
          nameEn: value.nameEn,
          symbol: value.symbol,
          conditionLabel: conditionLabel(value.conditions),
          state: provenanceState(value),
          display: value.display,
          citations: value.citations,
        })),
      })),
  }));
}

export function buildMaterialSourceData(
  registry: PropertyGroup<PropertyDefinition>[],
  material: MaterialDetail,
): MaterialSourceData {
  const materialGroups = buildGroupsForRegistry(registry, material);
  const gradeClasses = buildGradeClasses(material.gradeClasses);

  const totalRowCount =
    materialGroups.reduce((sum, g) => sum + g.rows.length, 0) +
    gradeClasses.reduce((sum, gc) => sum + gc.groups.reduce((s, g) => s + g.rows.length, 0), 0);

  return { materialGroups, gradeClasses, totalRowCount };
}
