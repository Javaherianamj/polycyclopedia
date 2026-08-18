import { describe, expect, it } from 'vitest';
import { buildMaterialParam, getMaterialParam } from './learn-url-state';

describe('getMaterialParam', () => {
  it('reads the material slug when present', () => {
    const params = new URLSearchParams('material=ldpe');
    expect(getMaterialParam(params)).toBe('ldpe');
  });

  it('returns undefined when absent, rather than an empty string', () => {
    const params = new URLSearchParams('');
    expect(getMaterialParam(params)).toBeUndefined();
  });

  it('ignores unrelated params', () => {
    const params = new URLSearchParams('foo=bar');
    expect(getMaterialParam(params)).toBeUndefined();
  });
});

describe('buildMaterialParam', () => {
  it('builds a material=slug pair', () => {
    expect(buildMaterialParam('ldpe')).toBe('material=ldpe');
  });

  it('percent-encodes a slug with reserved characters', () => {
    expect(buildMaterialParam('a b')).toBe('material=a%20b');
  });
});
