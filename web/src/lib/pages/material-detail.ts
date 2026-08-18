import type {
  GradeClass,
  MaterialDetail,
  PropertyDefinition,
  PropertyGroup,
  PropertyValue,
} from '../api/types';

// S4's acceptance criterion, made literal: "only properties that apply to
// the material's field are shown -- depends on G3, and without it this
// story regresses to noise." Scope decides what is a CANDIDATE at all;
// presence among candidates decides missing (render an invitation) vs a
// property that simply doesn't apply here (render nothing). Confusing the
// two would put "please contribute a value" invitations on properties that
// were never going to have one -- worse than the dash-and-hidden-row
// problem D11 exists to fix.
function applies(property: PropertyDefinition, fieldKey: string, familyKey: string): boolean {
  const fieldOk =
    property.appliesToFields.length === 0 || property.appliesToFields.includes(fieldKey);
  const familyOk =
    property.appliesToFamilies.length === 0 || property.appliesToFamilies.includes(familyKey);
  return fieldOk && familyOk;
}

export interface MaterialSection {
  key: string;
  nameFa: string;
  nameEn: string;
  // null = a candidate property (in scope) with no property_value row --
  // D11's "missing" state, rendered by ValueAtom as an invitation. A
  // property that fails `applies()` never reaches this array at all.
  rows: Array<{ property: PropertyDefinition; value: PropertyValue | null }>;
}

// Registry order in, registry order out (R28) -- both /api/properties and
// /api/materials/:slug already return their groups and properties in
// property_group.sort_order / property_definition.sort_order, so this
// function preserves that order rather than re-deriving or re-sorting it.
export function buildMaterialSections(
  registry: PropertyGroup<PropertyDefinition>[],
  material: Pick<MaterialDetail, 'field' | 'family' | 'propertyGroups'>,
): MaterialSection[] {
  const valuesByGroup = new Map<string, Map<string, PropertyValue>>();
  for (const group of material.propertyGroups) {
    const byKey = new Map<string, PropertyValue>();
    for (const value of group.properties) byKey.set(value.key, value);
    valuesByGroup.set(group.key, byKey);
  }

  return registry.map((group) => {
    const values = valuesByGroup.get(group.key) ?? new Map<string, PropertyValue>();
    const rows = group.properties
      .filter((property) => applies(property, material.field.key, material.family.key))
      .map((property) => ({ property, value: values.get(property.key) ?? null }));
    return { key: group.key, nameFa: group.nameFa, nameEn: group.nameEn, rows };
  });
}

// ---------------------------------------------------------------------------
// FE-3b: grade classes
// ---------------------------------------------------------------------------

// ValueAtom's `property` prop wants the registry's PropertyDefinition shape
// (description, allowedUnits, scoping...) so it can render the "(i)" info
// button and the two D11 states (present/missing). A grade class's own
// value already carries name/symbol/dataType (api's mapPropertyValueRow),
// just not wrapped that way -- and a grade-class row is NEVER rendered in
// the "missing" state (D46: only what was explicitly stated is shown at
// all, so there is nothing to invite a contribution for here), so the
// adapted definition has no description and empty scoping arrays. This
// keeps every property value on the page going through the one shared
// ValueAtom component (R1) instead of a second, grade-class-only renderer.
export function propertyValueAsDefinition(value: PropertyValue): PropertyDefinition {
  return {
    key: value.key,
    nameFa: value.nameFa,
    nameEn: value.nameEn,
    descriptionFa: null,
    descriptionEn: null,
    symbol: value.symbol,
    dataType: value.dataType,
    unit: value.unit,
    allowedUnits: [],
    isSearchable: false,
    isComparable: false,
    appliesToFields: [],
    appliesToFamilies: [],
  };
}

// Per-class transparency line, same phrasing family as CoverageBadge's
// material-level sentence ("{cited} of {total} values sourced") -- this is
// the "make clear that what's shown is what differs" requirement made
// literal: a reader sees, before expanding, how many values this specific
// class carries and how many of those are cited.
export function gradeClassValueCounts(gradeClass: GradeClass): { total: number; cited: number } {
  const values = gradeClass.propertyGroups.flatMap((group) => group.properties);
  return {
    total: values.length,
    cited: values.filter((value) => value.citations.length > 0).length,
  };
}
