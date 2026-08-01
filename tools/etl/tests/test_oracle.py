"""Regression guard: locks in the currently-clean parse/oracle state for the
two seeded materials (LDPE, HDPE) so a future edit to value_parser.py,
ts_object_parser.py, parse_polymers.py or src/data/polymersData.ts cannot
silently reintroduce a parse failure or an oracle disagreement for either
one without a test failing here.

Deliberately scoped to ldpe/hdpe only -- PP, PVC, PET and PS have known,
already-understood defects (see tools/etl/README.md) that are not this
tool's job to fix, and are not seeded by emit_sql.py.
"""
from __future__ import annotations

import subprocess

import pytest

from parse_polymers import parse_all_materials, require_clean

SEEDED_MATERIAL_IDS = ("ldpe", "hdpe")


@pytest.fixture(scope="module")
def materials():
    return parse_all_materials()


def test_ldpe_hdpe_have_zero_parse_failures(materials):
    for mid in SEEDED_MATERIAL_IDS:
        failures = materials[mid].failures
        assert failures == [], f"{mid}: expected zero parse failures, got {failures}"


def test_ldpe_hdpe_pass_require_clean(materials):
    # require_clean raises SystemExit on any failure; a clean call is the
    # actual gate emit_sql.py relies on before writing SQL.
    require_clean(materials, SEEDED_MATERIAL_IDS)


def test_ldpe_hdpe_have_zero_oracle_disagreements(materials):
    for mid in SEEDED_MATERIAL_IDS:
        disagreements = [c for c in materials[mid].oracle if not c.agrees]
        assert disagreements == [], f"{mid}: expected zero oracle disagreements, got {disagreements}"


def _fetch_property_definition_keys() -> set[str]:
    """Queries the live DB for the real, authoritative set of
    property_definition.key values (per the task: prefer the DB over
    re-parsing db/seeds/0002_property_groups_definitions.sql by hand)."""
    try:
        result = subprocess.run(
            [
                "docker",
                "exec",
                "polypedia-pg",
                "psql",
                "-U",
                "polypedia",
                "-d",
                "polypedia",
                "-t",
                "-A",
                "-c",
                "SELECT key FROM property_definition;",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        pytest.skip(f"docker/polypedia-pg not reachable to query property_definition: {e}")
    if result.returncode != 0:
        pytest.skip(f"could not query live DB for property_definition keys: {result.stderr.strip()}")
    keys = {line.strip() for line in result.stdout.splitlines() if line.strip()}
    if not keys:
        pytest.skip("property_definition query returned zero rows -- DB not seeded yet")
    return keys


def test_ldpe_hdpe_property_keys_are_all_registered(materials):
    valid_keys = _fetch_property_definition_keys()
    for mid in SEEDED_MATERIAL_IDS:
        parsed_keys = set(materials[mid].properties.keys())
        unknown = parsed_keys - valid_keys
        assert not unknown, f"{mid}: parsed property keys not present in property_definition: {unknown}"
