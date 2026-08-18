// FE-8 step 4 — solvent-datasheet fetch. Deliberately its own tiny request
// helper rather than extending web/src/lib/api/client.ts, matching FE-7's
// precedent (components/sources/fetch-sources.ts) for a route this unit
// owns end-to-end: DataBoundary's real error state (with retry, R4) is the
// right behaviour while the sibling curation pass populating `solvent` is
// still running (db/migrations/0027_solvent.sql's header) rather than a
// stub or a fake dataset.
//
// Also reused by Learn's HansenSpaceIsland (lib/learn/hansen-space.ts) — the
// solvent cloud is the same 700-ish rows either way, one fetch shape for
// both consumers rather than two.
import type { ApiResult } from '../api/types';
import type { Solvent, SolventsListResponse } from './types';

function baseUrl(): string {
  return import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
}

export async function fetchSolvents(): Promise<ApiResult<Solvent[]>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api/solvents`);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network request failed',
      },
    };
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Non-JSON error body — fall through to statusText.
    }
    return { ok: false, error: { code: `HTTP_${response.status}`, message } };
  }

  const body = (await response.json()) as SolventsListResponse;
  return { ok: true, data: body.data };
}
