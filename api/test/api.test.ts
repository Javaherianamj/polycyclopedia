// Integration tests against the real seeded Postgres database (container
// `polypedia-pg`, connecting as the least-privilege `polypedia_app` role --
// the same one production traffic would use). The database is not mocked:
// the entire value of this unit is whether the SQL is right.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
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

test('GET /health -- 200, migrations = 9', async () => {
  const res = await inject({ url: '/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'connected');
  assert.equal(body.migrations, 9);
});

// ---------------------------------------------------------------------------
// list materials
// ---------------------------------------------------------------------------

test('GET /api/materials -- returns ldpe and hdpe', async () => {
  const res = await inject({ url: '/api/materials' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const slugs = body.data.map((m: { slug: string }) => m.slug).sort();
  assert.deepEqual(slugs, ['hdpe', 'ldpe']);
  assert.equal(body.total, 2);
});

test('GET /api/materials?family=polyolefins -- returns both', async () => {
  const res = await inject({ url: '/api/materials?family=polyolefins' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const slugs = body.data.map((m: { slug: string }) => m.slug).sort();
  assert.deepEqual(slugs, ['hdpe', 'ldpe']);
});

test('GET /api/materials?q=... -- matches English name', async () => {
  const res = await inject({ url: '/api/materials?q=Low-Density' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].slug, 'ldpe');
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

test('GET /api/materials/ldpe -- density returns min 0.910 / max 0.925 as numbers', async () => {
  const res = await inject({ url: '/api/materials/ldpe' });
  const body = res.json();
  const density = findProperty(body, 'density');
  assert.ok(density, 'density property present');
  assert.equal(typeof density.valueMin, 'number');
  assert.equal(typeof density.valueMax, 'number');
  assert.equal(density.valueMin, 0.91);
  assert.equal(density.valueMax, 0.925);
  assert.equal(density.display, '0.910 - 0.925 g/cm³');
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

test('GET /api/properties -- 55 definitions across 6 groups', async () => {
  const res = await inject({ url: '/api/properties' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 6);
  assert.equal(body.total, 55);
  const total = body.data.reduce(
    (sum: number, g: { properties: unknown[] }) => sum + g.properties.length,
    0,
  );
  assert.equal(total, 55);
});

// ---------------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------------

test('GET /api/coverage -- reports 0% for both materials', async () => {
  const res = await inject({ url: '/api/coverage' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 2);
  for (const row of body.data) {
    assert.equal(row.coveragePct, 0);
    assert.equal(typeof row.coveragePct, 'number');
  }
});
