#!/usr/bin/env bash
#
# "Which material is missing which property?" -- the whole answer in one
# screen, without exporting a CSV or opening the frontend.
#
#   ./coverage.sh              # one line per material: filled / applicable
#   ./coverage.sh pvc          # the actual missing property keys for one material
#   ./coverage.sh --grades     # same summary, per grade_class instead
#
# Only properties that actually APPLY to a material are counted. A property
# scoped to certain fields/families (crystallinity is polyolefins+polyesters
# only, for instance) is not counted as "missing" for an amorphous polymer --
# it genuinely doesn't exist there, and counting it would make every amorphous
# polymer look permanently incomplete.

set -euo pipefail

PSQL=(docker exec polypedia-pg psql -U polypedia -d polypedia)

if ! docker exec polypedia-pg pg_isready -U polypedia >/dev/null 2>&1; then
    echo "error: the database isn't running. Try:  docker start polypedia-pg" >&2
    exit 1
fi

# A property applies to a material when its field/family scope arrays are
# either empty (= applies to everything) or contain that material's field/family.
APPLICABLE="
  FROM material m
  JOIN field f  ON f.id = m.field_id
  JOIN family fam ON fam.id = m.family_id
  JOIN property_definition pd
    ON (cardinality(pd.applies_to_fields)   = 0 OR f.key   = ANY(pd.applies_to_fields))
   AND (cardinality(pd.applies_to_families) = 0 OR fam.key = ANY(pd.applies_to_families))
"

HAS_VALUE="
  EXISTS (SELECT 1 FROM property_value pv
           WHERE pv.subject_type = 'material'
             AND pv.subject_id = m.id
             AND pv.property_id = pd.id
             AND pv.superseded_by IS NULL
             AND pv.status <> 'superseded')
"

case "${1:-}" in
    --grades)
        "${PSQL[@]}" -c "
          SELECT m.slug || '/' || gc.key AS grade,
                 count(*) FILTER (WHERE pv.id IS NOT NULL) AS filled
            FROM grade_class gc
            JOIN material m ON m.id = gc.material_id
            LEFT JOIN property_value pv
              ON pv.subject_type = 'grade_class' AND pv.subject_id = gc.id
             AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
           GROUP BY 1 ORDER BY 1;"
        ;;
    "")
        "${PSQL[@]}" -c "
          SELECT m.slug,
                 count(*) FILTER (WHERE $HAS_VALUE) AS filled,
                 count(*)                           AS applicable,
                 round(100.0 * count(*) FILTER (WHERE $HAS_VALUE) / count(*)) || '%' AS pct
          $APPLICABLE
           GROUP BY m.slug ORDER BY 4 DESC, 1;"
        ;;
    *)
        echo "Missing properties for '$1':"
        "${PSQL[@]}" -tAc "
          SELECT pd.group_id::text || E'\t' || pd.key
          $APPLICABLE
           WHERE m.slug = '$1' AND NOT $HAS_VALUE
           ORDER BY pd.group_id, pd.key;" \
          | awk -F'\t' '{ printf "%s%s", (NR%5==1 ? "\n  " : ", "), $2 } END { print "" }'
        ;;
esac
