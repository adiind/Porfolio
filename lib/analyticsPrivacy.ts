export type AnalyticsScalar = string | number | boolean;
export type SanitizedAnalyticsProperties = Record<string, AnalyticsScalar>;

export const ANALYTICS_OPT_OUT_KEY = 'portfolio_analytics_opt_out';

const DISALLOWED_PROPERTY_KEYS = new Set([
  'name',
  'first_name',
  'last_name',
  'full_name',
  'email',
  'message',
  'input',
  'text',
  'query',
  'search',
]);

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>;

const browserStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
};

export function sanitizeAnalyticsProperties(
  input: Record<string, unknown> = {},
): SanitizedAnalyticsProperties {
  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => {
      if (DISALLOWED_PROPERTY_KEYS.has(key.toLowerCase())) return false;
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    }),
  ) as SanitizedAnalyticsProperties;
}

export function getAnalyticsPreference(
  storage: ReadableStorage | undefined = browserStorage(),
): 'allowed' | 'opted_out' {
  if (!storage) return 'allowed';
  try {
    return storage.getItem(ANALYTICS_OPT_OUT_KEY) === 'true' ? 'opted_out' : 'allowed';
  } catch {
    return 'opted_out';
  }
}

export function setAnalyticsOptOut(
  value: boolean,
  storage: WritableStorage | undefined = browserStorage(),
): void {
  if (!storage) return;
  try {
    if (value) storage.setItem(ANALYTICS_OPT_OUT_KEY, 'true');
    else storage.removeItem(ANALYTICS_OPT_OUT_KEY);
  } catch {
    // Storage can be blocked by the browser. In that case the current page's
    // event boundary still checks the preference before every explicit event.
  }
}
