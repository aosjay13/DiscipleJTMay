#!/usr/bin/env node
/**
 * Keeps the "N of M written" line on the Through the Word index in step with
 * the chapter pages that actually exist.
 *
 * A chapter page is any file named  "Through the Word - <Book> <number>.html".
 * Run from the project root:
 *
 *   node scripts/update-chapter-counts.mjs
 *
 * Safe to run as often as you like: it rewrites only the numbers that differ.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INDEX_FILE = 'Through the Word.html';
const root = process.cwd();

/** Book name -> how many chapter pages exist for it. */
function chapterCounts(files) {
  const counts = new Map();
  for (const file of files) {
    const match = file.match(/^Through the Word - (.+) (\d+)\.html$/);
    if (!match) continue;
    const book = match[1];
    counts.set(book, (counts.get(book) || 0) + 1);
  }
  return counts;
}

const counts = chapterCounts(await readdir(root));
const path = resolve(root, INDEX_FILE);
const lines = (await readFile(path, 'utf8')).split('\n');

let book = null;
let total = 0;
let cards = 0;
const changes = [];
const booksOnIndex = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const name = line.match(/<span class="book-name">([^<]+)<\/span>/);
  if (name) {
    book = name[1];
    booksOnIndex.add(book);
  }

  const meta = line.match(/<span class="book-meta">(\d+) Chapters?<\/span>/);
  if (meta) total = Number(meta[1]);

  const progress = line.match(/(<span class="book-progress">)(\d+) of (\d+)( written<\/span>)/);
  if (!progress) continue;

  if (!book) throw new Error(`${INDEX_FILE}:${i + 1}: progress line with no book above it`);
  if (!total) throw new Error(`${INDEX_FILE}:${i + 1}: progress line for ${book} with no chapter total above it`);

  cards++;
  const written = counts.get(book) || 0;
  if (written > total) {
    throw new Error(`${book}: ${written} chapter pages exist, but the card says ${total} chapters`);
  }

  const replacement = `${progress[1]}${written} of ${total}${progress[4]}`;
  if (progress[0] === replacement) continue;

  changes.push(`${book}: now ${written} of ${total}`);
  lines[i] = line.replace(progress[0], replacement);
}

await writeFile(path, lines.join('\n'));

if (changes.length) {
  console.log(`updated ${changes.length} of ${cards} book cards:`);
  for (const change of changes) console.log(`  ${change}`);
} else {
  console.log(`all ${cards} book cards already up to date`);
}

for (const bookName of counts.keys()) {
  if (!booksOnIndex.has(bookName)) {
    console.warn(`warning: chapter pages for "${bookName}" exist, but the index has no card for it`);
  }
}
