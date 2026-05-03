/// <reference types="vite/client" />

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
