// School library publication gate. Run: node scripts/check-school-library-publication.mjs
// Exit nonzero until all three articles are safely indexable and discoverable.
import { readFileSync, existsSync } from 'node:fs';
const origin = 'https://enetcomproject.com';
const pages = [
  ['tr','rehber/okul-esya-kutuphanesi/','rehber/index.html'],
  ['en','en/guide/school-library-of-things/','en/guide/index.html'],
  ['de','de/ratgeber/schulische-leihbibliothek/','de/ratgeber/index.html']
];
const sitemapPath = 'public/sitemap.xml';
const sitemap = readFileSync(sitemapPath,'utf8');
const errors = [];
for (const [lang,slug,listing] of pages) {
  const path = 'public/'+slug+'index.html';
  if (!existsSync(path)) { errors.push(lang+': missing article '+path); continue; }
  const html = readFileSync(path,'utf8');
  const index = readFileSync('public/'+listing,'utf8');
  const url = origin+'/'+slug;
  if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(lang+': article is noindex');
  if (!html.includes('rel="canonical" href="'+url+'"')) errors.push(lang+': canonical missing');
  if (!index.includes('/'+slug)) errors.push(lang+': listing card missing');
  if (!sitemap.includes('<loc>'+url+'</loc>')) errors.push(lang+': sitemap URL missing');
  for (const [other,otherSlug] of pages) {
    if (!html.includes('hreflang="'+other+'" href="'+origin+'/'+otherSlug+'"')) errors.push(lang+': missing reciprocal hreflang '+other);
  }
  for (const marker of ['"@type":"Article"','"@type":"BreadcrumbList"','property="og:image"','name="twitter:card"','<h1','<img']) {
    if (!html.includes(marker)) errors.push(lang+': missing '+marker);
  }
}
if (errors.length) {
  console.error('School library NOT publication-ready:\n'+errors.map(x=>' - '+x).join('\n'));
  process.exitCode = 1;
} else {
  console.log('School library publication gate passed for TR/EN/DE (static checks only; editorial and live HTTP QA still required).');
}
