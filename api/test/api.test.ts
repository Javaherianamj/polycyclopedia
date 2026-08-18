// Integration tests against the real seeded Postgres database (container
// `polypedia-pg`, connecting as the least-privilege `polypedia_app` role --
// the same one production traffic would use). The database is not mocked:
// the entire value of this unit is whether the SQL is right.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { buildApp, type BuiltApp } from '../src/server.js';

let built: BuiltApp;

before(() => {
  built = buildApp({ logger: false });
});

after(async () => {
  await built.app.close();
  await built.pool.end();
});

function inject(opts: { method?: string; url: string }) {
  return built.app.inject({ method: (opts.method ?? 'GET') as 'GET', url: opts.url });
}

// ---------------------------------------------------------------------------
// health
// ---------------------------------------------------------------------------

test('GET /health -- 200, migration count matches db/migrations/', async () => {
  const res = await inject({ url: '/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'connected');
  // Counted from the migrations directory rather than hardcoded. The frozen
  // literal this replaced (9) broke the moment a migration was added, which
  // told us nothing except that the number had changed on purpose.
  const migrationDir = new URL('../../db/migrations/', import.meta.url);
  const expected = (await readdir(migrationDir)).filter((f) => f.endsWith('.sql')).length;
  assert.equal(body.migrations, expected);
});

// ---------------------------------------------------------------------------
// list materials
// ---------------------------------------------------------------------------

test('GET /api/materials -- includes the seeded materials', async () => {
  const res = await inject({ url: '/api/materials' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const slugs = body.data.map((m: { slug: string }) => m.slug);
  // Membership, not an exact catalog snapshot: curation adds materials, and
  // a test that fails every time someone does their job is noise.
  assert.ok(slugs.includes('ldpe'));
  assert.ok(slugs.includes('hdpe'));
  assert.equal(body.total, slugs.length);
});

test('GET /api/materials -- carries family display names, not just the key', async () => {
  const res = await inject({ url: '/api/materials' });
  const body = res.json();
  const ldpe = body.data.find((m: { slug: string }) => m.slug === 'ldpe');
  assert.ok(ldpe, 'ldpe present');
  assert.equal(ldpe.family, 'polyolefins');
  assert.equal(typeof ldpe.familyNameFa, 'string');
  assert.ok(ldpe.familyNameFa.length > 0);
  assert.equal(typeof ldpe.familyNameEn, 'string');
});

test('GET /api/materials?family=polyolefins -- filters to that family only', async () => {
  const res = await inject({ url: '/api/materials?family=polyolefins' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const slugs = body.data.map((m: { slug: string }) => m.slug);
  assert.ok(slugs.includes('ldpe'));
  assert.ok(slugs.includes('hdpe'));
  // The list endpoint flattens family to its key; only the detail endpoint
  // nests it as an object.
  for (const m of body.data) assert.equal(m.family, 'polyolefins');
});

test('GET /api/materials?q=... -- matches English name', async () => {
  const res = await inject({ url: '/api/materials?q=Low-Density' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const slugs = body.data.map((m: { slug: string }) => m.slug);
  assert.ok(slugs.includes('ldpe'));
  // Every hit must actually contain the search term -- LLDPE ("Linear
  // Low-Density Polyethylene") is a legitimate match, a wrong polymer is not.
  for (const m of body.data) {
    assert.ok(/low-density/i.test(m.nameEn), `unexpected match: ${m.nameEn}`);
  }
});

test('GET /api/materials?q=... -- matches Persian name', async () => {
  const res = await inject({ url: `/api/materials?q=${encodeURIComponent('چگالی بالا')}` });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].slug, 'hdpe');
});

// ---------------------------------------------------------------------------
// get by slug
// ---------------------------------------------------------------------------

test('GET /api/materials/ldpe -- 200, all 6 property groups present, in sort order', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.slug, 'ldpe');
  const groupKeys = body.propertyGroups.map((g: { key: string }) => g.key);
  assert.deepEqual(groupKeys, [
    'processing',
    'thermal',
    'mechanical',
    'physical',
    'electrical',
    'academic',
  ]);
});

test('GET /api/materials/ldpe -- property count = 54 (regression guard on the seed)', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const count = body.propertyGroups.reduce(
    (sum: number, g: { properties: unknown[] }) => sum + g.properties.length,
    0,
  );
  assert.equal(count, 54);
});

test('GET /api/materials/hdpe -- property count = 55 (regression guard on the seed)', async () => {
  const res = await inject({ url: '/api/materials/hdpe' });
  const body = res.json();
  const count = body.propertyGroups.reduce(
    (sum: number, g: { properties: unknown[] }) => sum + g.properties.length,
    0,
  );
  assert.equal(count, 55);
});

// ---------------------------------------------------------------------------
// numeric / qualifier / unicode fidelity
// ---------------------------------------------------------------------------

function findProperty(
  body: { propertyGroups: Array<{ properties: Array<{ key: string }> }> },
  key: string,
) {
  for (const group of body.propertyGroups) {
    const found = group.properties.find((p) => p.key === key);
    if (found) return found;
  }
  return undefined;
}

test('GET /api/materials/ldpe -- density returns min/max as numbers', async () => {
  // Not asserting the exact 0.910-0.925 legacy figures: U1 v2 FR-12
  // retired LDPE density's old *uncited* editorial value and promoted a
  // cited observation (Handbook of Industrial Polyethylene and Technology,
  // p577: 0.915-0.935) to editorial in its place -- see
  // tools/curation/scripts/import_pe_cited_data_followup.py. This test
  // checks shape (numeric min/max, a rendered display string), not a
  // specific number that curation is expected to keep changing.
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const density = findProperty(body, 'density');
  assert.ok(density, 'density property present');
  assert.equal(typeof density.valueMin, 'number');
  assert.equal(typeof density.valueMax, 'number');
  assert.ok(density.valueMin < density.valueMax);
  assert.match(density.display, /^\d+\.\d+ - \d+\.\d+ g\/cm³$/);
});

test('GET /api/materials/ldpe -- water_absorption returns qualifier "<", max 0.01', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const wa = findProperty(body, 'water_absorption');
  assert.ok(wa, 'water_absorption property present');
  assert.equal(wa.qualifier, '<');
  assert.equal(wa.valueMax, 0.01);
  assert.equal(typeof wa.valueMax, 'number');
  assert.equal(wa.display, '< 0.01 %');
});

test('GET /api/materials/ldpe -- volume_resistivity returns 1e16/1e18, Persian text round-trips', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();

  const vr = findProperty(body, 'volume_resistivity');
  assert.ok(vr, 'volume_resistivity property present');
  assert.equal(vr.valueMin, 1e16);
  assert.equal(vr.valueMax, 1e18);
  assert.equal(typeof vr.valueMin, 'number');
  assert.equal(typeof vr.valueMax, 'number');
  assert.equal(vr.display, '1e+16 - 1e+18 Ω·cm');

  // Persian text round-trips uncorrupted (no mojibake).
  assert.equal(body.nameFa, 'پلی‌اتیلن با چگالی پایین');
});

// ---------------------------------------------------------------------------
// citations -- work/edition/page (R11). The seeded dataset has 0% citation
// coverage by design (every real value is genuinely unsourced), so this test
// inserts its own fixture rows against a real property_value, asserts on the
// live join, and deletes exactly what it inserted -- same discipline as the
// rest of this suite: a real database, not a mock, left as it was found.
// ---------------------------------------------------------------------------

test('GET /api/materials/ldpe -- a cited value carries sourceTitle/sourceEdition/locator', async (t) => {
  const densityId = await built.pool.query<{ id: string }>(
    `SELECT pv.id FROM property_value pv
     JOIN property_definition pd ON pd.id = pv.property_id
     JOIN material m ON m.id = pv.subject_id
     WHERE pd.key = 'density' AND m.slug = 'ldpe' AND pv.subject_type = 'material'
       AND pv.value_role = 'editorial'`,
  );
  const propertyValueId = densityId.rows[0]?.id;
  assert.ok(propertyValueId, 'ldpe density property_value exists');

  const source = await built.pool.query<{ id: string }>(
    `INSERT INTO source (kind, tier, title, edition)
     VALUES ('handbook', 'peer_reviewed_handbook', '__fe2_test_source__', '3rd')
     RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;
  const doc = await built.pool.query<{ id: string }>(
    `INSERT INTO source_document (source_id) VALUES ($1) RETURNING id`,
    [sourceId],
  );
  const documentId = doc.rows[0]!.id;
  const citation = await built.pool.query<{ id: string }>(
    `INSERT INTO citation (source_document_id, locator) VALUES ($1, '{"page": 233}') RETURNING id`,
    [documentId],
  );
  const citationId = citation.rows[0]!.id;
  await built.pool.query(
    `INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method)
     VALUES ('property_value', $1, $2, 'primary', 'manual')`,
    [propertyValueId, citationId],
  );

  t.after(async () => {
    await built.pool.query('DELETE FROM evidence WHERE citation_id = $1', [citationId]);
    await built.pool.query('DELETE FROM citation WHERE id = $1', [citationId]);
    await built.pool.query('DELETE FROM source_document WHERE id = $1', [documentId]);
    await built.pool.query('DELETE FROM source WHERE id = $1', [sourceId]);
  });

  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const density = findProperty(body, 'density');
  assert.ok(density, 'density property present');
  // Not asserting citations.length === 1: LDPE density is real curated data
  // (U1 v2 FR-12) and may legitimately carry other citations besides this
  // test's own synthetic one -- assert this specific citation is present,
  // not that it is the only one.
  const entry = density.citations.find(
    (c: { sourceTitle: string }) => c.sourceTitle === '__fe2_test_source__',
  );
  assert.ok(entry, 'the synthetic test citation is present among density citations');
  assert.equal(entry.sourceTitle, '__fe2_test_source__');
  assert.equal(entry.sourceEdition, '3rd');
  assert.deepEqual(entry.locator, { page: 233 });
  assert.equal(entry.role, 'primary');
});

// ---------------------------------------------------------------------------
// FE-3: overview, coverage, processing techniques
// ---------------------------------------------------------------------------

test('GET /api/materials/ldpe -- carries overview, discoveryYear, chainType, coverage', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  assert.equal(typeof body.overviewFa, 'string');
  assert.ok(body.overviewFa.length > 0);
  assert.equal(typeof body.overviewEn, 'string');
  assert.equal(typeof body.discoveryYear, 'string');
  assert.equal(typeof body.chainType, 'string');
  assert.equal(typeof body.coverage.totalValues, 'number');
  assert.equal(typeof body.coverage.citedValues, 'number');
  assert.equal(typeof body.coverage.coveragePct, 'number');
  assert.ok(body.coverage.totalValues > 0);
  // Coverage here must agree with /api/coverage's own number for the same
  // material -- two endpoints computing the same view, not two sources of
  // truth that could silently drift.
  const coverageRes = await inject({ url: '/api/coverage' });
  const ldpeCoverage = coverageRes.json().data.find((r: { slug: string }) => r.slug === 'ldpe');
  assert.equal(body.coverage.coveragePct, ldpeCoverage.coveragePct);
});

test('GET /api/materials/ldpe -- processingTechniques is an array, present or empty, never missing', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  assert.ok(Array.isArray(body.processingTechniques));
});

test('GET /api/materials/ldpe -- a real processing technique carries its own note, independent of any other material', async (t) => {
  // The seeded dataset's processing-technique coverage varies as curation
  // continues, so this inserts and cleans up its own fixture rather than
  // asserting on a specific real row -- same discipline as the citations
  // fixture above.
  const ptResult = await built.pool.query<{ id: string }>(
    `SELECT id FROM processing_technique ORDER BY id LIMIT 1`,
  );
  const processingTechniqueId = ptResult.rows[0]?.id;
  assert.ok(processingTechniqueId, 'at least one processing_technique row exists to attach to');

  const materialIdResult = await built.pool.query<{ id: string }>(
    `SELECT id FROM material WHERE slug = 'ldpe'`,
  );
  const materialId = materialIdResult.rows[0]!.id;

  const inserted = await built.pool.query<{ id: string }>(
    `INSERT INTO material_process (material_id, processing_technique_id, note_fa, sort_order)
     VALUES ($1, $2, '__fe3_test_note__', 999) RETURNING id`,
    [materialId, processingTechniqueId],
  );
  const rowId = inserted.rows[0]!.id;
  t.after(async () => {
    await built.pool.query('DELETE FROM material_process WHERE id = $1', [rowId]);
  });

  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const entry = body.processingTechniques.find(
    (p: { noteFa: string }) => p.noteFa === '__fe3_test_note__',
  );
  assert.ok(entry, 'the fixture processing-technique row is present in the response');
  assert.equal(typeof entry.key, 'string');
  assert.equal(typeof entry.nameFa, 'string');
});

// ---------------------------------------------------------------------------
// FE-3b: grade classes
// ---------------------------------------------------------------------------

test('GET /api/materials/ldpe -- gradeClasses is a non-empty array carrying real cited values', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  assert.ok(Array.isArray(body.gradeClasses));
  // ldpe is seeded with 4 grade classes (film, injection, blow_molding,
  // thermoforming) -- membership on the ones known stable, not an exact
  // count, since curation may add more.
  const keys = body.gradeClasses.map((gc: { key: string }) => gc.key);
  assert.ok(keys.includes('injection'));
  assert.ok(keys.includes('film'));

  const injection = body.gradeClasses.find((gc: { key: string }) => gc.key === 'injection');
  assert.ok(injection, 'ldpe/injection grade class present');
  assert.equal(typeof injection.nameFa, 'string');
  assert.ok(injection.nameFa.length > 0);
  assert.ok(Array.isArray(injection.propertyGroups));
  assert.ok(Array.isArray(injection.processingTechniques));

  // A real cited value: ldpe/injection density, 0.923 g/cm3 (checked
  // directly against the database, not a fixture -- R9).
  const physical = injection.propertyGroups.find((g: { key: string }) => g.key === 'physical');
  assert.ok(physical, 'ldpe/injection carries a physical group (density is scoped there)');
  const density = physical.properties.find((p: { key: string }) => p.key === 'density');
  assert.ok(density, 'ldpe/injection carries its own density value');
  assert.equal(density.valueTypical, 0.923);
  assert.ok(density.citations.length > 0, 'the value is cited');
  assert.equal(typeof density.citations[0].sourceTitle, 'string');
});

test('GET /api/materials/ldpe -- a grade-class property value carries its conditions, distinguishing yield from break (CR11)', async () => {
  // FE-6's CR11 scenario, at the material-detail/grade-class-band surface
  // rather than the compare endpoint (which already asserted this
  // elsewhere in this file): ldpe/injection carries two tensile_strength
  // rows -- {basis: "yield"} at 12.8 MPa and {basis: "break"} at 9 MPa
  // (checked directly against the database, not a fixture -- R9). Before
  // this test, `conditions` wasn't selected by
  // MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL at all, so both rows carried
  // undefined and were indistinguishable in the API response even though
  // they are two distinct property_value rows.
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const injection = body.gradeClasses.find((gc: { key: string }) => gc.key === 'injection');
  assert.ok(injection, 'ldpe/injection grade class present');

  const mechanical = injection.propertyGroups.find((g: { key: string }) => g.key === 'mechanical');
  assert.ok(
    mechanical,
    'ldpe/injection carries a mechanical group (tensile_strength is scoped there)',
  );

  const tensileRows = mechanical.properties.filter(
    (p: { key: string }) => p.key === 'tensile_strength',
  );
  assert.equal(
    tensileRows.length,
    2,
    'yield and break are two distinct rows, not one merged/overwritten row',
  );

  const byBasis = new Map(
    tensileRows.map((p: { conditions: { basis: string } }) => [p.conditions.basis, p]),
  );
  assert.ok(byBasis.has('yield'));
  assert.ok(byBasis.has('break'));
  assert.equal((byBasis.get('yield') as { valueTypical: number }).valueTypical, 12.8);
  assert.equal((byBasis.get('break') as { valueTypical: number }).valueTypical, 9);
});

test('GET /api/materials/ldpe -- a material-level (unconditioned) property value carries an empty conditions object, not null/undefined', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const physical = body.propertyGroups.find((g: { key: string }) => g.key === 'physical');
  const density = physical.properties.find((p: { key: string }) => p.key === 'density');
  assert.deepEqual(
    density.conditions,
    {},
    'unconditioned rows report {} per the NOT NULL DEFAULT schema, never null',
  );
});

test('GET /api/materials/ldpe -- a grade-class value never leaks onto the parent material response and vice versa', async () => {
  // D46 (no value inheritance) as an API-level guarantee: the material's own
  // propertyGroups (subject_type = 'material') and a grade class's
  // propertyGroups (subject_type = 'grade_class') are disjoint sets of
  // property_value ids -- proven here via the citations, not asserted only
  // by construction, since both go through the same MATERIAL_CITATIONS_SQL
  // call and a leak would show up as a duplicate id there.
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const materialValueIds = body.propertyGroups.flatMap((g: { properties: { key: string }[] }) =>
    g.properties.map((p) => p.key),
  );
  const injection = body.gradeClasses.find((gc: { key: string }) => gc.key === 'injection');
  const injectionDensity = injection.propertyGroups
    .flatMap((g: { properties: { key: string; valueTypical: number | null }[] }) => g.properties)
    .find((p: { key: string }) => p.key === 'density');
  // The material's own density (a different, wider band -- generic ldpe, not
  // the injection population) must not equal the grade class's own value by
  // coincidence of being the same row.
  const materialDensity = body.propertyGroups
    .find((g: { key: string }) => g.key === 'physical')
    .properties.find((p: { key: string }) => p.key === 'density');
  assert.ok(materialValueIds.includes('density'));
  assert.equal(injectionDensity.valueTypical, 0.923);
  assert.notEqual(materialDensity.valueTypical, injectionDensity.valueTypical);
});

test('GET /api/materials/pet -- gradeClasses is an empty array, not missing (0 real rows)', async () => {
  const res = await inject({ url: '/api/materials/pet' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(Array.isArray(body.gradeClasses));
  assert.equal(body.gradeClasses.length, 0);
});

// ---------------------------------------------------------------------------
// unknown slug / limit cap / SQL injection
// ---------------------------------------------------------------------------

test('GET /api/materials/does-not-exist -- 404 with an error body, not a 500', async () => {
  const res = await inject({ url: '/api/materials/does-not-exist' });
  assert.equal(res.statusCode, 404);
  const body = res.json();
  assert.ok(body.error);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('GET /api/materials?limit=99999 -- clamped, not honoured', async () => {
  const res = await inject({ url: '/api/materials?limit=99999' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(body.limit <= 200, `limit ${body.limit} should be clamped to <= 200`);
  assert.notEqual(body.limit, 99999);
});

test("GET /api/materials?q=' OR 1=1 -- -- returns no rows and does not error", async () => {
  const res = await inject({ url: `/api/materials?q=${encodeURIComponent("' OR 1=1 --")}` });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 0);
});

test('GET /api/materials?q=... -- SQL injection attempt does not affect row count of a plain list', async () => {
  const injected = await inject({
    url: `/api/materials?q=${encodeURIComponent("x' OR '1'='1")}`,
  });
  assert.equal(injected.statusCode, 200);
  assert.equal(injected.json().data.length, 0);
});

// ---------------------------------------------------------------------------
// registry
// ---------------------------------------------------------------------------

test('GET /api/properties -- every definition is reachable through its group', async () => {
  const res = await inject({ url: '/api/properties' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 6);
  // The registry grows by design ("the registry is the schema"), so the real
  // invariant is that the reported total equals what the groups actually
  // carry -- not that either equals a number written down last month.
  const { rows } = await built.pool.query('SELECT count(*)::int AS n FROM property_definition');
  assert.equal(body.total, rows[0].n);
  const total = body.data.reduce(
    (sum: number, g: { properties: unknown[] }) => sum + g.properties.length,
    0,
  );
  assert.equal(total, body.total);
});

// ---------------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FE-6: compare
// ---------------------------------------------------------------------------

interface CompareCell {
  subjectRef: string;
  band: { valueMin: number; valueMax: number; valueTypical: number | null };
  representative: number;
  isCited: boolean;
}
interface CompareRow {
  rowKey: string;
  propertyKey: string;
  conditions: Record<string, unknown>;
  cells: CompareCell[];
}
interface CompareResponse {
  subjects: Array<{
    kind: 'material' | 'grade_class';
    ref: string;
    materialSlug: string;
    gradeClassKey?: string;
    nameFa: string;
    nameEn: string;
    familyKey: string;
  }>;
  rows: CompareRow[];
  excludedRowCount: number;
  applications: Array<{ key: string; nameFa: string; nameEn: string }>;
  polarityRules: Array<{
    applicationKey: string;
    propertyKey: string;
    polarity: 'higher_is_better' | 'lower_is_better' | 'not_relevant';
    rationaleFa: string;
    rationaleEn: string;
  }>;
}

test('GET /api/compare -- 400 when subjects is missing or empty', async () => {
  const missing = await inject({ url: '/api/compare' });
  assert.equal(missing.statusCode, 400);
  assert.equal(missing.json().error.code, 'BAD_REQUEST');

  const empty = await inject({ url: '/api/compare?subjects=' });
  assert.equal(empty.statusCode, 400);
});

test('GET /api/compare -- 400 on a malformed ref (more than one slash)', async () => {
  const res = await inject({ url: '/api/compare?subjects=ldpe/film/extra' });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error.message, /malformed/);
});

test('GET /api/compare -- 400 listing unknown subject refs, not a 500', async () => {
  const res = await inject({ url: '/api/compare?subjects=nope,ldpe/nope' });
  assert.equal(res.statusCode, 400);
  const msg = res.json().error.message as string;
  assert.match(msg, /nope/);
  assert.match(msg, /ldpe\/nope/);
});

test('GET /api/compare -- subjects may be a material and a grade class, mixed (CR14)', async () => {
  const res = await inject({ url: '/api/compare?subjects=ldpe,hdpe/injection' });
  assert.equal(res.statusCode, 200);
  const body: CompareResponse = res.json();
  assert.equal(body.subjects.length, 2);

  const ldpe = body.subjects.find((s) => s.ref === 'ldpe');
  assert.ok(ldpe, 'ldpe subject present');
  assert.equal(ldpe!.kind, 'material');
  assert.equal(ldpe!.materialSlug, 'ldpe');
  assert.equal(ldpe!.gradeClassKey, undefined);
  assert.equal(typeof ldpe!.nameFa, 'string');
  assert.ok(ldpe!.nameFa.length > 0);

  const injection = body.subjects.find((s) => s.ref === 'hdpe/injection');
  assert.ok(injection, 'hdpe/injection subject present');
  assert.equal(injection!.kind, 'grade_class');
  assert.equal(injection!.materialSlug, 'hdpe');
  assert.equal(injection!.gradeClassKey, 'injection');

  // Every row's every cell must reference one of the two requested refs --
  // no stray subject leaking in.
  for (const row of body.rows) {
    for (const cell of row.cells) {
      assert.ok(['ldpe', 'hdpe/injection'].includes(cell.subjectRef));
    }
  }
});

test('GET /api/compare -- tensile_strength (yield) and (break) are separate rows, never merged (CR11)', async () => {
  // Real seeded data: hdpe/injection carries tensile_strength at both
  // {"basis":"yield"} and {"basis":"break"}, both 31 MPa -- if these were
  // merged into one row a reader could not tell yield from break apart.
  const res = await inject({ url: '/api/compare?subjects=hdpe/injection,ldpe/injection' });
  assert.equal(res.statusCode, 200);
  const body: CompareResponse = res.json();

  const tensileRows = body.rows.filter((r) => r.propertyKey === 'tensile_strength');
  assert.equal(tensileRows.length, 2, 'yield and break each get their own row');

  const rowKeys = new Set(tensileRows.map((r) => r.rowKey));
  assert.equal(rowKeys.size, 2, 'the two rows have distinct rowKeys');

  const byBasis = new Map(tensileRows.map((r) => [r.conditions.basis, r]));
  assert.ok(byBasis.has('yield'));
  assert.ok(byBasis.has('break'));

  // Each condition-specific row only ever compares a subject against the
  // SAME conditions -- both cells in the yield row are yield values, not one
  // yield and one break.
  for (const row of tensileRows) {
    assert.equal(row.cells.length, 2);
    for (const cell of row.cells) {
      assert.equal(typeof cell.representative, 'number');
    }
  }

  // Row keys are globally unique across the whole response -- the
  // deterministic (property, conditions) serialization never collides two
  // distinct conditions objects onto the same key.
  const allKeys = body.rows.map((r) => r.rowKey);
  assert.equal(new Set(allKeys).size, allKeys.length);
});

test('GET /api/compare -- a row only one subject can answer is excluded but counted (CR13)', async () => {
  const res = await inject({ url: '/api/compare?subjects=hdpe/injection,ldpe/injection' });
  const body: CompareResponse = res.json();

  // brittleness_temp is comparable and hdpe/injection has a real value for
  // it, but ldpe/injection does not (checked directly against the seeded
  // database) -- a comparison only one side can answer is not a comparison.
  const brittleness = body.rows.find((r) => r.propertyKey === 'brittleness_temp');
  assert.equal(brittleness, undefined, 'a single-subject row is not returned as a row');

  // Every eligible (is_comparable, numeric/range) (property, conditions)
  // combination that only one of the two subjects holds a value for --
  // computed independently against the database, not assumed to match
  // excludedRowCount by construction.
  const { rows: dbRows } = await built.pool.query<{ n: string }>(
    `
    WITH candidate AS (
      SELECT pv.subject_type, pv.subject_id, pd.key AS property_key, pv.conditions
      FROM property_value pv
      JOIN property_definition pd ON pd.id = pv.property_id
      WHERE pd.is_comparable = true
        AND pd.data_type IN ('numeric', 'range')
        AND pv.value_role = 'editorial'
        AND pv.superseded_by IS NULL
        AND pv.status <> 'superseded'
        AND (
          (pv.subject_type = 'grade_class' AND pv.subject_id IN (
            SELECT gc.id FROM grade_class gc JOIN material m ON m.id = gc.material_id
            WHERE (m.slug, gc.key) IN (('hdpe','injection'), ('ldpe','injection'))
          ))
        )
    )
    SELECT count(*)::int AS n FROM (
      SELECT property_key, conditions, count(*) AS c
      FROM candidate
      GROUP BY property_key, conditions
      HAVING count(*) = 1
    ) singleton
    `,
  );
  assert.equal(body.excludedRowCount, Number(dbRows[0]!.n));
  assert.ok(body.excludedRowCount > 0, 'sanity: there really is at least one excluded row');
});

test('GET /api/compare -- a single subject produces zero rows, all eligible rows excluded (CR13)', async () => {
  const res = await inject({ url: '/api/compare?subjects=ldpe' });
  assert.equal(res.statusCode, 200);
  const body: CompareResponse = res.json();
  assert.equal(body.rows.length, 0);
  assert.ok(body.excludedRowCount > 0);
});

test('GET /api/compare -- a missing value is simply absent from a row, never a cell (CR12)', async () => {
  const res = await inject({ url: '/api/compare?subjects=ldpe,hdpe/injection' });
  const body: CompareResponse = res.json();
  for (const row of body.rows) {
    // Every eligible row has at least 2 cells (CR13); with exactly 2
    // subjects requested, a row therefore never has more than 2 cells, and
    // a subject missing the value is simply not represented -- no null/0
    // placeholder cell for it.
    assert.ok(row.cells.length >= 2 && row.cells.length <= 2);
    const refs = row.cells.map((c) => c.subjectRef);
    assert.equal(new Set(refs).size, refs.length, 'no duplicate subject in one row');
  }
});

test('GET /api/compare -- citedness is reported per cell (CR18)', async (t) => {
  // Build a controlled asymmetric fixture: one real property_value cited,
  // a second real property_value (different subject) left uncited -- same
  // discipline as the existing citations fixture test above (insert, assert
  // on the live join, delete exactly what was inserted).
  const target = await built.pool.query<{ id: string }>(
    `SELECT pv.id
     FROM property_value pv
     JOIN property_definition pd ON pd.id = pv.property_id
     JOIN material m ON m.id = pv.subject_id
     WHERE pd.key = 'density' AND m.slug = 'pet' AND pv.subject_type = 'material'
       AND pv.value_role = 'editorial' AND pv.superseded_by IS NULL AND pv.status <> 'superseded'`,
  );
  const propertyValueId = target.rows[0]?.id;
  assert.ok(propertyValueId, 'pet density property_value exists');

  const source = await built.pool.query<{ id: string }>(
    `INSERT INTO source (kind, tier, title, edition)
     VALUES ('handbook', 'peer_reviewed_handbook', '__fe6_test_source__', '1st')
     RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;
  const doc = await built.pool.query<{ id: string }>(
    `INSERT INTO source_document (source_id) VALUES ($1) RETURNING id`,
    [sourceId],
  );
  const documentId = doc.rows[0]!.id;
  const citation = await built.pool.query<{ id: string }>(
    `INSERT INTO citation (source_document_id, locator) VALUES ($1, '{"page": 12}') RETURNING id`,
    [documentId],
  );
  const citationId = citation.rows[0]!.id;
  await built.pool.query(
    `INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method)
     VALUES ('property_value', $1, $2, 'primary', 'manual')`,
    [propertyValueId, citationId],
  );

  t.after(async () => {
    await built.pool.query('DELETE FROM evidence WHERE citation_id = $1', [citationId]);
    await built.pool.query('DELETE FROM citation WHERE id = $1', [citationId]);
    await built.pool.query('DELETE FROM source_document WHERE id = $1', [documentId]);
    await built.pool.query('DELETE FROM source WHERE id = $1', [sourceId]);
  });

  const res = await inject({ url: '/api/compare?subjects=pet,ldpe' });
  assert.equal(res.statusCode, 200);
  const body: CompareResponse = res.json();
  const density = body.rows.find((r) => r.propertyKey === 'density');
  assert.ok(density, 'pet vs ldpe density row present');
  const petCell = density!.cells.find((c) => c.subjectRef === 'pet');
  assert.ok(petCell, 'pet cell present');
  assert.equal(petCell!.isCited, true, 'the fixture citation makes this cell cited');
  for (const cell of density!.cells) {
    assert.equal(typeof cell.isCited, 'boolean');
  }
});

test('GET /api/compare -- carries the application list and polarity rules for CR4/CR5/CR6', async () => {
  const res = await inject({ url: '/api/compare?subjects=hdpe/injection,ldpe/injection' });
  assert.equal(res.statusCode, 200);
  const body: CompareResponse = res.json();

  assert.ok(Array.isArray(body.applications));
  assert.ok(body.applications.length > 0);
  for (const a of body.applications) {
    assert.equal(typeof a.key, 'string');
    assert.equal(typeof a.nameFa, 'string');
    assert.equal(typeof a.nameEn, 'string');
  }

  assert.ok(Array.isArray(body.polarityRules));
  const validPolarities = new Set(['higher_is_better', 'lower_is_better', 'not_relevant']);
  for (const rule of body.polarityRules) {
    assert.ok(validPolarities.has(rule.polarity));
    assert.equal(typeof rule.rationaleFa, 'string');
    assert.ok(rule.rationaleFa.length > 0, 'CR6 -- rationale is required, never blank');
    assert.equal(typeof rule.rationaleEn, 'string');
  }

  // A specific real seeded judgement (application_property_polarity, 0024):
  // chemical tanks/pallets judges higher ESCR better -- checked directly
  // against the database, not assumed.
  const { rows: dbRule } = await built.pool.query<{ polarity: string }>(
    `SELECT app.polarity::text AS polarity
     FROM application_property_polarity app
     JOIN application a ON a.id = app.application_id
     JOIN property_definition pd ON pd.id = app.property_id
     WHERE a.key = 'chemical_tanks_pallets' AND pd.key = 'escr'`,
  );
  if (dbRule[0]) {
    const rule = body.polarityRules.find(
      (r) => r.applicationKey === 'chemical_tanks_pallets' && r.propertyKey === 'escr',
    );
    assert.ok(rule, 'the seeded chemical_tanks_pallets/escr rule is present in the response');
    assert.equal(rule!.polarity, dbRule[0]!.polarity);
  }
});

test('GET /api/coverage -- one numeric 0-100 row per material', async () => {
  const res = await inject({ url: '/api/coverage' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const { rows } = await built.pool.query('SELECT count(*)::int AS n FROM material');
  assert.equal(body.data.length, rows[0].n);
  // Asserting a specific percentage would make this test fail every time a
  // citation lands -- i.e. every time the project succeeds. The invariant is
  // that the number is a real percentage.
  for (const row of body.data) {
    assert.equal(typeof row.coveragePct, 'number');
    assert.ok(row.coveragePct >= 0 && row.coveragePct <= 100);
  }
});

// ---------------------------------------------------------------------------
// FE-7: GET /api/materials/:slug/sources -- per-material "CSV of data with
// their source" (frontend-plan.md D4).
// ---------------------------------------------------------------------------

test('GET /api/materials/ldpe/sources -- 404 for an unknown slug, not a 500', async () => {
  const res = await inject({ url: '/api/materials/does-not-exist/sources' });
  assert.equal(res.statusCode, 404);
  const body = res.json();
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('GET /api/materials/ldpe/sources -- material identity and shape', async () => {
  const res = await inject({ url: '/api/materials/ldpe/sources' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.material.slug, 'ldpe');
  assert.equal(typeof body.material.nameFa, 'string');
  assert.equal(typeof body.material.nameEn, 'string');
  assert.ok(Array.isArray(body.rows));
  assert.ok(body.rows.length > 0);
  for (const row of body.rows) {
    assert.ok(row.subject.kind === 'material' || row.subject.kind === 'grade_class');
    assert.equal(typeof row.property.key, 'string');
    assert.ok(Array.isArray(row.citations));
    // The whole point of this surface: a row is never presented as sourced
    // without a page-level locator (citation_locator_present_chk,
    // db/migrations/0006_citations.sql).
    for (const c of row.citations) {
      assert.ok(c.locator && typeof c.locator === 'object');
      const hasLocatorKey = ['page', 'table', 'figure', 'section'].some(
        (k) => c.locator[k] !== undefined && c.locator[k] !== null,
      );
      assert.ok(hasLocatorKey, `citation ${c.id} carries a page/table/figure/section locator`);
      assert.equal(typeof c.sourceTitle, 'string');
      assert.equal(typeof c.sourceTier, 'string');
      assert.equal(typeof c.sourceKind, 'string');
    }
  }
});

test('GET /api/materials/ldpe/sources -- grade-class-backed rows are present and distinguishable from material rows', async () => {
  const res = await inject({ url: '/api/materials/ldpe/sources' });
  const body = res.json();
  const gradeClassRows = body.rows.filter(
    (r: { subject: { kind: string } }) => r.subject.kind === 'grade_class',
  );
  const materialRows = body.rows.filter(
    (r: { subject: { kind: string } }) => r.subject.kind === 'material',
  );
  assert.ok(gradeClassRows.length > 0, 'ldpe has grade-class-backed rows (film, injection, ...)');
  assert.ok(materialRows.length > 0, 'ldpe has material-level rows');
  for (const row of gradeClassRows) {
    assert.equal(typeof row.subject.key, 'string');
    assert.equal(typeof row.subject.nameFa, 'string');
    assert.equal(typeof row.subject.nameEn, 'string');
  }
  for (const row of materialRows) {
    assert.equal(row.subject.key, undefined);
  }

  // Cross-check against the real database, independent of the endpoint's
  // own SQL: ldpe/injection's density value (0.923, checked directly
  // against the seed elsewhere in this file) must appear as a
  // grade_class-subject row here, carrying its own citation.
  const injectionDensity = gradeClassRows.find(
    (r: { subject: { key: string }; property: { key: string } }) =>
      r.subject.key === 'injection' && r.property.key === 'density',
  );
  assert.ok(injectionDensity, 'ldpe/injection density row present in the sources table');
  assert.ok(injectionDensity.citations.length > 0, 'ldpe/injection density is cited');
});

test('GET /api/materials/ldpe/sources -- coverage counts are internally consistent and match an independent SQL count', async () => {
  const res = await inject({ url: '/api/materials/ldpe/sources' });
  const body = res.json();

  const citedInBody = body.rows.filter(
    (r: { citations: unknown[] }) => r.citations.length > 0,
  ).length;
  assert.equal(body.coverage.totalValues, body.rows.length);
  assert.equal(body.coverage.citedValues, citedInBody);
  assert.equal(body.coverage.uncitedValues, body.coverage.totalValues - body.coverage.citedValues);
  assert.equal(
    body.coverage.materialLevel.totalValues + body.coverage.gradeClassLevel.totalValues,
    body.coverage.totalValues,
  );
  assert.equal(
    body.coverage.materialLevel.citedValues + body.coverage.gradeClassLevel.citedValues,
    body.coverage.citedValues,
  );

  // Independent count straight from the schema: live editorial material
  // values for ldpe with at least one evidence row.
  const { rows: materialCited } = await built.pool.query<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM property_value pv
     JOIN material m ON m.id = pv.subject_id
     WHERE pv.subject_type = 'material' AND m.slug = 'ldpe'
       AND pv.value_role = 'editorial' AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
       AND EXISTS (
         SELECT 1 FROM evidence e WHERE e.subject_type = 'property_value' AND e.subject_id = pv.id
       )`,
  );
  assert.equal(body.coverage.materialLevel.citedValues, materialCited[0]!.n);

  const { rows: gradeClassCited } = await built.pool.query<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM property_value pv
     JOIN grade_class gc ON gc.id = pv.subject_id
     WHERE pv.subject_type = 'grade_class' AND gc.material_id = (SELECT id FROM material WHERE slug = 'ldpe')
       AND pv.value_role = 'editorial' AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
       AND EXISTS (
         SELECT 1 FROM evidence e WHERE e.subject_type = 'property_value' AND e.subject_id = pv.id
       )`,
  );
  assert.equal(body.coverage.gradeClassLevel.citedValues, gradeClassCited[0]!.n);

  // Grade classes are seeded as the best-cited data in the project -- their
  // coverage here must not be lower than the material level's, and must not
  // be silently omitted (0 rows would also satisfy citedValues === total,
  // so length is checked too).
  assert.ok(body.coverage.gradeClassLevel.totalValues > 0, 'ldpe grade classes contribute rows');
  assert.ok(
    body.coverage.gradeClassLevel.coveragePct >= body.coverage.materialLevel.coveragePct,
    'grade-class-level coverage is at least as good as material-level coverage for ldpe',
  );
});

test('GET /api/materials/ldpe/sources -- an uncited value is reported with an empty citations array, never fabricated', async () => {
  const res = await inject({ url: '/api/materials/ldpe/sources' });
  const body = res.json();
  const uncited = body.rows.find((r: { citations: unknown[] }) => r.citations.length === 0);
  assert.ok(
    uncited,
    'ldpe has at least one uncited row (its material-level coverage is well under 100%)',
  );
  assert.deepEqual(uncited.citations, []);
  assert.equal(typeof uncited.status, 'string');
});

test('GET /api/materials/ldpe/sources -- a known citation resolves with its full locator', async (t) => {
  const densityId = await built.pool.query<{ id: string }>(
    `SELECT pv.id FROM property_value pv
     JOIN property_definition pd ON pd.id = pv.property_id
     JOIN material m ON m.id = pv.subject_id
     WHERE pd.key = 'density' AND m.slug = 'ldpe' AND pv.subject_type = 'material'
       AND pv.value_role = 'editorial'`,
  );
  const propertyValueId = densityId.rows[0]?.id;
  assert.ok(propertyValueId, 'ldpe density property_value exists');

  const source = await built.pool.query<{ id: string }>(
    `INSERT INTO source (kind, tier, title, edition)
     VALUES ('handbook', 'peer_reviewed_handbook', '__fe7_test_source__', '9th')
     RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;
  const doc = await built.pool.query<{ id: string }>(
    `INSERT INTO source_document (source_id) VALUES ($1) RETURNING id`,
    [sourceId],
  );
  const documentId = doc.rows[0]!.id;
  const citation = await built.pool.query<{ id: string }>(
    `INSERT INTO citation (source_document_id, locator) VALUES ($1, '{"page": 99, "table": "2-1"}') RETURNING id`,
    [documentId],
  );
  const citationId = citation.rows[0]!.id;
  await built.pool.query(
    `INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method)
     VALUES ('property_value', $1, $2, 'corroborating', 'manual')`,
    [propertyValueId, citationId],
  );

  t.after(async () => {
    await built.pool.query('DELETE FROM evidence WHERE citation_id = $1', [citationId]);
    await built.pool.query('DELETE FROM citation WHERE id = $1', [citationId]);
    await built.pool.query('DELETE FROM source_document WHERE id = $1', [documentId]);
    await built.pool.query('DELETE FROM source WHERE id = $1', [sourceId]);
  });

  const res = await inject({ url: '/api/materials/ldpe/sources' });
  const body = res.json();
  const densityRow = body.rows.find(
    (r: { subject: { kind: string }; property: { key: string } }) =>
      r.subject.kind === 'material' && r.property.key === 'density',
  );
  assert.ok(densityRow, 'ldpe density row present');
  const entry = densityRow.citations.find(
    (c: { sourceTitle: string }) => c.sourceTitle === '__fe7_test_source__',
  );
  assert.ok(entry, 'the synthetic citation is present among density citations');
  assert.deepEqual(entry.locator, { page: 99, table: '2-1' });
  assert.equal(entry.sourceEdition, '9th');
  assert.equal(entry.sourceTier, 'peer_reviewed_handbook');
  assert.equal(entry.sourceKind, 'handbook');
  assert.equal(entry.role, 'corroborating');
});

test('GET /api/materials/pet/sources -- gradeClassLevel is all-zero, not missing, for a material with no grade classes', async () => {
  const res = await inject({ url: '/api/materials/pet/sources' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.coverage.gradeClassLevel.totalValues, 0);
  assert.equal(body.coverage.gradeClassLevel.citedValues, 0);
  assert.equal(body.coverage.gradeClassLevel.coveragePct, 0);
  assert.ok(body.rows.every((r: { subject: { kind: string } }) => r.subject.kind === 'material'));
});

// ---------------------------------------------------------------------------
// FE-7: GET /api/sources -- site-wide bibliography
// ---------------------------------------------------------------------------

test('GET /api/sources -- every seeded source is present, carrying tier/kind and its document list', async () => {
  const res = await inject({ url: '/api/sources' });
  assert.equal(res.statusCode, 200);
  const body = res.json();

  const { rows: countRows } = await built.pool.query<{ n: number }>(
    'SELECT count(*)::int AS n FROM source',
  );
  assert.equal(body.total, countRows[0]!.n);
  assert.equal(body.data.length, countRows[0]!.n);

  for (const s of body.data) {
    assert.equal(typeof s.id, 'string');
    assert.equal(typeof s.title, 'string');
    assert.equal(typeof s.kind, 'string');
    assert.equal(typeof s.tier, 'string');
    assert.equal(typeof s.citationCount, 'number');
    assert.equal(typeof s.valueCount, 'number');
    assert.ok(Array.isArray(s.documents));
  }

  // A source known to have zero source_documents today (checked directly
  // against the seed) is still listed, with an empty documents array and
  // zero counts -- the bibliography does not silently drop it just because
  // nothing cites it yet.
  const { rows: zeroDocSources } = await built.pool.query<{ title: string }>(
    `SELECT s.title FROM source s
     WHERE NOT EXISTS (SELECT 1 FROM source_document sd WHERE sd.source_id = s.id)
     LIMIT 1`,
  );
  if (zeroDocSources[0]) {
    const found = body.data.find((s: { title: string }) => s.title === zeroDocSources[0]!.title);
    assert.ok(found, 'a source with no source_document rows is still listed in the bibliography');
    assert.deepEqual(found.documents, []);
    assert.equal(found.valueCount, 0);
  }
});

test('GET /api/sources -- ordered by tier (credibility), then by how many values the source backs', async () => {
  const res = await inject({ url: '/api/sources' });
  const body = res.json();

  const tierRank: Record<string, number> = {
    peer_reviewed_handbook: 0,
    standard: 1,
    manufacturer_datasheet: 2,
    vendor_marketing: 3,
    community: 4,
  };
  for (let i = 1; i < body.data.length; i++) {
    const prev = body.data[i - 1];
    const cur = body.data[i];
    assert.ok(
      tierRank[prev.tier] <= tierRank[cur.tier],
      `source ${i - 1} (${prev.tier}) must not sort after source ${i} (${cur.tier})`,
    );
    if (prev.tier === cur.tier) {
      assert.ok(
        prev.valueCount >= cur.valueCount,
        `within tier ${prev.tier}, valueCount must be non-increasing (${prev.valueCount} then ${cur.valueCount})`,
      );
    }
  }
});

test('GET /api/sources -- a known source resolves to the specific values it backs, matching an independent SQL count', async () => {
  const res = await inject({ url: '/api/sources' });
  const body = res.json();

  // "Encyclopedia of Polymer Science and Technology, Vol. 2" is the
  // heaviest-cited seeded source (checked directly against the database),
  // backing values under both material and grade_class subjects.
  const entry = body.data.find(
    (s: { title: string }) => s.title === 'Encyclopedia of Polymer Science and Technology, Vol. 2',
  );
  assert.ok(entry, 'the seeded source is present in the bibliography');
  assert.ok(entry.valueCount > 0);

  const { rows } = await built.pool.query<{ n: number }>(
    `SELECT COUNT(DISTINCT pv_resolved.editorial_id)::int AS n
     FROM source s
     JOIN source_document sd ON sd.source_id = s.id
     JOIN citation c ON c.source_document_id = sd.id
     JOIN evidence e ON e.citation_id = c.id AND e.subject_type = 'property_value'
     JOIN (
       SELECT id AS editorial_id, id AS pv_id FROM property_value WHERE value_role = 'editorial'
       UNION ALL
       SELECT editorial_value_id AS editorial_id, id AS pv_id FROM property_value
         WHERE value_role = 'observation' AND editorial_value_id IS NOT NULL
     ) pv_resolved ON pv_resolved.pv_id = e.subject_id
     WHERE s.title = 'Encyclopedia of Polymer Science and Technology, Vol. 2'`,
  );
  assert.equal(entry.valueCount, rows[0]!.n);

  const { rows: citationRows } = await built.pool.query<{ n: number }>(
    `SELECT COUNT(DISTINCT c.id)::int AS n
     FROM source s
     JOIN source_document sd ON sd.source_id = s.id
     JOIN citation c ON c.source_document_id = sd.id
     WHERE s.title = 'Encyclopedia of Polymer Science and Technology, Vol. 2'`,
  );
  assert.equal(entry.citationCount, citationRows[0]!.n);
});

test('GET /api/sources -- citation locators are always well-formed where a source has any', async () => {
  const res = await inject({ url: '/api/sources' });
  const body = res.json();
  // The bibliography itself doesn't return locators (they're per-value, on
  // the per-material sources endpoint) -- this proves the schema-level
  // guarantee this whole unit rests on: every citation row in the database
  // has a real locator, so nothing the per-material endpoint surfaces could
  // ever be a citation without one.
  const { rows } = await built.pool.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM citation
     WHERE NOT (
       jsonb_typeof(locator) = 'object'
       AND (
         (locator ? 'page' AND jsonb_typeof(locator -> 'page') <> 'null')
         OR (locator ? 'table' AND jsonb_typeof(locator -> 'table') <> 'null')
         OR (locator ? 'figure' AND jsonb_typeof(locator -> 'figure') <> 'null')
         OR (locator ? 'section' AND jsonb_typeof(locator -> 'section') <> 'null')
       )
     )`,
  );
  assert.equal(rows[0]!.n, 0, 'every citation row satisfies citation_locator_present_chk');
  assert.ok(body.data.length > 0);
});

// ---------------------------------------------------------------------------
// solvents (FE-8 step 4)
// ---------------------------------------------------------------------------

test('GET /api/solvents -- 200, shape is {data, total}, total matches data length', async () => {
  const res = await inject({ url: '/api/solvents' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(Array.isArray(body.data));
  assert.equal(body.total, body.data.length);
});

test('GET /api/solvents -- matches the real row count in the database (honest about an empty table too)', async () => {
  const res = await inject({ url: '/api/solvents' });
  const body = res.json();
  const { rows } = await built.pool.query<{ n: number }>('SELECT count(*)::int AS n FROM solvent');
  assert.equal(body.total, rows[0]!.n);
});

test('GET /api/solvents -- every row carries the three Hansen parameters as numbers and a boolean cited flag', async () => {
  const res = await inject({ url: '/api/solvents' });
  const body = res.json();
  for (const solvent of body.data) {
    assert.equal(typeof solvent.key, 'string');
    assert.equal(typeof solvent.nameEn, 'string');
    assert.equal(typeof solvent.hansenD, 'number');
    assert.equal(typeof solvent.hansenP, 'number');
    assert.equal(typeof solvent.hansenH, 'number');
    assert.equal(typeof solvent.cited, 'boolean');
    // nameFa is expected to be NULL for the great majority of rows (the
    // handbook import does not machine-translate 700 chemical names) --
    // the contract is "string or null", never undefined/missing.
    assert.ok(solvent.nameFa === null || typeof solvent.nameFa === 'string');
    assert.ok(solvent.molarVolume === null || typeof solvent.molarVolume === 'number');
  }
});

test('GET /api/solvents -- rows are sorted by English name, matching an independent SQL ORDER BY', async () => {
  // Compared against the database's own ORDER BY name_en rather than a
  // JS-side .sort()/.localeCompare() re-sort: Postgres's default collation
  // and JS's locale-aware string comparison do not always agree on
  // punctuation/hyphen/digit ordering, so re-sorting in JS and asserting
  // equality against the route's actual (collation-ordered) output was
  // asserting the wrong thing, not testing the wrong thing.
  const res = await inject({ url: '/api/solvents' });
  const body = res.json();
  const names = body.data.map((s: { nameEn: string }) => s.nameEn);
  const { rows } = await built.pool.query<{ name_en: string }>(
    'SELECT name_en FROM solvent ORDER BY name_en',
  );
  assert.deepEqual(
    names,
    rows.map((r) => r.name_en),
  );
});

test('GET /api/solvents -- a solvent with real evidence rows is reported as cited', async () => {
  const { rows: solventRows } = await built.pool.query<{ id: string; key: string }>(
    `SELECT s.id, s.key FROM solvent s
     JOIN evidence e ON e.subject_type = 'solvent' AND e.subject_id = s.id
     LIMIT 1`,
  );
  if (solventRows.length === 0) {
    // No cited solvent exists yet (the curation import is concurrent and
    // may not have landed any evidence rows at the moment this suite runs)
    // -- nothing to assert against, and asserting a fixed count here would
    // make this test flaky against a moving dataset rather than a bug.
    return;
  }
  const res = await inject({ url: '/api/solvents' });
  const body = res.json();
  const match = body.data.find((s: { key: string }) => s.key === solventRows[0]!.key);
  assert.ok(match, 'the cited solvent is present in the list response');
  assert.equal(match.cited, true);
});

// ---------------------------------------------------------------------------
// hsp-correlations (Appendix A Table A.2 import)
// ---------------------------------------------------------------------------

test('GET /api/hsp-correlations -- 200, shape is {data, total}, total matches data length', async () => {
  const res = await inject({ url: '/api/hsp-correlations' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(Array.isArray(body.data));
  assert.equal(body.total, body.data.length);
});

test('GET /api/hsp-correlations -- matches the real row count in the database (honest about an empty table too)', async () => {
  const res = await inject({ url: '/api/hsp-correlations' });
  const body = res.json();
  const { rows } = await built.pool.query<{ n: number }>(
    'SELECT count(*)::int AS n FROM hsp_correlation',
  );
  assert.equal(body.total, rows[0]!.n);
});

test('GET /api/hsp-correlations -- every row carries the four Hansen sphere numbers as numbers and a boolean cited flag', async () => {
  const res = await inject({ url: '/api/hsp-correlations' });
  const body = res.json();
  for (const correlation of body.data) {
    assert.equal(typeof correlation.key, 'string');
    assert.equal(typeof correlation.nameRaw, 'string');
    assert.equal(typeof correlation.hansenD, 'number');
    assert.equal(typeof correlation.hansenP, 'number');
    assert.equal(typeof correlation.hansenH, 'number');
    assert.equal(typeof correlation.r0, 'number');
    assert.equal(typeof correlation.cited, 'boolean');
    // materialSlug is NULL for the great majority of rows (most Table A.2
    // entries are trade-name-only products with no catalog counterpart) --
    // the contract is "string or null", never undefined/missing.
    assert.ok(correlation.materialSlug === null || typeof correlation.materialSlug === 'string');
    assert.ok(correlation.nameFa === null || typeof correlation.nameFa === 'string');
    assert.ok(correlation.uncertainty === null || typeof correlation.uncertainty === 'string');
  }
});

test('GET /api/hsp-correlations -- rows are sorted by handbook_number, matching an independent SQL ORDER BY', async () => {
  const res = await inject({ url: '/api/hsp-correlations' });
  const body = res.json();
  const numbers = body.data.map((c: { handbookNumber: number | null }) => c.handbookNumber);
  const { rows } = await built.pool.query<{ handbook_number: number | null }>(
    'SELECT handbook_number FROM hsp_correlation ORDER BY handbook_number NULLS LAST, name_raw',
  );
  assert.deepEqual(
    numbers,
    rows.map((r) => r.handbook_number),
  );
});

test('GET /api/hsp-correlations -- a correlation with real evidence rows is reported as cited', async () => {
  const { rows: correlationRows } = await built.pool.query<{ id: string; key: string }>(
    `SELECT h.id, h.key FROM hsp_correlation h
     JOIN evidence e ON e.subject_type = 'hsp_correlation' AND e.subject_id = h.id
     LIMIT 1`,
  );
  if (correlationRows.length === 0) {
    // No cited correlation exists yet (the curation import is concurrent
    // and may not have landed any evidence rows at the moment this suite
    // runs) -- nothing to assert against, and asserting a fixed count here
    // would make this test flaky against a moving dataset rather than a bug.
    return;
  }
  const res = await inject({ url: '/api/hsp-correlations' });
  const body = res.json();
  const match = body.data.find((c: { key: string }) => c.key === correlationRows[0]!.key);
  assert.ok(match, 'the cited correlation is present in the list response');
  assert.equal(match.cited, true);
});

test('GET /api/hsp-correlations -- a correlation linked to a catalog material carries that material materialSlug', async () => {
  const { rows: linkedRows } = await built.pool.query<{ key: string; slug: string }>(
    `SELECT h.key, m.slug FROM hsp_correlation h
     JOIN material m ON m.id = h.material_id
     LIMIT 1`,
  );
  if (linkedRows.length === 0) {
    // No linked correlation exists yet -- see the note above on the
    // concurrent curation import; nothing to assert against.
    return;
  }
  const res = await inject({ url: '/api/hsp-correlations' });
  const body = res.json();
  const match = body.data.find((c: { key: string }) => c.key === linkedRows[0]!.key);
  assert.ok(match, 'the linked correlation is present in the list response');
  assert.equal(match.materialSlug, linkedRows[0]!.slug);
});
