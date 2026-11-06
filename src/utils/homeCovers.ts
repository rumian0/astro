import { getCollection } from 'astro:content'
import { getPostUrl } from './content'

export interface HomeCover {
  url: string
  cover: string
  title: string
}

/**
 * 首页「随机文章头图」候选集（构建期生成，客户端只负责随机挑一条）。
 *
 * 规则：
 *  - 只取已发布（draft !== true）且有 cover 的文章
 *  - 排除 .png：站内存在 5.1MB / 3.5MB 的 PNG 封面，拿来当整屏模糊背景太重
 *  - 按 cover 去重（多篇文章共用同一张图时只保留一条）
 *
 * 返回结构同时供 `/home-covers.json` 端点与页面使用，避免两处逻辑分叉。
 */
export async function getHomeCovers(): Promise<HomeCover[]> {
  const posts = await getCollection('posts', ({ data }) => data.draft !== true)
  const isLightWeight = (url: string) => /\.(webp|jpe?g|avif|gif)(\?|#|$)/i.test(url)

  const seen = new Set<string>()
  const covers: HomeCover[] = []

  for (const post of posts) {
    const cover = post.data.cover
    if (!cover || !isLightWeight(cover) || seen.has(cover)) continue
    seen.add(cover)
    covers.push({ url: getPostUrl(post), cover, title: post.data.title })
  }

  return covers
}
