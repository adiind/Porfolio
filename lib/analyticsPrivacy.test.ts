import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_OPT_OUT_KEY,
  getAnalyticsPreference,
  sanitizeAnalyticsProperties,
  setAnalyticsOptOut,
} from './analyticsPrivacy';

const storageWith = (entries: Record<string, string> = {}) => ({
  getItem(key: string) {
    return entries[key] ?? null;
  },
  setItem(key: string, value: string) {
    entries[key] = value;
  },
  removeItem(key: string) {
    delete entries[key];
  },
});

describe('sanitizeAnalyticsProperties', () => {
  it('retains only scalar values', () => {
    expect(sanitizeAnalyticsProperties({
      id: 'glyph',
      count: 2,
      active: true,
      missing: null,
      absent: undefined,
      nested: { unsafe: true },
      list: ['unsafe'],
    })).toEqual({ id: 'glyph', count: 2, active: true });
  });

  it.each([
    'name',
    'NAME',
    'first_name',
    'last_name',
    'full_name',
    'email',
    'message',
    'input',
    'text',
    'query',
    'search',
  ])('drops the disallowed property key %s', (key) => {
    expect(sanitizeAnalyticsProperties({ id: 'safe', [key]: 'private' })).toEqual({ id: 'safe' });
  });
});

describe('analytics preference', () => {
  it('defaults to allowed and recognizes only the explicit opt-out value', () => {
    expect(getAnalyticsPreference(storageWith())).toBe('allowed');
    expect(getAnalyticsPreference(storageWith({ [ANALYTICS_OPT_OUT_KEY]: 'false' }))).toBe('allowed');
    expect(getAnalyticsPreference(storageWith({ [ANALYTICS_OPT_OUT_KEY]: 'true' }))).toBe('opted_out');
  });

  it('writes and removes the portfolio opt-out key', () => {
    const values: Record<string, string> = {};
    const storage = storageWith(values);

    setAnalyticsOptOut(true, storage);
    expect(values).toEqual({ [ANALYTICS_OPT_OUT_KEY]: 'true' });

    setAnalyticsOptOut(false, storage);
    expect(values).toEqual({});
  });

  it('fails closed when browser storage cannot be read', () => {
    const throwingStorage = {
      getItem() {
        throw new Error('blocked');
      },
    };

    expect(getAnalyticsPreference(throwingStorage)).toBe('opted_out');
  });
});
