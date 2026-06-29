import { execSync } from 'child_process';

console.log('🔨 Building...');
try {
  execSync('pnpm run build', { stdio: 'inherit' });
} catch {
  console.error('Build failed, aborting deploy.');
  process.exit(1);
}

console.log('\n📦 Staging files...');
execSync('git add -A', { stdio: 'inherit' });

const now = new Date();
const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

console.log('📝 Committing...');
try {
  execSync(`git commit -m "deploy: ${dateStr}"`, { stdio: 'inherit' });
} catch {
  console.log('Nothing to commit.');
  process.exit(0);
}

console.log('\n🚀 Pushing to GitHub...');
execSync('git push origin main', { stdio: 'inherit' });
console.log('\n✅ Deploy complete!');
