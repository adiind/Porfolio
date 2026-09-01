import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const viteConfig = read('vite.config.ts');

const requireSource = (condition, message) => {
  if (!condition) throw new Error(message);
};

const openPanelBranch = viteConfig.indexOf("id.includes('@openpanel')");
const catchAllVendor = viteConfig.indexOf("return 'vendor';");

if (openPanelBranch < 0 || catchAllVendor < 0 || openPanelBranch > catchAllVendor) {
  throw new Error('vite.config.ts must isolate @openpanel before the catch-all vendor chunk');
}

if (!viteConfig.includes("id.includes('@rrweb')") || !viteConfig.includes("id.includes('/rrweb')")) {
  throw new Error('vite.config.ts must keep OpenPanel replay dependencies out of the eager vendor chunk');
}

if (!viteConfig.slice(openPanelBranch, catchAllVendor).includes('return undefined;')) {
  throw new Error('vite.config.ts must let Rollup preserve the OpenPanel dynamic-import boundary');
}

const openPanel = read('lib/openpanel.ts');
requireSource(openPanel.includes("import('@openpanel/web')"), 'OpenPanel must initialize behind a dynamic import');
requireSource(openPanel.includes('maskAllInputs: true'), 'Session replay must mask all inputs');
requireSource(openPanel.includes('maskAllText: true'), 'Session replay must mask page text by default');
requireSource(openPanel.includes("pathname: window.location.pathname"), 'OpenPanel must evaluate the current pathname');
requireSource(openPanel.includes("getAnalyticsPreference() === 'opted_out'"), 'OpenPanel must honor analytics opt-out');

const analytics = read('lib/analytics.ts');
requireSource(analytics.includes("getAnalyticsPreference() === 'opted_out'"), 'The shared event boundary must honor analytics opt-out');
requireSource(analytics.includes('sanitizeAnalyticsProperties'), 'The shared event boundary must sanitize properties');

const projectDetail = read('components/ProjectDetail.tsx');
requireSource(projectDetail.includes("trackEvent('project_opened'"), 'The canonical project detail must emit project_opened');
requireSource(projectDetail.includes("contentType: 'project'"), 'The canonical project detail must time engagement');

const projectHosts = [
  'components/ProjectsSection.tsx',
  'components/ExperienceDetail.tsx',
  'components/MobileTimeline.tsx',
  'components/TinkerVerseModal.tsx',
];
for (const path of projectHosts) {
  const source = read(path);
  const projectDetailCalls = [...source.matchAll(/<ProjectDetail[\s\S]*?\/>/g)];
  requireSource(projectDetailCalls.length > 0, `${path} must render its project detail through the canonical wrapper`);
  requireSource(
    projectDetailCalls.every(([call]) => call.includes('analyticsSource=')),
    `${path} must label every ProjectDetail analytics source`,
  );
}

const experienceDetail = read('components/ExperienceDetail.tsx');
requireSource(experienceDetail.includes("trackEvent('experience_opened'"), 'Desktop experience details must emit experience_opened');
requireSource(experienceDetail.includes("contentType: 'experience'"), 'Desktop experience details must time engagement');

const mobileTimeline = read('components/MobileTimeline.tsx');
requireSource(mobileTimeline.includes("trackEvent('experience_opened'"), 'Mobile inline experiences must emit experience_opened');
requireSource(mobileTimeline.includes("contentType: 'experience'"), 'Mobile inline experiences must time engagement');

console.log('OpenPanel analytics source verification passed.');
