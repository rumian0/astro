const fs = require('fs')
const p = 'src/content/posts/skills-recommend/index.md'
const s = fs.readFileSync(p, 'utf8')
const nl = s.includes('\r\n') ? '\r\n' : '\n'
const L = s.split(nl)
const fence = String.fromCharCode(96, 96, 96)

if (L[0].trim() !== fence || L[9].trim() !== fence) {
  console.error('ABORT: unexpected layout', JSON.stringify([L[0], L[9]]))
  process.exit(1)
}
L[0] = '---'
L[9] = '---'
fs.writeFileSync(p, L.join(nl), 'utf8')
console.log('fixed: line1 -> ---, line10 -> ---')
console.log('newline:', JSON.stringify(nl))
