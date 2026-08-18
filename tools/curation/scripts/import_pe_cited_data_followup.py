#!/usr/bin/env python3
"""Follow-up to import_pe_cited_data.py, after the owner pushed back on the
first pass: "i told you to add all of the data i have in this file into
database. you just took citation of some, and diverted others? ask me if
you want to add something new and do it! i was telling you to do so! also,
about density and all properties which already there, are they cited? if
not delete them and replace them with the data i gave you now".

Three things this script does, none of them silent skips:

1. RETIRES the 5 pre-existing UNCITED editorial rows that the first pass's
   own data collided with (LDPE/HDPE density, HDPE tm, LDPE/HDPE unit_cell --
   all seeded 2026-07-31 with status='unsourced' and no evidence). The first
   pass correctly refused to overwrite them outright (that would silently
   destroy a number nobody asked to replace) and instead added the owner's
   number as a linked *observation*. The owner has now explicitly said: if
   the old number was never cited, replace it, don't just stand a citable
   number next to an uncited one. So here the *new*, cited observation is
   promoted to become the editorial row, and the old uncited editorial row
   is deleted (nothing else references it -- verified below before deleting).

2. FIXES a real transcription bug from the first pass: Table 3's "High load
   melt index (21.6 kg)" row is Injection="High" (text, not a number) /
   Blow=34.14 / Film=23.22. The first pass misread the column alignment and
   attributed 34.14 to the INJECTION grade. That row (id looked up by
   subject+property+conditions, not hardcoded) is deleted and the correct
   blow/film values inserted.

3. IMPORTS everything from Table 3, Table 9, Table 10 and Table 11 that the
   first pass left out because no property_definition existed yet --
   db/seeds/0009_pe_import_properties.sql and 0010_pe_import_properties_2.sql
   added brittleness_temp, escr, comonomer_content, tensile_impact_strength,
   notched_impact_area_basis, heat_resistance_temp, specific_heat_capacity,
   heat_of_combustion, hardness_brinell precisely so this data would not have
   to be skipped. Also fills in properties that already existed but whose
   OTHER grade-class values were missed on the first pass (blow/film Vicat,
   thermal conductivity, elongation at break, hardness Shore D).

Still not imported, and still not guessed: the Encyclopedia v1 p549
shrinkage/CTE table, whose own column headers are ambiguous in the extracted
text -- see the AskUserQuestion this script's companion turn raised.

Run: python3 import_pe_cited_data_followup.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import get_connection  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_pe_cited_data import (  # noqa: E402
    ENCYC_V2,
    get_or_create_citation,
    get_or_create_document,
    get_or_create_grade_class,
    get_or_create_source,
    get_or_create_test_method,
)

CONTRIBUTOR_EMAIL = "amirmahdijavaherian1383@gmail.com"
CREATED_BY = "curation-import-pe-cited-data-followup"

# Rows to retire: (material_slug, property_key) -> nothing else needed, the
# script finds the live uncited editorial row and its replacement
# observation (inserted by the first pass, created_by='curation-import-pe-cited-data')
# itself.
RETIRE = [
    ("ldpe", "density"),
    ("hdpe", "density"),
    ("hdpe", "tm"),
    ("ldpe", "unit_cell"),
    ("hdpe", "unit_cell"),
]

# The first pass's misreading of Table 3's high-load MFI column.
DELETE_WRONG = [
    dict(subject=("grade_class", "hdpe", "injection"), property="mfi", conditions={"load_kg": 21.6}),
]

TABLE3_LOCATOR = {"page": 392, "volume": 2, "table": "3"}

NEW_FACTS = [
    # --- Table 3 corrections and completions --------------------------------
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="mfi",
        value_typical=34.14, conditions={"load_kg": 21.6},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1238",
        note_en="Table 3. High load melt index at 21.6kg load. (Corrects the first import pass, which misattributed this number to the injection grade -- Table 3's injection value for this row is the non-numeric 'High'.)",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="mfi",
        value_typical=23.22, conditions={"load_kg": 21.6},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1238",
        note_en="Table 3. High load melt index at 21.6kg load.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="vicat",
        value_typical=133,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1525",
        note_en="Table 3. Blow molding grade (missed on the first import pass -- only injection's Vicat was captured then).",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="conductivity",
        value_min=0.42, value_max=0.44,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Blow molding grade thermal conductivity.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="elongation_at_break",
        value_typical=669,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D638",
        note_en="Table 3. Blow molding grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="hardness_shore_d",
        value_typical=62,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D2240",
        note_en="Table 3. Blow molding grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="hardness_shore_d",
        value_typical=51,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D2240",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="hardness_brinell",
        value_min=60, value_max=70,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="hardness_brinell",
        value_min=50, value_max=60,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="hardness_brinell",
        value_min=35, value_max=50,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="comonomer_content",
        value_typical=0.00,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Weight percent hexene, C13 NMR. Driver for the grade_dependent properties on this grade_class.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="comonomer_content",
        value_typical=0.60,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Weight percent hexene.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="comonomer_content",
        value_typical=3.50,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Weight percent hexene.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="tensile_impact_strength",
        value_typical=56.8,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D638",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="tensile_impact_strength",
        value_typical=143.6,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D638",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="tensile_impact_strength",
        value_typical=9.0,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D638",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="notched_impact_area_basis",
        value_typical=0.90,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D256",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="notched_impact_area_basis",
        value_typical=17.3,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D256",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="notched_impact_area_basis",
        value_text="No Break",
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D256",
        note_en="Table 3. Printed as 'No Break' -- the specimen did not fracture under the test's impact energy.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="brittleness_temp",
        value_min=-140, value_max=-70,
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D746",
        note_en="Table 3. Blow molding grade (injection and film blank in the source).",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="heat_resistance_temp",
        value_typical=122,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Printed as 'ca 122' (approximate). No ASTM method given in the source for this row.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="heat_resistance_temp",
        value_typical=120,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Printed as 'ca 120'.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="heat_resistance_temp",
        value_typical=117,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Printed as 'ca 117'.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="heat_of_combustion",
        value_typical=46.0,
        source=ENCYC_V2, locator=TABLE3_LOCATOR,
        note_en="Table 3. Blow molding grade -- this is the only grade the source gives a value for (injection/film blank). NOTE: the first import pass's note incorrectly said this was the injection grade's value; corrected here.",
    ),
    # ESCR, Table 3 (3 conditions x 3 grades)
    dict(
        subject=("grade_class", "hdpe", "injection"), property="escr",
        value_typical=0, conditions={"condition": "A"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition A.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="escr",
        value_typical=0, conditions={"condition": "B"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition B.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="escr",
        value_typical=0, conditions={"condition": "C"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition C.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="escr",
        value_typical=49, conditions={"condition": "A"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition A.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="escr",
        value_typical=29, conditions={"condition": "B"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition B.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="escr",
        value_typical=0, conditions={"condition": "C"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition C.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="escr",
        value_min=1000, qualifier=">", conditions={"condition": "A"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition A, printed as '>1000'.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="escr",
        value_min=1000, qualifier=">", conditions={"condition": "B"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition B, printed as '>1000'.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="escr",
        value_min=1000, qualifier=">", conditions={"condition": "C"},
        source=ENCYC_V2, locator=TABLE3_LOCATOR, test_method="D1693",
        note_en="Table 3. ESCR Condition C, printed as '>1000'.",
    ),

    # --- Table 9: brittleness (missed on the first pass) --------------------
    dict(
        subject=("grade_class", "lldpe", "injection"), property="brittleness_temp",
        value_max=-76, qualifier="<",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"}, test_method="D746",
        note_en="Table 9: Comparison of LLDPE and LDPE Injection Molding Resins. Printed as '<-76'.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="brittleness_temp",
        value_typical=-25,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"}, test_method="D746",
        note_en="Table 9.",
    ),

    # --- Table 10: ESCR (missed on the first pass) --------------------------
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_gas_phase"), property="escr",
        value_min=1000, qualifier=">",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"}, test_method="D1693",
        note_en="Table 10: Comparison of LLDPE and HDPE Rotational Molding Resins. Gas-phase route, printed as '>1000'.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_solution"), property="escr",
        value_typical=400,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"}, test_method="D1693",
        note_en="Table 10. Solution route.",
    ),
    dict(
        subject=("grade_class", "hdpe", "rotational_molding"), property="escr",
        value_typical=30,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"}, test_method="D1693",
        note_en="Table 10.",
    ),

    # --- Table 11: brittleness + ESCR (missed on the first pass) -----------
    dict(
        subject=("grade_class", "lldpe", "blow_molding"), property="brittleness_temp",
        value_max=-76, qualifier="<",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"}, test_method="D746",
        note_en="Table 11: Comparison of LDPE, LLDPE and HDPE Blow Molding Resins.",
    ),
    dict(
        subject=("grade_class", "ldpe", "blow_molding"), property="brittleness_temp",
        value_max=-76, qualifier="<",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"}, test_method="D746",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="brittleness_temp",
        value_max=-76, qualifier="<",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"}, test_method="D746",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "lldpe", "blow_molding"), property="escr",
        value_min=1000, qualifier=">",
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"}, test_method="D1693",
        note_en="Table 11, printed as '>1000'.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="escr",
        value_typical=50,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"}, test_method="D1693",
        note_en="Table 11. (Note: this HDPE blow-molding ESCR is Table 11's own reported value, 50h -- distinct from Table 3's blow-molding grade, which reports different ESCR values under a 3-condition test. Both are kept, since they describe different specific commercial grades.)",
    ),
    # LDPE blow molding ESCR is 'NM' (not measured) in Table 11 -- not imported, not guessed.
]

# Facts genuinely not imported even now, because importing them would mean
# guessing rather than transcribing.
STILL_SKIPPED_NOTES = [
    "Encyclopedia v1 p549 shrinkage/CTE table -- column headers ambiguous "
    "in the extracted text (two properties, one set of numbers per "
    "material). Needs the owner to resolve which number is which before "
    "any property (existing `cte` or a new one) can receive it.",
    "Table 11 LDPE blow-molding ESCR -- source prints 'NM' (not measured). "
    "No number to import.",
    "Table 3 CTE linear/volume expansion coefficients (blow molding grade "
    "only) -- same unit-basis ambiguity as the Encyclopedia v1 table above "
    "(10^-4, unclear whether per-K or per-material-length-per-K).",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    conn = get_connection()
    retired = 0
    deleted_wrong = 0
    inserted = 0
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM contributor WHERE email = %s", (CONTRIBUTOR_EMAIL,))
            contributor_id = cur.fetchone()[0]

            cur.execute("SELECT id, slug FROM material WHERE slug IN ('ldpe','hdpe','lldpe')")
            material_ids = {slug: mid for mid, slug in cur.fetchall()}

            cur.execute("SELECT id, key FROM property_definition")
            property_ids = {key: pid for pid, key in cur.fetchall()}

            # -----------------------------------------------------------------
            # Step 1: retire the 5 pre-existing uncited editorial rows
            # -----------------------------------------------------------------
            for material_slug, prop_key in RETIRE:
                material_id = material_ids[material_slug]
                property_id = property_ids[prop_key]

                cur.execute(
                    """SELECT id, status FROM property_value
                        WHERE subject_type = 'material' AND subject_id = %s AND property_id = %s
                          AND value_role = 'editorial' AND superseded_by IS NULL AND status <> 'superseded'""",
                    (material_id, property_id),
                )
                old_row = cur.fetchone()
                if old_row is None:
                    continue
                old_id, old_status = old_row

                cur.execute(
                    """SELECT EXISTS(SELECT 1 FROM evidence WHERE subject_type='property_value' AND subject_id=%s)""",
                    (old_id,),
                )
                old_has_evidence = cur.fetchone()[0]
                if old_has_evidence:
                    # Already cited -- not one of the 5 uncited rows the
                    # owner is asking about. Leave it alone.
                    continue

                cur.execute(
                    """SELECT id FROM property_value
                        WHERE editorial_value_id = %s AND value_role = 'observation'
                          AND created_by = 'curation-import-pe-cited-data'""",
                    (old_id,),
                )
                new_row = cur.fetchone()
                if new_row is None:
                    print(f"  SKIP retire {material_slug}/{prop_key}: no replacement observation found under editorial {old_id}")
                    continue
                new_id = new_row[0]

                # Nothing else may reference the old editorial row before
                # deleting it -- contribution rows use a soft polymorphic
                # reference (no FK, see 0019's header) so they are not a
                # blocker, but re-check evidence/observations defensively.
                cur.execute(
                    "SELECT count(*) FROM property_value WHERE editorial_value_id = %s AND id <> %s",
                    (old_id, new_id),
                )
                other_dependents = cur.fetchone()[0]
                if other_dependents:
                    print(f"  SKIP retire {material_slug}/{prop_key}: editorial {old_id} has {other_dependents} other linked rows, not safe to delete")
                    continue

                # Three steps, in this order, or two different constraints
                # fire: (1) clear the new row's editorial_value_id FK to the
                # old row first, since old_id can't be deleted while
                # something still references it; (2) delete the now-
                # unreferenced old row; (3) only now promote the new row to
                # editorial -- doing this before step 2 would put two
                # editorial rows in uq_property_value_live_editorial's slot
                # at once (same ordering constraint the existing supersede
                # path in import_values.py documents for that index).
                cur.execute(
                    "UPDATE property_value SET editorial_value_id = NULL WHERE id = %s",
                    (new_id,),
                )
                cur.execute("DELETE FROM property_value WHERE id = %s", (old_id,))
                cur.execute(
                    """UPDATE property_value
                          SET value_role = 'editorial',
                              status = 'published', derivation_rule = 'single_source'
                        WHERE id = %s""",
                    (new_id,),
                )
                print(f"  retired {material_slug}/{prop_key}: deleted uncited editorial {old_id} (status was {old_status}), promoted cited observation {new_id} to editorial")
                retired += 1

            # -----------------------------------------------------------------
            # Step 2: delete the Table 3 high-load-MFI misattribution
            # -----------------------------------------------------------------
            for wrong in DELETE_WRONG:
                _, material_slug, gc_key = wrong["subject"]
                cur.execute(
                    "SELECT id FROM grade_class WHERE material_id = %s AND key = %s",
                    (material_ids[material_slug], gc_key),
                )
                gc_id = cur.fetchone()[0]
                property_id = property_ids[wrong["property"]]
                cur.execute(
                    """DELETE FROM property_value
                        WHERE subject_type = 'grade_class' AND subject_id = %s AND property_id = %s
                          AND conditions = %s::jsonb""",
                    (gc_id, property_id, json.dumps(wrong["conditions"])),
                )
                deleted_wrong += cur.rowcount

            # -----------------------------------------------------------------
            # Step 3: import everything new
            # -----------------------------------------------------------------
            source_cache: dict = {}
            grade_class_cache: dict = {}
            test_method_cache: dict = {}

            for fact in NEW_FACTS:
                source_id = get_or_create_source(cur, source_cache, fact["source"])
                doc_id = get_or_create_document(cur, source_cache, source_id, fact["source"])
                citation_id = get_or_create_citation(cur, doc_id, fact["locator"])

                _, material_slug, gc_key = fact["subject"]
                subject_id = get_or_create_grade_class(
                    cur, grade_class_cache, material_ids[material_slug], material_slug, gc_key
                )

                property_id = property_ids[fact["property"]]
                test_method_id = None
                if fact.get("test_method"):
                    test_method_id = get_or_create_test_method(cur, test_method_cache, fact["test_method"])

                conditions = fact.get("conditions", {})

                cur.execute(
                    """SELECT id FROM property_value
                        WHERE subject_type = 'grade_class' AND subject_id = %s AND property_id = %s
                          AND conditions = %s::jsonb AND value_role = 'editorial'
                          AND superseded_by IS NULL AND status <> 'superseded'""",
                    (subject_id, property_id, json.dumps(conditions)),
                )
                existing = cur.fetchone()
                # Same rule as the first pass: a live editorial row already
                # occupying this exact (subject, property, conditions) slot
                # is not a reason to drop the new fact -- it means two real
                # sources describe the same population (e.g. Table 3's and
                # Table 11's brittleness_temp for hdpe/blow_molding), which
                # is exactly what U1 v2 FR-2 exists to hold. The new fact
                # becomes an observation linked under the existing editorial
                # instead of being silently skipped.
                value_role = "editorial"
                editorial_value_id = None
                derivation_rule = "single_source"
                status = "published"
                if existing:
                    value_role = "observation"
                    editorial_value_id = existing[0]
                    derivation_rule = None
                    status = "unsourced"

                cur.execute(
                    """
                    INSERT INTO property_value (
                        subject_type, subject_id, property_id,
                        value_min, value_max, value_typical, value_text,
                        qualifier, test_method_id, conditions,
                        note_en, status, value_role, editorial_value_id, derivation_rule, created_by
                    ) VALUES (
                        'grade_class', %(subject_id)s, %(property_id)s,
                        %(value_min)s, %(value_max)s, %(value_typical)s, %(value_text)s,
                        %(qualifier)s, %(test_method_id)s, %(conditions)s,
                        %(note_en)s, %(status)s, %(value_role)s, %(editorial_value_id)s, %(derivation_rule)s, %(created_by)s
                    ) RETURNING id;
                    """,
                    {
                        "subject_id": subject_id,
                        "property_id": property_id,
                        "value_min": fact.get("value_min"),
                        "value_max": fact.get("value_max"),
                        "value_typical": fact.get("value_typical"),
                        "value_text": fact.get("value_text"),
                        "qualifier": fact.get("qualifier"),
                        "test_method_id": test_method_id,
                        "conditions": json.dumps(conditions),
                        "note_en": fact.get("note_en"),
                        "status": status,
                        "value_role": value_role,
                        "editorial_value_id": editorial_value_id,
                        "derivation_rule": derivation_rule,
                        "created_by": CREATED_BY,
                    },
                )
                pv_id = cur.fetchone()[0]
                inserted += 1
                if editorial_value_id:
                    print(f"  {material_slug}/{gc_key} {fact['property']} -> observation {pv_id}, linked under existing editorial {editorial_value_id}")

                cur.execute(
                    """INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method, created_by)
                       VALUES ('property_value', %s, %s, 'primary', 'manual', %s)""",
                    (pv_id, citation_id, CREATED_BY),
                )
                cur.execute(
                    """INSERT INTO contribution (contributor_id, contribution_target, target_id, role)
                       VALUES (%s, 'property_value', %s, 'author') ON CONFLICT DO NOTHING""",
                    (contributor_id, pv_id),
                )
                cur.execute(
                    """INSERT INTO contribution (contributor_id, contribution_target, target_id, role)
                       VALUES (%s, 'citation', %s, 'author') ON CONFLICT DO NOTHING""",
                    (contributor_id, citation_id),
                )

        if args.dry_run:
            conn.rollback()
            print(f"\nDRY RUN: retired {retired}, deleted {deleted_wrong} wrong row(s), would insert {inserted} new rows. Rolled back.")
        else:
            conn.commit()
            print(f"\nCommitted: retired {retired} old uncited editorial rows, deleted {deleted_wrong} misattributed row(s), inserted {inserted} new property_value rows.")

        print(f"\n{len(STILL_SKIPPED_NOTES)} facts still not imported (genuine ambiguity, not a missing property):")
        for note in STILL_SKIPPED_NOTES:
            print(f"  - {note}")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
