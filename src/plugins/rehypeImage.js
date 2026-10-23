import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeImage() {
  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'p' && node.children.length === 1) {
        const child = node.children[0]
        if (child.tagName === 'img') {
          parent.children[index] = buildFigure(child)
        }
      } else if (node.tagName === 'img') {
        parent.children[index] = buildImage(node)
      }
    })
  }
}

function buildImage(node) {
  const imgProps = node.properties

  // class 标记文章图，运行时在 Layout.astro 的 initFancybox() 里补齐
  // data-fancybox / data-caption / data-src 三个属性。
  // 不用 data-* 是因为 Astro 的 Content 组件把 HAST properties 当 JSX props
  // 渲染时会把连字符驼峰化（data-fancybox → dataFancybox），Fancybox 的
  // [data-fancybox] 选择器匹配不到，点击就无反应。类名不受此影响。
  const existing = imgProps.className || ''
  const base = Array.isArray(existing) ? existing.join(' ') : String(existing).trim()
  const cls = base ? base + ' article-image-fancybox' : 'article-image-fancybox'

  return h('img', {
    ...imgProps,
    className: cls,
    loading: 'lazy',
  })
}

function buildFigure(node) {
  let imgAlt = node.properties.alt
  if (imgAlt) {
    imgAlt = imgAlt.trim()
  }

  return h('figure', null, [buildImage(node), imgAlt ? h('figcaption', imgAlt) : null])
}
