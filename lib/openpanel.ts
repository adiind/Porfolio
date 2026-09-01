import type { OpenPanelOptions } from '@openpanel/web';
import { getAnalyticsPreference, type SanitizedAnalyticsProperties } from './analyticsPrivacy';

export interface OpenPanelRuntimeInput {
  clientId?: string;
  apiUrl?: string;
  enabledFlag?: string;
  testModeFlag?: string;
  isProd: boolean;
  pathname: string;
  optedOut: boolean;
}

export interface OpenPanelRuntimeConfig {
  enabled: boolean;
  replayEnabled: boolean;
  clientId?: string;
  apiUrl?: string;
}

interface OpenPanelClient {
  track(name: string, properties?: Record<string, unknown>): Promise<unknown> | void;
}

interface QueuedEvent {
  name: string;
  properties: SanitizedAnalyticsProperties;
}

let client: OpenPanelClient | null = null;
let initialization: Promise<void> | null = null;
let acceptsQueuedEvents = false;
const queuedEvents: QueuedEvent[] = [];

const isTrue = (value?: string) => value === 'true';
const isStudioPath = (pathname: string) => /^\/studio\/?$/.test(pathname);
const debugEnabled = () => import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

export function resolveOpenPanelRuntime(input: OpenPanelRuntimeInput): OpenPanelRuntimeConfig {
  const testMode = isTrue(input.testModeFlag);
  const enabled = Boolean(
    input.clientId
    && !input.optedOut
    && !isStudioPath(input.pathname)
    && (testMode || (input.isProd && isTrue(input.enabledFlag))),
  );

  return {
    enabled,
    replayEnabled: enabled,
    clientId: input.clientId,
    apiUrl: input.apiUrl,
  };
}

export function createOpenPanelOptions(runtime: OpenPanelRuntimeConfig): OpenPanelOptions {
  if (!runtime.clientId) throw new Error('OpenPanel client ID is required');

  return {
    clientId: runtime.clientId,
    ...(runtime.apiUrl ? { apiUrl: runtime.apiUrl } : {}),
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: false,
    trackHashChanges: true,
    filter: () => getAnalyticsPreference() === 'allowed',
    debug: debugEnabled(),
    sessionReplay: {
      enabled: runtime.replayEnabled,
      maskAllInputs: true,
      maskAllText: true,
      unmaskTextSelector: '[data-openpanel-unmask]',
    },
  };
}

const runtimeFromBrowser = (): OpenPanelRuntimeConfig => {
  if (typeof window === 'undefined') {
    return { enabled: false, replayEnabled: false };
  }

  return resolveOpenPanelRuntime({
    clientId: import.meta.env.VITE_OPENPANEL_CLIENT_ID,
    apiUrl: import.meta.env.VITE_OPENPANEL_API_URL,
    enabledFlag: import.meta.env.VITE_OPENPANEL_ENABLED,
    testModeFlag: import.meta.env.VITE_OPENPANEL_TEST_MODE,
    isProd: import.meta.env.PROD,
    pathname: window.location.pathname,
    optedOut: getAnalyticsPreference() === 'opted_out',
  });
};

const reportError = (label: string, error: unknown) => {
  if (debugEnabled()) console.warn(`[analytics] ${label}`, error);
};

const send = (event: QueuedEvent) => {
  try {
    void Promise.resolve(client?.track(event.name, event.properties)).catch((error: unknown) => {
      reportError(`OpenPanel event failed: ${event.name}`, error);
    });
  } catch (error) {
    reportError(`OpenPanel event failed: ${event.name}`, error);
  }
};

export function initializeOpenPanel(): Promise<void> {
  if (initialization) return initialization;

  const runtime = runtimeFromBrowser();
  acceptsQueuedEvents = runtime.enabled;
  if (!runtime.enabled) return Promise.resolve();

  initialization = import('@openpanel/web')
    .then(({ OpenPanel }) => {
      if (getAnalyticsPreference() === 'opted_out') return;
      client = new OpenPanel(createOpenPanelOptions(runtime));
      queuedEvents.splice(0).forEach(send);
    })
    .catch((error) => {
      acceptsQueuedEvents = false;
      queuedEvents.length = 0;
      reportError('OpenPanel initialization failed', error);
    });

  return initialization;
}

export function trackOpenPanelEvent(
  name: string,
  properties: SanitizedAnalyticsProperties,
): void {
  if (getAnalyticsPreference() === 'opted_out') return;
  const event = { name, properties };
  if (client) send(event);
  else if (acceptsQueuedEvents) queuedEvents.push(event);
}
