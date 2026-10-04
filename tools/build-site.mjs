// Assembles the publishable site into _site/: the games index plus each game folder without its
// tests, and stamps the game's service worker with a version and the list of files to save offline.
// Usage: node tools/build-site.mjs [--version <id>] [--out <dir>]
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

function defaultVersion() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12);
  try {
    return execSync('git rev-parse --short=12 HEAD', { cwd: root }).toString().trim();
  } catch {
    return String(Date.now());
  }
}

const version = arg('version', defaultVersion());
const out = join(root, arg('out', '_site'));
const GAMES = ['straw-hat-showdown'];
const SKIP = new Set(['tests']);

async function listFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else files.push(full);
  }
  return files;
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'index.html'), join(out, 'index.html'));

for (const game of GAMES) {
  const src = join(root, game);
  const dest = join(out, game);
  const files = await listFiles(src);
  for (const file of files) {
    const target = join(dest, relative(src, file));
    await mkdir(join(target, '..'), { recursive: true });
    await cp(file, target);
  }
  const offline = files
    .map((f) => relative(src, f).split(sep).join('/'))
    .filter((f) => f !== 'sw.js')
    .sort();
  const sw = await readFile(join(src, 'sw.js'), 'utf8');
  const stamped = sw
    .replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`)
    .replace(/const FILES = \[[^\]]*\];/, `const FILES = ${JSON.stringify(['./', ...offline])};`);
  if (stamped === sw) throw new Error('sw.js placeholders not found');
  await writeFile(join(dest, 'sw.js'), stamped);
  const html = await readFile(join(dest, 'index.html'), 'utf8');
  await writeFile(join(dest, 'index.html'), html.replace('<html lang="en">', `<html lang="en" data-version="${version}">`));
  console.log(`${game}: ${offline.length} files, version ${version}`);
}
console.log(`site written to ${relative(root, out) || '.'}`);
