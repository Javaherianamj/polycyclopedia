// FE-7 — site-wide bibliography fetch. Deliberately its OWN tiny request
// helper rather than importing from web/src/lib/api/client.ts: that file's
// `request`/`baseUrl` helpers are private (not exported) and the file
// itself is off-limits to this unit (the sibling agent building the API
// owns client.ts/types.ts, landing concurrently). This mirrors
// components/search/fetch-index.ts's precedent of a component-local fetch
// wrapper rather than duplicating client.ts's ApiResult error-shape logic
// wholesale.
//
// DEPENDENCY NOTE: `GET /api/sources` is being built in parallel by the
// sibling agent and may not exist yet at any given moment this unit is
// tested. That is not a bug in this file — `SourcesIsland` calls this
// through `DataBoundary`, whose 'error' state renders R4's real error UI
// (with retry) rather than a stub or a fake dataset, so the page is honest
// about "the data isn't available yet" instead of silently working around
// it.
import type { ApiResult } from '../../lib/api/types';
import type { SourceSummary, SourcesListResponse } from './types';

function baseUrl(): string {
  return import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
}

export async function fetchSources(): Promise<ApiResult<SourceSummary[]>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api/sources`);
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
      // Non-JSON error body (e.g. the route doesn't exist yet and a 404
      // came from Fastify's default handler) — fall through to statusText.
    }
    return { ok: false, error: { code: `HTTP_${response.status}`, message } };
  }

  const body = (await response.json()) as SourcesListResponse;
  return { ok: true, data: body.data };
}
