import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'editor', 'gallery', 'collection', 'login', 'register', 'admin', 'meme'];
export default defineConfig({
  build: { rollupOptions: { input: Object.fromEntries(pages.map(page => [page, resolve(import.meta.dirname, page + '.html')])) } },
});
