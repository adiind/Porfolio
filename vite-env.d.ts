/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_DEBUG?: string;
  readonly VITE_OPENPANEL_API_URL?: string;
  readonly VITE_OPENPANEL_CLIENT_ID?: string;
  readonly VITE_OPENPANEL_ENABLED?: string;
  readonly VITE_OPENPANEL_TEST_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  zaraz?: {
    track?: (eventName: string, properties?: Record<string, string | number | boolean>) => void | Promise<void>;
  };
  posthog?: {
    capture?: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
  };
  plausible?: (
    eventName: string,
    options?: { props?: Record<string, string | number | boolean> }
  ) => void;
  umami?: {
    track?: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
  };
}
