import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';
import { groupConsecutiveBy } from '../group.js';

// The property registry, grouped -- lets the frontend build property
// pickers and comparison rows from data instead of hardcoding them.
const PROPERTIES_SQL = `
  SELECT
    pgr.key AS group_key,
    pgr.name_fa AS group_name_fa,
    pgr.name_en AS group_name_en,
    pgr.ui_tab AS group_ui_tab,
    pd.key AS property_key,
    pd.name_fa AS property_name_fa,
    pd.name_en AS property_name_en,
    pd.description_fa AS property_description_fa,
    pd.description_en AS property_description_en,
    pd.symbol AS property_symbol,
    pd.data_type AS property_data_type,
    pd.canonical_unit AS property_canonical_unit,
    pd.allowed_units AS property_allowed_units,
    pd.is_searchable AS property_is_searchable,
    pd.is_comparable AS property_is_comparable
  FROM property_definition pd
  JOIN property_group pgr ON pgr.id = pd.group_id
  ORDER BY pgr.sort_order, pd.sort_order, pd.key
`;

interface PropertyDefinitionRow {
  propertyKey: string;
  propertyNameFa: string;
  propertyNameEn: string;
  propertyDescriptionFa: string | null;
  propertyDescriptionEn: string | null;
  propertySymbol: string | null;
  propertyDataType: string;
  propertyCanonicalUnit: string | null;
  propertyAllowedUnits: string[];
  propertyIsSearchable: boolean;
  propertyIsComparable: boolean;
}

export function registerPropertiesRoute(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/api/properties', async (_req, reply) => {
    const result = await pool.query(PROPERTIES_SQL);

    const grouped = groupConsecutiveBy(result.rows, (r) => r.group_key as string);
    const data = grouped.map(({ rows }) => {
      const first = toCamelCase<{
        groupKey: string;
        groupNameFa: string;
        groupNameEn: string;
        groupUiTab: string | null;
      }>(rows[0]!);

      return {
        key: first.groupKey,
        nameFa: first.groupNameFa,
        nameEn: first.groupNameEn,
        uiTab: first.groupUiTab,
        properties: rows.map((r) => {
          const camel = toCamelCase<PropertyDefinitionRow>(r);
          return {
            key: camel.propertyKey,
            nameFa: camel.propertyNameFa,
            nameEn: camel.propertyNameEn,
            descriptionFa: camel.propertyDescriptionFa,
            descriptionEn: camel.propertyDescriptionEn,
            symbol: camel.propertySymbol,
            dataType: camel.propertyDataType,
            unit: camel.propertyCanonicalUnit,
            allowedUnits: camel.propertyAllowedUnits,
            isSearchable: camel.propertyIsSearchable,
            isComparable: camel.propertyIsComparable,
          };
        }),
      };
    });

    return reply.send({ data, total: result.rows.length });
  });
}
