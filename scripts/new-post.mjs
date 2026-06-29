import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_BLOG = path.resolve(__dirname, '../src/data/blog');

const title = process.argv[2];
if (!title) {
  console.error('Usage: node scripts/new-post.mjs "文章标题"');
  process.exit(1);
}

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');

const slug = title
  .toLowerCase()
  .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  .replace(/^-|-$/g, '');

const pubDatetime = new Date(
  Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
).toISOString();

const postDir = path.join(ASTRO_BLOG, String(year), month, day, slug);
fs.mkdirSync(postDir, { recursive: true });

const template = [
  '---',
  `title: "${title}"`,
  `pubDatetime: ${pubDatetime}`,
  'description: ""',
  'tags: []',
  'featured: false',
  'draft: false',
  '---',
  '',
  '',
].join('\n');

const filePath = path.join(postDir, 'index.md');
fs.writeFileSync(filePath, template);
console.log(`\n✨ Created: ${filePath}\n`);
