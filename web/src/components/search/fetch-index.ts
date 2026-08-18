// BR12: the two index files are fetched as static assets on navigating to
// the search page, after the island hydrates -- never inlined into page JS.
// A thin wrapper matching DataBoundary's `fetcher: () => Promise<ApiResult<T>>`
// contract (web/src/components/states/DataBoundary.tsx), so DataBoundary
// needs zero changes to serve a build-time static asset instead of a live
// `/api/...` route (frontend-components.md).
import type { ApiResult } from '../../lib/api/types';
import type {
  SearchIndexGradeClass,
  SearchIndexMaterial,
  SearchIndexProperty,
  SearchMaterialsIndex,
  SearchPropertiesIndex,
} from '../../lib/search/types';

export interface SearchIndexData {
  materials: SearchIndexMaterial[];
  gradeClasses: SearchIndexGradeClass[];
  properties: SearchIndexProperty[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchSearchIndex(): Promise<ApiResult<SearchIndexData>> {
  try {
    const [materialsIndex, propertiesIndex] = await Promise.all([
      fetchJson<SearchMaterialsIndex>('/search-materials.json'),
      fetchJson<SearchPropertiesIndex>('/search-properties.json'),
    ]);
    return {
      ok: true,
      data: {
        materials: materialsIndex.materials,
        gradeClasses: materialsIndex.gradeClasses,
        properties: propertiesIndex.properties,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'SEARCH_INDEX_FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to load the search index',
      },
    };
  }
}
