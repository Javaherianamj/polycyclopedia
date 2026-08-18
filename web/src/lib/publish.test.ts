import { describe, expect, it, afterEach, vi } from 'vitest';
import { gateMaterials, isPublished, publishedOnly } from './publish';

const draft = { slug: 'abs', status: 'draft' };
const published = { slug: 'ldpe', status: 'published' };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isPublished', () => {
  it('accepts only the published status', () => {
    expect(isPublished('published')).toBe(true);
    expect(isPublished('draft')).toBe(false);
    expect(isPublished('review')).toBe(false);
    // Not a status the schema emits; must not be treated as published by
    // accident if the column ever grows a new value.
    expect(isPublished('')).toBe(false);
  });
});

describe('publishedOnly', () => {
  it('is off unless the env var is exactly "true"', () => {
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', '');
    expect(publishedOnly()).toBe(false);
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', 'yes');
    expect(publishedOnly()).toBe(false);
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', 'true');
    expect(publishedOnly()).toBe(true);
  });
});

describe('gateMaterials', () => {
  it('passes everything through when the gate is off (the default)', () => {
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', '');
    expect(gateMaterials([draft, published])).toEqual([draft, published]);
  });

  it('drops non-published materials when the gate is on', () => {
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', 'true');
    expect(gateMaterials([draft, published])).toEqual([published]);
  });

  it('returns an empty list rather than throwing when nothing is published', () => {
    vi.stubEnv('PUBLIC_PUBLISHED_ONLY', 'true');
    expect(gateMaterials([draft])).toEqual([]);
  });
});
