import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zkmarek.com',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
