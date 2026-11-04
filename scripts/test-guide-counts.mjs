import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./sync-guide-counts.mjs', import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-count-test-'));
const guides = [
  ['rehber', '2 konuda çevre okuryazarlığı ve sürdürülebilir yaşam'],
  ['en/guide', '2 topics on environmental literacy and sustainable living'],
  ['de/ratgeber', '2 Themen zu Umweltkompetenz und nachhaltigem Leben']
];
try {
  for (const [dir] of guides) {
    const base = path.join(root, 'public', dir);
    fs.mkdirSync(base, { recursive: true });
    const prefix = '/' + dir + '/';
    const cards = ['first', 'second', 'draft'].map(slug =>
      '<a class="story" href="' + prefix + slug + '/">Article</a>').join('');
    fs.writeFileSync(path.join(base, 'index.html'),
      '<html><head><meta property="og:description" content="old"></head><body>' +
      '<div class="toolbar"><div><h2>Articles</h2><p>old count</p></div></div>' +
      cards + '</body></html>');
    for (const slug of ['first', 'second', 'draft']) {
      const target = path.join(base, slug);
      fs.mkdirSync(target);
      fs.writeFileSync(path.join(target, 'index.html'),
        '<meta name="robots" content="' + (slug === 'draft' ? 'noindex,follow' : 'index,follow') + '">');
    }
  }
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(run('--check').status, 1, 'stale counters must fail CI');
  const sync = run();
  assert.equal(sync.status, 0, sync.stderr);
  for (const [dir, expected] of guides) {
    const html = fs.readFileSync(path.join(root, 'public', dir, 'index.html'), 'utf8');
    assert.ok(html.includes(expected), dir + ': language-specific published count');
    assert.match(html, /<meta property="og:description" content="2 /);
  }
  assert.equal(run('--check').status, 0, 'synchronized counters must pass CI');
  const tr = path.join(root, 'public/rehber/index.html');
  fs.appendFileSync(tr, '<a class="story" href="/rehber/first/">duplicate</a>');
  assert.notEqual(run('--check').status, 0, 'duplicate cards must fail CI');
  console.log('Guide count regression tests passed');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
