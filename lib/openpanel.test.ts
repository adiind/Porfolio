import { describe, expect, it } from 'vitest';
import { createOpenPanelOptions, resolveOpenPanelRuntime } from './openpanel';

const baseInput = {
  clientId: 'portfolio-test',
  apiUrl: undefined,
  enabledFlag: 'true',
  testModeFlag: undefined,
  isProd: true,
  pathname: '/',
  optedOut: false,
};

describe('resolveOpenPanelRuntime', () => {
  it('enables configured public production collection', () => {
    expect(resolveOpenPanelRuntime(baseInput)).toEqual({
      enabled: true,
      replayEnabled: true,
      clientId: 'portfolio-test',
      apiUrl: undefined,
    });
  });

  it.each([
    ['missing client ID', { clientId: undefined }],
    ['disabled flag', { enabledFlag: undefined }],
    ['development build', { isProd: false }],
    ['Studio route', { pathname: '/studio' }],
    ['Studio route with slash', { pathname: '/studio/' }],
    ['visitor opt-out', { optedOut: true }],
  ])('disables collection for %s', (_label, override) => {
    expect(resolveOpenPanelRuntime({ ...baseInput, ...override }).enabled).toBe(false);
  });

  it('allows controlled local verification only in explicit test mode', () => {
    expect(resolveOpenPanelRuntime({
      ...baseInput,
      enabledFlag: undefined,
      isProd: false,
      testModeFlag: 'true',
    }).enabled).toBe(true);
  });
});

describe('createOpenPanelOptions', () => {
  it('enables screen views, outbound links, and fully masked replay', () => {
    const runtime = resolveOpenPanelRuntime(baseInput);

    expect(createOpenPanelOptions(runtime)).toMatchObject({
      clientId: 'portfolio-test',
      trackScreenViews: true,
      trackOutgoingLinks: true,
      trackAttributes: false,
      trackHashChanges: true,
      sessionReplay: {
        enabled: true,
        maskAllInputs: true,
        maskAllText: true,
        unmaskTextSelector: '[data-openpanel-unmask]',
      },
    });
  });
});
