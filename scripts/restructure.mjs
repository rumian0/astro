import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_BLOG = path.resolve(__dirname, '../src/data/blog');

function walkSlugDirs(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const children = fs.readdirSync(fullPath);
      if (children.includes('index.md')) {
        results.push(fullPath);
      } else {
        results.push(...walkSlugDirs(fullPath));
      }
    }
  }
  return results;
}

const slugDirs = walkSlugDirs(ASTRO_BLOG);
console.log(`Found ${slugDirs.length} article directories.`);

let moved = 0;
for (const srcDir of slugDirs) {
  const relative = path.relative(ASTRO_BLOG, srcDir);
  const segments = relative.split(path.sep);
  const slug = segments[segments.length - 1];
  const destDir = path.join(ASTRO_BLOG, slug);

  if (fs.existsSync(destDir)) {
    console.log(`✗ Skipping ${slug}: target already exists`);
    continue;
  }

  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    const s = path.join(srcDir, item);
    const d = path.join(destDir, item);
    fs.cpSync(s, d, { recursive: true });
  }
  console.log(`✓ ${relative} → ${slug}`);
  moved++;
}

console.log(`\n✨ Moved ${moved} directories. Cleaning up old structure...`);

// Remove old YYYY/MM/DD/slug directories and empty parents
for (const srcDir of slugDirs) {
  if (fs.existsSync(srcDir)) {
    fs.rmSync(srcDir, { recursive: true, force: true });
  }
}

// Remove empty date folders bottom-up
function removeEmptyParents(dir) {
  let changed = false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      if (removeEmptyParents(fullPath)) changed = true;
    }
  }
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0 && dir !== ASTRO_BLOG) {
    fs.rmdirSync(dir);
    return true;
  }
  return changed;
}

removeEmptyParents(ASTRO_BLOG);

// Verify
const final = fs.readdirSync(ASTRO_BLOG).filter(e => !e.startsWith('.'));
const articles = final.filter(e => {
  const p = path.join(ASTRO_BLOG, e);
  return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.md'));
});
console.log(`Final: ${final.length} top-level entries, ${articles.length} articles.`);
console.log('✨ Restructure complete!');
