// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://zkmarek.com', // Set this to your production URL for proper Open Graph URLs
  integrations: [mdx()],
});
