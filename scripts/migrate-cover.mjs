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
  console.error(`Astro blog directory not found: ${ASTRO_BLOG}`);
  process.exit(1);
}

function parseHexoFrontmatter(content) {
  const frontmatter = {};
  let match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match && content.startsWith('title:')) {
    match = content.match(/^([\s\S]*?)\r?\n-----\r?\n/);
  }
  if (!match) return frontmatter;

  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)/);
    const listMatch = line.match(/^\s*-\s*(.*)/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      frontmatter[currentKey] = keyMatch[2].trim();
    } else if (listMatch && currentKey) {
      const arr = Array.isArray(frontmatter[currentKey]) ? frontmatter[currentKey] : [frontmatter[currentKey]];
      arr.push(listMatch[1].trim());
      frontmatter[currentKey] = arr;
    }
  }
  return frontmatter;
}

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.name === 'index.md') {
      results.push(fullPath);
    }
  }
  return results;
}

const astroPosts = walkDir(ASTRO_BLOG);
let updatedCount = 0;

for (const astroFile of astroPosts) {
  try {
    const astroContent = fs.readFileSync(astroFile, 'utf-8');
    const astroMatch = astroContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!astroMatch) continue;
    if (astroMatch[1].includes('ogImage:')) continue;

    const relativePath = path.relative(ASTRO_BLOG, astroFile);
    const slug = relativePath.split(path.sep).slice(-2, -1)[0];
    const hexoFile = path.join(HEXO_POSTS, slug + '.md');

    if (!fs.existsSync(hexoFile)) continue;

    const hexoContent = fs.readFileSync(hexoFile, 'utf-8');
    const hexoFrontmatter = parseHexoFrontmatter(hexoContent);

    if (hexoFrontmatter.cover) {
      const coverUrl = hexoFrontmatter.cover.replace(/"/g, '\\"');
      const newContent = astroContent.replace(
        /^(draft: (?:true|false))/m,
        `$1\nogImage: "${coverUrl}"`
      );
      fs.writeFileSync(astroFile, newContent);
      console.log(`✓ ${slug} → ogImage: ${coverUrl}`);
      updatedCount++;
    }
  } catch (err) {
    console.error(`✗ Error processing ${astroFile}: ${err.message}`);
  }
}

console.log(`\n✨ Done! ${updatedCount} articles updated with ogImage from Hexo cover.`);
