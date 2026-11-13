#!/usr/bin/env node
/**
 * Writes sitemap.xml from the pages that actually exist in this folder.
 *
 * Cloudflare serves HTML files at their clean path (no .html), so the sitemap
 * lists those clean URLs, which are the ones the site links to. Chapter pages
 * that have not been written yet have no file, so they never appear here.
 *
 * Run from the project root:
 *
 *   node scripts/generate-sitemap.mjs
 */

import { readdir, writeFile } from 'node:fs/promises';

const ORIGIN = 'https://disciplejtmay.jtmay3.workers.dev';
const OUTPUT = 'sitemap.xml';

// Not pages anyone should land on from a search result.
const EXCLUDED = new Set([
  '404.html',
  'Through the Word - Coming Soon.html',
]);

const files = (await readdir(process.cwd()))
  .filter(file => file.endsWith('.html') && !EXCLUDED.has(file))
  .sort((a, b) => a.localeCompare(b));

const urls = files.map(file => {
  if (file === 'index.html') return `${ORIGIN}/`;
  const path = file.slice(0, -'.html'.length);
  // Commas are legal in a path but Cloudflare redirects the raw form, so the
  // canonical URL the site serves is the percent-encoded one.
  const encoded = encodeURI(path).replace(/&/g, '%26').replace(/,/g, '%2C');
  return `${ORIGIN}/${encoded}`;
});

// The home page leads, then everything else alphabetically.
urls.sort((a, b) => (a === `${ORIGIN}/` ? -1 : b === `${ORIGIN}/` ? 1 : 0));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(url => `  <url>\n    <loc>${url.replace(/&/g, '&amp;')}</loc>\n  </url>\n`).join('') +
  '</urlset>\n';

await writeFile(OUTPUT, xml);
console.log(`wrote ${OUTPUT} with ${urls.length} pages`);
