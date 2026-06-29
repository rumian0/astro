import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEXO_POSTS = path.resolve(__dirname, '../../hexo/blog/shokax-can/source/_posts');
const ASTRO_BLOG = path.resolve(__dirname, '../src/data/blog');

if (!fs.existsSync(HEXO_POSTS)) {
  console.error(`Hexo posts directory not found: ${HEXO_POSTS}`);
  process.exit(1);
}

if (!fs.existsSync(ASTRO_BLOG)) {
  fs.mkdirSync(ASTRO_BLOG, { recursive: true });
}

const files = fs.readdirSync(HEXO_POSTS).filter(f => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(HEXO_POSTS, file), 'utf-8');
    // Try standard format: ---\n...\n---
    let match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    // Try alternative format: title: ...\n...\n-----\n
    if (!match && content.startsWith('title:')) {
      match = content.match(/^([\s\S]*?)\r?\n-----\r?\n?([\s\S]*)$/);
      if (!match) {
        // Some have ----- but with content before title: fields
        match = content.match(/^([\s\S]*?)\r?\n-----\r?\n?([\s\S]*)$/);
      }
    }

    if (!match) {
      continue;
    }

    const frontmatter = {};
    let body = match[2] || '';
    const lines = match[1].split('\n');
    let currentKey = null;

    for (const line of lines) {
      const keyMatch = line.match(/^(\w+):\s*(.*)/);
      const listMatch = line.match(/^\s*-\s*(.*)/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        const val = keyMatch[2].trim();
        frontmatter[currentKey] = val || [];
      } else if (listMatch && currentKey) {
        const arr = Array.isArray(frontmatter[currentKey]) ? frontmatter[currentKey] : [];
        arr.push(listMatch[1].trim());
        frontmatter[currentKey] = arr;
      }
    }

    const title = (frontmatter.title || file.replace('.md', '')).replace(/"/g, '\\"');
    const rawDate = frontmatter.date || new Date().toISOString();
    const pubDate = new Date(rawDate);
    const pubDatetime = pubDate.toISOString();
    const year = pubDate.getFullYear();
    const month = String(pubDate.getMonth() + 1).padStart(2, '0');
    const day = String(pubDate.getDate()).padStart(2, '0');
    const slug = file.replace('.md', '');

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    const desc = (frontmatter.descr || frontmatter.description || '').replace(/"/g, '\\"');

    const newFrontmatter = [
      '---',
      `title: "${title}"`,
      `pubDatetime: ${pubDatetime}`,
      `description: "${desc}"`,
      `tags: [${tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]`,
      'featured: false',
      'draft: false',
      '---',
      '',
      body.trim(),
    ].join('\n');

    const postDir = path.join(ASTRO_BLOG, String(year), month, day, slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.md'), newFrontmatter);

    const imgFolder = path.join(HEXO_POSTS, slug);
    if (fs.existsSync(imgFolder) && fs.statSync(imgFolder).isDirectory()) {
      const items = fs.readdirSync(imgFolder);
      for (const item of items) {
        const src = path.join(imgFolder, item);
        const dest = path.join(postDir, item);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
      let mdContent = fs.readFileSync(path.join(postDir, 'index.md'), 'utf-8');
      const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      mdContent = mdContent.replace(new RegExp(`\\(${escapedSlug}/`, 'g'), '(');
      fs.writeFileSync(path.join(postDir, 'index.md'), mdContent);
    }

    count++;
  } catch (err) {
    console.error(`✗ Error: ${file} - ${err.message}`);
  }
}

console.log(`\n✨ Migration complete! ${count} articles migrated`);
