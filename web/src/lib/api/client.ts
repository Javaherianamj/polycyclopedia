import type {
  ApiErrorBody,
  ApiResult,
  BibliographyResponse,
  CompareResponse,
  CoverageResponse,
  HealthResponse,
  MaterialDetail,
  MaterialSourcesResponse,
  MaterialsListParams,
  MaterialsListResponse,
  PropertiesResponse,
} from './types';

// Isomorphic: runs at Astro build time (Node) for static pages today, and
// from browser islands later (FE-8) without changing shape. Base URL is a
// PUBLIC_ variable so both contexts see the same value.
function baseUrl(): string {
  return import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`);
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
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Response body wasn't JSON — fall through to the generic message below.
    }
    return {
      ok: false,
      error: body?.error ?? { code: `HTTP_${response.status}`, message: response.statusText },
    };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}

// R2/R3: this client is a typed passthrough. No property list, section
// order, or display formatting is decided here — it all comes from the API.

export function getMaterials(
  params: MaterialsListParams = {},
): Promise<ApiResult<MaterialsListResponse>> {
  const query = buildQuery({
    field: params.field,
    family: params.family,
    q: params.q,
    status: params.status,
    limit: params.limit,
    offset: params.offset,
  });
  return request<MaterialsListResponse>(`/api/materials${query}`);
}

export function getMaterial(slug: string): Promise<ApiResult<MaterialDetail>> {
  return request<MaterialDetail>(`/api/materials/${encodeURIComponent(slug)}`);
}

export function getProperties(): Promise<ApiResult<PropertiesResponse>> {
  return request<PropertiesResponse>('/api/properties');
}

export function getCoverage(): Promise<ApiResult<CoverageResponse>> {
  return request<CoverageResponse>('/api/coverage');
}

export function getHealth(): Promise<ApiResult<HealthResponse>> {
  return request<HealthResponse>('/health');
}

// FE-7. Per-material "CSV of data with their source" (frontend-plan.md D4) --
// api/src/routes/sources.ts.
export function getMaterialSources(slug: string): Promise<ApiResult<MaterialSourcesResponse>> {
  return request<MaterialSourcesResponse>(`/api/materials/${encodeURIComponent(slug)}/sources`);
}

// FE-7. Site-wide bibliography -- api/src/routes/sources.ts.
export function getBibliography(): Promise<ApiResult<BibliographyResponse>> {
  return request<BibliographyResponse>('/api/sources');
}

// FE-6. `subjectRefs` are "ldpe" / "ldpe/film" style refs (CompareSubject.ref,
// web/src/lib/compare/types.ts), joined the same way url-state.ts joins them
// for the URL. `GET /api/compare` (api/src/routes/compare.ts) takes only
// `subjects` — it returns EVERY application and EVERY polarity rule
// regardless of selection, and CR4's "no application -> no polarity
// anywhere" is enforced client-side by which of those rules
// `fetch-compare.ts` actually consults, not by what's requested.
export function getCompareTable(subjectRefs: string[]): Promise<ApiResult<CompareResponse>> {
  const query = buildQuery({ subjects: subjectRefs.join(',') });
  return request<CompareResponse>(`/api/compare${query}`);
}
