// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// Static-first: every page is prerendered HTML. Only /api/* runs as serverless functions.
// Deploys to Netlify or Vercel unchanged: Netlify sets NETLIFY=true during its builds.
export default defineConfig({
  site: 'https://lakesareaaviation.com',
  output: 'static',
  adapter: process.env.NETLIFY ? netlify() : vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes('/api/') })],
  compressHTML: true,
  image: { responsiveStyles: true },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
