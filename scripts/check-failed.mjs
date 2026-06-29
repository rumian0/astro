import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEXO_POSTS = path.resolve(__dirname, '../../hexo/blog/shokax-can/source/_posts');

const files = fs.readdirSync(HEXO_POSTS).filter(f => f.endsWith('.md'));

for (const file of files) {
  const content = fs.readFileSync(path.join(HEXO_POSTS, file), 'utf-8');
  if (!content.startsWith('---')) {
    console.log(`NO_DELIM: ${file}`);
    continue;
  }
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    console.log(`NO_MATCH: ${file} (len=${content.length}, starts=${content.slice(0,20).replace(/\n/g,'\\n').replace(/\r/g,'\\r')})`);
  }
}
