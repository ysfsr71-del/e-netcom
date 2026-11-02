/** Offline SEO audit for Green Guide article sources. No network calls. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const host = 'https://enetcomproject.com';
const folders = ['rehber', 'en/guide', 'de/ratgeber'];
const issues = [];
const pages = [];
const note = (level, code, page, detail) => issues.push({ level, code, page, detail });
const getCanonical = html => html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
const getLinks = html => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1]);

for (const folder of folders) {
  const base = path.join(root, folder);
  if (!fs.existsSync(base)) { note('error', 'missing-directory', folder, 'Guide directory missing'); continue; }
  for (const item of fs.readdirSync(base, { withFileTypes: true })) {
    if (!item.isDirectory() || item.name === 'assets') continue; // asset folders are not articles
    const page = '/' + folder + '/' + item.name + '/';
    const file = path.join(base, item.name, 'index.html');
    if (!fs.existsSync(file)) { note('error', 'missing-index', page, 'index.html missing'); continue; }
    const html = fs.readFileSync(file, 'utf8');
    const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
    const expected = host + page;
    const canonical = getCanonical(html);
    const body = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = body ? body.split(' ').length : 0;
    pages.push({ page, noindex, words });
    if (canonical !== expected) note('error', 'canonical-mismatch', page, 'Expected ' + expected + '; got ' + (canonical || '(missing)'));
    if (!/<title>[^<]+<\/title>/i.test(html) || !/<meta name="description"/i.test(html)) note('warning', 'missing-title-or-description', page, 'Title or description absent');
    if (!noindex && words < 350) note('warning', 'thin-indexable-content', page, String(words) + ' approximate words');
    if (noindex) note('info', 'noindex-draft', page, 'Not yet eligible for indexing');
    if (!/property="og:title"/.test(html)) note('warning', 'missing-og-title', page, 'Open Graph title missing');
    if (!/name="twitter:card"/.test(html)) note('warning', 'missing-twitter-card', page, 'Twitter card missing');
    if (!/"@type"\s*:\s*"Article"/.test(html)) note('warning', 'missing-article-schema', page, 'Article schema missing');
    if (!/hreflang=/.test(html)) note('warning', 'missing-hreflang', page, 'Language alternates missing');
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt=/.test(match[0])) note('warning', 'missing-image-alt', page, match[0].slice(0, 120));
      if (!/\bwidth=/.test(match[0]) || !/\bheight=/.test(match[0])) note('warning', 'missing-image-dimensions', page, match[0].slice(0, 120));
    }
    for (const link of getLinks(html)) {
      if (!/^\/(rehber|en\/guide|de\/ratgeber)\//.test(link)) continue;
      const target = link.split(/[?#]/)[0];
      if (!fs.existsSync(path.join(root, target.slice(1), 'index.html'))) note('error', 'broken-guide-link', page, target);
    }
  }
}
// Source-only card image checks: duplicates are verifiable, HTTP availability is not.
for (const folder of folders) {
  const file = path.join(root, folder, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const used = new Map();
  const cards = [...html.matchAll(/<a class="story[^"]*" href="([^"]+)"[^>]*>\s*<div class="visual">\s*<img\b([^>]*)>/gi)];
  for (const [, link, attrs] of cards) {
    const src = attrs.match(/\bsrc="([^"]+)"/i)?.[1]?.replaceAll('&amp;', '&');
    if (!src) { note('warning', 'missing-card-image', link, 'Card has no image src'); continue; }
    const identity = src.split('?')[0];
    if (used.has(identity)) note('warning', 'duplicate-card-photo', link, 'Same image as ' + used.get(identity));
    else used.set(identity, link);
    if (!/\bwidth="\d+"/i.test(attrs) || !/\bheight="\d+"/i.test(attrs)) note('warning', 'missing-card-dimensions', link, 'Width or height missing');
    const fallback = attrs.match(/onerror="[^"]*this\.src='([^']+)'/i)?.[1]?.replaceAll('&amp;', '&');
    if (fallback && fallback.split('?')[0] === identity) note('warning', 'ineffective-image-fallback', link, 'Fallback uses the same image identity');
  }
  if (cards.some(([, , attrs]) => /\bsrc="https?:\/\//i.test(attrs))) {
    note('info', 'external-card-images-unverified', '/' + folder + '/', 'HTTP status, subject relevance and licensing require separate live checks');
  }
}
const sitemap = path.join(root, 'sitemap.xml');
if (!fs.existsSync(sitemap)) note('error', 'missing-sitemap', '/sitemap.xml', 'Sitemap absent');
else {
  const xml = fs.readFileSync(sitemap, 'utf8');
  const listed = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&')));
  for (const p of pages) {
    if (p.noindex && listed.has(host + p.page)) note('error', 'noindex-in-sitemap', p.page, 'Noindex URL in sitemap');
    if (!p.noindex && !listed.has(host + p.page)) note('warning', 'indexable-not-in-sitemap', p.page, 'Indexable URL not in sitemap');
  }
}
const counts = Object.fromEntries(['error', 'warning', 'info'].map(level => [level, issues.filter(x => x.level === level).length]));
const report = { scope: 'offline-source-only', checkedPages: pages.length, counts, pages, issues, limitations: ['External image URLs not checked', 'No browser layout test', 'No LCP/INP/CLS or PageSpeed', 'No Google Search Console evidence'] };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log('Guide source SEO: ' + pages.length + ' pages; ' + counts.error + ' errors, ' + counts.warning + ' warnings, ' + counts.info + ' info');
  for (const i of issues.filter(x => x.level === 'error')) console.log('ERROR ' + i.code + ' ' + i.page + ': ' + i.detail);
}
if (process.argv.includes('--strict') && counts.error) process.exitCode = 1;
