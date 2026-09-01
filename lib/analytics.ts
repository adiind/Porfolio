import { getAnalyticsPreference, sanitizeAnalyticsProperties, type AnalyticsScalar } from './analyticsPrivacy';
import { trackOpenPanelEvent } from './openpanel';

export type AnalyticsProperties = Record<string, AnalyticsScalar | null | undefined>;

export const trackEvent = (eventName: string, properties: AnalyticsProperties = {}) => {
  if (typeof window === 'undefined') return;
  if (getAnalyticsPreference() === 'opted_out') return;

  const payload = sanitizeAnalyticsProperties({
    path: window.location.pathname,
    ...properties,
  });

  trackOpenPanelEvent(eventName, payload);
  window.zaraz?.track?.(eventName, payload);
  window.posthog?.capture?.(eventName, payload);
  window.plausible?.(eventName, { props: payload });
  window.umami?.track?.(eventName, payload);

  if (import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
    console.info('[analytics]', eventName, payload);
  }
};
