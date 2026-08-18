import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCoverage, getHealth, getMaterial, getMaterials, getProperties } from './client';

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'mocked',
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getMaterials', () => {
  it('returns data on success', async () => {
    mockFetchOnce(200, { data: [], total: 0, limit: 50, offset: 0 });
    const result = await getMaterials();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.total).toBe(0);
  });

  it('passes filters as query params', async () => {
    mockFetchOnce(200, { data: [], total: 0, limit: 50, offset: 0 });
    await getMaterials({ field: 'polymers', q: 'poly' });
    const call = vi.mocked(fetch).mock.calls[0]![0] as string;
    expect(call).toContain('field=polymers');
    expect(call).toContain('q=poly');
  });
});

describe('getMaterial', () => {
  it('surfaces the API error body on 404', async () => {
    mockFetchOnce(404, { error: { code: 'NOT_FOUND', message: "No material with slug 'nope'" } });
    const result = await getMaterial('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns a NETWORK_ERROR result rather than throwing when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const result = await getMaterial('ldpe');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NETWORK_ERROR');
  });
});

describe('getProperties', () => {
  it('returns an empty list without erroring', async () => {
    mockFetchOnce(200, { data: [], total: 0 });
    const result = await getProperties();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.data).toEqual([]);
  });
});

describe('getCoverage', () => {
  it('returns data on success', async () => {
    mockFetchOnce(200, {
      data: [
        {
          slug: 'ldpe',
          nameFa: 'LDPE',
          nameEn: 'LDPE',
          totalValues: 10,
          citedValues: 5,
          coveragePct: 50,
        },
      ],
    });
    const result = await getCoverage();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.data).toHaveLength(1);
  });
});

describe('getHealth', () => {
  it('returns data on success', async () => {
    mockFetchOnce(200, { status: 'ok', database: 'connected', migrations: 9 });
    const result = await getHealth();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.migrations).toBe(9);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('not json');
        },
      }),
    );
    const result = await getHealth();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('HTTP_500');
  });
});
