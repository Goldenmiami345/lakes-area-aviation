// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Static-first: every page is prerendered HTML. Only /api/* runs on Vercel functions.
export default defineConfig({
  site: 'https://lakesareaaviation.com',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes('/api/') })],
  compressHTML: true,
  image: { responsiveStyles: true },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
