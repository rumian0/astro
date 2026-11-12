const fs = require('fs')
const p = 'src/content/posts/skills-recommend/index.md'
const s = fs.readFileSync(p, 'utf8')
const L = s.split(/\r?\n/)
const fence = String.fromCharCode(96, 96, 96)
L.forEach((l, i) => {
  if (l.trim().startsWith(fence)) console.log(i + 1, JSON.stringify(l))
})
