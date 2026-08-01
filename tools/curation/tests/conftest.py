"""Shared fixtures for the curation tool tests.

Tests that touch the database open their own connection via
``common.get_connection()`` (as polypedia_app, same as the real tools) and
roll it back in teardown -- nothing a test does is ever committed. A couple
of tests exercise the real CLI end-to-end via subprocess; those are
constructed so they either only ever validate (never write) or are
engineered to fail validation, so the transaction they open never commits
either. See test_integration.py's module docstring for which is which.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import get_connection  # noqa: E402

TEST_SOURCE_TITLE = "__test_source__"


@pytest.fixture
def db_conn():
    """A live connection, always rolled back after the test -- never
    committed, regardless of what the test does with it."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.rollback()
        conn.close()
