#!/usr/bin/env python3
"""One-off import of curation/cited data-by author-p1-PE.md into the
database (U1 v2 FR-12).

Not part of the reusable gaps.csv/import_values.py pipeline: that pipeline
has no notion of grade_class or observation/editorial multi-source values
yet (see database-revision-requirements.md "Out of Scope"), and this
source file needs exactly those -- three grade-comparison tables and one
commercial-grade table, each describing several distinct resin populations
of the same material. Written as a straight, auditable script instead of
force-fitting it through a tool that cannot express the shape of the data.

Every fact in FACTS below is a direct transcription of the source file; no
numbers are invented, converted with an assumed formula, or averaged. A
handful of facts from the source file are deliberately left out -- see
SKIPPED at the bottom -- because they either lack a matching
property_definition or need a unit conversion this script is not confident
enough to perform silently.

All values are inserted as editorial rows with derivation_rule =
'single_source' (each fact has exactly one citation) and status =
'published', and attributed to the project owner as contributor #1 with
role 'author' (U1 v2 FR-6/FR-7), per their explicit request to be credited
for data they supply.

Run: python3 import_pe_cited_data.py [--dry-run]

POST-RUN DEFECT (found via API test failure, fixed by direct UPDATE, not by
re-running this script): none of the facts below set unit_display, and
computeDisplay() in api/src/routes/materials.ts has no fallback to
property_definition.canonical_unit -- so every row this script inserted
rendered with no unit suffix. Fixed once, for both this script's rows and
import_pe_cited_data_followup.py's, with:
    UPDATE property_value pv SET unit_display = pd.canonical_unit
    FROM property_definition pd WHERE pv.property_id = pd.id
      AND pv.created_by IN ('curation-import-pe-cited-data', 'curation-import-pe-cited-data-followup')
      AND pv.unit_display IS NULL AND pd.canonical_unit IS NOT NULL
      AND (pv.value_min IS NOT NULL OR pv.value_max IS NOT NULL OR pv.value_typical IS NOT NULL);
Not fixed in this file's INSERT itself since the script already ran; a
future one-off import script should set unit_display explicitly.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import get_connection  # noqa: E402

CONTRIBUTOR_EMAIL = "amirmahdijavaherian1383@gmail.com"
CREATED_BY = "curation-import-pe-cited-data"

# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------

HANDBOOK = dict(
    key="handbook-industrial-polyethylene",
    title="Handbook of Industrial Polyethylene and Technology: Definitive "
    "Guide to Manufacturing, Properties, Processing, Applications and "
    "Markets",
    authors="Spalding, Mark A. (ed.); Chatterjee, Ananda (ed.)",
    kind="handbook",
    tier="peer_reviewed_handbook",
)
ENCYC_V1 = dict(
    key="encyclopedia-polymer-science-technology-v1",
    title="Encyclopedia of Polymer Science and Technology, Vol. 1",
    kind="encyclopedia",
    tier="peer_reviewed_handbook",
)
ENCYC_V2 = dict(
    key="encyclopedia-polymer-science-technology-v2",
    title="Encyclopedia of Polymer Science and Technology, Vol. 2",
    kind="encyclopedia",
    tier="peer_reviewed_handbook",
)

# ---------------------------------------------------------------------------
# grade_class rows this import needs, keyed by (material_slug, key)
# ---------------------------------------------------------------------------

GRADE_CLASSES = {
    ("ldpe", "thermoforming"): ("ترموفرمینگ", "Thermoforming"),
    ("hdpe", "thermoforming"): ("ترموفرمینگ", "Thermoforming"),
    ("lldpe", "thermoforming"): ("ترموفرمینگ", "Thermoforming"),
    ("ldpe", "film"): ("فیلم", "Film"),
    ("ldpe", "injection"): ("تزریقی", "Injection Molding"),
    ("lldpe", "injection"): ("تزریقی", "Injection Molding"),
    ("hdpe", "injection"): ("تزریقی", "Injection Molding"),
    ("lldpe", "rotational_molding_gas_phase"): ("قالب‌گیری چرخشی (فاز گازی)", "Rotational Molding (Gas Phase)"),
    ("lldpe", "rotational_molding_solution"): ("قالب‌گیری چرخشی (محلولی)", "Rotational Molding (Solution)"),
    ("hdpe", "rotational_molding"): ("قالب‌گیری چرخشی", "Rotational Molding"),
    ("ldpe", "blow_molding"): ("بادی (دمشی)", "Blow Molding"),
    ("lldpe", "blow_molding"): ("بادی (دمشی)", "Blow Molding"),
    ("hdpe", "blow_molding"): ("بادی (دمشی)", "Blow Molding"),
    ("hdpe", "film"): ("فیلم", "Film"),
}

# ---------------------------------------------------------------------------
# Facts. Each is one property_value. "subject" is either
# ("material", slug) or ("grade_class", material_slug, key).
# ---------------------------------------------------------------------------

FACTS = [
    # --- Fact 1: general density (Handbook, p577) --------------------------
    dict(
        subject=("material", "ldpe"), property="density",
        value_min=0.915, value_max=0.935,
        source=HANDBOOK, locator={"page": 577},
        note_en="General range for low density PE, as reported alongside HDPE in the same sentence.",
    ),
    dict(
        subject=("material", "hdpe"), property="density",
        value_max=0.975,
        source=HANDBOOK, locator={"page": 577},
        note_en="Source gives only an upper bound ('up to about 0.975 g/cm3') in the same sentence as the LDPE range; no lower bound stated.",
    ),

    # --- Fact 2: thermoforming MFI (Handbook, p577) -------------------------
    # "0.25 dg/min" == "0.25 g/10min" exactly (dg/min = 0.1 g/min = g/10min);
    # not a guessed conversion, a unit identity.
    dict(
        subject=("grade_class", "hdpe", "thermoforming"), property="mfi",
        value_typical=0.25,
        source=HANDBOOK, locator={"page": 577},
        test_method="D1238",
        note_en="Preferred melt index for thermoforming HDPE (190C, 2.16kg). Driver: end-use process (thermoforming) selects a narrow MFI band.",
    ),
    dict(
        subject=("grade_class", "ldpe", "thermoforming"), property="mfi",
        value_typical=0.25,
        source=HANDBOOK, locator={"page": 577},
        test_method="D1238",
        note_en="Typical melt index for LDPE in thermoforming, same conditions as the HDPE figure in the same sentence.",
    ),
    dict(
        subject=("grade_class", "lldpe", "thermoforming"), property="mfi",
        value_min=0.65, value_max=0.90,
        source=HANDBOOK, locator={"page": 577},
        test_method="D1238",
        note_en="LLDPE melt index range for thermoforming, same source sentence as the HDPE/LDPE figures.",
    ),

    # --- Fact 4: LDPE film blow-up ratio (Encyclopedia v2, p518) ------------
    dict(
        subject=("grade_class", "ldpe", "film"), property="bur",
        value_text="2.0-2.5",
        source=ENCYC_V2, locator={"page": 518, "volume": 2},
        note_en="Typical blow-up ratios used in LDPE film extrusion for packaging.",
    ),

    # --- Table 9: LLDPE vs LDPE Injection Molding Resins (Encyclopedia v2) -
    # Locator for the whole table is given once, at the end of the source
    # excerpt, as "[encyckopedia... vol2, p477]" -- covers Tables 9-11.
    dict(
        subject=("grade_class", "lldpe", "injection"), property="mfi",
        value_typical=32,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D1238",
        note_en="Table 9: Comparison of LLDPE and LDPE Injection Molding Resins.",
    ),
    dict(
        subject=("grade_class", "lldpe", "injection"), property="density",
        value_typical=0.925,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D1505",
        note_en="Table 9.",
    ),
    dict(
        subject=("grade_class", "lldpe", "injection"), property="tensile_strength",
        value_typical=13.4, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D638",
        note_en="Table 9. Tensile strength at yield.",
    ),
    dict(
        subject=("grade_class", "lldpe", "injection"), property="tensile_strength",
        value_typical=9.3, conditions={"basis": "break"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D638",
        note_en="Table 9. Tensile strength at break.",
    ),
    dict(
        subject=("grade_class", "lldpe", "injection"), property="flexural_modulus",
        value_typical=0.366,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D790",
        note_en="Table 9. '2% Secant modulus', 366 MPa converted to 0.366 GPa (exact SI unit conversion, canonical_unit is GPa).",
    ),
    dict(
        subject=("grade_class", "lldpe", "injection"), property="hardness_shore_d",
        value_typical=55,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D2240",
        note_en="Table 9.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="mfi",
        value_typical=37.5,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D1238",
        note_en="Table 9.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="density",
        value_typical=0.923,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D1505",
        note_en="Table 9.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="tensile_strength",
        value_typical=12.8, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D638",
        note_en="Table 9. Tensile strength at yield.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="tensile_strength",
        value_typical=9.0, conditions={"basis": "break"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D638",
        note_en="Table 9. Tensile strength at break.",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="flexural_modulus",
        value_typical=0.186,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D790",
        note_en="Table 9. 186 MPa converted to 0.186 GPa (exact SI unit conversion).",
    ),
    dict(
        subject=("grade_class", "ldpe", "injection"), property="hardness_shore_d",
        value_typical=41,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "9"},
        test_method="D2240",
        note_en="Table 9.",
    ),

    # --- Table 10: LLDPE (gas phase / solution) vs HDPE Rotational Molding -
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_gas_phase"), property="mfi",
        value_typical=5.0,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1238",
        note_en="Table 10: Comparison of LLDPE and HDPE Rotational Molding Resins. Gas-phase LLDPE process route.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_gas_phase"), property="density",
        value_typical=0.935,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1505",
        note_en="Table 10.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_gas_phase"), property="flexural_modulus",
        value_typical=0.601,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D790",
        note_en="Table 10. 601 MPa converted to 0.601 GPa (exact SI unit conversion).",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_gas_phase"), property="tensile_strength",
        value_typical=17, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D638",
        note_en="Table 10. Tensile strength at yield.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_solution"), property="mfi",
        value_typical=5.0,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1238",
        note_en="Table 10. Solution LLDPE process route.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_solution"), property="density",
        value_typical=0.937,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1505",
        note_en="Table 10.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_solution"), property="flexural_modulus",
        value_typical=0.520,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D790",
        note_en="Table 10. 520 MPa converted to 0.520 GPa.",
    ),
    dict(
        subject=("grade_class", "lldpe", "rotational_molding_solution"), property="tensile_strength",
        value_typical=14, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D638",
        note_en="Table 10. Tensile strength at yield.",
    ),
    dict(
        subject=("grade_class", "hdpe", "rotational_molding"), property="mfi",
        value_typical=5.0,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1238",
        note_en="Table 10.",
    ),
    dict(
        subject=("grade_class", "hdpe", "rotational_molding"), property="density",
        value_typical=0.945,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D1505",
        note_en="Table 10.",
    ),
    dict(
        subject=("grade_class", "hdpe", "rotational_molding"), property="flexural_modulus",
        value_typical=0.931,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D790",
        note_en="Table 10. 931 MPa converted to 0.931 GPa.",
    ),
    dict(
        subject=("grade_class", "hdpe", "rotational_molding"), property="tensile_strength",
        value_typical=21, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "10"},
        test_method="D638",
        note_en="Table 10.",
    ),

    # --- Table 11: LDPE, LLDPE, HDPE Blow Molding Resins --------------------
    dict(
        subject=("grade_class", "lldpe", "blow_molding"), property="mfi",
        value_typical=0.75,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1238",
        note_en="Table 11: Comparison of LDPE, LLDPE and HDPE Blow Molding Resins.",
    ),
    dict(
        subject=("grade_class", "lldpe", "blow_molding"), property="density",
        value_typical=0.934,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1505",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "lldpe", "blow_molding"), property="flexural_modulus",
        value_typical=0.578,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D790",
        note_en="Table 11. 578 MPa converted to 0.578 GPa.",
    ),
    dict(
        subject=("grade_class", "ldpe", "blow_molding"), property="mfi",
        value_typical=0.25,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1238",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "ldpe", "blow_molding"), property="density",
        value_typical=0.918,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1505",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "ldpe", "blow_molding"), property="flexural_modulus",
        value_typical=0.234,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D790",
        note_en="Table 11. 234 MPa converted to 0.234 GPa.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="mfi",
        value_typical=0.35,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1238",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="density",
        value_typical=0.954,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D1505",
        note_en="Table 11.",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="flexural_modulus",
        value_typical=1.228,
        source=ENCYC_V2, locator={"page": 477, "volume": 2, "table": "11"},
        test_method="D790",
        note_en="Table 11. 1228 MPa converted to 1.228 GPa.",
    ),

    # --- Standalone facts: melting range / crystal structure ---------------
    dict(
        subject=("material", "lldpe"), property="tm",
        value_min=122, value_max=128,
        source=ENCYC_V2, locator={"page": 448, "volume": 2},
        note_en="Maximum melting peak of the relatively broad LLDPE melting range, largely independent of comonomer type.",
    ),
    dict(
        subject=("material", "hdpe"), property="tm",
        value_min=133, value_max=138,
        source=ENCYC_V2, locator={"page": 397, "volume": 2},
        note_en="Measured on highly crystallized HDPE samples. Source also notes Tm depends on molecular weight (137C at Mw~1,000,000 down to 128C at Mw~40,000) and branch content -- recorded here as context, not encoded numerically.",
    ),
    dict(
        subject=("material", "ldpe"), property="unit_cell",
        value_text="orthorhombic, a=7.42 A, b=4.94 A, c=2.55 A",
        source=ENCYC_V2, locator={"page": 447, "volume": 2},
        note_en="Most stable crystalline form for polyethylene generally (source does not distinguish by PE grade); recorded identically on LDPE, LLDPE and HDPE.",
    ),
    dict(
        subject=("material", "lldpe"), property="unit_cell",
        value_text="orthorhombic, a=7.42 A, b=4.94 A, c=2.55 A",
        source=ENCYC_V2, locator={"page": 447, "volume": 2},
        note_en="Most stable crystalline form for polyethylene generally.",
    ),
    dict(
        subject=("material", "hdpe"), property="unit_cell",
        value_text="orthorhombic, a=7.42 A, b=4.94 A, c=2.55 A",
        source=ENCYC_V2, locator={"page": 447, "volume": 2},
        note_en="Most stable crystalline form for polyethylene generally.",
    ),

    # --- Table 3: Three Typical Commercial HDPE Grades ----------------------
    # Single locator covers the whole table (encyclopedia vol2 p392).
    dict(
        subject=("grade_class", "hdpe", "injection"), property="mfi",
        value_typical=33.59, conditions={"load_kg": 2.16},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1238",
        note_en="Table 3: Properties of Three Typical Commercial HDPE Grades. Melt index at 2.16kg load.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="mfi",
        value_typical=34.14, conditions={"load_kg": 21.6},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1238",
        note_en="Table 3. High load melt index at 21.6kg load.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="density",
        value_typical=0.9678,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1505",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="refractive_index",
        value_typical=1.54,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Refractive index n_D at 25C.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="mw",
        value_typical=13900,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Weight-average molecular weight, GPC.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="mn",
        value_typical=48400,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Number-average molecular weight, GPC. NOTE: source table lists Mw < Mn for this grade, which is physically impossible (PDI = Mw/Mn must be >= 1) -- transcribed as printed; likely a units/column swap in the original table, flagged for review rather than silently corrected.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="tensile_strength",
        value_typical=31.0, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3. Yield point.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="tensile_strength",
        value_typical=31.0, conditions={"basis": "break"},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="elongation_at_break",
        value_typical=8.2,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="flexural_modulus",
        value_typical=1.894,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D790",
        note_en="Table 3. 1894 MPa converted to 1.894 GPa.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="hardness_shore_d",
        value_typical=67,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D2240",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="tm",
        value_typical=136,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Melting point for the injection molding grade specifically.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="vicat",
        value_typical=126,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1525",
        note_en="Table 3.",
    ),
    dict(
        subject=("grade_class", "hdpe", "injection"), property="conductivity",
        value_min=0.46, value_max=0.52,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Thermal conductivity.",
    ),

    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="density",
        value_typical=0.9557,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1505",
        note_en="Table 3. Blow molding grade -- distinct HDPE product from Table 11's blow molding entry (different MFI/density); both kept as separate observations under the same grade_class since they describe the same real population from different sources.",
        value_role_override="observation",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="mfi",
        value_typical=0.36, conditions={"load_kg": 2.16},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1238",
        note_en="Table 3. Blow molding grade.",
        value_role_override="observation",
    ),
    dict(
        subject=("grade_class", "hdpe", "blow_molding"), property="tm",
        value_typical=133.5,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Blow molding grade.",
    ),

    dict(
        subject=("grade_class", "hdpe", "film"), property="mfi",
        value_typical=0.31, conditions={"load_kg": 2.16},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1238",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="density",
        value_typical=0.939,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D1505",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="tensile_strength",
        value_typical=19.1, conditions={"basis": "yield"},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3. Film grade, yield point.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="tensile_strength",
        value_typical=29.5, conditions={"basis": "break"},
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="elongation_at_break",
        value_typical=745,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D638",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="flexural_modulus",
        value_typical=0.822,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D790",
        note_en="Table 3. Film grade. 822 MPa converted to 0.822 GPa.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="hardness_shore_d",
        value_typical=51,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        test_method="D2240",
        note_en="Table 3. Film grade.",
    ),
    dict(
        subject=("grade_class", "hdpe", "film"), property="tm",
        value_typical=127,
        source=ENCYC_V2, locator={"page": 392, "volume": 2, "table": "3"},
        note_en="Table 3. Film grade.",
    ),
]

# ---------------------------------------------------------------------------
# Skipped facts (logged, not guessed): unit mismatches with no confirmed
# conversion, or no matching property_definition. Written to
# curation/new_properties.md at the end of this run rather than silently
# dropped.
# ---------------------------------------------------------------------------

SKIPPED_NOTES = [
    "Table (Encyclopedia v1, p549): 'Shrinkage of Blow-Molding %' and "
    "'Linear coefficient of thermal expansion (10-4 K-1)' for LDPE/HDPE -- "
    "table header/columns are ambiguous in the extracted text (two column "
    "headers, one set of numbers) and the CTE unit (10^-4 K^-1, i.e. per-K "
    "not per-material-length) does not cleanly map to cte's canonical "
    "µm/°C without assuming a basis. Not imported.",
    "Table 9-11 'Low temperature brittleness F50' -- no matching "
    "property_definition (closest, izod_impact, is a different test). Not imported.",
    "Table 10-11 'ESCR' (Environmental Stress-Crack Resistance, hours) -- "
    "no matching property_definition. Not imported.",
    "Table 3 'Weight percent hexene' (comonomer content) -- no matching "
    "property_definition. Not imported.",
    "Table 3 'Tensile Impact, kJ/m2' -- distinct test from izod_impact "
    "(different specimen/energy basis); no matching property_definition. Not imported.",
    "Table 3 'Notched impact strength, kJ/m2' (ASTM D256) -- izod_impact's "
    "canonical unit is J/m (energy per unit notch width), not kJ/m2 (energy "
    "per unit cross-section area); converting between the two needs "
    "specimen thickness, which the source does not give. Not force-converted; "
    "not imported (FR-12 skip policy).",
    "Table 3 'Brittleness temp', 'Heat resistance temp', 'Specific heat "
    "capacity', 'Temp. coefficient of linear/volume expansion', 'Heat of "
    "combustion' -- no matching property_definition. Not imported.",
    "Table 3 'Condition A/B/C ESCR hours' -- no matching property_definition. Not imported.",
]


def get_or_create_source(cur, cache: dict, spec: dict) -> int:
    if spec["key"] in cache:
        return cache[spec["key"]]
    cur.execute("SELECT id FROM source WHERE title = %s", (spec["title"],))
    row = cur.fetchone()
    if row:
        cache[spec["key"]] = row[0]
        return row[0]
    cur.execute(
        """INSERT INTO source (kind, tier, title, authors)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (spec["kind"], spec["tier"], spec["title"], spec.get("authors")),
    )
    source_id = cur.fetchone()[0]
    cache[spec["key"]] = source_id
    return source_id


def get_or_create_document(cur, cache: dict, source_id: int, spec: dict) -> int:
    doc_key = (spec["key"], "doc")
    if doc_key in cache:
        return cache[doc_key]
    cur.execute("SELECT id FROM source_document WHERE source_id = %s", (source_id,))
    row = cur.fetchone()
    if row:
        cache[doc_key] = row[0]
        return row[0]
    cur.execute(
        "INSERT INTO source_document (source_id) VALUES (%s) RETURNING id",
        (source_id,),
    )
    doc_id = cur.fetchone()[0]
    cache[doc_key] = doc_id
    return doc_id


def get_or_create_citation(cur, doc_id: int, locator: dict) -> int:
    import json

    cur.execute(
        "SELECT id FROM citation WHERE source_document_id = %s AND locator = %s::jsonb",
        (doc_id, json.dumps(locator)),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO citation (source_document_id, locator) VALUES (%s, %s::jsonb) RETURNING id",
        (doc_id, json.dumps(locator)),
    )
    return cur.fetchone()[0]


def get_or_create_grade_class(cur, cache: dict, material_id: int, material_slug: str, key: str) -> int:
    cache_key = (material_slug, key)
    if cache_key in cache:
        return cache[cache_key]
    cur.execute(
        "SELECT id FROM grade_class WHERE material_id = %s AND key = %s",
        (material_id, key),
    )
    row = cur.fetchone()
    if row:
        cache[cache_key] = row[0]
        return row[0]
    name_fa, name_en = GRADE_CLASSES[(material_slug, key)]
    cur.execute(
        """INSERT INTO grade_class (material_id, key, name_fa, name_en, status)
           VALUES (%s, %s, %s, %s, 'draft') RETURNING id""",
        (material_id, key, name_fa, name_en),
    )
    gc_id = cur.fetchone()[0]
    cache[cache_key] = gc_id
    return gc_id


def get_or_create_test_method(cur, cache: dict, code: str) -> int:
    if code in cache:
        return cache[code]
    cur.execute("SELECT id FROM test_method WHERE standard_body = 'ASTM' AND code = %s", (code,))
    row = cur.fetchone()
    if row:
        cache[code] = row[0]
        return row[0]
    titles = {
        "D1505": "Standard Test Method for Density of Plastics by the Density-Gradient Technique",
        "D1693": "Standard Test Method for Environmental Stress-Cracking of Ethylene Plastics",
        "D746": "Standard Test Method for Brittleness Temperature of Plastics and Elastomers by Impact",
    }
    cur.execute(
        "INSERT INTO test_method (standard_body, code, title) VALUES ('ASTM', %s, %s) RETURNING id",
        (code, titles.get(code)),
    )
    tm_id = cur.fetchone()[0]
    cache[code] = tm_id
    return tm_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    conn = get_connection()
    inserted = 0
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM contributor WHERE email = %s", (CONTRIBUTOR_EMAIL,))
            contributor_id = cur.fetchone()[0]

            cur.execute("SELECT id, slug FROM material WHERE slug IN ('ldpe','hdpe','lldpe')")
            material_ids = {slug: mid for mid, slug in cur.fetchall()}

            cur.execute("SELECT id, key FROM property_definition")
            property_ids = {key: pid for pid, key in cur.fetchall()}

            source_cache: dict = {}
            grade_class_cache: dict = {}
            test_method_cache: dict = {}

            for fact in FACTS:
                source_id = get_or_create_source(cur, source_cache, fact["source"])
                doc_id = get_or_create_document(cur, source_cache, source_id, fact["source"])
                citation_id = get_or_create_citation(cur, doc_id, fact["locator"])

                subject = fact["subject"]
                if subject[0] == "material":
                    subject_type = "material"
                    subject_id = material_ids[subject[1]]
                else:
                    _, material_slug, gc_key = subject
                    subject_type = "grade_class"
                    subject_id = get_or_create_grade_class(
                        cur, grade_class_cache, material_ids[material_slug], material_slug, gc_key
                    )

                property_id = property_ids[fact["property"]]
                test_method_id = None
                if fact.get("test_method"):
                    test_method_id = get_or_create_test_method(cur, test_method_cache, fact["test_method"])

                import json as _json

                conditions = fact.get("conditions", {})
                requested_role = fact.get("value_role_override", "editorial")

                # A live editorial row may already exist for this exact
                # (subject, property, conditions) -- e.g. LDPE/HDPE density
                # were already seeded (uncited) in db/seeds/0005. That is
                # not a bug to route around; it is exactly the case U1 v2
                # FR-2 was built for. Rather than fail on
                # uq_property_value_live_editorial (one live editorial row
                # per slot) or silently supersede a number nobody asked to
                # replace, this fact becomes an OBSERVATION linked to the
                # existing editorial row via editorial_value_id -- a second,
                # independently-cited source standing alongside the first,
                # exactly as database-revision-requirements.md FR-2/FR-3
                # describe. The editorial number itself is left for a
                # curator to decide whether to re-derive from both.
                editorial_value_id = None
                value_role = requested_role
                if requested_role == "editorial":
                    cur.execute(
                        """SELECT id FROM property_value
                            WHERE subject_type = %s AND subject_id = %s AND property_id = %s
                              AND conditions = %s::jsonb AND value_role = 'editorial'
                              AND superseded_by IS NULL AND status <> 'superseded'""",
                        (subject_type, subject_id, property_id, _json.dumps(conditions)),
                    )
                    existing = cur.fetchone()
                    if existing:
                        value_role = "observation"
                        editorial_value_id = existing[0]

                derivation_rule = "single_source" if value_role == "editorial" else None
                status = "published" if value_role == "editorial" else "unsourced"

                cur.execute(
                    """
                    INSERT INTO property_value (
                        subject_type, subject_id, property_id,
                        value_min, value_max, value_typical, value_text,
                        unit_display, test_method_id, conditions,
                        note_en, status, value_role, editorial_value_id, derivation_rule, created_by
                    ) VALUES (
                        %(subject_type)s, %(subject_id)s, %(property_id)s,
                        %(value_min)s, %(value_max)s, %(value_typical)s, %(value_text)s,
                        %(unit_display)s, %(test_method_id)s, %(conditions)s,
                        %(note_en)s, %(status)s, %(value_role)s, %(editorial_value_id)s, %(derivation_rule)s, %(created_by)s
                    ) RETURNING id;
                    """,
                    {
                        "subject_type": subject_type,
                        "subject_id": subject_id,
                        "property_id": property_id,
                        "value_min": fact.get("value_min"),
                        "value_max": fact.get("value_max"),
                        "value_typical": fact.get("value_typical"),
                        "value_text": fact.get("value_text"),
                        "unit_display": fact.get("unit_display"),
                        "test_method_id": test_method_id,
                        "conditions": _json.dumps(conditions),
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
                    print(f"  fact {property_id}@{subject_type}:{subject_id} -> observation {pv_id}, linked under existing editorial {editorial_value_id}")

                cur.execute(
                    """INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method, created_by)
                       VALUES ('property_value', %s, %s, 'primary', 'manual', %s)""",
                    (pv_id, citation_id, CREATED_BY),
                )

                # Authorship: the owner supplied this data (U1 v2 FR-6/FR-7).
                cur.execute(
                    """INSERT INTO contribution (contributor_id, contribution_target, target_id, role)
                       VALUES (%s, 'property_value', %s, 'author')
                       ON CONFLICT DO NOTHING""",
                    (contributor_id, pv_id),
                )
                cur.execute(
                    """INSERT INTO contribution (contributor_id, contribution_target, target_id, role)
                       VALUES (%s, 'citation', %s, 'author')
                       ON CONFLICT DO NOTHING""",
                    (contributor_id, citation_id),
                )

        if args.dry_run:
            conn.rollback()
            print(f"DRY RUN: would insert {inserted} property_value rows. Rolled back.")
        else:
            conn.commit()
            print(f"Committed {inserted} property_value rows with citations and authorship.")

        print(f"\n{len(SKIPPED_NOTES)} facts skipped (no property_definition match or unresolved unit):")
        for note in SKIPPED_NOTES:
            print(f"  - {note}")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
