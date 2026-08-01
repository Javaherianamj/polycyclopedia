# Build and Test — U1 `database-core`

**Stage**: CONSTRUCTION — Build and Test
**Unit**: U1 `database-core`
**Environment**: PostgreSQL 16.14 (Docker), Python 3.14

---

## 1. Build

There is no compilation step. The unit's artifacts are SQL migrations, SQL seeds,
and a Python ETL tool.

```bash
cp db/.env.example db/.env      # then edit credentials
docker compose -f db/docker-compose.yml up -d
./db/run.sh
```

`run.sh` waits for the container, ensures the least-privilege application role
exists, applies migrations (skipping versions already recorded in
`schema_migration`), then applies the idempotent seeds.

**Reset and rebuild from empty:**
```bash
./db/run.sh --reset
```

---

## 2. Test Suites

### 2.1 Schema verification — `./db/test.sh`

16 checks, executed inside a transaction that is rolled back, so the suite is
safe to run against a seeded database.

| Group | Checks | What it proves |
|---|---|---|
| Citation locator | 4 | `{}`, JSON `null`, and `{"foo":"bar"}` are rejected; `{"page":412}` is accepted. The structural fix for `src_default`. |
| Extensibility | 2 | A brand-new property (hydrogel swelling ratio) is added with zero DDL, and a value against it is accepted. |
| Value integrity | 3 | A value row with no value at all, an inverted range, and a polymorphic `subject_id` pointing at a nonexistent material are all rejected. |
| Provenance views | 2 | Unsourced values surface in the work list; all three read views exist. |
| Registry | 5 | 55 definitions, 6 groups, and a numeric property without a unit is impossible. |

Negative tests use an `assert_fails` helper: several of these constraints exist
precisely so that certain inserts are impossible, and a suite that only checked
happy paths would not notice their removal.

### 2.2 ETL tests — `cd tools/etl && ./.venv/bin/pytest`

**27 tests, all passing.**

| File | Coverage |
|---|---|
| `test_value_parser.py` | One example per legacy value form, using real strings from `polymersData.ts`. Negative tests asserting the seven two-variant strings raise rather than returning a wrong value. |
| `test_value_parser_properties.py` | Property-based (hypothesis): parse/format round-trip; `min <= max` invariant; no numeric result with all-None fields. |
| `test_oracle.py` | Regression guard asserting LDPE and HDPE have zero parse failures and zero oracle disagreements, and that every parsed property key exists in the registry. |

The oracle test is the important one: it locks in the currently-clean state, so a
future edit to the parser cannot silently corrupt the seeded materials.

### 2.3 Integration — ETL to database

```bash
cd tools/etl && ./.venv/bin/python emit_sql.py   # regenerates the seed
./db/run.sh                                       # applies it
```

The ETL calls `require_clean(materials, ('ldpe','hdpe'))` before emitting and
refuses to generate SQL if either material has an unresolved parse failure or
oracle disagreement.

---

## 3. Results

| Metric | Value |
|---|---|
| Migrations applied | 9 |
| Tables / views | 24 / 3 |
| Schema verification checks | 16 passed, 0 failed |
| ETL tests | 27 passed, 0 failed |
| Property definitions | 55 |
| Materials seeded | 2 (LDPE, HDPE) |
| Property values | 109 (LDPE 54, HDPE 55) |
| Sources / test methods | 10 / 28 |
| Citation coverage | 0% — by design, see below |
| Oracle agreement | 45 / 46 |

The LDPE/HDPE difference of one value is legitimate: `izodImpact` is an optional
field in the legacy type and is genuinely absent for LDPE.

---

## 4. Not Tested Here (and why)

| Item | Reason |
|---|---|
| REST API endpoints | No Node.js runtime in this environment. Descoped to U2 rather than written blind. |
| Frontend integration | Depends on U2. |
| Performance under load | Only 2 materials seeded; a load test now would measure nothing meaningful. Index strategy is designed for the roadmap's target scale but is unproven at that scale. |
| Backup and restore | Resiliency extension disabled for this unit. **Remains an open item before any deployment.** |
| Concurrent writes / RLS under multi-tenant load | No tenants exist yet. Policies are verified functionally against a non-owner role, not under contention. |

---

## 5. Known Defects Carried Forward

1. **PET density range disagrees with itself** — display string 1.38–1.40 vs
   shadow `minDensity` 1.33 (amorphous vs crystallised PET). PET is not seeded;
   must be resolved before PET is published.

2. **Seven values encode two materials in one string** (PVC rigid/flexible, PS
   GPPS/HIPS, PET unfilled/glass-filled). These require splitting into `grade`
   rows. The parser refuses them rather than guessing. LDPE and HDPE are
   unaffected.

3. **Zero citation coverage.** All 109 values are `status='unsourced'` and both
   materials are `status='draft'`. This is deliberate, not an oversight: real
   citations need page-level locators from the actual handbooks, and fabricating
   them would defeat the project's purpose while being undetectable — the schema
   cannot distinguish a real page number from a plausible one. `v_unsourced_values`
   is the work list for the citation campaign.

---

## 6. Next Unit

U2 `core-api` (Fastify + Drizzle read endpoints) is blocked only on a Node.js
runtime being available. The schema it will read is complete and verified.
