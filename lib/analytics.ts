type AnalyticsValue = string | number | boolean;
export type AnalyticsProperties = Record<string, AnalyticsValue | null | undefined>;

const cleanProperties = (properties: AnalyticsProperties = {}) => {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== null && value !== undefined)
  ) as Record<string, AnalyticsValue>;
};

export const trackEvent = (eventName: string, properties: AnalyticsProperties = {}) => {
  if (typeof window === 'undefined') return;

  const payload = cleanProperties({
    path: window.location.pathname,
    ...properties,
  });

  window.zaraz?.track?.(eventName, payload);
  window.posthog?.capture?.(eventName, payload);
  window.plausible?.(eventName, { props: payload });
  window.umami?.track?.(eventName, payload);

  if (import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
    console.info('[analytics]', eventName, payload);
  }
};
