# DiscipleJTMay

The Bible teaching site of Brother Justin May. Every page is hand-written HTML
with no build step, and the folder itself is what gets deployed.

## Preview locally

```
npx wrangler dev
```

Then open the address Wrangler prints (http://localhost:8787 by default).

**Use Wrangler, not a plain file open or a generic static server.** Internal
links point at clean URLs such as `/Through%20the%20Word%20-%20Genesis`, and
Cloudflare maps those paths onto the matching `.html` files when it serves the
site. Opening the pages from disk (`file://`) or serving the folder with
something like `python3 -m http.server` cannot do that mapping, so navigation
will 404 even though the files are all present. Wrangler runs the same asset
handling as production, so what you see locally is what the site does.

## Deploying

A push to `main` deploys through GitHub Actions, using
[.github/workflows/deploy.yml](.github/workflows/deploy.yml). The workflow runs
`node scripts/update-chapter-counts.mjs` first, which recounts the chapter pages
and refreshes the "N of M written" line on every book card of the Through the
Word index. If the counts changed, the workflow commits them back to `main`
before deploying, so the repository and the live site stay in step.

## Publishing a chapter

Create `Through the Word - <Book> <number>.html`. Unwritten chapters currently
link to `Through the Word - Coming Soon.html` with `?book=…&chapter=…`; point
that chapter's card at the new page, and the counts take care of themselves.
