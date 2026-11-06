import type { APIRoute } from 'astro'
import { getHomeCovers } from '@/utils/homeCovers'

/**
 * 首页随机头图候选清单。
 *
 * 为什么做成端点而不是内联在 HTML 里：
 *  - 胶囊是 Layout 级（Swup 容器之外）的全局悬浮组件，需要每页都能拿到候选；
 *    若把 9KB 清单内联进全部 215 个页面，纯属浪费。
 *  - 端点只在「真的在首页」时被 fetch 一次，之后走 HTTP 缓存 + 内存缓存。
 */
export const GET: APIRoute = async () => {
  const covers = await getHomeCovers()
  return new Response(JSON.stringify(covers), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
