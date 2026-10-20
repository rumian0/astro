# astro-gyoza — Astro 博客主题迁移项目

基于 Astro 4 + React 18 + Tailwind CSS 的静态博客主题。从旧版 Astro 博客迁移至本主题。

## 角色定位

你是**高级 Astro 设计师**，同时也是**爱折腾的博主**。对 Astro、React、Tailwind CSS 生态非常熟悉，追求代码整洁、性能优化和用户体验。

## 核心约束（必读）

### 只读规则

- **只能修改 `astro-gyoza/` 目录下的文件**
- `astro-gyoza/` 之外的所有文件（包括父目录 `opencode/` 下的其他文件和目录）**均为只读，禁止修改**
- 需要参考旧代码时，读取后告知我内容，但**绝不修改**

### 确认规则

- **每次修改文件前必须先向我确认**，说明要改什么、为什么改、怎么改
- 我确认后你才能执行修改

## 技术栈

- 框架：Astro 4
- 前端：React 18、TypeScript、Tailwind CSS 3
- 动画：Framer Motion、Swup
- 状态管理：Jotai
- 评论：Twikoo + Waline 双系统（评论区胶囊切换器 + 记忆选择，均本地化）
- 搜索：Pagefind
- 数学公式：KaTeX
- 包管理：pnpm

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本（含类型检查和 Pagefind 索引）
pnpm preview      # 预览生产构建
pnpm lint         # Prettier 格式化
pnpm new-post     # 创建新文章
pnpm new-project  # 创建新项目
pnpm new-friend   # 添加友链
```

## 项目结构

```
astro-gyoza/
├── src/
│   ├── assets/        # 静态资源（图片等）
│   ├── components/    # 可复用组件（React + Astro）
│   ├── content/       # Markdown 内容（文章、项目等）
│   ├── hooks/         # React 自定义 Hooks
│   ├── layouts/       # 页面布局
│   ├── pages/         # 路由页面
│   ├── plugins/       # Astro 插件（remark/rehype）
│   ├── store/         # Jotai 状态管理
│   ├── styles/        # 全局样式
│   └── utils/         # 工具函数
├── public/            # 公共静态资源
└── scripts/           # Node 脚本
```

## 编码规范

- 使用 pnpm，禁止 npm/yarn
- 组件文件使用 `.astro` 或 `.tsx`/`.jsx` 扩展名
- 路径别名 `@/*` 映射到 `src/*`
- 提交信息使用 conventional commits 格式

## 注意事项

- 修改 `src/config.json`（站点配置）前必须确认
- 修改 `astro.config.js` 前必须确认
- 修改 `package.json`（依赖变更）前必须确认
- 迁移过程中不删除旧文件，只新增或修改本目录内文件

## 迁移记录

### 2026-10-10 - 页底仓库地址更新 + 搜索框首包慢优化（preload hint + hover 预加载）

**背景：** 两个诉求：①新博客主题已开源到 `rumian0/astro-mingcy`，页底「Designed by MingCY」的 GitHub 链接还指向旧仓库 `rumian0/astro`，让访客去新仓库拿同款模板；②每次打开搜索框都很慢，跟之前 CDN 版不一样。

**搜索慢的根因：** `SearchModal.astro` 是「点搜索按钮才注入 `pagefind-ui.js`」的懒加载，首次点击要走完整链路：

```
click #search-btn
  → modal.show()
  → document.createElement('script') src=/pagefind/pagefind-ui.js   [163 KB]
  → script.onload → new PagefindUI({...})
      → fetch /pagefind/pagefind-entry.json                          [214 B]
      → fetch /pagefind/wasm.unknown.pagefind                        [68 KB]
      → fetch /pagefind/index/zh-cn_*.pf_index (按需)                 [~35 KB × N]
  → 用户输入关键词
      → fetch /pagefind/fragment/zh-cn_*.pf_fragment (按需)           [数十 KB]
```

`initialized=true` 是闭包变量，页面刷新一次才重置；Swup 切页也不重跑（`data-swup-ignore-script` 已加）→ 同一会话第二次打开应该秒开。用户反馈「每次都很慢」的大概率是：**每次浏览器刷新**（硬刷新、离开再回来）都是首次加载，163 KB script 冷启动 300–1000ms。「跟之前不一样」——之前是 CDN（jsDelivr）预热过的国内节点快，改本地后走自己服务器带宽。

**修改文件：**

- `src/components/footer/Footer.astro`（页底链接）
- `src/data/projects.ts`（「博客」卡片 codeUrl）
- `src/layouts/Layout.astro`（head 加 preload hint）
- `src/components/header/SearchModal.astro`（hover 预加载 + loading 指示器）

**改动内容：**

1. **页底 + 项目卡仓库地址**：`https://github.com/rumian0/astro` → `https://github.com/rumian0/astro-mingcy`（Footer 页底 1 处 + projects.ts 「博客」卡片 1 处）。`projects.ts` 里 `rumian0/liaotian`（笔记项目）未动，那是独立仓库。

2. **Layout head 加 preload hint**：在 `pagefind-ui.css` 后面插一行

   ```html
   <link rel="preload" href="/pagefind/pagefind-ui.js" as="script" fetchpriority="low" />
   ```

   浏览器在 head 解析时就开始低优先级下载 163 KB 的 `pagefind-ui.js`，`fetchpriority="low"` 不抢首屏带宽。SearchModal 后来注入 `<script src="...">` 时命中 HTTP 缓存，onload 立即触发 → 用户点搜索时 script 通常已就绪。

3. **SearchModal 加 hover 预加载 + loading 指示器**：
   - **hover 预加载**：`btn.addEventListener('mouseenter', preload)` 在鼠标悬停搜索按钮时就注入 `pagefind-ui.js` script，等 click 时脚本基本就绪。移动端无 hover，用 `matchMedia('(hover:hover) and (pointer:fine)')` 守卫，避免触屏设备挂无效监听
   - **loading 指示器**：`open()` 里若 script 未就绪（`typeof PagefindUI === 'undefined'`）先 `showLoading()` 显示 spinner，script onload 后 `doInit()` → `hideLoading()`；用户看到「正在加载搜索…」而不是空白卡住，主观感受「快」很多
   - **双状态变量**：`initialized`（PagefindUI 实例已建）+ `scriptLoading`（script 已注入但未 onload）区分两种状态，避免重复加载。preload 的 onload 里把 `scriptLoading=false` 但不 `doInit()`——保持懒加载语义（用户没点搜索就不 new PagefindUI）
   - **错误降级**：script onload 后 `PagefindUI` 仍 undefined、或 onload 未触发 → `hideLoading()` + `showError()` 显示「搜索加载失败，请刷新重试」（原代码静默失败，用户看到空白面板不知为何）
   - **spinner CSS**：16×16 圆环，`border:2px solid border-primary` + `border-top-color: accent` + `animation: search-spin 0.8s linear infinite`；`@media (prefers-reduced-motion: reduce)` 下降级为静态环（`animation:none` + `border-top-color: border-primary`）
   - **HTML 结构**：`<div id="search"></div>` 后面加两个 `data-loading` / `data-loading-error` 的 hidden 层，PagefindUI 渲染真实 UI 到 `#search` 后这两层被隐藏（PagefindUI 会覆盖整个 `#search` 子树，`#search` 外的 loading 层不受影响）

**验证：** `astro check` 114 files / 0 errors / 0 warnings / 0 hints；`astro build` 213 pages Complete（133s）。dist 核验：`dist/index.html` 含 `rel="preload"` + `fetchpriority="low"` + `pagefind-ui.js` 各 1 处；含 `search-modal__spinner` / `search-modal__loading` 各 1 处；含 `mouseenter.*preload` 监听 1 处；`dist/projects/index.html` 含 `github.com/rumian0/astro-mingcy` 1 处、`github.com/rumian0/liaotian` 1 处（独立仓库未动）；页底 `Designed by <a href="https://github.com/rumian0/astro-mingcy">MingCY</a>` 正确。

**注意：**

- ① preload hint 让**每个访问者**都会下载 163 KB 的 `pagefind-ui.js`（即使从不搜索）。`fetchpriority="low"` 保证不抢首屏，但对从不搜索的用户是纯浪费。要完全零浪费只能走「仅 hover 预加载」的方案 A，本次选了 A+B 双保险换取「几乎所有用户秒开」
- ② hover 预加载只在 `mouseenter` 触发，**触屏设备不生效**（`matchMedia('(hover:hover) and (pointer:fine)')` 返回 false）。触屏用户的冷启动仍靠 preload hint 的后台预取，理论上也会秒开
- ③ `data-loading` 层在 PagefindUI 初始化后由 `hideLoading()` 主动隐藏。若 script 加载成功但 `new PagefindUI` 抛错（如索引未生成），loading 仍会被隐藏、`#search` 保持空——此时用户看到空面板，属预期降级
- ④ 索引规模当前不大（`index/*.pf_index` 共 208 KB、`fragment/*.pf_fragment` 共 384 KB、wasm 68 KB），首次搜索关键词时按需拉分片。若日后文章数暴涨（>300 篇），fragment 分片会变大，首次搜索仍可能慢——那时考虑改方案 D（`pagefind-modular-ui.js` 21 KB + 自建面板）
- ⑤ 本次只优化了「首次打开慢」，**每次搜索关键词拉 fragment 分片**的延迟未处理（Pagefind 走 HTTP 缓存，同一关键词第二次秒出，不同关键词首次仍要下载该分片）。若用户反馈仍慢，下一步是加 `Fragment` 预热（打开 modal 时主动 fetch 几个热门 fragment）

### 2026-10-09 00:00 - 随机壁纸性能重构：纯色占位 + Service Worker 跨刷新 SWR 缓存

**背景：** 用户反馈加随机图后网站速度非常慢。要求：①图片未加载完前用黑白纯色背景（即没加随机图之前的背景）；②图片彻底加载完毕后才显示壁纸；③缓存一张背景图，刷新时展示缓存的图（第二张）。

**慢的根因：** `Layout.astro` 壁纸脚本用 `var url = 'https://webp.mingcy.cn?v=' + Date.now()` —— `?v=timestamp` 是缓存杀手，URL 每次刷新都不同，浏览器 HTTP 缓存按 URL 匹配 → **每次刷新都重新下载一整张 1–2MB 的 webp**。这是「刷新就慢」的直接原因。

**CORS 硬限制（决定方案）：** `webp.mingcy.cn` 实测**完全不返回 `Access-Control-Allow-Origin`**（带不带 Origin 头都没有）。浏览器同源策略下 `fetch()` / canvas 都拿不到跨域图片字节 → **IndexedDB 存 Blob 方案不可行**。

**最终方案：Service Worker + Cache API + Stale-While-Revalidate + 固定 KEY**（唯一不需要服务端 CORS 配合的跨域图片缓存方案）：

- SW 用 `fetch(request, {mode:'no-cors'})` 拿 **opaque response** —— JS 读不到内容，但 `new Image` / CSS `url()` 能渲染，`cache.put` 能存；这是 opaque response 的关键特性
- **固定 KEY** `'https://webp.mingcy.cn/__bg_cache__'`（不是真实 URL，仅作 cache 槽位标识）忽略 `?v=timestamp` 参数 → 跨刷新复用同一份缓存
- **SWR 流程**：首次访问无缓存走网络（慢，必然）；之后每次刷新 SW 命中缓存秒开返回 + 后台 `fetch` 新图覆盖固定 KEY；下次刷新返回上次后台更新的图（即「第二张」）→ 正好对应用户「刷新展示第二张图」语义
- 只拦截 `webp.mingcy.cn`，其他请求一律放行（`if (url.hostname !== BG_HOST) return`）

**修改文件：** `public/sw.js`（新建）、`src/layouts/Layout.astro`、`src/styles/global.css`

**① `public/sw.js`（新建，2916 B）：**

- `install` → `skipWaiting()`；`activate` → 清旧缓存 + `clients.claim()`
- `fetch` 事件：`new URL(e.request.url).hostname !== 'webp.mingcy.cn'` 直接 return 放行
- `handleBg(e)`：`caches.open(CACHE).match(BG_KEY)` 取缓存；后台 `fetch(e.request, {mode:'no-cors', cache:'no-store'})` 更新固定 KEY（`cache: 'no-store'` 确保后台更新真正请求网络、不读 HTTP 缓存）；有缓存先返回 + `e.waitUntil(networkPromise)` 保活后台更新；无缓存等网络；都失败返回 `new Response('', {status:504})` 让 img 触发 onerror

**② `Layout.astro`（壁纸脚本重构 + 新增 SW 注册脚本）：**

- 新增独立 `<script is:inline data-swup-ignore-script>` 注册 SW（仅 `https:` / `localhost` / `127.0.0.1`；`navigator.serviceWorker.register('/sw.js').catch(()=>{})`）；`data-swup-ignore-script` 保证 Swup 切页不重跑、注册只一次
- 壁纸脚本简化：**删掉 `fallback()` 函数**（原逻辑加 `.bg-ready` 会显示 `:root` 兜底 url，即裸接口图，违背「未加载完纯色」）；**删掉 `setTimeout(fallback, 8000)`**（用户要「没加载完就纯色」，不该有超时强制兜底）；**删掉 `decoded` 标志**（`apply` 已有 `settled` 守卫，`decoded` 冗余）
- `error` 处理改为静默空函数（保持纯色占位，不强制显示兜底图）
- `load` → `img.decode().then(apply, apply)`（decode 失败也 apply，CSS 渲染仍可用）；`apply(url)` 设 `--random-bg-url` + 加 `.bg-ready` 不变

**③ `global.css`（`:root` 兜底值改 none）：**

- `--random-bg-url: url('https://webp.mingcy.cn')` → **`--random-bg-url: none`**
- 原因：原兑底值指向裸接口，`::before` 在 `opacity:0` 时浏览器仍可能加载该 url → 额外下载一张图；改 `none` 后未加载时 `::before` 无背景图 + `opacity:0` → 露元素 `.site-wallpaper` 的 `background-color: rgb(var(--color-bg-primary))`（亮色浅绿 / 暗色深蓝纯色），即「没加随机图之前的黑白纯色背景」彻底成立
- 侧边栏 `.bg-shared-media` 同理受益（读同一变量，未加载时露自身 `background-color`）

**验证：** `astro check` 113 files / 0 / 0 / 0；`astro build` 213 pages Complete。dist 核验：`dist/sw.js` 存在（2916 B，`node --check` 通过）；`index.html` 含 SW 注册脚本 + `var url = 'https://webp.mingcy.cn?v=' + Date.now()`（唯一真请求，其余 4 处全在 HTML/JS 注释里）；旧 `setTimeout(fallback, 8000)` / `function fallback` 在 HTML 里 **0 处残留**；`_spec_*.css` 含 `--random-bg-url: none`、`webp.mingcy.cn` 在 CSS 里 **0 处**（旧 url() 兜底彻底消失）；sw.js 含 `BG_HOST`/`BG_KEY`/`handleBg`/`no-cors`/`cache.put`/`return cached`/`Response 504` 全部逻辑。

**注意：**

- ① **首次访问仍慢**（无 SW 缓存，走网络下载 1–2MB），这是 SW 缓存的固有特性；从第二次刷新起秒开。要首次也快只能构建期预下载一批图存 `public/`（失去「每次随机」），本次未做
- ② SW 只在 `https:` / `localhost` / `127.0.0.1` 生效；生产 `mingcy.cn` 是 https，OK；本地 `pnpm dev` 是 http+localhost，OK
- ③ SW 生命周期：首次访问注册后需 `install` + `activate` + `claim` 才接管（通常几秒），首次壁纸请求可能早于 SW 就绪仍走网络；后续刷新全程命中
- ④ opaque response 无法用 JS 读取内容（`response.blob()` 得到 size:0），所以不能用 `caches.match` + `createObjectURL` 方案，只能让浏览器自己请求（`new Image` / CSS `url()`）由 SW 返回 opaque
- ⑤ `fetch(e.request, {cache: 'no-store'})` 的 `cache: no-store` 是 fetch init 选项，确保后台更新不读 HTTP 缓存、真正请求网络拿新随机图
- ⑥ 若日后 `webp.mingcy.cn` 加了 `Access-Control-Allow-Origin: *`，可改用 `mode: 'cors'` + IndexedDB 存 Blob 方案（更可控），但当前 SW opaque 方案已足够
- ⑦ 改 sw.js 后部署，旧 SW 仍缓存旧版 → `CACHE` 常量改版本号（`gyoza-bg-v1` → `v2`）会让 `activate` 清旧缓存；当前 `gyoza-bg-v1` 是首版无需特殊处理

---

### 2026-10-04 20:15 - 导航新增三个子域外链 + 随机壁纸一次请求两处复用

**背景：** ①在导航分组的「导航」下加三个外链：笔记 `e.mingcy.cn`、编辑 `markdown.mingcy.cn`、集合 `h.mingcy.cn`；②全局背景层与右侧侧边栏卡片背景直连同一个随机接口，**同一张图被下载两次且两次返回结果不同** → 冗余请求 + 画面割裂。目标：1 次请求，两处复用，完全同步。

**修改文件：** `src/components/header/Navbar.astro`、`src/styles/global.css`、`src/layouts/Layout.astro`、`src/components/sidebar/BgImageCard.astro`、`src/pages/about.astro`

**① 导航外链：**

- `NavLink` 类型加可选 `external?: boolean`；「导航」分组从 3 项扩到 6 项
- 桌面下拉与移动端抽屉**都**给 `target={sub.external ? '_blank' : undefined}` + `rel='noopener noreferrer'`（Astro 传 `undefined` 会省略属性，不影响站内项）
- `isActive()` 开头加 `/^https?:\/\//.test(href)` 直接 return false —— 外链不参与站内高亮判断，否则 `path.startsWith(href + '/')` 对外链无意义
- 未加外链小图标（6 项里 3 项有图标会不一致），要加可后续统一处理

**② 随机壁纸一次请求（核心）：**

- **`global.css` `:root` 新增 `--random-bg-url: url('https://webp.mingcy.cn')`**（兑底值指向裸接口，脚本未跑也能显示一张随机图）
- **图片从元素本身移到伪元素**：`.site-wallpaper::before, .bg-shared-media::after` 合并为**一条规则**（因为 `.site-wallpaper` 的 `::after` 已被可读性遮罩占用，无法复用）——同一 `background-image: var(--random-bg-url)`、同一 `opacity 0.9s` transition
- 同步机制：`html.bg-ready .site-wallpaper::before, html.bg-ready .bg-shared-media::after { opacity: 1 }` —— **一个 class 切换两处**，数学上不可能不同步
- `.site-wallpaper` 本体只留 `position:fixed / inset:-48px / background-color`（占位底色）`/ filter / contain:strict`；尺寸策略（cover / center center / no-repeat）**原样保留**，只是从元素本体下沉到 `::before`
- 新增 `.bg-shared-media`：`position:relative + overflow:hidden + background-color: --color-bg-secondary`（占位底色，与全局背景同族）
- **删掉旧 `.site-wallpaper.is-loading`**：图片层默认 `opacity:0` 本身就是占位态，不需要 loading class，少一个 class 同步点
- **`Layout.astro` 脚本重写**：`new Image()` 预取 + `img.decode()` → `docEl.style.setProperty('--random-bg-url', "url('...?v=" + Date.now())")` + `docEl.classList.add('bg-ready')`；失败/8s 超时走 `fallback()` —— **不覆盖变量**（回退 `:root` 兑底值）**但仍加 `bg-ready`**，两处一起淡入、或一起停在占位底色，不会出现一处成功一处失败
- 保留 `data-swup-ignore-script` + 只跑一次：CSS 变量挂在 `:root` 上，Swup 切页不重建 body，SPA 期间壁纸稳定
- `background-attachment: fixed` 依旧不写（元素本身 `position:fixed` 已等效）

**③ 消费方改造（2 个，共 212 页）：**

- `BgImageCard.astro`：`<img src="https://webp.mingcy.cn" loading="lazy" class="h-32 w-full object-cover">` → `<div class="bg-shared-media h-32 rounded-xl" role="img" aria-label="随笔插画">`。`object-cover` 由 `::after` 的 `background-size:cover` 等效承担；丢失的 `loading="lazy"` 是**有意为之**——反正要作为壁纸立即下载，不额外花代价
- `about.astro` 页脚装饰图（第三个消费方，用户没点名但同属「单独发请求」）：`<img ...>` → `<div class="bg-shared-media ..." aria-hidden="true">`，顺带把无意义的 `alt="random"` 改为 `aria-hidden`（纯装饰，屏读器不再念出 "random"）

**验证：** `astro check` 113 files / 0 / 0 / 0；`astro build` 213 pages。dist 核验：`_spec_*.css` 含 `--random-bg-url: url(https://webp.mingcy.cn)` 与合并规则 `.site-wallpaper:before,.bg-shared-media:after{...background-image:var(--random-bg-url);background-size:cover;background-position:center center;background-repeat:no-repeat;opacity:0;transition:opacity .9s ease}`、`html.bg-ready ...{opacity:1}`；**旧 `.is-loading` 在 CSS/HTML 里 0 处残留**；`dist/index.html` 内 `webp.mingcy.cn` 共 4 处但**只有 1 处是真请求**（`var url = '...?v=' + Date.now()`），另 3 处全在 HTML/JS 注释里；导航下拉 + 抽屉各含 e/markdown/h 三外链，`target="_blank" rel="noopener noreferrer"` 各 2 处；212 个 HTML 含 `bg-shared-media`。

**子域元数据实测：** e = EdgeEver（开源印象笔记）、h = CF-Navs（Cloudflare Workers 导航面板）、d = EdgeMirror（边缘镜像网关，`github.com/tianrking/EdgeMirror`）、markdown = 「火星编辑器 · Markdown 转公众号排版」、n = 「cyr — Cloud Notepad」（即已有项目 3「笔记」）。

**⚠️ 遗留：** ①**「笔记」现在有两个**：项目卡 id 3 `n.mingcy.cn`（Cloud Notepad）与新加的 id 7 `e.mingcy.cn`（EdgeEver）标题都是「笔记」，而导航「笔记」指 e。要区分请给 n 改个名字（建议「云笔记」）；②`markdown.mingcy.cn`（编辑）**只进了导航，没进项目页**——本次用户只要求加导航，要同步加项目卡说一声；③三个新项目的封面图仍待放。

---

### 2026-10-04 19:45 - Logo 胶囊紧凑化 + 壁纸预解码淡入 + 分类总览页 + 3 个新项目

**背景：** 用户四点：①导航左侧 Ming·CY 胶囊胖肿松散；②随机壁纸尺寸/比例不一导致显示不全、裁切偏移；③把「项目、工具」挪进「导航」下拉分组，并新增 e/h/d 三个子域项目；④`/categories` 页不存在（但 `/categories/网站建站` 正常），补上并显示四字标签。

**修改文件：** `src/components/header/Navbar.astro`、`src/styles/global.css`、`src/layouts/Layout.astro`、`src/data/projects.ts`、`src/components/ProjectList.astro`、`src/pages/sitemap.xml.ts`；新建 `src/pages/categories/index.astro`

**① Logo 胶囊紧凑化（根因是 viewBox 里 32% 死空间）：**

- SVG viewBox `0 0 1000 250` → **`0 0 800 250`**：内容实际只到 x≈680（Ming@0 + CY@500，JetBrains Mono 0.6em 步进），右侧 32% 是纯空白，是胶囊宽度的主要浪费源
- `.logo-svg` `width: 9.375rem`(150px) → **`7rem`**(112px)，裁完 viewBox 后字形高仍 ≈20px 不变
- `.navbar__float-left` 新增紧凑覆盖（同选择器级、声明在后压过 `.navbar__float`）：`padding 0.28rem 0.35rem` → **`0.1rem 0.55rem`**、`border-radius 999px` → **`16px`**（全圆胖胶囊 → 修长圆角胶囊）；`min-height: 2.75rem` **刻意保持**与右胶囊视觉重心一致
- 效果：**157×46.5px → 130×44px**（窄 17%、矮 5%）
- **顺带修了一个隐藏 bug**：SVG 内 CSS transform 走 user 单位，viewBox 800 渲到 112px 时 1 unit = 0.14 CSS px，原 `translateX(-5px)` 实际只渲 0.7px（hover 字块分离效果几乎不可见）→ 补到 **`-36px`/`36px`**，实际 ≈5 CSS px
- Ming/CY 加 `letter-spacing: -0.04em`，圆球 `-30px` 保留
- **不动**：右胶囊默认值与 glide-pill 几何、`transform-origin: 342px 130px`（user 单位，不受 viewBox 宽度裁剪影响）、`dark:invert`、圆球摇摆 keyframes、reduced-motion 降级

**② 壁纸加载过渡（真正的闪烁根因，不是 cover）：**

- `cover` + `center` 本就已生效，缺的是：`background-repeat: no-repeat`、**加载淡入（完全没有）**
- CSS：`background-position: center` → **`center center`**、新增 `background-repeat: no-repeat`、`opacity: 1` + `transition: opacity 0.9s ease`、新增 `.site-wallpaper.is-loading { opacity: 0 }`
- JS（Layout 内联脚本）重写：先用 `new Image()` 预取 + `img.decode()`，解码成功后才写 `backgroundImage` 并摘掉 `.is-loading` → 0.9s 淡入。`.is-loading` 在首帧绘制前同步加上，所以不会出现「先露兜底图、再换新图」的两次跳变；解码失败 / 8s 超时也摘掉 `.is-loading`（回退 CSS 兜底图/纯色，宁缺不多）
- **`background-attachment: fixed` 明确不写**：本元素本身 `position: fixed` 已等效实现视差；`background-attachment: fixed` 在 iOS Safari 有重绘卡顿与被忽略问题（只减不加）
- 遮罩、`blur(12px)`、明暗 `::after`、`data-swup-ignore-script` + 只跑一次（SPA 期间壁纸稳定）均不动

**③ 导航分组：** `NAV_LINKS` 把「导航」从扁平项改为分组 `{label:'导航', items:[首页/、项目//projects、工具//tools]}`，删掉原来的两个顶级扁平项。移动端汉堡抽屉本就走 `NAV_LINKS` 递归 + `navbar__drawer-group` 分支，无需改代码自动适配。

**④ 分类总览页（根因：只有 `[category].astro` 没有 `index.astro`）：**

- 新建 `src/pages/categories/index.astro`：`getAllCategories()` 取全部分类，按**文章数降序**（同数按名称 `localeCompare('zh')`）排序；`grid-cols-2 sm:3 lg:4` 卡片墙，复用 `.cloud-badge` + `hover:glow-border`，每张卡显示图标 + 篇数 + 四字标签名 + hover 箭头；头部统计「N 个分类，M 篇文章」
- 实测：**21 个分类、85 篇文章**
- `sitemap.xml.ts` 补 `add('/categories/', '0.5')`（原本只收单分类页）
- ⚠️ 坑：写了 `text-tertiary` 才发现**这个类根本不存在**（`tailwind.config.ts` 的 `extend.textColor` 只有 primary/secondary，`TagList.astro` 里用的 `text-tertiary` 是死类静默不生成）→ 统一用 `text-secondary`

**⑤ 新增 3 个项目**（元数据实测抓取，非猜）：

| id  | title | 域名          | 描述                                                                                    | codeUrl                                   |
| --- | ----- | ------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| 7   | 笔记  | `e.mingcy.cn` | EdgeEver：基于 Cloudflare 全家桶自托管的开源印象笔记                                    | 空                                        |
| 8   | 集合  | `h.mingcy.cn` | CF-Navs：部署在 Cloudflare Workers 上的轻量个人导航面板                                 | 空                                        |
| 9   | 加速  | `d.mingcy.cn` | EdgeMirror：边缘镜像网关，加速源码、包仓库、模型库、Docker 镜像、Linux 镜像与运行时下载 | `https://github.com/tianrking/EdgeMirror` |

- 来源：e 的 `meta description`；h 的 HTML 无 description，从 `manifest.webmanifest` 取；d 的 `meta description`（英文原文译中）。**GitHub API 本环境不可达（curl http_code 000），e/h 仓库地址不猜，留空**（d 的仓库地址是从页面源码 grep 到的 `github.com/tianrking/EdgeMirror`）
- 图片占位：`image/edgeever.webp` / `image/cfnavs.webp` / `image/edgemirror.webp`（待用户放 `public/image/`）
- `ProjectList.astro` 加破图兜底：卡片 `aspect-video` 容器加内联 `style="background: linear-gradient(135deg, rgb(var(--color-bg-secondary) / 0.75), rgb(var(--color-bg-primary) / 0.35))"` + `<img onerror="this.remove()">`（放图前不再显示破图图标）。**`onerror` 经构建验证已保留在 dist（9 处）**
- ⚠️ 坑：`from-secondary/70` 这类渐变类**不会生成** —— 本主题 `secondary` 定义在 `extend.backgroundColor` 而非 `extend.colors`，而 Tailwind 的 `from-*/via-*/to-*` 只读 `colors` 命名空间（只有 `accent` 进去了，所以 `.from-accent/5` 存在、`.from-secondary/70` 不存在）。要渐变只能写内联 `style` 或加到 `colors` 里

**验证：** `astro check` 113 files / 0 errors / 0 warnings / 0 hints；`astro build` **213 pages**（+1 = 新分类页）。dist 核验：`categories/index.html` 102KB 含 21 张卡 + 21 个 `icon-arrow-right` + 「共有 21 个分类，85 篇文章」；导航下拉含首页/项目/工具、`/projects` 3 处、`/tools` 2 处（桌面 + 抽屉 + 页内）；`dist/_astro` 含 `background-repeat:no-repeat` / `background-position:center center` / `.site-wallpaper.is-loading` / `transition:opacity .9s ease` 各 1；内联脚本含 `new Image()` / `img.decode` / `is-loading`；项目页 9 张卡 + e/h/d 三域链接 + `this.remove()` ×9 + 渐变兜底；sitemap 收录 `/categories/`。提交 `61b255a` 已推 `main`。

**⑥ 删掉 `baidu-push` 工作流：** 用户确认不需要。实际它已经是**死工作流** —— 它引用的 `scripts/baidu-changed-urls.cjs` 与 `scripts/baidu_push.py` **两个脚本在仓库里根本不存在**（`ls scripts/` 只有 7 个文件），所以每次命中 path filter 都会直接失败。另外确认过 `cache-hit-check.yml` / `close-inactive-issues.yml` 都没有 `workflow_run` 引用它，可单独删除。现状：`.github/workflows/` 只剩 `cache-hit-check.yml` + `close-inactive-issues.yml`，部署全靠根目录 `vercel.json`（推 `main` 后 Vercel 自动构建）。CLAUDE.md 1432/1440 行对 `baidu_push.py` 的历史描述属于 2026-08/09 旧轮记录，脚本早已被删，未回改历史记录。

**⚠️ 遗留：** ①`ChatGPT` 是 21 个分类里**唯一不是四字**的（7 字符，slug `chatgpt`），影响 2 篇：`ChatGPT-KEY`、`aitiaosuo`。未擅自改内容字段，要归一化成「人工智能」之类四字标签请说；②另有一批语义重复的类（技术分享/技术教程/技术教学、实际生活/生活方面、实用推荐/实用技巧/实用软件、安卓应用/安卓软件）未合并，要并也请说；③三个新项目的封面图待放。

---

### 2026-10-04 16:30 - 壁纸可见度修复 + 导航栏卡顿优化 + 卡片封面缩小

**背景：** 用户反馈三个问题：①导航栏有卡顿；②文章图片比例太大；③全局背景「没有实现」，要求全部换成 `webp.mingcy.cn` 壁纸 + 模糊。

**背景「未实现」的真相（排查结论）：** 壁纸其实一直在渲染（`Layout.astro` 的 `.site-wallpaper` + 时间戳注入），**但四层遮罩叠加让壁纸只剩 12–15% 可见**，等于没有。叠加链路：`.site-wallpaper::after` 50%（暗 65%）× `.page-bg-home` 45% × `main` 的 `bg-primary/50` 或 `/75` → 亮色首页仅 `0.5 × 0.55 × 0.55 ≈ 15%`，文章页仅 `0.5 × 0.25 = 12.5%`。

**修改文件：**

- `src/styles/global.css`（壁纸遮罩大幅减弱 + CSS 兜底图）
- `src/layouts/PageLayout.astro`、`src/layouts/MarkdownLayout.astro`（main 背景透明度）
- `src/components/post/PostCard.astro`（封面比例）
- `src/components/header/Navbar.astro`（性能）

**修改内容：**

1. **壁纸遮罩减弱**（可见度从 12–15% 提升到 32–60%）：
   - `.site-wallpaper::after`：50% → **20%**（暗 65% → **36%**）
   - `.page-bg-home`：45% → **15%**
   - PageLayout main：`bg-primary/50` → **`/25`**
   - MarkdownLayout main：`bg-primary/75` → **`/60`**（文章页正文多，保留较高遮罩保证可读）
   - `blur(14px)` → **`blur(12px) saturate(1.1)`**（保留壁纸轮廓），移动端 8px → **6px**
   - **新增 CSS 兜底图**：`.site-wallpaper` 直接写 `background-image:url('https://webp.mingcy.cn')`，JS 注入的带时间戳 URL 用 inline style 覆盖它 —— 脚本未跑时背景不全空
   - 最终可见度：首页约 **51%**、普通页约 **60%**、文章页约 **32%**
2. **壁纸自适应尺寸（去掉额外放大）**：原 `transform: scale(1.08)` 会在 `background-size:cover` 之外再放大 8%，叠加后壁纸只显示中间约 92%（用户反馈「比例太大只显示一部分」）。删除 `scale(1.08)` 与配套的 `will-change:transform`，只保留 `cover` + `inset:-48px` —— 后者已足以补偿 `blur(12px)` 的边缘透明（48 > 12×2），无需再 scale。壁纸现按视口宽高比自适应铺满，无额外裁剪
3. **导航栏卡顿**（根因：胶囊 `backdrop-filter: blur(18px)` 在滚动时**每帧重采样**背景，两颗胶囊 = 两处持续合成成本）：
   - 静止时 blur 18px → **12px saturate(150%)**（小区域上模糊半径超过内容时收益递减，但重采样成本线性上升）
   - 投影减弱：`0 16px 40px -24px #00000075` → **`0 12px 30px -24px #0006`**（#00000066 的 4 位 hex 简写）
   - **滚动期间彻底拿掉毛玻璃**：`body.is-scrolling` 时 `backdrop-filter:none` + 把 `--navbar-glass-bg` 提到 **90% 不透明度**补偿视觉（原来只降到 `blur(8px)`，仍在每帧重算）
   - 下拉菜单 blur 18px → 12px；删掉 `.navbar` 自身无意义的 `transition: background-color/box-shadow`（navbar 无背景无阴影）
4. **卡片封面缩小**（`PostCard.astro`）：`aspect-[16/9]` → **`aspect-[21/9] max-h-[220px]`**。宽 780px 的卡片高度从 439px 降到 220px（矮 50%），窄卡片按 21:9 自然比例，图片 `object-cover` 不变

**关键机制说明：**

- 壁纸本身**不是**滚动成本：`.site-wallpaper` 是 `position:fixed`（滚动时位置不变）+ `contain:strict` + `will-change:transform`，`filter:blur()` 只算一次
- 真正的滚动成本是 **`backdrop-filter`**（毛玻璃要采样下方内容，内容在动就每帧重算）。壁纸用的是 `filter`（只作用于自身）不是 `backdrop-filter`，所以壁纸不拖帧
- glide-pill 的 rAF 循环在弹簧收敛后直接停止（`state.frame=0`），非 hover 时零成本
- `body.is-scrolling` 由 `Layout.astro` 的常驻脚本设置（rAF 节流 + 120ms 停止计时器），导航栏降级规则在 Navbar.astro 的 scoped CSS 里通过 `body.is-scrolling #site-navbar` 消费
- CSS 4 位 hex `#0006` = `#000066`（每字符×17），压缩器对 8 位 hex 的合法简写

**验证：** `astro check` 112 files / 0 errors / 0 warnings / 0 hints；`astro build` 212 pages。dist 核验：CSS 兜底 URL 1 处、遮罩 `/ .2` 与 `/ .36` 均在、`page-bg-home / .15`、`bg-primary / .25` 12 处、`/ .6` 11 处、`aspect-ratio:21` 1 处、`max-height:220px` 2 处、旧 `aspect-[16/9]` 残留 0；导航栏 `blur(18px)` 残留 **0**、`blur(12px) saturate(150%)` 4 处、`backdrop-filter:none` 6 处、玻璃提到 90% 1 处。

**注意：**

- ①壁纸遮罩减弱后，`card-glass` 的 `backdrop-filter` 会让卡片显示模糊的壁纸（玻璃质感更强），这是期望效果
- ②若某张壁纸本身对比度极高（纯白/纯黑），亮色模式下正文可能对比不足 —— 此时把 `.site-wallpaper::after` 从 20% 提到 28% 即可（文章页的 60% 遮罩不受影响）
- ③卡片 `max-h-[220px]` 只在宽卡片生效（窄卡片 21:9 自然高度更低）；若想全平台统一固定高度可改用 `h-56`
- ④壁纸遮罩与 `main` 背景叠加大概按 `壁纸 × Π(1-α)` 衰减，调参时可先算目标可见度再反推每一层

**背景：** 要求参考 https://blog.liushen.fun/ 复刻导航栏：滑动特效、二级菜单、「MingCY 与导航栏分开」的效果，并随浅深主题随心切换。

**参考站源码定位（可复用）：**

- 导航 HTML 内联在首页；导航 CSS 在 `/_astro/Footer.*.css`（约 212KB 的 bundle 里，不是 index.css）
- glide-pill 的 runtime 在懒加载 chunk `/_astro/header.*.js`（由 `requestIdleCallback` 引入，且仅在 `(hover:hover) and (pointer:fine)` 时加载）
- 参考站是 Astro 7 + `data-theme` CSS 变量体系，全部颜色走 `var(--accent)` / `var(--foreground)` / `var(--background)` / `var(--border)`，无任何硬编码

**修改文件：**

- `src/components/header/Navbar.astro`（整体重写，约 1000 行）
- `src/components/hero/Hero.astro`（仅容器宽度同步对齐）
- `src/styles/global.css`（删除上一轮加的 `body.is-scrolling #site-navbar` 胶囊模糊规则 —— navbar 自身不再承载 backdrop-filter）

**四项设计语言（1:1 对照参考站）：**

1. **两个独立浮起胶囊**：Logo 单独一个胶囊（`.navbar__float-left`，z-index 30），导航菜单 + 功能按钮单独一个胶囊（`.navbar__float-right`）。默认态 `background:0 0` + `border:1px solid #0000` + `::before` 玻璃层 `opacity:0` → **完全透明**；滚动时（`scrollY > 15`）玻璃层浮现 `opacity:1` + 边框 `color-mix(border 24%)` + 双层投影 + 整颗下移 `translateY(.35rem)`。玻璃层是 `::before` + `isolation:isolate` + `z-index:-1` + `backdrop-filter:blur(18px) saturate(160%)`，背景 `color-mix(bg-primary 72%, transparent)`（`@supports color-mix` 降级为实色）
2. **滑动特效**：`.glide-pill` 不是 CSS transition，而是 `requestAnimationFrame` 驱动的**弹簧物理** —— stiffness 7000 / damping 96 / 位置容差 0.1px / 速度容差 0.6 / 隐藏态 `scale(0.92)` / 最小帧间隔 0.002s，逐帧写 `translate3d(x,y,0) scale(s)` + `width` + `height`，按**中心点**定位并按速度方向额外拉出 `min(|v|*dt, 10)` 的拖尾。收敛后归零速度直接吸附到目标。hover 用 `pointerover` / `pointerleave`，键盘用 `focusin` / `focusout`（检查 `relatedTarget` 是否仍在容器内）；`resize` / `scroll` 时重新量测已锁定项。父 track 与子 track（下拉内部）互不干扰：`closest('[data-glide-track]') !== container` 直接排除
3. **二级菜单**：胶囊形玻璃下拉（`border-radius:999px` + `width:max-content` + `max-width:min(92vw,820px)` + `backdrop-filter:blur(18px)` + `box-shadow:0 16px 36px -18px`），`hover` / `focus-within` 展开，带 `::before` 顶部悬浮间隙（0.5rem）避免鼠标离开触发器时立刻消失。**下拉内部同样内嵌一枚 glide-pill**，展开项 hover 时在胶囊内滑动。当前页标识从上一版的「背景高亮块」改为参考站的**波浪下划线**（`text-decoration:underline wavy .08em` + `text-underline-offset:.42em` + `::after{content:none}`）
4. **浅深随心切换**：全部颜色改为 CSS 变量 —— 文字 `rgb(var(--color-text-primary))`、hover/accent `rgb(var(--color-accent))`、边框 `rgb(var(--color-border-primary))`、玻璃底 `color-mix(rgb(var(--color-bg-primary)) 72%, transparent)`、分隔线 `rgb(var(--color-border-primary) / .3)`、移动抽屉底色/边框/标题同样变量化。**顺带解决了上一轮遗留的「深灰 Logo vs 白色菜单文字」不一致**（上一轮菜单是硬编码 `#e2e8f0`）。唯一保留的硬编码是 Logo SVG 自身的 `fill:rgb(51,51,51)` + `dark:invert`（Logo 是固定色 SVG，与菜单文字无关）

**其他细节：**

- 容器宽度：`.navbar__layout` = `max-width:950px`，`@media(min-width:1280px)` → `1100px`（参考站 `app-layout`）。Hero 容器同步从 1024px 改为 950/1100 以保证左边缘对齐
- 断点从 768px 改为 **1024px**（参考站 `lg`）：7 个菜单项 + 分隔线 + 两个图标按钮在 769–1023px 区间确实放不下
- 分隔线：菜单末尾 `1px × 1rem` 竖线（参考站分隔符）
- 图标按钮：`2rem × 2rem` 圆形，`border:1px solid color-mix(border 18%)`，hover 时 accent 色 + accent 8% 底色
- 搜索按钮保留（本地无 Pagefind 搜索面板，仍是装饰），**未新增主题切换按钮**（「随心切换」按样式自动跟随理解；footer 已有 ThemeSwitch）
- 分组触发器改用 `<button aria-haspopup>`，**去掉了上一版的 caret 箭头**（参考站 trigger 只有文字）

**关键决策（避免全站布局回归）：**

定位**仍用 absolute（默认态）/ fixed（滚动态）**，不改成参考站的 `sticky`。理由：改 sticky 需要移除 `main` 的 `pt-16`（影响 PageLayout + MarkdownLayout 全站布局），而「两个胶囊浮现」的视觉效果完全由胶囊自身承载，与定位方式无关。副作用是滚动态胶囊底部（约 70px）与内容起点（pt-16 = 64px）重叠约 6–7px —— 胶囊是圆角玻璃，重叠部分自然被模糊显示，视觉可接受。**未改 `main` 的 `pt-16`。**

**验证：**

- `astro check` 112 files / **0 errors / 0 warnings / 0 hints**
- `astro build` **212 pages** Complete
- 内联脚本 `node --check` 语法通过；脚本原样输出（`is:inline` 未参与打包），参数可核：`STIFFNESS`/`DAMPING`/`TOL_POS`/`HIDDEN_SCALE`/`MIN_FRAME` 各在 HTML 中 2–3 次
- dist 结构核验：`navbar__float-left`/`-right` 各 1、`data-glide-pill` 4（3 枚 pill + 1 处 JS 常量）、`data-glide-track` 4（3 个 track + JS 常量）、`navbar__dropdown` 8、`navbar__sep-line` 1、`nav-active` 2（首页命中「导航」，桌面 + 移动抽屉各一）
- dist CSS 核验：`isolation:isolate` 8 处、`translateY(.35rem)` 1、`border-radius:999px` 16、`backdrop-filter:blur(18px)` 4、`color-mix` 64、`underline wavy` 8、`max-width:950px` 2 / `1100px` 3、`min-height:2.75rem` 1

**注意：**

- ①`data-swup-ignore-script` + `window.__gyozaNavbarInit` 幂等守卫**必须保留**：不加则 SwupScriptsPlugin 每切一页克隆重跑、监听器无限累加。glide 的监听器走 `AbortController`，`rescan` 时先 `abort()` 再**重新赋值** `ac`（不能新建局部变量，否则第二次 rescan 无法撤销第一批监听器）
- ②`bootGlide` 惰性执行（`requestIdleCallback`），且不满足 `(hover:hover) and (pointer:fine)` 或 `prefers-reduced-motion` 时直接不初始化 —— 触屏无 hover，启用反而干扰。此时 pill 永久 `opacity:0`（CSS 默认态），当前页标识由 CSS 波浪下划线承担
- ③滚动期间胶囊玻璃从 `blur(18px) saturate(160%)` 降到 `blur(8px) saturate(120%)` 并关闭 transition（`body.is-scrolling` 触发）—— `backdrop-filter` 每帧重算是滚动掉帧主因
- ④分组展开后，鼠标移入下拉会触发父 track 的 `pointerleave` → 父 pill 淡出，这是期望行为（与参考站一致）
- ⑤Logo SVG 的 `transform-origin:342px 130px` 是 SVG 用户坐标，依赖内联 SVG 的 CSS transform 在 viewBox 坐标系生效（不能用 `<img>` 引用）

**背景：** 要求以 `F:\桌面\study\opencode\astro\astro-devosfera`（茗辰原迁移副本，最新提交 `9439aed`）为范本做三件事：①首页「最新文章」以上的个人形象展示区与参考站做到一模一样；②导航栏 Ming{·}CY 采用参考站同位置同效果；③全局背景参照参考站使用 `https://webp.mingcy.cn` 模糊背景。约束：写法按本主题体系，保证流畅度优先。

**修改文件：**

- `src/components/hero/Hero.astro`（重写）
- `src/components/header/Navbar.astro`（Logo + 布局）
- `src/styles/global.css`（背景参数 + 滚动降级）

**① Hero（结构 1:1 照搬参考站 index.astro，文案走本地 config）：**

- 顶部终端提示符徽章：`ping` 脉冲点（`animate-ping bg-accent`）+ accent 前缀 `~` + 路径 `/mingcy` + 40% 透明度后缀 `$`，圆角胶囊 `border-primary/40 bg-secondary/20 font-mono`
- 超大标题：`hero.name`（茗辰原）+ RSS 图标链接（`/rss.xml`，`stroke-accent stroke-3 opacity-40 hover:opacity-100`）；`.hero-title` shimmer 流光渐变（`250% auto` background-size + 6s 流动，accent↔text-primary 两端插值用 `color-mix(in oklab, ... 50%, ...)`）
- 描述：`{hero.description} | {hero.bio}记录编程、网络安全与生活的点滴。`
- `Written by` + 作者虚线下划线链接（`decoration-dashed underline-offset-4 hover:text-accent`）+ 分隔线 + `SocialList`（保留本地 React 组件）
- 右侧头像：`.hero-avatar-ring` 用 `conic-gradient(from 0deg, transparent 0deg 200deg, accent 60% 300deg, transparent)` + 9s 旋转 + hover 由 0.7 → 1；头像 `size-48 xl:size-64`（参考站 192/256px）
- 容器从 `max-w-[1200px]` 改为 `max-w-[1024px]`，与导航栏、下方 home-grid 的左对齐线一致
- 移除旧版 `overflow-hidden` / `lg:-mt-16 lg:h-dvh` 沉浸式顶格、底部一言、下拉箭头、`Highlight` 组件（参考站均无；`Highlight.astro` 文件保留，其它 7 处仍在使用）

**② Navbar（Logo 同款 + 内容收敛居中）：**

- Logo 由纯文本 `Ming{·}CY` 换为参考站 `devosfera.svg` 的内联 SVG（Ming `rgb(51,51,51)` + 圆球 `rgb(167,90,90)` + CY，`viewBox="0 0 1000 250"`，`matrix(1.112155,...)` 变换矩阵与 `logo-text-left/-sphere/-right` 三段 class 完全照搬）；字体链改为 `'JetBrains Mono','Fira Code','Cascadia Code',monospace`（本机无 Cascadia Code，落到 JetBrains Mono，与 `tailwind.config` 的 `font-mono` 同源）
- 内联 SVG 而非 `<img src={Logo}>`：本主题 `astro.config.js` 未启用 `assets.svg.defaultExport`，`<img>` 无法穿透 SVG 内部 class，hover 动画会失效
- Logo hover 动效按参考站 `Header.astro` 逐条照搬：左右字块 `translateX(±5px)` + 字重阴影，圆球 `drop-shadow(8px rgba(167,90,90,.5))` + `logo-sphere-wiggle` 0.6s 弹性 keyframes（`transform-origin: 342px 130px`），`prefers-reduced-motion` 降级
- **新增 `.navbar__wrap`**：`max-width: 1024px; margin: 0 auto`（对应参考站 `app-layout = max-w-4xl xl:max-w-5xl`），原 `display:flex / justify-content: space-between` 从 `.navbar` 下沉到 wrap —— 这是「导航栏偏向左右」的根因（原未滚动态全宽 + `margin-left:auto` 把 Logo/菜单顶到两端）
- 滚动态胶囊 `max-width: 1200px` → `1024px`，与 wrap 同宽，胶囊与内容严格居中

**③ 全局背景（参数对齐参考站 `SITE.background`）：**

- `.site-wallpaper`：`blur(24px) saturate(1.1)` → **`blur(14px) saturate(1.05)`**、`scale(1.05)` → **`scale(1.08)`**、`contain: paint` → **`contain: strict`**，新增 `will-change: transform`
- 新增移动端降级 `@media (max-width: 768px) { filter: blur(8px) saturate(1) }`（参考站同款，小屏 GPU 预算有限）
- `body.is-scrolling #site-navbar` 新增滚动时 `backdrop-filter: blur(6px)` + `transition: none`（参考站对 header 同款；本地 `.navbar` 有 `transition: all .3s`，不加 `transition:none` 会在滚动中反复回跳）
- **遮罩保持 `.5`/`.65` 未动**：参考站遮罩 68/76% 是配它的主容器无额外底色；本地还有 `.page-bg-home` 45% 半透明层，若同步拉到 68/76 会叠加到约 82% 导致壁纸不可见。要更接近参考站观感，需同时减弱 `.page-bg-home`（未做，需确认）
- 背景图源与加载机制保留本地方案：`?v=Date.now()` 时间戳每次整页加载拉新随机壁纸（参考站是裸 URL `<img>`）

**类名映射（写法按本主题）：** `font-firacode`→`font-mono`；`border-border/40`→`border-primary/40`；`bg-muted/20`→`bg-secondary/20`；`bg-foreground/5`→`bg-secondary/5`；参考站 `var(--accent)/var(--foreground)`→`rgb(var(--color-accent))/rgb(var(--color-text-primary))`；`text-6xl/text-7xl`→`text-[3.75rem]/text-[4.5rem]`（本主题 `tailwind.config.ts` 的 `fontSize` 只定义到 `5xl`，直接写 `text-6xl` 会静默不生成）

**验证：** `pnpm exec astro check` 112 files / 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 212 pages Complete。dist 核验（`dist/index.html`）：`hero-section`×1、`hero-title`×3、`hero-avatar-ring`×6、`navbar__wrap`×1、`logo-svg`/`logo-text-left`/`logo-sphere`/`logo-text-right` 各×1、`Written by`×1、`/rss.xml`×3、`/mingcy`×9；Hero 的 shimmer 与光环 keyframes 内联在 HTML 的 7 个 `<style>` 块内；`_astro/*.css` 含 `conic-gradient`×6、`logo-sphere-wiggle`×2、`blur(14px)`/`saturate(1.05)`/`scale(1.08)` 各×1、`blur(8px)`×7、`contain:strict`×1、`is-scrolling #site-navbar`×1、`max-width:1024px`×4、`dark\:invert`×1、`border-primary\/40`/`bg-secondary\/20` 各×1。

**注意：**

- ①**未改文件**：`tailwind.config.ts`、`src/config.json`、`astro.config.js`、`package.json`（未引入依赖、未改构建配置）；`Highlight.astro` 未删除（仍被 ProfileCard 等 7 处引用）
- ②`src/config.json` 没有终端提示符与 profile 字段，故 `PROMPT_PREFIX/PROMPT_PATH/PROMPT_SUFFIX` 硬编码在 `Hero.astro` 顶部三个常量，`profileUrl` 取 `hero.socials[0].url`（GitHub）；要配置化再改 config
- ③**既有的对比度问题未处理**：导航菜单文字仍是白色（`#e2e8f0`），而新 Logo 是参考站的深灰 `rgb(51,51,51)`（暗色模式 `dark:invert` 反色），两者在亮色模式浅绿壁纸上的观感不一致 —— 参考站菜单用 `var(--foreground)` 深色文字是因为其背景为浅色；若要一致需把 `.navbar__link/.navbar__icon` 改为文字色变量，需确认后动手
- ④Hero 底部一言（`hero.yiyan`）已随参考站结构移除，该文案在右侧边栏 `YiyanCard` 仍有展示
- ⑤Logo SVG 里 `transform-origin` 是 SVG 用户坐标（`342px 130px`），依赖内联 SVG 的 CSS transform 在 viewBox 坐标系下生效，与参考站行为一致
- ⑥背景 `contain: strict` 对 `position:fixed + inset` 元素是安全的（layout containment 不改变定位）；若某浏览器出现背景位置异常，回退到 `contain: paint` 即可

### 2026-10-04 - 导航栏重构：全站菜单接入两个下拉分组 + 移动端汉堡抽屉 + Logo 改 Ming{·}CY

**背景：** 用户提供两套适配 Pi 的精准提示词（UI 效果图 / Astro 组件），要求导航栏覆盖全站所有页面：不只友链，还有相册、工具、项目、归档、标签、关于；同时按提示词把品牌改为 `Ming{·}CY`、花括号青绿 `#2dd4bf`（teal-400）、移动端折叠为汉堡菜单。用户确认菜单结构后执行。

**修改文件：**

- `src/components/header/Navbar.astro`（唯一改动，单文件重写）

**修改内容：**

- **菜单结构**（`NAV_LINKS` 改为联合类型 `NavItem = NavLink | NavGroup`，`'href' in item` 收窄）：7 个顶级项 + 两个 hover 下拉分组：
  - 导航 → `/`（直链）
  - **整理 ▾**（下拉）：归档 `/archives`、标签 `/tags`、分类 `/categories`
  - 项目 → `/projects`（直链）
  - 工具 → `/tools`（直链）
  - 相册 → `/galleries`（直链）
  - **友人 ▾**（下拉）：友链展示 `/links`、友链申请 `/links/apply`、朋友动态 `/links/fcircle`
  - 关于 → `/about`（直链）
- **Logo**：`Liu{·}Shen` → `Ming{·}CY`，花括号 `#34d399` → `#2dd4bf`（teal-400，按提示词），圆点 `#60a5fa` 保留
- **下拉交互**：`.navbar__item` 容器 `position:relative` + `.navbar__dropdown`（absolute 居中、毛玻璃 `rgba(15,23,42,.88)` + blur(12px)、圆角、阴影），`hover` / `focus-within` 展开（opacity + translateY 淡入），caret 箭头 hover 旋转 180°；分组链接用 `item.items[0].href` 作 parent 直达（整理→/archives、友人→/links）
- **移动端汉堡抽屉**（≤768px）：横向菜单 `display:none` → 汉堡按钮 + 顶部滑下抽屉面板（`#navbar-drawer`，fixed top-0 z-990、毛玻璃 blur(16px)、`.is-open` 动画、分组标题 `.navbar__drawer-title` + 子项缩进 `--sub`）；JS：点击切换、点外部关闭、Esc 关闭、点击抽屉内链接关闭、Swup `swup:page:view` 切页关闭；汉堡图标切 ✕（`.navbar.is-drawer-open` 控制两枚 SVG 显隐）；`aria-expanded` / `aria-hidden` / `aria-label` 同步
- **保留不动**：滚动形变双状态（默认透明全宽 ↔ ≥50px 居中毛玻璃胶囊 `rgba(15,23,42,.8)` + blur(12px) + 999px 圆角）、搜索图标、过渡动画、`data-swup-ignore-script` + `__gyozaNavbarInit` 幂等守卫、`swup:page:view` / `astro:page-load` 滚动重判

**验证：** `pnpm exec astro check` 112 files / 0 errors / 0 warnings / 0 hints（含 prettier 格式化后复验）；`pnpm exec astro build` 212 pages Complete。dist 核验：首页含 `Ming<span class="logo-brace">` + teal `#2dd4bf`、桌面菜单 7 顶级项 + 两个 `.navbar__item` 下拉（归档/标签/分类、友链展示/申请/朋友动态 各 3 项）、`#navbar-drawer` 抽屉含全部 11 项（平铺 5 + 分组子项 6）、`navbar__drawer-title` 整理/友人两组、汉堡按钮 + `is-drawer-open` 图标切换 CSS；`@media (max-width:768px)` 块含 `.navbar__menu{display:none}` / `.navbar__burger{display:inline-flex}` / `.navbar__drawer{display:block}`。

**注意：** ①下拉展开依赖 hover / focus-within（无 JS 也能用，纯 CSS）；②抽屉 z-990 位于 navbar（z-1000）之下、顶部滑下不盖住胶囊；③后续加页面只需改 `NAV_LINKS` 一处，桌面下拉与移动端抽屉自动同步；④提示词第 1 套（UI 效果图）为设计规范，代码环境不出图，视觉语言已直接落实在组件里。

### 2026-10-04 - 全局背景壁纸：替换 Aurora 为 webp.mingcy.cn 随机壁纸 + 高斯模糊 + 明暗遮罩

**背景：** 用户要求把全局背景改为 `https://webp.mingcy.cn` 的随机壁纸（该域名每次请求返回一张新随机壁纸，实测 200 / image/webp / 1672×941 / 每次哈希不同），并增加模糊效果避免影响文字阅读。

**修改文件：**

- `src/layouts/Layout.astro`
- `src/styles/global.css`
- `src/layouts/PageLayout.astro`
- `src/layouts/MarkdownLayout.astro`
- `src/components/footer/Footer.astro`

**修改内容：**

- **Layout.astro**：移除 `<AuroraBackground />`（CSS 极光，暗色模式本就隐藏，弃用），改为全局壁纸层 `<div class="site-wallpaper">`（`position:fixed` 铺满视口，`aria-hidden`，`pointer-events:none`）；壁纸 URL 用**内联脚本 + 时间戳缓存杀手**注入（`url('https://webp.mingcy.cn?v=' + Date.now())`），每次整页加载都拉新随机壁纸；脚本带 `data-swup-ignore-script` + 只跑一次的幂等逻辑 —— Swup 切页不重建 body，SPA 导航期间壁纸保持稳定不闪变（不需要每页重拉）
- **global.css**：新增 `.site-wallpaper` 样式 —— `background-size:cover` + `background-position:center`、`filter:blur(24px) saturate(1.1)` 高斯模糊、`inset:-48px` + `transform:scale(1.05)` 防模糊边缘露白、`contain:paint`；`::after` 可读性遮罩（亮色 `rgb(var(--color-bg-primary, 242 245 236) / .5)`、暗色 `/ .65`，带 fallback 防注入器未跑时透明）；`.page-bg-home` 从实色 `--page-bg` 改为半透明 `rgb(var(--color-bg-primary) / .45)`；删除已无引用的 `--page-bg` 变量（:root 与 dark 两处）与 `html[data-theme='dark'] .aurora-container` 死规则
- **PageLayout.astro**：非首页 main `bg-primary` → `bg-primary/50`（半透明，壁纸透出）
- **MarkdownLayout.astro**：文章页 main `bg-primary` → `bg-primary/75`（正文可读性优先，壁纸只淡淡透出）
- **Footer.astro**：页脚 `bg-primary` → `bg-primary/70`

**不动的部分：** `AuroraBackground.astro` 组件文件保留未删除（不再被引用，Astro 不打包即可）；Navbar / Hero / 卡片玻璃材质（card-glass 自带 backdrop-filter）均未改；`config.json` / `astro.config.js` / `package.json` 未改，无新增依赖。

**验证：** `pnpm exec astro check` 112 files / 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 212 pages Complete。dist 核验：`dist/index.html` 含 `site-wallpaper` 层 + `webp.mingcy.cn?v=' + Date.now()` 内联脚本 + `data-swup-ignore-script`；首页 main 为 `page-bg-home`、归档页 main 为 `bg-primary/50`、文章页为 `bg-primary/75`、页脚 `/70`；`_page_.*.css` 含 `bg-primary\/50`/`\/70`/`\/75` 三条半透明规则；`_spec_.*.css` 含 `.site-wallpaper`（blur(24px) saturate(1.1)）+ `::after` 亮/暗双遮罩 + `.page-bg-home` 半透明。

**注意：** ①壁纸只随**整页加载**变化（内联脚本只跑一次），Swup 切页期间保持同一张 —— 如需每次切页换壁纸需在 `swup:page:view` 里重写 `backgroundImage`（本次未做，切页重拉有闪烁风险）；②`bg-primary/50` 等半透明值依赖 Tailwind 对 `rgb(var(--color-bg-primary))` 的 alpha 修饰支持（实测生成 `rgb(var(--color-bg-primary) / .5)`）；③若某张壁纸较亮/较暗影响文字对比度，可调 `::after` 遮罩 alpha（亮色 .5 / 暗色 .65 是当前平衡值）。

### 2026-09-19 18:50 - 文章页元信息栏：5 项同一行 + 图标统一为内联 SVG（去除 iconfont）

**背景：** 用户要求文章页顶部的「发布日期（写入时间）、最后修改时间、字数、阅读时长、阅读量」5 项排成同一行，且每项前的图标不要用 iconfont，改为自己写/找 SVG。

**现状（改前）：** `src/components/post/PostMetaInfo.astro` 里 5 项**已齐全**，但 ①容器 `flex flex-wrap gap-2` 在窄容器会换行；②图标混用 —— 发布日期/字数/阅读时长三项用 `iconfont`（`icon-calendar` / `icon-file-list` / `icon-timer`），最后修改时间/阅读量两项用内联 SVG（编辑笔 / 眼睛），风格不统一。

**修改文件：**

- `src/components/post/PostMetaInfo.astro`（仅此一个文件）

**修改内容：**

- **图标全部改为内联 SVG**，统一 lucide 线条风格（`viewBox="0 0 24 24"` + `fill="none"` + `stroke="currentColor"` + `stroke-width="2"` + `stroke-linecap="round"` + `stroke-linejoin="round"` + `aria-hidden="true"`），`width/height` 均为 `14`，`class="inline-block -mt-[1px]"`（沿用原编辑笔 SVG 的基线对齐写法）：
  - 发布日期 → 日历图标（两条挂耳竖线 + `rect` 主体 + 横分隔线）
  - 字数 → 文档图标（文件轮廓 + 折角 `polyline` + 两条横线）
  - 阅读时长 → 时钟图标（`circle` + 指针 `polyline`）
  - 最后修改时间 → 编辑笔（原有 SVG 保留）
  - 阅读量 → 眼睛（在 `ReadCount.astro` 组件内，未改动）
- **容器** `gap-2` → `gap-2.5`（0.625rem），拉开 5 项间距；保留 `flex-wrap` 作为移动端窄屏换行兜底（PC 端 1 行，窄屏自然换行，符合响应式习惯 —— 用户确认采用此方案）

**不动的部分：** `RelativeDate.tsx`、`ReadCount.astro`、文章页 `[slug].astro` 的调用（`justify-center` 居中保持不变）、`Outdate.tsx` 过时提示卡、`PostArchiveInfo.astro` 分类标签、`config.json` / `astro.config.js` / `package.json` 均未改，无新增依赖。

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints（119 files）；`pnpm exec astro build` 211 pages Complete。dist 核验：86 个含 PostMetaInfo 的文章页中，其容器段内 `iconfont` 出现次数 **全为 0**，`icon-calendar` / `icon-file-list` / `icon-timer` 三处死引用彻底消失；有 `lastMod` 的文章页（`2024/04/01/guide`）渲染 5 个 `<svg>`，无 `lastMod` 的文章页（`2026/07/16/remark`）渲染 4 个（符合 `{lastMod && (...)}` 条件逻辑）。

**注意：** ①全站其它组件（Header / Footer 等）仍大量使用 iconfont，本次只收敛 PostMetaInfo 这一个组件，全站 iconfont 计数仍 >0 属正常；②`ReadCount.astro` 的眼球 SVG 在组件内部、未纳入本次统一，但风格本就与新增 SVG 一致（lucide `stroke-width:2` 线条），无需改动；③iconfont 图标本身依赖字体文件加载，改为内联 SVG 后这 3 项不再生成额外网络请求、也不会出现字体未加载时的豆腐块。

### 2026-09-17 23:25 - 四项修复：Twikoo 二级回复展开失效 & 相册灯箱直跳直链 & 昵称波浪线/站长标签 & 友圈移动端溢出

**背景：** 用户一次报四个问题：①Twikoo 二级回复下继续新增回复后，点「展开」看不到下方评论；②`/galleries/junxun` 从导航栏直接访问时点击图片直接跳图片直链，只有带锚点的 `/galleries/junxun#gallery-1` 能弹出 Fancybox；③昵称下方要波浪线（颜色随每页随机强调色，浅色明显 / 深色柔和）+ 站长评论旁要「站长」标签带小装饰；④友圈页移动端仍有溢出。要求仅改必要代码，布局 / 功能 / 样式全部保留。

**修改文件：**

- `src/components/comment/Twikoo.astro`
- `src/layouts/Layout.astro`
- `src/pages/galleries/[slug].astro`
- `src/pages/links/fcircle.astro`

**Bug 1 根因（Twikoo 展开失效）：** 组件自己的 `[data-engine='twikoo'] .tk-replies { max-height:220px!important; overflow:hidden!important }` 选择器特异性比官方 `.tk-replies-expand { max-height:none; overflow:unset }` 高，且带 `!important` → 展开态被一起压回 220px + 裁剪。twikoo 1.7.19 bundle（jsDelivr，772129 B）实测：展开类是 `{'tk-replies-expand': isExpanded || !showExpand || replying}`，展开阈值是 `scrollHeight > 236`。修法：补一条同级 `!important` 显式放开。

**Bug 2 根因（相册直跳直链）—— 三层叠加，缺一不可：**

1. **Swup 每切一次页会重新执行整个 document 里的所有 `<script>`。** `@swup/astro` 默认 `reloadScripts = true` → 启用 `SwupScriptsPlugin`（`@swup/scripts-plugin@2.1.0`，默认 `head:true, body:true, optin:false`），它挂 `content:replace`，用 `document.querySelectorAll('script:not([data-swup-ignore-script])')` 把每个 script 克隆重建并重新执行。于是 Swup 切页后 `/fancybox/fancybox.umd.min.js` 被重跑 → `Fancybox` 变成全新实例（`openers` 空、点击监听器没了），而 `initFancybox` 的 `astro:page-load` / `swup:page:view` +200ms 重绑可能先于 UMD 重加载完成 → 灯箱彻底没绑上，点击落回原生 `<a href>` 直跳图片。
2. **Swup 的点击代理不会认 Fancybox 的 `preventDefault`。** delegate-it 6.4.0 把监听挂到 `document.documentElement`（`base instanceof Document ? documentElement : base`），而 `handleLinkClick` 里只判 `shouldIgnoreVisit`，**不检查 `event.defaultPrevented`** → 即使 Fancybox 在 `document.body` 上先 preventDefault，Swup 照样 `performNavigation` 去加载图片 URL。
3. **Fancybox 6.0.29 的 unbind 不摘监听。** `unbind(el)` 不传 selector 时只删掉 body→selector 的 Map 项、**不调 `removeEventListener`**；`bind` 又只在 `Map.size === 1` 时才 `addEventListener` → 每次切页的 unbind+bind 基本是空转，绑定丢了也不会被察觉。

「带锚点能用」的解释：`/galleries/junxun#gallery-1` 是整页加载进的（Fancybox 在 DOMContentLoaded 绑了一次，没有 Swup 重执行），不是 Swup 切页进的 —— 与哈希本身无关。

**Bug 2 修法：** Fancybox UMD 与初始化脚本都加 `data-swup-ignore-script`（初始化脚本的监听全挂在 `document` 上、Swup 永不替换，首载即生效；不加标记会被每页重跑一次，`astro:page-load` 监听器随切页数无限累加）；相册 `<a>` 加 `data-no-swup` 让 Swup 完全不碰图片链接；`initFancybox` 加「当前页无 `[data-fancybox]` 就早退」。

**Twikoo 样式（保留原有两行评论头 + 0.55rem 子回复缩进）：**

- 波浪线从 `.tk-nick-link` 移到 `.tk-nick`：bundle ~700270 实测昵称有两个 DOM 分支（有主页链接 `<a class="tk-nick tk-nick-link">`、没有 `<strong class="tk-nick">`），两者都带 `.tk-nick` → 每个用户昵称下都有波浪线，不漏普通访客。颜色走 `--color-accent`（AccentColorInjector 每页随机注入）；浅色 62% + 1.6px 明显，`html[data-theme='dark']` 降到 36% + 1.2px，暗色辉光 14px→10px、悬停 90%→58%。
- 站长标签兜底：`.tk-comment.tk-master .tk-meta:not(:has(.tk-tag)) .tk-nick::after` 画「站长」药丸 + 皇冠 SVG（三层背景：高光条 + 皇冠 + accent 渐变）。官方 `.tk-tag-green` 只在云端配了 `MASTER_TAG` 时才渲染（i18n 默认文案是「博主」），配了就由官方标签接管、`:has()` 让兜底自动退让；不支持 `:has()` 的旧浏览器整条规则被丢弃，静默降级。刻意不挂 `mcy-tag-sweep` —— 那条 keyframe 只挪 `background-position`，会把 0.72em 的皇冠带着在药丸里横滑。
- `prefers-reduced-motion` 名单里 `.tk-nick-link` → `.tk-nick`。

**友圈移动端（只影响 ≤768px，PC 一条不改）：** `.card` 内边距 1.15/1.1rem → 0.8/0.85rem（单列后每张卡少浪费 ~18px）；`.card-author`（桌面端 `width:fit-content` + 无 overflow）限宽 + 裁切，长作者名不再撑出卡片；`.card-title` / `.card-date` 拆成独立规则，`.card-date` 加 `calc(100% - 1rem)` + 省略号；`.random-content` 提前到 768px 改竖排（fclite 自己要到 ≤600px 才改，而横排时 `.random-button-container` 是 `flex-shrink:0`，601–768px 这段最易横撑），按钮容器满宽居中可换行；`.status-card` 补 `min-width:0`（网格项默认 `min-width:auto`）。原有 `overflow-x: clip` 兜底保留。

**验证：** `pnpm astro check` 119 files / 0 errors / 0 warnings / 0 hints；`pnpm build` 210 pages Complete + Pagefind 88 pages / 11063 words。dist 核验：`dist/index.html` 的 Fancybox UMD 标签带 `data-swup-ignore-script`；`dist/galleries/junxun/index.html` 含 `data-fancybox="gallery" data-no-swup`；`_spec_.*.css` 含 `.tk-replies.tk-replies-expand{max-height:none!important;overflow:visible!important}`、`not(:has(.tk-tag))` 站长兜底、`underline wavy` ×2；`_astro/fcircle.*.css` 的 `@media (max-width: 768px)` 块含全部新增规则。

**注意：**

- `SwupScriptsPlugin` 仍会在每次切页重跑**其它**外链脚本（Twikoo CDN、fclite.js、livephoto、Umami/Vercel analytics）。inline 脚本靠站点现有的 `window.__xxxInit` 幂等守卫吸收；以后再看到「重复初始化」症状，给那个 script 加 `data-swup-ignore-script`。彻底关掉要在 `astro.config.js` 的 swup 里设 `reloadScripts: false`，但那也会让被替换容器内的脚本不再执行，本次没动。
- 兜底站长标签依赖 `:has()`（Chrome 105+ / Safari 15.4+ / Firefox 121+）；旧浏览器只是不显示这枚药丸，不影响其它样式。
- `data-no-swup` 同时让 Swup 的 hover 预加载跳过图片链接（`SwupPreloadPlugin` 走 `shouldIgnoreVisit` 判断）—— 这是预期的，把图片 URL 当页面预加载没意义。
- Twikoo 的展开阈值是 bundle 内的常量 236px，本站折叠态用 220px。回复块高度落在 220–236px 之间时会「被裁但没展开按钮」，概率低；想彻底对齐可把 220px 提到 236px（代价是折叠块更高）。

### 2026-09-17 23:34 - `scripts/sync.mjs` 白文件预检查修复（目录型 .gitignore pattern 的误报）

**背景：** 跑 `pnpm d` 被前置检查拦下：`❌ 以下路径未被 .gitignore 排除，已中止同步：.reasonix`。但 `.reasonix` 本来就在 `.gitignore` 里，只是那个目录已经被删掉了。

**根因：** `.gitignore` 写的是 `.reasonix/`（带尾斜杠 = **只匹配目录**）。`git check-ignore` 对**不存在**的路径无法判断它是不是目录，于是匹配不上：实测同目录下 `.reasonix/`（带斜杠）→ IGNORED，`.reasonix`（不带斜杠、路径不存在）→ NOT-IGNORED。而 `sync.mjs` 的 `MUST_IGNORE` 传的是不带斜杠的 `.reasonix` → 误报为「未排除」，同步直接中止。同理 `.env` 之所以能过，是因为它的 pattern 不带斜杠。

**修改文件：** `scripts/sync.mjs`

**修改内容：** `isIgnored(p)` 开头加一句存在性判断 —— 本机不存在的路径不可能被 git 提交，直接视为安全：

```js
import { existsSync } from 'fs'

function isIgnored(p) {
  if (!existsSync(path.join(ROOT, p))) return true
  try {
    execSync(`git check-ignore -q "${p}"`, { cwd: ROOT, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}
```

保留目录型 pattern 的原始写法（`.reasonix/`），**没有**为了迁就检查去把 `.gitignore` 改成 `.reasonix`。反过来说：如果哪天真的出现一个名为 `.reasonix` 的**文件**，`git check-ignore` 仍会判 NOT-IGNORED 并正确中止，防误推的语义没被削弱。

**验证：** `pnpm d` 预检查通过（`dist` / `node_modules` / `.astro` / `reasonix.toml` → IGNORED，`.reasonix` / `.env` → 因不存在跳过），提交 `174cc95` 推送成功。

**上一笔 `8e35404` 的实际内容（供核对）：** 除本次 4 个 src 文件 + CLAUDE.md 外，`git add -A` 还带走了工作区里**早已存在**的改动：`docs/twikoo-mail-template/` 三个文件的删除（本次会话未动过 docs）与 `src/data/ai-summaries.json` 的 +5 行（`pnpm build` 的 `gen-ai-summaries.mjs` 重新生成）。

### 2026-09-16 - Twikoo 昵称/身份标签/点赞行视觉重做 & 卸载 @vercel/speed-insights

**背景：** 用户反馈上一版 Twikoo CSS 三处问题：①第二行点赞/踩/回复是灰字，应该有强调色；②昵称后面的身份标签不美观、「丢掉了」；③要求参考 `blog.weasel6.cn` 的用户名与标签样式，做成本站独有的科技感。同批还要求卸载 @Speed Insights 插件。

**参考实现（`blog.weasel6.cn/assets/css/twikoo-custom.css` 实测）：** `.tk-action-link` 与 `.tk-action-icon` 全部走 `var(--tk-accent)`（不是灰色）；身份标签是**实心渐变药丸 + 深色文字**，并靠 `overflow:visible` + `::before` data-URI SVG 把徽标探出药丸上沿（站长=猫咪、邻居=皇冠）。

**关键事实（1.7.19 官方 bundle 逐字核对，非推测）：**

- 标签渲染为纯文本 `<span class="tk-tag tk-tag-green">站长</span>`，**bundle 内没有任何标签图标**——参考站的图标全是 CSS 画的，所以要复刻必须自己写 SVG data URI。
- 官方 `.tk-action-count { height:1.5rem; line-height:1.5rem }` 是个 24px 高的固定盒子，会把第二行整体撑高、按钮纵向不再居中——这就是「第二行不好看」的根因之一。
- 官方 `.tk-actions { display:none }` + `.tk-comment:hover .tk-actions { display:inline }` 是悬停才显示的管理按钮；上一版用 `display:inline-flex !important` 强制常显，站长操作按钮会一直露出（已修）。

**修改文件：**

- `src/components/comment/Twikoo.astro`（重写 `<style is:global>`，容器结构与两行布局不变）
- `src/layouts/Layout.astro`（删 SpeedInsights import + `<SpeedInsights />`）
- `src/components/head/AccentColorInjector.astro`（注释同步）
- `package.json` / `pnpm-lock.yaml`（`pnpm remove @vercel/speed-insights`）

**修改内容：**

- **昵称**：`.tk-nick-link` 走 `var(--color-accent)` + 波浪下划线（`underline wavy`，45% accent 色，1.5px 粗，offset 4px）+ `text-shadow` accent 辉光；悬停加粗辉光并上浮 1px。中文防竖排的 `writing-mode:horizontal-tb` 保留。
- **身份标签**：基类改为实心渐变药丸（`color:#0b1020`、`font-weight:800`、`letter-spacing:.04em`、`overflow:visible`、`border:0`）；四个变体各是「斜向高光条 + 纯色渐变」双层背景（`background-size:220% 100%,100% 100%`），共用一条 `@keyframes mcy-tag-sweep` 只移动背景位置（第二层尺寸 100%，位置变化对它不可见）→ 只有高光在扫。徽标用 `::before` 探出上沿（`top:-.85em`、`1.15em` 见方、`translateX(-50%)`、`pointer-events:none`）：站长=星形、置顶=图钉、待审核=时钟、`tk-tag-blue`=皇冠。图标 SVG 全部写成无空格路径（逗号分隔坐标、`viewBox='0,0,24,24'`），避免 data URI 编码被压缩器改写。
- **站长标签跟随机强调色**：渐变两端是 `color-mix(in srgb, var(--color-accent) 90%, #000)` 与 `color-mix(... 45%, #fff)`，带 accent 外发光——每页随机色不同，标签颜色随之变；置顶/待审核/邻居仍用固定红橙/琥珀/蓝紫三色以区分语义。
- **第二行按钮**：`.tk-action-link` 默认即 accent 色 + `9%` accent 底 + `30%` accent 描边药丸；悬停/聚焦整颗变实心 accent + 外发光；`.tk-liked` 实心 accent 白字，`.tk-disliked` 实心 `#f56c6c` 白字；图标 `color:currentColor`（不再固定 `#409eff`）；`.tk-action-count` 归零成 `height:auto;line-height:1.2` + `tabular-nums`。
- **修 bug**：`.tk-actions` 恢复「默认 `display:none` + 悬停 `inline-flex`」；站长操作按钮单独做成小药丸。
- **动效降级**：`prefers-reduced-motion` 里额外关掉四个标签的 `mcy-tag-sweep`。

**卸载 Speed Insights：** 删除 `Layout.astro` 的 import 与 `<SpeedInsights />`、`package.json` 依赖，`pnpm remove` 同步锁文件；保留 `@vercel/analytics`。

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints（119 files）；`pnpm exec astro build` 210 pages Complete；产物核验：新 CSS 落在 `dist/_astro/_spec_.egmn4Oh5.css`（24718 B），`mcy-tag-sweep` 5 处、四色标签各 3 处、`220% 100%` 4 处、4 段 `data:image/svg+xml` 徽标、`overflow:visible!important` / `height:auto!important` / `display:none!important` / `underline wavy` / `currentColor!important` 均在；`dist` 全量 HTML/CSS/JS 中 `speed-insights` 匹配数 **0**。

**注意：** ①标签徽标探出上沿依赖 `.tk-comment { padding:1rem }` 留出的空间，缩进/间距改动时留意不要把它裁进 `.tk-replies { overflow:hidden }` 边界；②标签颜色里唯一「随页变」的是站长色，其余三色是固定语义色，别当成 bug；③Twikoo 云端的 `MASTER_TAG` 文案由 `twikoo.mingcy.cn` 服务端配置，本地只负责样式。

### 2026-09-15 22:20 - 页脚公安备案：豫 ICP + 新公网安备同行并排 & 备案图标本地化

**背景：** 用户要为页脚补充公安联网备案信息（`新公网安备65010602001220号`），与已有的豫 ICP 备案**同一行**展示；并指出备案图标「可以获取到、可以添加」。原页脚只有一枚 ICP 备案链接（`src/components/footer/Footer.astro` 44–47 行），无公安备案、无图标。

**图标获取与瘦身（实测）：**

- 官方图标 `https://www.beian.gov.cn/img/ghs.png`：20×20 RGBA，文件 **19256 B**
- 其中 **15176 B（79%）是 `iTXt` 块里的 Adobe XMP 元数据**（keyword `XML:com.adobe.xmp`，政府站点编辑器自动写入），与显示完全无关
- 剥离后 **4068 B**，块序列 `IHDR → pHYs → iCCP → cHRM → IDAT → IEND`，逐块 CRC 校验全部正确
- `IDAT` 解压数据 SHA256 与官方原图**逐字节一致**（`06751fdb0d2a5f8892bce660`）→ 图像零损失，仅丢元数据
- 本地化理由：与本仓库 twikoo / waline / fclite / fancybox 同款做法。实测 `www.beian.gov.cn` 直连返回 `Connection was reset`，外链图标在跟踪防护/断网下会裂图
- 核验链接 `https://beian.mps.gov.cn/#/index?code=65010602001220` 实测 200；公安部下发的传统格式 `http://www.beian.gov.cn/portal/registerSystemInfo?recordCode=65010602001220` 会 302 到前者。方案中默认采用前者，用户确认执行 → 采用前者

**修改文件：**

- `public/beian/ghs.png`（**新建**，4068 B，公安部国徽盾标）
- `src/components/footer/Footer.astro`

**修改内容：**

- Footer 备案号行 `<div>` → `<div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">`：
  - 原 ICP 链接原样保留（`https://beian.miit.gov.cn/`）
  - 中间插竖线分隔符 `<span class="select-none opacity-50">|</span>`（沿用页脚运行天数/字数行的分隔风格）
  - 新增公安备案链接 + 图标：`<img src="/beian/ghs.png" alt="公安备案图标" width="20" height="20" class="inline-block align-[-3px]">` + `<span>新公网安备65010602001220号</span>`
  - `flex-wrap`：窄屏放不下自动换行，不撑破页脚
  - `width/height` 写死避免 CLS；`align-[-3px]` 让 20px 图标贴住 14px 文字基线
  - 外链由 `Link.astro` 自动加 `target="_blank" rel="noopener noreferrer"`；`data-no-swup` 沿用 ICP 链接写法（跳出站点不做 SPA 切换）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 210 pages Complete；dist 核验：`dist/beian/ghs.png` 存在（4068 B），209 个 HTML 中 **208 个**引用 `/beian/ghs.png`（唯一例外 `404.html` —— 该页用基础 `Layout.astro`，本身就不含 Footer，与本次改动无关），两枚备案号确实在同一个 `flex` 容器内；图标渲染正常（非空、非裂图）。

**注意：**

- 公安部备案图标本体只有 **20×20**，不要再放大成高清版（会糊），需要更大尺寸只能换设计
- 日后要改备案编号，只改 `Footer.astro` 里的链接 `code=` 参数与 `<span>` 文案两处
- `ghs.png` 无 hash，改内容后部署需留意浏览器缓存
- 本次仅动 `Footer.astro` 一行容器与新增一个静态图标；`config.json`、`astro.config.js`、`package.json` 未改，无新增依赖

### 2026-09-15 - 双评论系统（Twikoo + Waline）：胶囊切换器 + 记忆选择 + 双端本地化

**背景：** 用户已部署 Twikoo（`twikoo.mingcy.cn`），另新建了 Waline 服务端（`waline.mingcy.cn`，Vercel，`X-Waline-Version: 1.41.6`），要求博客同时拥有两套评论系统，评论区上方可切换，样式符合本站科技感。

**服务端实测（重要）：**

- Waline v1.41 的评论接口是**单数** `GET {serverURL}/api/comment?path=…`（返回 `{errno:0,data:{count,data}}`）；`/api/comments`（复数）、`/api/pv`、`/api/verify`、`/api/emojis` 均 404 → **浏览量统计接口不存在**（不影响，本站已有 Umami），客户端不可开启 `pageview`
- `@waline/client@3.15.2` 本地源码确认请求路径为 `${serverURL}/api/comment`，与服务端匹配；`init()` 返回 `{ el, update(opts), destroy() }`
- **`requiredMeta` 会被白名单过滤**（只认 `nick`/`mail`/`link`）：写 `'email'` 会被**静默丢弃**，必须写 `'mail'`
- **`dark` 支持选择器形式**：`dark: '[data-theme="dark"]'` 让 Waline 原生跟随本站明暗切换，无需额外桥接
- 表情集从 `{folderUrl}/info.json` 读清单（非目录列表）；unpkg 目录 URL 会 301 到 `app.unpkg.com`，故改用 jsDelivr（站点已依赖该 CDN）
- 本地 `@waline/client` 有 `waline.js`(262KB，自包含) 与 `slim.js`(62KB，**带裸 import 不可直接在浏览器用**) 两种构建，必须用 `waline.js`

**修改文件：**

- `src/components/comment/Comments.astro`（重写）
- `src/components/comment/Twikoo.astro`（重写）
- `src/components/comment/Waline.astro`（新建）
- `src/layouts/Layout.astro`（新增 body 级评论驱动控制器）
- `src/components/post/CommentFAB.astro`（滚动目标改当前激活引擎）
- `src/pages/links/apply.astro`（一键导入模板适配双引擎 + `bare` 外壳）
- `src/styles/global.css`（`.comment-block` 加入滚动毛玻璃降级名单）
- `src/content/posts/remark/index.md`（新增「双评论系统」章节）
- `public/waline/waline.js` + `waline.css`（新建，本地化）
- `public/twikoo/twikoo.all.min.js`（新建，本地化）

**修改内容：**

- **Comments.astro 重写**：毛玻璃卡片外壳（`border-radius:1.25rem` + `backdrop-filter: blur(12px)` + 顶部 accent 流光线 `::before`）+ 标题左侧发光竖条 + **胶囊分段切换器**（`grid-template-columns:1fr 1fr`，高亮块 `--color-accent / 0.14` 填色 + 内描边 + 外辉光，`cubic-bezier(0.34,1.56,0.64,1)` 弹性滑动）+ `role=tablist` / `aria-selected` / ← → 方向键 + `prefers-reduced-motion` 降级 + 懒加载 spinner（失败时停止旋转并给出可读提示）。新增 `bare` prop：友链申请页嵌套在其它卡片内时去掉自身外壳
- **Twikoo.astro 重写（关键 bug 修复）**：Twikoo 内部用 Vue 2 的 `new Vue({...}).$mount('#twikoo')`，而 **Vue 2 的 `$mount(el)` 会替换掉目标节点** → 替换后 `#twikoo` 的 id 与 class 一并消失，直接给 `#twikoo` 加 `display:none` 完全无效（用户看到的现象：切到 Waline 后 Twikoo 评论仍显示）。修复：多包一层 **`data-engine="twikoo"` 的外壳**，显隐控制与幂等标记 `data-ready` 都打在外壳上，**CSS 一律改用 `[data-engine='twikoo']` 作用域**（`#twikoo` 作用域在替换后全部失效，原主题样式也会随之丢失）
- **Layout.astro 评论驱动控制器**（body 级常驻脚本，Swup 不重建 body → 单例；main 内的 inline 脚本由 SwupScriptsPlugin 每次重跑，写在组件内会导致每切一篇就新建实例且旧的永不销毁）：
  - 选择写入 `localStorage['mcy-comment-driver']`，**下次打开自动沿用上次选择的系统**，默认 Twikoo
  - **双引擎均懒加载**：只有真的切到对应系统才下载；loading 指示器只跟随当前展示的系统（`driver !== shownDriver` 时不动，避免误关别人的加载态）
  - Twikoo：同源加载 `/twikoo/twikoo.all.min.js`，`data-ready` 打在外层壳上（`#twikoo` 会被替换）
  - Waline：`import('/waline/waline.js')` 动态加载 + 注入本地 CSS，`noCopyright:true`、`highlighter:true`、`requiredMeta:['nick','mail']`、`pageSize:20`、`commentSorting:'latest'`
  - **Swup 切页**：`swup:page:view` / `astro:page-load` 双事件 + 150ms/700ms 双定时器兜底；Waline 实例仍挂在当前文档 → 复用并 `update({path})`；实例挂在已被移除的节点 → `destroy()` 后重建到新容器；切到无评论区页面 → `destroy()` 释放
  - 首次同步时临时关闭高亮块 transition，避免从默认位滑到记忆位的多余动画
- **CommentFAB.astro**：显隐判断由 `#twikoo` 改为 `#comment-block`；点击滚动目标改为 `#comment-block .comment-driver.is-active`（否则选了 Waline 后会滚到隐藏元素）；补 `swup:page:view` 监听（原 `swup:content:replaced` 在 Swup 4 不存在）
- **apply.astro**：`getTextarea()` 按 `data-engine` 取当前激活引擎的输入框（Twikoo → `.el-textarea textarea`，Waline → `#wl-edit`）；`MutationObserver` 从只监听 `#twikoo` 改为监听整个 `#comment-block`（懒加载下输入框可能由后切到的引擎注入）
- **global.css**：`.comment-block` 加入 `body.is-scrolling` 的 `backdrop-filter: none` 降级名单
- **体积对比（gzip 实测）**：Twikoo 772KB / 206KB gzip；Waline 262KB / 90KB gzip + CSS 4.8KB gzip。改动前每篇文章页都会从 jsDelivr **全量拉取 772KB Twikoo**；改动后按用户选择按需加载

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 208 pages Complete；dist 核验：`/twikoo/twikoo.all.min.js` 被引用、无 `<script>` 指向 jsDelivr 的 twikoo（`/tags/twikoo` 页内匹配到的是正文文本非脚本）、`data-engine="twikoo"` 外壳与 `id="waline" data-engine="waline"` 均存在、`public/twikoo` + `public/waline` 随构建拷贝。

**注意：**

- **Twikoo 无公开的销毁 API**（bundle 内无 `unmount`/`destroy` 全局导出），Swup 切页后旧实例的 JS 引用无法释放，只会随导航次数累积；这是 Twikoo 自身的限制，本次未引入回归（改动前每页同样会新建实例）
- Waline 服务端未开启浏览量统计（`/api/pv` 404），客户端已确认未传 `pageview`，不会发出无效请求
- 表情集仍需外网（jsDelivr `info.json`），被拦截时仅影响表情面板，不影响评论主体

### 2026-08-16 - Umami 浏览量尾斜杠归一化累计 & 页脚游客数改曝光次数

**背景：** 用户反馈单篇文章浏览量「明显偏少」，并指出根因——Umami 历史记录里同一篇文章可能同时存在**带尾斜杠**（旧 `/2024/09/07/ode/`）与**不带尾斜杠**（新 `/2026/08/08/new-work`）两条 path 记录；原 `ReadCount.astro` 构建 map 时把 `map[normalizePath(row.x)] = value` 直接赋值，**后写覆盖先写**，等于丢掉了其中一条记录的浏览量 → 展示偏少。同时要求页脚由「游客访问数」改为「曝光次数」，数字化用 pageviews。

**修改文件：**

- `src/components/post/ReadCount.astro`
- `src/components/footer/SiteVisitors.astro`

**修改内容：**

- **ReadCount.astro**：构建全站 path→views map 时由「后写覆盖」改为**按归一化 key 累加**（`map[key] = (map[key]||0) + value`）。`normalizePath` 去尾斜杠后同篇文章的两条记录（`/a/b/` 与 `/a/b`）合并为一条，浏览量相加，恢复完整计数。`startAt=0` 本就全时段累计，无需改动。
- **SiteVisitors.astro**：数据源字段 `stats.visitors`（独立访客）→ `stats.pageviews`（页面曝光）；文案「已经有 N 游客访问过本站」→「本站已被曝光 N 次」，`title`/`aria-label` 同步改为「全站累计曝光次数」。

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete。（全量 `pnpm build` 的 AI 摘要生成步骤需外网调用 ai.mingcy.cn，本环境无外网故仅验 check+build。）

### 2026-08-16 - 阅读数组件修复（COUNTER_GET 真实返回结构 & 去数组批量）

**现象：** `ReadCount.astro` 部署后博客一直显示 `--`。

**根因（对照上游源码 + 实测接口确认）：**

- **读错字段**：Twikoo `COUNTER_GET` 返回结构是 `{ data: <计数doc>, time, updated, accessToken }`，计数在 **`data.time`**（上游 `counterGet`：`res.data = record.data[0]`），原组件按 `item.value` 读取 → 永远 `NaN` → 全部 `--`
- **数组批量不被支持**：实测 `url` 传数组返回 `data:{}`（后端精确匹配 `where({url: 单值})`）；`COUNTER_GETS` 事件返回 `code:1001`「请更新云函数」——该后端无批量事件，只能单 url 逐条查询
- **上游行为确认**：每次 `COUNTER_GET` 读取会**自增计数**（`res.updated = await incCounter(event)`）；未统计过的新文章返回 `data:{}`（应显示 0，非错误）；读取活跃期多篇文章可能因 bucket 聚合共享一条计数 doc（实测 5 篇近文共享 `_id=6a813bcf…`）

**修改内容：**

- `src/components/post/ReadCount.astro` 脚本部分重写：
  - **批量一次请求 → 按 path 分组并发单查**（逐 url 发 `COUNTER_GET`）
  - **数值读取 `data.time`**，兜底 `data.value`，空 doc 记 0
  - **会话级内存缓存 `cache[path]`**：同一 path 只请求一次，Swup 切页/重复渲染不重复请求、不重复自增
  - 失败显示 `--` 且不缓存（瞬时网络错误不污染会话）
  - 其余不变：幂等守卫、DOMContentLoaded 延迟、Swup/astr5 切页重拉、`text-secondary` 主题适配

**验证：** `pnpm build` 通过（204 pages, 0 errors, Pagefind 85 pages）；dist 中脚本含 `data.time` 读取逻辑；接口单查返回 `{data.time: N}` 正常。

**注意（向后端/数据）：** 该部署是逐次读取自增 + bucket 聚合模型，页面卡片每刷新一次会让对应计数 doc `time` +1；若需精确按文章隔离统计，需在后端数据层面确认 counter 集合记录（本项目仓库只读边界外）。

### 2026-08-16 - 文章浏览量展示（Twikoo COUNTER_GET 纯 fetch，不引入 SDK）

**修改文件：**

- `src/components/post/ReadCount.astro`（新建，浏览量标签组件）
- `src/components/post/PostCard.astro`（首页卡片 meta 行接入）
- `src/components/post/PostMetaInfo.astro`（文章页头部 meta 接入）
- `src/pages/[year]/[month]/[day]/[slug].astro`（给 PostMetaInfo 传 postPath/postTitle）

**修改内容：**

- **新建 `ReadCount.astro`（可复用 Astro 组件）**，接收两个 props：
  - `postPath`：文章路由路径（如 `/2026/08/16/slug`），作为 Twikoo 计数 key
  - `postTitle`：文章标题
  - `class`：透传 class 控制间距/对齐（可选）
  - 渲染：眼睛 SVG + 「阅读量」文字 + 数字（初始 `--`），`text-secondary` 色 + `tabular-nums`，随 CSS 变量自适应明暗/随机 accent 主题
- **纯 fetch 请求**：`POST https://twikoo.mingcy.cn`，body `{ event: 'COUNTER_GET', url: <单路径>, title: <单标题> }`，无需 token、无自定义头；**未引入 twikoo 完整 SDK**
- **同页多实例处理**：由幂等守卫的 `is:inline` 内联脚本按 path 分组并发单查（~~数组批量一次请求~~ 该后端不支持，见下方修复记录），同 path 会话级缓存只请求一次
- **不阻塞首屏**：内联脚本（约 1.5KB，零外部依赖）仅首个实例注册逻辑，`DOMContentLoaded`/`requestAnimationFrame` 延迟执行，避开首帧；fetch 为异步，不参与渲染关键路径
- **异常兜底**：网络/HTTP 非 200/JSON 解析失败均 `.catch` 后显示 `--`，页面绝不崩溃；千分位格式化（1,234）
- **Swup 兼容**：监听 `swup:content:replaced` / `astro:page-load` / `popstate` 在切页后重新拉取新页面 `.read-count` 节点（`data-state=done` 防重复请求）
- **接入位置**：PostCard 的 `.post-meta`（日期 | 时长 | 阅读量）；文章页 PostMetaInfo 头部 meta（postPath 用 `mdSlug`）

**保留不动：** `Comments.astro`、`Twikoo.astro`（评论模块原样），`config.json` 未改，无新增依赖。

**原因：** 在文章卡片与详情页展示 Twikoo 已统计的浏览量，无需加载完整评论 SDK、不影响 LCP、异常降级为 `--`。**注意：** 本组件只读计数（COUNTER_GET），不触发自增；如需自增可在阅读时另发 `KEEP_COUNTER`。构建通过（204 pages, 0 errors, Pagefind 85 pages）。

### 2026-07-16 15:51 - 博客文章迁移 & 构建修复完成

**修改文件：** 多文件

**修改内容：**

- 从旧主题 `G:\文档\astro-devosfera` 迁移 74 篇博客文章至 `src/content/posts/`，转换 frontmatter 键名（`pubDatetime→date`、`description→summary`、`ogImage→cover`）
- 拷贝 422 张图片至 `src/assets/images/`，按 slug 前缀重命名
- 新增背景效果（backdrop、grid、cursor-glow、grain）到 `src/styles/global.css`
- 新增内容标签样式（彩色文字、彩虹动画、标签、标记、spoiler）到 `src/styles/markdown.css`
- 清理 `src/pages/[spec].astro` 中的友链引用
- 降级 `@astrojs/sitemap@3.7.3` → `3.2.0`（修复与 Astro 4.6.1 的兼容性）
- 安装缺失的 `remark-ins`、`remark-supersub` 依赖
- 更新 zod `3.22.4` → `3.25.28`（满足 zod-to-json-schema 3.25.2 peer dep）
- 配置 `passthroughImageService()` 绕过 sharp 安装失败
- 修复 YAML frontmatter 解析错误（cloud-photography、tree-photo）
- 修复损坏的图片引用（pdf-repalr、music_download、sqyy、qqth）
- 修复 Shiki 语言代码（undefined、TOML、YAML）
- 重命名 `mother's-day.md` → `mothers-day.md`（撇号导致 Vite 解析失败）
- 修复 TypeScript 错误：HeaderContent.tsx 可选链、galleries/[slug].astro lightbox 脚本 `is:inline`

**原因：** 完成从旧主题到新主题的完整迁移，确保 `pnpm build` 通过（146 页面、371 图片、sitemap、Pagefind 索引）

### 2026-07-16 16:10 - 固定链接重构 & 文章子文件夹迁移

**修改文件：** 多文件

**修改内容：**

- 路由文件从 `src/pages/posts/[year]/[month]/[day]/[slug].astro` 移至 `src/pages/[year]/[month]/[day]/[slug].astro`，删除旧目录
- 74 篇文章从单文件 `src/content/posts/<slug>.md` 迁移至子文件夹 `src/content/posts/<slug>/index.md`
- 422 张图片从 `src/assets/images/` 移入对应文章子文件夹，按 `<slug>-<name>` 命名
- 修复迁移后的图片引用路径（gkd、123-liuliang 等）
- 更新 `scripts/new-post.js` 支持子文件夹创建模式
- 修复 `Header.tsx` 中 `overflow-hidden` → `overflow-visible`（友链下拉菜单被裁剪）
- 新增文章 `src/content/posts/styling-guide/index.md`（进阶排版指南，覆盖 KaTeX、MDX、代码块高亮、表格增强、脚注等）

**原因：** 消除 URL 中 `/posts/` 前缀，优化文章内容组织（图片与 Markdown 同目录），修复导航栏二级菜单显示。构建通过（153 页面、372 图片、0 错误）

### 2026-07-16 17:50 - 关于页面重写 & 友链整合为单文件

**修改文件：**

- `src/pages/about.astro`（新建）
- `src/data/links.ts`（新建）
- `src/pages/links/index.astro`
- `src/content/config.ts`
- `scripts/new-friend.js`
- `src/content/friends/`（删除目录及 33 个 yaml）
- `src/components/FriendList.astro`（删除，未使用）

**修改内容：**

- 新建 `src/pages/about.astro`：参考 `mingcy.cn/about` 设计，包含头像名片、座右铭、技能环形进度条、生涯时间线、游戏&兴趣区块，使用本项目主题的 accent 配色与 glass-card 样式
- 新建 `src/data/links.ts`：将 33 个散落的 yaml 友链合并为单文件，按 category 分组（大佬们/朋友们/Link3/软件阁/大家庭），顺序参考旧主题 `G:\文档\astro-devosfera\src\data\links.ts`
- 修改 `src/pages/links/index.astro`：`getCollection('friends')` → `import { friendLinks } from '@/data/links'`
- 删除 `src/content/friends/` 目录及全部 33 个 yaml 文件
- 删除 `src/content/config.ts` 中的 `friendsCollection` 定义
- 删除未使用的 `FriendList.astro` 组件
- 更新 `scripts/new-friend.js`：从新建 yaml 改为追加条目到 `src/data/links.ts`，增加分类选择

### 2026-07-17 13:00 - 移动端布局溢出修复 & 友圈链接跳转修复 & Umami 统计注入

**修改文件：**

- `src/components/header/Header.tsx`
- `src/styles/global.css`
- `src/pages/links/fcircle.astro`
- `src/layouts/Layout.astro`

**修改内容：**

- Header 容器 `md:px-4` → `px-4`，修复移动端无水平 padding 导致内容贴边的问题
- `html {}` 新增 `overflow-x: hidden`，防止全局元素溢出造成水平滚动
- 友圈 iframe sandbox 追加 `allow-top-navigation allow-popups`，修复内部链接无法跳转的问题
- Layout head 注入两条 Umami 统计脚本（自建 `um.mingcy.cn` + 云版 `cloud.umami.is`），添加 `is:inline` 消除 Astro 提示

**原因：** 修复移动端布局错位（header 贴边、全局溢出）；解锁 iframe 内链接导航权限；部署双 Umami 实例保障统计不中断。构建通过（0 errors, 0 warnings, 0 hints）

### 2026-07-17 13:42 - Sitemap 完善 & 性能优化 & TOC 重写（Shiro 风格）

**修改文件：**

- `astro.config.js`
- `src/layouts/Layout.astro`
- `src/components/post/PostToc.tsx`
- `src/pages/[year]/[month]/[day]/[slug].astro`
- `src/components/post/ActionAside.tsx`

**修改内容：**

- Sitemap 配置：添加 `filter`（排除 404）、`lastmod`（构建时间）、`changefreq: weekly`、`priority: 0.7`，所有 URL 带上 lastmod 标签
- 性能优化：两条 Umami 统计脚本添加 `async`，避免阻塞页面渲染
- TOC 重写：
  - 滚动追踪从 `scroll` 事件 + `getBoundingClientRect` 改为 **`IntersectionObserver`**（`rootMargin: '-80px 0px -80px 0px'`），性能更好
  - 激活指示器从水平条改为**垂直线**（`w-[3px] rounded-sm`），使用 **Framer Motion `layoutId` + `layout`** 实现丝滑波浪滑动
  - 新增 `scaleY: 0 → 1` 弹簧入场动画（`stiffness: 500, damping: 22`），激活时线条「弹出来」
  - 所有条目显示可见灰线（`w-[1.5px]`），激活时变为 accent 色 + 加粗
  - 激活文本 `ml-[18px] → ml-[22px]` 微移，配合弹出感
  - 新增 `depth` 缩进（h3+ 层级增加 `0.6rem` padding）
  - 点击标题使用 `smooth` 滚动（offset -80px）而非原生锚点跳转
- 侧边栏布局：`sticky top-24` 优化定位
- ActionAside：移除 `absolute bottom-0 translateY` 改为流式布局 `pt-6`，消除阅读进度下方的空白

**原因：** Sitemap 缺少 lastmod 不利于 SEO；Umami 脚本无 async 可能阻塞渲染；TOC 依赖 scroll 事件性能差，参考 Shiro（https://github.com/innei/Shiro）的 IntersectionObserver + Framer Motion 方案重写，提升目录交互体验。构建通过（150 pages, 0 errors, 0 warnings）

### 2026-07-19 14:18 - 文章列表改造：浮动小图 → 网格卡片布局

**修改文件：**

- `src/components/post/PostCard.astro`（重写）
- `src/components/post/PostList.astro`（重写）

**修改内容：**

- PostCard.astro 从 `float-right size-[80px]` 浮动小缩略图 + 文字环绕 → **杂志风格网格卡片**布局：
  - 卡片容器：`rounded-xl border border-primary/15 bg-primary hover:shadow-lg hover:border-accent/25 transition-all duration-300`
  - 顶部封面图：`aspect-[16/10]` 宽幅比例，`object-cover`，hover 时 `scale-105` 放大过渡
  - 内容区 `p-5 space-y-3`：分类 Badge（`rounded-full bg-accent/10 text-accent`）、置顶图钉、标题 `line-clamp-2`、摘要 `line-clamp-3`、底部元数据（日期 + 阅读分钟）带分隔线
- PostList.astro 从 `<ul class="-my-4">` → `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">`
- PostCardHoverOverlay.tsx（Framer Motion 悬停组件）不再被使用，文件保留未删除

**原因：** 原 80px 右浮动小图在列表中过于细碎，卡片无视觉边界导致排版松散。改为网格卡片布局后图片增大 6 倍+，每篇文章拥有独立卡片容器，视觉层次清晰，移动端单列良好。构建通过（183 pages, 0 errors）

### 2026-07-20 - 动态背景系统重构（极光+粒子+磁流体+光标+发光）

**修改文件：**

- `src/components/hero/Hero.astro`
- `src/layouts/Layout.astro`
- `src/layouts/MarkdownLayout.astro`
- `src/styles/global.css`
- `tailwind.config.ts`
- `src/components/CategoryList.astro`
- `src/components/TagList.astro`
- `src/components/post/PostCard.astro`
- `src/components/background/`（新建目录及 6 个组件）

**新组件：**

- `src/components/background/AuroraBackground.astro` — 纯 CSS 极光背景，以 accent 色为基调，多层 radial-gradient 缓慢流动，替换原 `.site-grid` 静态网格
- `src/components/background/FerrofluidHero.tsx` — Canvas 2D 磁流体效果，专用于 Hero 区域，鼠标靠近时 blob 块收缩流动，移动端自动降级
- `src/components/background/ParticlesBg.tsx` — Canvas 2D 粒子系统，用于文章页背景，粒子随鼠标排斥，粒子间有连线
- `src/components/background/TargetCursorWrap.tsx` — GSAP 自定义光标，hover `.cursor-target` 元素时展开矩形框并加光晕
- `src/components/background/GlowBubble.tsx` — 包装 `@codaworks/react-glow` 的边缘发光组件

**修改内容：**

- Hero.astro：删除随机背景图 `https://webp.mingcy.cn` 和模糊遮罩，替换为 FerrofluidHero
- Layout.astro：删除 `.site-grid` `.site-cursor-glow` 和其 JS 追踪代码，替换为 AuroraBackground；追加 TargetCursorWrap
- MarkdownLayout.astro：`.swup-transition-fade` 后追加 ParticlesBg，实现文章页粒子背景
- global.css：删除 `.site-backdrop` `.site-grid` `.site-cursor-glow` 相关代码；新增 `.glow-border` 类
- tailwind.config.ts：新增 Aurora 动画 keyframes
- CategoryList.astro / TagList.astro：分类/标签 hover 时增加 `.glow-border` 发光效果
- PostCard.astro：新增 `.cursor-target` class，触发自定义光标展开

**新增依赖：** `gsap`（TargetCursor）、`@codaworks/react-glow`（GlowBubble）

**原因：** 替换过时的随机图方案，构建杂志级动态背景系统。极光+粒子+磁流体三层叠加，配合自定义光标和边缘发光，全面提升交互质感。构建通过（0 errors）

### 2026-07-22 15:40 - Apple Liquid Glass 标签云改造 & Git 同步修复

**修改文件：**

- `src/components/TagList.astro`
- `src/components/post/PostCard.astro`（仅加注释）
- `src/components/post/PostList.astro`（仅加注释）
- `src/pages/about.astro`（仅加注释）
- `src/pages/links/index.astro`（仅加注释）
- `src/pages/tags/index.astro`（仅加注释）
- `scripts/deploy.mjs`

**修改内容：**

- TagList.astro 从 `bg-accent/10` 彩色标签 + `glow-border` 发光悬浮 → 改为 **Apple Liquid Glass 灰度药丸标签**：`bg-secondary/40 dark:bg-secondary/30` 自适应亮/暗模式，`hover:-translate-y-[1px] hover:shadow-sm` 轻抬悬浮，计数使用 `tabular-nums`，去掉 `glow-item`/`glow-border` 依赖
- 6 个文件头部添加 `<!-- Apple Liquid Glass: ... -->` 注释，标注设计模式来源（components.md/patterns.md 引用），便于日后回溯
- 修复 Git 无法同步 GitHub 的问题：
  - 远程改为 HTTPS + `http.proxy=socks5h://127.0.0.1:10808`（Git libcurl 原生支持 SOCKS5，比 SSH ProxyCommand 快 1000 倍）
  - `scripts/deploy.mjs` 重写：移除硬编码 PAT token，用 HTTPS remote + 全局代理配置，修复 Windows 兼容性（`fs.rmSync`、安全日期格式）
  - 凭据通过 `credential.helper=store` 缓存，无需每次登录
- Apple Liquid Glass skill 已安装至 `~/.config/opencode/skills/apple-liquid-glass/`

**日常同步命令：**

```bash
git add -A
git commit -m "description"
$env:GIT_PROXY_COMMAND='C:\Program Files\Git\mingw64\bin\connect.exe -S 127.0.0.1:10808 -5 %h %p'; git push
```

> 使用 `GIT_PROXY_COMMAND` 而非全局 `http.proxy`，后者在大包推送时（~59MB）频繁断连。`connect.exe` 走 HTTPS 通道更稳定。已写入 `scripts/deploy.mjs`。

**原因：** 标签云视觉升级（Apple 灰度规范 + 亮/暗自适应）；解决 git 同步需反复登录和大数据推送断连问题。构建通过（188 pages, 0 errors）

### 2026-07-22 17:00 - 首页文章卡片改造：液态玻璃 + 左右交替布局 + 滑动光源

**修改文件：**

- `src/styles/global.css`
- `src/layouts/PageLayout.astro`
- `src/components/footer/Footer.astro`
- `src/components/post/PostCard.astro`（重写）
- `src/components/post/PostList.astro`
- `src/pages/[...page].astro`

**修改内容：**

- global.css 新增 3 组工具类：
  - `.card-glass` — Apple Liquid Glass 风格基底：`backdrop-filter: saturate(180%) blur(20px)` + 半透明 `bg-primary` + 双层 Apple 阴影，暗色模式自适应
  - `.card-shine` — `::before` 伪元素斜向白色渐变（transparent→white 0.18→transparent），`background-position` 平移到 `-200%` 实现 hover 时光源扫过效果
  - `.img-mask-right` / `.img-mask-left` — 图片朝向内容侧 `mask-image: linear-gradient` 渐变消失，仅在桌面端（`@media min-width: 640px`）生效
- PageLayout.astro：新增 `transparentBg?: boolean` prop，首页主区域透明让 AuroraBackground 极光透过玻璃卡片折射
- Footer.astro：添加 `bg-primary` 保底背景色
- PostCard.astro 重写：
  - `index` 奇偶控制左右交替布局（even → `flex-row` 图左文右，odd → `flex-row-reverse` 文左图右）
  - 图片 `w-full sm:w-[45%] shrink-0 aspect-[3/2]`，覆盖原有 `w-48` 小图
  - 移动端（`<sm`）垂直堆叠，图片在上、内容在下
  - 应用 `card-glass card-shine` 玻璃材质 + 滑动光源
  - 图片侧边应用 `img-mask-*` 实现图→文渐变过渡
  - Apple 风格排版：`tracking-tight` 标题、`tabular-nums` 数字
- PostList.astro：向 PostCard 传递 `index`，间距 `gap-8`→`gap-10`
- `[...page].astro`：文章容器 `max-w-[800px]`→`max-w-[960px]`，首页传递 `transparentBg`

**原因：** 用户反馈首页文章卡片样式不够精致，期望左右交替、大图大文字、液态玻璃质感。参考 blog.bsgun.cn 的左右布局 + Apple Liquid Glass 设计语言，打造带有滑动光源的玻璃卡片系统，AuroraBackground 透过玻璃折射增强质感。构建通过（188 pages, 0 errors）

### 2026-07-22 19:00 - 文章卡片重构：图上文下 + 移除扫光 + 首页背景修复

**修改文件：**

- `src/components/post/PostCard.astro`
- `src/styles/global.css`
- `src/pages/[...page].astro`
- `src/layouts/PageLayout.astro`

**修改内容：**

- PostCard.astro 从 `sm:flex-row/sm:flex-row-reverse` 左右分栏 → 固定 `flex-col` 图上文下排版
  - 删除 `isEven`/`flexDir`/`maskClass` 布局变量
  - 图片容器 `w-full sm:w-[45%]` → `w-full` 满宽去边，`aspect-[3/2]` → `aspect-[16/9]` 降低纵向高度
  - 删除 `card-shine` class，移除 hover 扫光伪元素
- global.css：删除 `.card-shine` 和 `.img-mask-*` 整段 CSS
- `[...page].astro`：文章容器 `max-w-[960px]` → `max-w-[780px]` 收窄宽度
- PageLayout.astro：首页 `<main>` 始终使用 `bg-primary`（亮色白/暗色#1c1c1e），保留 AccentColorInjector 随机色系统

**原因：** 用户反馈左右分栏+扫光效果闪眼，改为图上文下+毛玻璃+轻抬悬停的 Apple 风格；首页背景跟随亮暗主题。构建通过（188 pages, 0 errors）

### 2026-07-25 - 友链申请页添加一键导入模板按钮

**修改文件：**

- `src/pages/links/apply.astro`

**修改内容：**

- 在「申请格式」div 内 `<pre>` 代码块下方添加 `📥 一键导入模板` 按钮，右对齐
- 按钮初始 `disabled`，通过 `MutationObserver` 监听 `#twikoo` 子树，等待 textarea 出现后自动启用
- 附加 500ms 轮询兜底（最长 5s），防止 Observer 错过时机
- 点击按钮后：将格式模板填入 textarea → dispatch `input`/`change` 事件（`bubbles: true`）→ `focus()` → 弹窗提示「✅ 模板已导入」
- 未找到输入框时提示「未找到评论区输入框，请稍后重试」

**原因：** 方便访客一键将友链申请格式填入 Twikoo 评论框，降低提交门槛。构建通过（0 errors）

### 2026-07-27 - 首页卡片重构：CSS 变量化 + 柔和滑动高光 + 移动端隐藏封面

**修改文件：**

- `src/styles/global.css`
- `src/components/post/PostCard.astro`

**修改内容：**

- 新增 CSS 自定义属性体系（`:root` + `[data-theme='dark']`）：`--card-glass-bg`、`--card-glass-border`、`--card-glass-shadow`、`--card-glass-hover-shadow`、`--card-glass-hover-translate`、`--card-glass-radius`，统一管理毛玻璃卡片配色
- 重构 `.card-glass`：将 `overflow-hidden`、`border-radius`、`hover:translateY`、`hover:shadow` 从 Tailwind 行内类搬入 CSS，替换为 CSS 变量引用；过渡动画使用 `cubic-bezier` 精细化缓动
- 新增 `.card-glass::after` 伪元素：`105deg` 斜向渐变，hover 时 `background-position 0.8s` 从左到右滑动，实现柔和扫过高光（亮色模式峰值 12% 白，暗色模式峰值 7% 白）；`pointer-events: none` 不遮挡交互
- 新增 `@media (max-width: 768px)` 移动端规则：`.card-cover-mobile-hidden { display: none }` 隐藏封面图片（不删除 DOM），卡片仅展示文字内容，玻璃 hover 动效保留
- PostCard.astro 简化：`<article>` 类名从 4 行浓缩为 `group card-glass cursor-target`；封面 `<div>` 添加 `card-cover-mobile-hidden`

**原因：** 将散落在 Tailwind 行内的卡片样式收归 CSS 变量体系便于维护；添加柔和斜向扫光替代之前过于抢眼的扫光效果；移动端大图遮挡文字信息，隐藏后卡片更紧凑。构建通过（0 errors）

### 2026-07-27 - 首页卡片重构：3D 液态玻璃堆叠 + 纯黑底 + 辉光边缘

**修改文件：**

- `src/styles/global.css`
- `src/components/post/PostCard.astro`
- `src/components/post/PostList.astro`
- `src/layouts/PageLayout.astro`

**修改内容：**

- 纯黑底色（暗色 `#000` / 亮色 `#fff`）：新增 `--page-bg` CSS 变量，`.page-bg-home` 类用于首页 `<main>` 背景；`transparentBg` prop 真正生效
- 暗色模式隐藏 Aurora 极光：`html[data-theme='dark'] .aurora-container { display: none }`
- 卡片材质升级：`backdrop-filter: blur(24px)`，暗色背景透明度降至 18%，亮色 45%；细半透边框 + 双层阴影
- 边缘辉光：`.card-glass::before` 伪元素，`inset: -3px` + `box-shadow` 使用 `--color-accent` 实现外发光，hover 时渐显
- 3D 透视堆叠（PC ≥769px）：`.post-list` 设置 `perspective: 1000px`；奇数卡片 `rotateX(1.5deg) translateZ(4px)`，偶数 `rotateX(-1deg) translateZ(-2px)`；hover 归零 + `translateZ(30px)` 上浮
- 滑动高光保留：`::after` 斜向渐变扫光，亮色峰值 10% 白，暗色 7% 白
- 字号层级优化：新增 `.card-content .category-badge`、`.post-title`、`.post-summary`（opacity 0.7）、`.post-meta`（opacity 0.55）
- 卡片间距：PostList `gap-10` → `gap-12`
- 移动端（≤768px）：禁用 3D 透视；`card-content` padding 缩至 1rem；标题字号降为 1rem；去除 `!important` 残留
- PostCard.astro 新增语义 class：`card-content`、`category-badge`、`post-title`、`post-summary`、`post-meta`

**原因：** 用户要求暗黑 3D 液态玻璃堆叠卡片效果，纯黑底 + 厚毛玻璃 + 透视错落 + 边缘微弱辉光 + 绿色强调色（沿用随机色系统）。保留昼夜切换和全部 hover 动效。构建通过（0 errors）

### 2026-07-27 - 卡片背景色修正 + 自定义 Sitemap 替代插件

**修改文件：**

- `src/styles/global.css`
- `src/pages/sitemap.xml.ts`（新建）
- `src/pages/robots.txt.ts`
- `astro.config.js`

**修改内容：**

- 暗色 `--page-bg` 从 `#000` 改回 `#1c1c1e`（用户拒绝纯黑底）
- 删除 `.card-glass::before` 边缘辉光伪元素及相关 `--card-glow-*` 变量
- 新建 `src/pages/sitemap.xml.ts`：自定义 API 端点生成单一 `<urlset>` 格式 sitemap，覆盖首页、分页、文章、分类、标签、静态页面共 191 个 URL，含 lastmod/priority/changefreq
- `robots.txt.ts`：引用 `/sitemap.xml` 替代 `sitemap-index.xml`
- `astro.config.js`：移除 `@astrojs/sitemap` 集成

**原因：** `@astrojs/sitemap` v3 输出 `sitemap-index.xml`（sitemap 索引，不直接展示内容），浏览器打开无实际 URL。自定义端点的单一 sitemap.xml 可直接浏览全部收录页面。构建通过（193 pages, 0 errors）

### 2026-08-09 - EdgeOne AI-Chat-Assistant 接入：全站浮窗 + AI 咨询卡片 + 构建期 AI 摘要

**修改文件：**

- `src/layouts/Layout.astro`（全站 embed.js 注入）
- `src/components/ai/AiConsultCard.astro`（新建，AI 咨询入口卡片）
- `src/components/ai/AiSummaryCard.astro`（新建，文章页 AI 摘要卡片）
- `src/pages/[...page].astro`（首页挂载 AiConsultCard）
- `src/pages/[year]/[month]/[day]/[slug].astro`（文章页挂载 AiConsultCard + AiSummaryCard）
- `scripts/gen-ai-summaries.mjs`（新建，构建期 AI 摘要生成脚本）
- `src/data/ai-summaries.json`（新建，82 篇 AI 摘要数据）
- `package.json`（build 链前置摘要生成）

**修改内容：**

- 接入已部署在 EdgeOne 的官方开源项目 AI-Chat-Assistant（`https://github.com/TencentEdgeOne/AI-Chat-Assistant`，MIT），自定义域名 `ai.mingcy.cn`，实现「顶部 AI 摘要 + 顶部 AI 咨询」：
- **路线 A 全站浮窗**：`Layout.astro` 底部注入 `<script is:inline src="https://ai.mingcy.cn/embed.js" data-color="#10b981" data-position="bottom-right">`，全站右下角出现 AI 聊天气泡；embed.js 自动提取 `article` 正文（≤6000 字符）经 postMessage 发给同源 iframe widget，AI 可理解当前页面内容；与 Swup 兼容（embed.js 自带 1s 轮询检测 URL 变化）
- **路线 B AI 咨询卡片**：新建 `AiConsultCard.astro`（glass-card 风格），首页主列表顶部 + 文章页正文区顶部渲染；「开始咨询」按钮展开内嵌 `<iframe src="https://ai.mingcy.cn/widget">`（widget 页面与 /chat 同源、无跨域），点击时 postMessage 注入页面上下文；脚本用 `MutationObserver` + `swup:contentReplaced` 事件重新绑定，兼容 Swup 页面替换后卡片不失效
- **路线 C 构建期 AI 摘要**：新建 `scripts/gen-ai-summaries.mjs`——遍历 `src/content/posts/*/index.md` 解析 frontmatter + 正文（去代码块，截 3000 字符），POST `https://ai.mingcy.cn/chat`（SSE 流式）请求 2-3 句中文摘要，解析 `data:` 增量拼接；**429 限流处理**：会话并发限制（Recognized "Conversation concurrency limit reached"）→ 共享同一 `makers-conversation-id` + 并发默认 2 + 指数退避重试（最多 4 次）；输出 `src/data/ai-summaries.json`（`{slug: {summary, from, updatedAt}}`），AI 失败自动用文章 frontmatter summary 兜底（`from:'fallback'`），支持 `--force` / `--retry-fallback` 参数
- 82 篇文章全部生成真实 AI 摘要（`from:'ai'`、0 fallback）；文章页 header 内、`Outdate` 下方渲染 `AiSummaryCard.astro`（「AI 摘要」标题 + 「✨ AI 生成」/「文章简介」徽标）
- `package.json` build 链：`astro check && node scripts/gen-ai-summaries.mjs && astro build && pagefind --site dist`（生成摘要失败仅兜底不阻断构建）
- 已验证：`/embed.js` 200（6175B）、`/api/config` 正常、`/chat` SSE 中文输出正常

**原因：** 用户希望把 EdgeOne 部署的 AI-Chat-Assistant 装入博客，在顶部提供 AI 摘要与 AI 咨询。官方 embed.js 仅提供右下角浮窗，无法直接做顶部摘要/咨询；故采用「embed.js 浮窗（零配置）+ 自建 widget 内嵌卡片（同源调用）+ 构建期离线调 /chat 生成摘要（静态站零延迟）」的三层方案。构建通过（196 pages, 0 errors, Pagefind 85 pages/10255 词）。

**⚠️ 待用户侧操作：** `ai.mingcy.cn` 的 HTTPS 证书当前仍是腾讯 CDN 泛域名证书（`*.cdn.myqcloud.com`，curl 忽略证书可访问但浏览器会告警），需在 EdgeOne 控制台给该自定义域名签发免费证书后浮窗/咨询/摘要才能在线生效。日常更新：`pnpm build` 自动刷新 AI 摘要。

### 2026-08-09 - AI 助手重构：移除咨询卡与 embed.js、左下液态玻璃浮球、修复切换卡顿

**修改文件：**

- `src/components/ai/AiConsultCard.astro`（**删除**）
- `src/components/ai/AiAssistant.tsx`（新建，左下自浮球组件）
- `src/layouts/Layout.astro`（移除官方 embed.js；挂载 `<AiAssistant client:only="react" />`）
- `src/pages/[...page].astro`（移除 AiConsultCard 引用）
- `src/pages/[year]/[month]/[day]/[slug].astro`（移除 AiConsultCard 引用）
- `src/styles/global.css`（新增 `.ai-assistant` / `.ai-bubble` / `.ai-window` 液态玻璃样式）

**修改内容：**

- **性能修复（网页预览切页卡顿 / CPU 占用高）**：
  - 删除 `AiConsultCard.astro`——其全局 `MutationObserver(observe(document.body, { childList, subtree }))` 在 Swup 切页时触发 scan 回调风暴，是切页卡顿主因；且其监听事件名 `swup:contentReplaced` 与项目实际 `swup:content:replace` 不一致，scan 完全依赖 MutationObserver 进一步放大开销
  - 移除 `Layout.astro` 中官方 `embed.js` 脚本——其无条件 `appendChild(<iframe src=".../widget">)` 每页后台加载完整 Next.js React 对话应用（即使浮球未打开），另有 1s `setInterval` 常驻轮询 URL，是 CPU 占用主因
  - 重构后**切页零额外开销**：浮球由 React `client:only` 在客户端创建，Swup 只替换 `main`、不重建 body 级浮球
- **自建左下浮球 `AiAssistant.tsx`**（React + Framer Motion，挂在 `Layout.astro` body 末尾）：
  - 气泡固定左下（`fixed bottom-6 left-4 z-50`），点击展开对话窗（`AnimatePresence` 弹簧动画）
  - **iframe 懒加载**：`<iframe src="https://ai.mingcy.cn/widget">` 仅首次点击展开时才挂载，未展开绝不加载 widget 资源；关闭后保留复用
  - 展开时 `postMessage` 注入当前页面上下文（`article`/`main`/`.post-content`，≤6000 字符，与官方 embed.js 协议一致）；监听 `swup:content:replace` 在切页后自动刷新上下文
- **Apple 液态玻璃样式**（`global.css`）：`.ai-bubble` / `.ai-window` 用 `backdrop-filter: saturate(180%) blur(24px)` + accent 渐变半透明底 + 双层 Apple 阴影 + `--color-accent` 微光边框；`html[data-theme='dark']` 覆盖加深底色；**颜色全部走 CSS 变量**（`--color-accent` / `--color-text-primary` 等），**自动跟随主题随机色**（AccentColorInjector 注入 light/dark 双值）与明暗模式；移动端（≤480px）窗口占满左右 16px
- iframe 内部对话区深色：需在 EdgeOne 侧 `chat-panel.tsx` 支持 `prefers-color-scheme`，属待办（见下）

**原因：** 用户反馈网页切页明显卡顿、CPU 占用大，且要求去掉顶部 AI 咨询卡、AI 助手改左下角 + 液态玻璃 + 明暗/随机色适配。官方 embed.js 无法自定义样式且无条件加载 widget。重构后：无全局 MutationObserver、无 embed.js 轮询、iframe 按需加载，根治卡顿；外观完全主题化。构建通过（195 html, 0 errors, 0 warnings, Pagefind 85 pages）。

**⚠️ 用户待办（EdgeOne 项目，本仓库只读边界外）：** AI 对话窗内 iframe（`ai.mingcy.cn/widget`）的深色模式需修改 `AI-Chat-Assistant` 项目 `app/components/chat-panel.tsx`：读取 `window.matchMedia('(prefers-color-scheme: dark)')` + localStorage 主题或跟随父页面 `postMessage` 主题，使 iframe 内对话区与博客明暗一致。

### 2026-08-09 21:57 - AI 对话浮球下线 & 卡片模糊减弱 + 移除扫光

**修改文件：**

- `src/layouts/Layout.astro`（移除 AiAssistant import 与 body 挂载）
- `src/components/ai/AiAssistant.tsx`（**删除**，左下 AI 对话浮球组件）
- `src/styles/global.css`（移除 `.ai-assistant` / `.ai-bubble` / `.ai-window` 样式段；删除 `.card-glass::after` 扫光层；`blur(24px)` → `blur(12px)`）

**保留不动：**

- `src/components/ai/AiSummaryCard.astro` + `src/data/ai-summaries.json`（文章页顶部 AI 摘要卡完整保留）
- `AuroraBackground` 极光、`HeadGradient` 顶部渐变、`ParticlesBg` 粒子、3D 透视堆叠、hover 泛光阴影——均为用户未点名的项，保持原样

**修改内容：**

- **移除左下 AI 对话浮球**：用户反馈浮球拖慢网页速度（每次 Swup 切页都会扫描整页 DOM、截取上下文并 postMessage，动画期间叠加卡顿；按钮常驻左下干扰阅读）。删除 `Layout.astro` 中 `<AiAssistant client:only="react" />` 及其 import，删除组件文件与 `global.css` 中 `.ai-assistant` `.ai-bubble` `.ai-window` 整段样式（约 298–377 行）。**只保留 AI 摘要这一个 AI 功能**
- **卡片模糊减弱**：用户反馈液态玻璃卡片「模糊特效」干扰视野。`.card-glass` / `.sidebar-card` 的 `backdrop-filter: saturate(180%) blur(24px)` → `blur(12px)`（亮/暗模式共用）
- **移除卡片扫光层**：用户确认光干扰即 `::after` 斜向扫光伪元素（hover 时白色光带滑过）。整体删除 `.card-glass::after`、`.card-glass:hover::after`、暗色模式覆盖三段样式（原 402–435 行）

**原因：** 用户要求「只保留文章 AI 摘要，去掉左下 AI 对话（拖慢网页速度）；液体玻璃卡片的模糊与扫光特效干扰视野」。经排查确认干扰源为 `.card-glass` 的 `backdrop-filter: blur(24px)` 与 `::after` 扫光层，按用户选择减弱到 `blur(12px)` 并删除扫光层。**注意：** 本次改动与「2026-08-09 - AI 助手重构」记录互为因果——该次引入的浮球在本次下线。

### 2026-08-13 - React hydration 错误修复 & 未使用组件清理

**修改文件：**

- `src/components/sidebar/GreetingClock.tsx`（重写）
- `src/components/background/FerrofluidHero.tsx`（**删除**，未使用）
- `src/components/background/TargetCursorWrap.tsx`（**删除**，未使用）
- `src/components/background/GlowBubble.tsx`（**删除**，未使用）
- `src/components/post/PostCardHoverOverlay.tsx`（**删除**，未使用）
- `src/components/comment/Waline.tsx`（**删除**，未使用）
- `package.json` / `pnpm-lock.yaml`（移除孤儿依赖 `gsap`、`@codaworks/react-glow`）

**背景：** 生产环境浏览器控制台持续报 `Minified React error #418 / #423 / #425`，堆栈指向 MessagePort，一度怀疑第三方 `gyoza.lxchapu.com` 脚本与 React 冲突。**排查结论（与猜测不符）：**

- **错误码真实含义**（从本地 react-dom 18.2.0 源码验证，全部为 hydration/Suspense 家族，非 createRoot/Context 问题）：
  - `#418`：Hydration failed because the initial UI does not match what was rendered on the server（SSR 与客户端首帧渲染不一致）
  - `#423`：There was an error while hydrating this Suspense boundary（水合失败的伴随错误）
  - `#425`：This Suspense boundary received an update before it finished hydrating（水合完成前收到更新）
- **堆栈指向 MessagePort 是 React 18 Scheduler 的正常机制**（MessageChannel 调度），并非第三方脚本
- **`gyoza.lxchapu.com` 不是脚本**：全项目仅 `PrintVersion.astro` 的 `console.log` 横幅字符串引用该域名，无任何脚本注入
- **项目无手动 createRoot/hydrateRoot**（仅 `RootPortal.tsx` 用 `createPortal`），所有 React 挂载由 Astro island（`client:*`）托管，不存在重复挂载
- **Context 结构已正确**：`Provider` 已在 PageLayout/MarkdownLayout 全局挂载（`client:only`），Drawer/modal 的 Context 均在各自组件内就近提供

**修复内容：**

- **`GreetingClock.tsx` 重写（#418 根因）**：原实现 `useState(() => new Date())` 在 SSR 与客户端 hydration 各取一次当前时间，输出必然不同 → 每次加载必现 #418 → 连锁 #423/#425。改为初始 state 为 `null`，SSR/首帧渲染固定占位符（`--:--:--` / `----年-月-日 · 星期-`），时间仅在 `useEffect` mount 后读取并每秒更新，两端渲染一致
- **删除 5 个零引用组件**（引用检查 0 处）：`FerrofluidHero`（Hero 已重写不再使用）、`TargetCursorWrap`（Layout 已移除挂载）、`GlowBubble`（TagList 已移除 glow 依赖）、`PostCardHoverOverlay`（PostCard 已改为网格卡片）、`Waline`（评论实际用 Twikoo）
- **移除孤儿依赖**：`gsap`、`@codaworks/react-glow`（对应组件删除后无任何引用）

**原因：** 消除生产环境必现的 React hydration 报错（#418/#423/#425），并清理未使用组件与孤儿依赖（gzip 体积减小、构建产物瘦身）。构建通过（196 pages, 0 errors, Pagefind 85 pages）。**验证方式：** `pnpm dev` 本地控制台无红色报错；`pnpm build` + `pnpm preview` 生产产物无 Minified React 错误；dist 首页 GreetingClock SSR 输出为 `--:--:--` 占位符（此前为具体时间）。

### 2026-08-13 19:00 - Swup 切页 React island 资源泄漏修复 & 性能优化

**修改文件：**

- `src/hooks/useCleanupOnPageLeave.ts`（新建，统一切页清理工具 hook）
- `src/layouts/Layout.astro`（body 末尾注入 `mcy:island-cleanup` 切页清理事件）
- `src/components/sidebar/GreetingClock.tsx`（setInterval 泄漏修复）
- `src/components/TimelineProgress.tsx`（setInterval 泄漏修复）
- `src/components/post/PostToc.tsx`（IntersectionObserver 泄漏修复）
- `src/components/background/ParticlesBg.tsx`（rAF 循环 + resize/mousemove/mouseleave 监听器泄漏修复）
- `src/components/Flashlight.tsx`（mousemove 监听泄漏修复 + **修复 hooks 规则违规**：`if (isMobile) return null` 提前于 `useLayoutEffect` 调用，已把全部 hooks 提升到条件 return 之前）

**背景：** 用户持续反馈生产环境 `#423`（createRoot 重复挂载）/`#425`（useContext 无 Provider）报错且切页卡顿。经排查：**错误码释义仍不成立**（#423/#425 均为 hydration 家族，已在上一轮修根因 #418 后随连锁消除；项目无手动 createRoot；Context 均就近提供）。但**"路由切换旧 React 实例未销毁"描述指向一个真实问题**：`@swup/astro` 仅派发 `astro:before-swap`/`astro:page-load` 事件，**对 main 容器内被替换的 astro-island 无任何 React unmount 处理**——Swup 切页时 React 组件 DOM 被整体替换但组件不卸载，`useEffect` cleanup 不执行，导致 `setInterval`（GreetingClock/TimelineProgress 每秒）、rAF 循环（ParticlesBg）、IntersectionObserver（PostToc）、事件监听器（Flashlight/ParticlesBg）持续运行，**切页越用越卡、内存上涨**。这是卡顿的真实根因（与 gyoza 无关——`gyoza.lxchapu.com` 仅是 `PrintVersion.astro` 的 console.log 字符串，无任何脚本）。

**修复内容：**

- 新建 `useCleanupOnPageLeave(cleanup)` hook：监听 Layout 注入的 `mcy:island-cleanup` 事件，在 Swup 替换 main 内容**之前**主动执行清理函数并自我解绑；组件正常卸载时仍由 React `useEffect` cleanup 兜底（与清理函数共用同一 `cleanupRef`）
- `Layout.astro` body 末尾注入 `is:inline` 脚本：监听 `swup:content:replace`（Swup 内容替换前）→ `document.dispatchEvent(new CustomEvent('mcy:island-cleanup'))`
- 5 个资源型组件接入：定时器/动画帧/观察器/监听器统一在切页前释放

**原因：** 解决 Swup SPA 路由切换下 React island 资源泄漏导致的页面卡顿与内存增长（用户"路由切换旧实例未销毁"诉求的真实落地——React 无公开 unmount API，用切页事件主动清理是等价且安全的方案）。构建通过（196 pages, 0 errors, Pagefind 85 pages）。**验证方式：** `pnpm dev` 控制台无报错；多次切换文章页→首页后 Performance 面板监听器数量不再增长、CPU 占用回落；`pnpm build` 产物中 `dist/index.html` 含 `mcy:island-cleanup` 脚本、GreetingClock SSR 仍为 `--:--:--` 占位符。

### 2026-08-15 - 首页滚动卡顿修复 & 每页文章数改 5

**修改文件：**

- `src/config.json`（`posts.perPage` 10 → 5）
- `src/styles/global.css`（移除 3D 透视堆叠、新增滚动降级规则）
- `src/layouts/Layout.astro`（注入滚动降级脚本）

**背景：** 用户反馈首页滑动文章时视觉上明显卡顿（加载不卡），自认为与 hover 放大效果不丝滑有关。经排查，卡顿根源是**三处叠加**：

- **`.card-glass` 的 `backdrop-filter: saturate(180%) blur(12px)`（主因）**：浏览器滚动时需为每张卡片每帧重算背景模糊（页面内容在滚动，模糊采样区域持续变化），每页 10 张卡片 = 10 个持续重绘的合成层；hover 放大动画（`scale-105`）每一帧也叠加模糊重算 → 掉帧、不丝滑。用户感知的"放大不丝滑"正是此瓶颈（transform 本身 GPU 加速不卡）
- **`.post-list` 的 3D 透视堆叠**（`perspective: 1000px` + 奇数/偶数卡片 `rotateX(1.5deg) translateZ(4px)` / `rotateX(-1deg) translateZ(-2px)`，2026-07-27 引入）：滚动时强制重算 3D 投影，且与 hover 的 `translateY` 冲突造成突变
- **perPage=10 卡片过多**：放大模糊重算基数

**修改内容：**

- `config.json`：`perPage` 10 → 5（首页每页 5 篇，直接减半模糊重算元素；总页面数 196 → 204）
- `global.css`：
  - **删除 3D Perspective Stacking 整块**（`@media (min-width: 769px)` 内的 `.post-list perspective` 与 `.card-glass:nth-child(odd/even)` 规则），hover 统一走主规则 `translateY(-6px)`，消除透视突变
  - 新增滚动降级：`body.is-scrolling .card-glass/.sidebar-card/.cloud-badge { backdrop-filter: none }`——滚动期间毛玻璃退化为半透明纯色（视觉接近、零模糊重算），滚动停止 120ms 恢复玻璃效果
- `Layout.astro`：注入 `is:inline` 滚动监听（rAF 节流 + 120ms 停止计时器），滚动中给 `body` 加 `is-scrolling` class

**原因：** 保留 Apple Liquid Glass 观感的同时根治滚动卡顿：静态页玻璃效果不变，滚动时临时降级；移除与 hover 冲突的 3D 透视使放大过渡丝滑；每页 5 篇减少元素。构建通过（204 pages, 0 errors, Pagefind 85 pages）。**验证方式：** `pnpm dev` / `pnpm build && pnpm preview` 首页滚动明显流畅；hover 放大动画无掉帧；DevTools Performance 录制滚动帧率（修复前滚动期间 backdrop-filter 持续重绘，修复后滚动中卡片为纯色无模糊重算）。

### 2026-08-16 - 浏览量数据源迁移：Twikoo COUNTER_GET → Umami metrics(type=path) & Vercel Analytics 接入

**背景：** 用户反馈 Twikoo 浏览量数据不准（该后端为逐次读取自增 + bucket 聚合模型，多篇文章可能共享计数 doc，见 2026-08-16 前两条修复记录），要求停用 Twikoo、改用 Umami 统计作为文章阅读量；同日还要求接入 Vercel Analytics。

**Umami 分享 API 关键机制（花了一整轮验证，重要）：**

- **认证不用 Authorization 头**：分享页数据端点要求 **`x-umami-share-token: <JWT>` + `x-umami-share-context: 1`** 两个请求头（先前用 Authorization 导致 401，是踩坑点）
- **令牌获取**：`GET https://um.mingcy.cn/api/share/{shareId}` 完全公开（`ACAO:*`），返回 `{ shareId, shareType, websiteId, token(JWT), parameters }`；当前分享 `RfHfOK3ospywZsFv` 为 `shareType:1`（基础总览版）
- **CORS 全开放**：数据端点均 `Access-Control-Allow-Origin: *`，且 OPTIONS 预检返回 `Access-Control-Allow-Headers: *`、`Allow-Methods` 含 GET——浏览器可纯前端跨域 fetch 自 `mingcy.cn` → `um.mingcy.cn`，**无需服务端代理**
- **shareType=1 限制**：只放行聚合维度端点；`metrics?type=page` 返回 400、`pageviews?url=`/`stats?url=` 过滤参数被忽略（全站数据照返）。**v3 把 metric 类型 `url` 改名为 `path`**——用 `metrics?type=path&startAt=0&endAt={now}&limit=2000` 一次取回全站 **827 个页面路径**的累计浏览量（`[{x:"/path", y:N}, ...]`）
- **`startAt=0` 即全时段累计**（0/1/1000000000 结果相同），无需先调 `daterange` 中间跳
- 单篇文章 URL 可能带/不带尾斜杠（旧记录 `/2024/09/07/ode/`、新 `/2026/08/08/new-work`），匹配须归一化去尾部斜杠

**修改文件：**

- `src/components/post/ReadCount.astro`（**重写**，Twikoo → Umami）
- `src/components/footer/SiteVisitors.astro`（**新建**，Footer 全站累计访客数）
- `src/components/footer/Footer.astro`（在第 37-39 行 RunningDays 行追加 `<SiteVisitors />`）
- `src/layouts/Layout.astro`（body 注入 `<Analytics />`）
- `package.json` / `pnpm-lock.yaml`（新增依赖 `@vercel/analytics@2.0.1`）

**修改内容：**

- **`ReadCount.astro` 重写**：对外接口不变（`postPath` / `postTitle?` / `class`），数据源与逻辑整体切换：
  - 请求链：`GET /api/share/{shareId}`（公开元数据）→ 带 `x-umami-share-token` / `x-umami-share-context` 调 `GET /api/websites/{wd}/metrics?type=path&startAt=0&endAt={now}&limit=2000`
  - 一次取回全站 path→views map，当前页面所有 `.read-count[data-path]` 本地匹配显示（千分位格式化）
  - **归一化去尾斜杠**匹配；**未匹配到 path 的文章显示 `--`**（非 0，避免误导访问数为 0）
  - **sessionStorage 按天缓存** `{day, map}`：当天首次真请求，Swup 切页/刷新零网络开销（重写后样式/行为：幂等守卫、DOMContentLoaded/rAF 延迟、`swup:content:replaced` / `astro:page-load` / `popstate` 重拉、失败显示 `--` 均保留）
  - **纯读取、零自增副作用**（Umami metrics 无写入）；初始化守卫 `window.__umamiReadCountInit`（区别于旧 Twikoo 守卫，防热替换后双执行）
- **`SiteVisitors.astro`（新建）**：Footer 展示「已经有 N 游客访问过本站」，同款三步（share 元数据 → ~~daterange~~ → stats 全站 visitors，`startAt=daterange.startDate`），sessionStorage 当天缓存，失败回退历史缓存，再失败 `--`
- **`Layout.astro`**：`import Analytics from '@vercel/analytics/astro'`，`<SpeedInsights />` 后追加 `<Analytics />`（`dist` 产物验证 `hoisted.*.js` 内含 vercel analytics 代码）
- package.json + `@vercel/analytics@2.0.1`（peer dep 有 WARN 但兼容 Astro 4）

**保留不动：** `Comments.astro` / `Twikoo.astro`（评论模块），Umami 双脚本（`um.mingcy.cn` + `cloud.umami.is`）、SpeedInsights、config.json 未改。

**⚠️ 注意（Twikoo 数据清理）：** 前端已彻底停止调用 `COUNTER_GET`，浏览量不再自增；但 Twikoo 云端历史计数数据在 `twikoo.mingcy.cn` 后端数据库（本项目只读边界外），如需清零需用户自行到 Twikoo 后台操作。Umami 侧全站 path 数据（`metrics?type=path`）约 827 条、每天随访问变化，无需干预。

**原因：** Twikoo 计数模型（读取自增 + bucket 聚合共享 doc）导致阅读量不准且每次刷新上涨；Umami 真实 PV 统计更符合阅读量语义，且公开分享 API 无鉴权跨域可用。Vercel Analytics 为用户要求接入的分析（与 Umami 并行）。构建通过（204 pages, 0 errors, Pagefind 85 pages）。

### 2026-08-16 - Vercel Analytics 接入（Web Analytics）

**修改文件：** `src/layouts/Layout.astro`、`package.json` / `pnpm-lock.yaml`

**修改内容：** 安装 `@vercel/analytics@2.0.1` 并在基础布局 body 追加 `import Analytics from '@vercel/analytics/astro'` + `<Analytics />`（紧邻既有 `<SpeedInsights />`）。

**原因：** 用户要求为站点接入 Vercel Web Analytics。构建通过（204 pages, 0 errors）；dist 产物 `hoisted.*.js` 含 vercel analytics 代码。

### 2026-08-16 - Astro check 4 个警告清理（ts(6133) / ts(80006)）

**背景：** Vercel 构建日志显示 `astro check` 有 4 个警告，用户要求清零。

**警告清单与根因：**

- `src/components/background/AuroraBackground.astro:7` **ts(6133)** `className` 声明未读取：模板用 `class="...{className}"` 字符串内联插值，TS 不计入读取 → 改用 `class:list={[...base, className]}`
- `src/components/footer/SiteVisitors.astro:63/80` **ts(80006)**「可转为 async 函数」：`getJson` 与 `load()` 用 `.then(function(){...})` 链式回调 → 改 `async/await` + `try/catch`
- `src/components/post/ReadCount.astro:111` **ts(80006)** 同上：`getJson` fetch 链 → `async/await`

**修改文件：**

- `src/components/background/AuroraBackground.astro`（`class:list`）
- `src/components/footer/SiteVisitors.astro`（`getJson` + `load()` 改写 async/await）
- `src/components/post/ReadCount.astro`（`getJson` + `load()` 改写 async/await）

**行为验证：** 逻辑等价（try/catch 替代 .catch，结果一致）；`pnpm astro check` 0 errors / **0 warnings**；`pnpm build` 通过（204 pages, 0 errors, Pagefind 85 pages）。

**性能排查（未改动）：** 用户提到「文件太大导致缓存加载慢」。实测 dist 产物：index.html 平均仅 ~38 KB（内联 is:inline 脚本均为小片段）；真正的体积大头是 **Pagefind 三个 bundle**（`pagefind-component-ui.js` 171KB + `pagefind-ui.js` 117KB + `pagefind.js` 44KB ≈ 330KB）与主入口 `index.*.js`（131KB）。已向用户提议 Pagefind 按需化（打开搜索时才加载），但用户明确表示**暂不改 Pagefind**，本次仅清理警告收尾。

### 2026-08-17 - Twikoo AI 自动评论回复补丁（docs/ai-comment-reply/，仓库只读边界外交付）

**背景：** 用户希望 Twikoo 评论系统接入 AI 自动回复：游客发表评论后，由评论云函数抓取 mingcy.cn 文章正文，调用 `ai.mingcy.cn/chat`（EdgeOne AI-Chat-Assistant，SSE）生成博主语气的回复，以独立 AI 机器人身份写回评论，游客提交路径零改动。本仓库只读边界不含 Twikoo Vercel 云函数部署，故交付形式为**补丁 + 文档**（可 `git apply`）。

**前期验证（只读边界外，本仓库仅存档结论）：**

- `ai.mingcy.cn/chat`：POST `{message}` + 头 `makers-conversation-id`，SSE `data:{"type":"text_delta","delta":...}`→`[DONE]`；短回复 3-4s，长回复 10-40s；429 并发限流，指数退避可重试
- `twikoo.mingcy.cn`：Vercel 上的 `twikoo-vercel@1.7.19`（MongoDB）；`COMMENT_SUBMIT` 保存评论后自调用 `/`+`{event:'POST_SUBMIT',comment}`，`isRecursion` 校验内部头 `x-twikoo-recursion===config.ADMIN_PASS`，是 AI 触发挂点
- 文章正文：静态页 `#markdown-wrapper.markdown`（fallback `.markdown`/`article`/`main`）；URL 兼容带/不带尾斜杠

**交付文件（写入本仓库）：**

- `docs/ai-comment-reply/0001-twikoo-ai-reply.patch` — 完整补丁，含 3 个文件：
  - `api/ai-reply.js`（新增 223 行）：内部头鉴权 → DB 重读评论 → 守卫（跳 isAiReply/master/isSpam/非文章页）→ pid 去重 → 线程上限 `AI_REPLY_THREAD_MAX`（防死循环）→ 抓正文（`AI_REPLY_ARTICLE_CHARS` 截断）→ 组装 PROMPT → `callAi`（SSE 解流、429 指数退避、`AI_REPLY_TIMEOUT`）→ `insertOne` AI 回复（`isAiReply=true, master=false`，独立昵称/头像）
  - `api/index.js`：① `require('./ai-reply')` ② switch 加 `case 'AI_REPLY':` ③ `postSubmit` 末尾 `Promise.race([axiosPost 自调 /, delay(5000)])` 仅发出不等待 → **游客响应零阻塞**
  - `vercel.json`：`functions.api/index.js.maxDuration = 60`（AI 生成 10-40s 超 Vercel 默认 10s）
- `docs/ai-comment-reply/README.md` — 前置条件（Twikoo ≥1.7、证书有效）、应用步骤、触发流程图、环境变量参数表（`AI_REPLY_URL/BLOG_ORIGIN/NICK/MAIL/LINK/AVATAR/ARTICLE_CHARS/REPLY_CHARS/THREAD_MAX/TIMEOUT`）、注意事项

**方式：** 在 `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\twikoo-patch2` 临时仓库下载原版 twikoo-vercel → 应用 3 处修改 + 新增 `api/ai-reply.js` → `git commit` → `git format-patch` 导出。仓库本身除 docs 外无代码改动；CLAUDE.md 记录含「Twikoo AI 自动回复」链路全部关键技术参数，供日后在 Twikoo 侧实施时参考。

### 2026-08-17 - Twikoo AI 回复落地方案 B：薄包装仓库路线 A 补丁（0002）+ twikoo-vercel 1.7.19 + 客户端 CDN 换 jsDelivr

**背景：** 用户给出实际部署仓库 `https://github.com/rumian0/twikoo`，是**薄包装**结构（`api/index.js = module.exports = require('twikoo-vercel')`，`package.json` 仅依赖 `twikoo-vercel`），真正的云函数逻辑在 npm 包内。前一份 `0001` 补丁（面向全源码仓库）无法直接 apply，故按「路线 A」重新设计 wrapper 方案并交付 `0002` 补丁。版本统一定为 **1.7.19**（npm 上 `twikoo-vercel` 与客户端 `twikoo` 的 latest 均为 1.7.19；cdnjs 客户端只同步到 1.7.18，故客户端 CDN 改用 jsDelivr）。

**关键事实（源码验证）：**

- `twikoo-vercel@1.7.19` tarball（registry.npmjs.org/twikoo-vercel/-/twikoo-vercel-1.7.19.tgz，10KB）`main: api/index.js`，内含完整 34KB `api/index.js`；依赖 `get-user-ip` / `mongodb@^6.3.0` / `twikoo-func@1.7.19` / `uuid`
- 事件分发：`module.exports = async (request, response)`；`event = request.body || {}`（Vercel 已解析 body）；`switch(event.event)` 含 `COMMENT_SUBMIT`/`POST_SUBMIT` 等；`POST_SUBMIT` 入口 `if (!isRecursion(request)) return FORBIDDEN`，`isRecursion = request.headers['x-twikoo-recursion'] === (config.ADMIN_PASS || 'true')`
- `commentSubmit` 尾部 `await Promise.race([axios.post(https://${VERCEL_URL}, {event:'POST_SUBMIT', comment}, {headers:{'x-twikoo-recursion': config.ADMIN_PASS||'true'}}), delay(5000)])` —— 自调 POST_SUBMIT 仅等 5s，游客响应零阻塞
- DB 连接：`MongoClient.connect(uri, {useNewUrlParser, useUnifiedTopology})` + `client.db(new URL(uri).pathname.substr(1))`（库名取自连接串路径）；config 存 `db.collection('config').findOne({})`（含 ADMIN_PASS）
- 博客客户端 CDN：jsDelivr 路径**必须是 `dist/`**（`https://cdn.jsdelivr.net/npm/twikoo@1.7.19/dist/twikoo.all.min.js` 733KB，实测 200；不带 `dist/` 会 404）

**交付文件（写入本仓库）：**

- `docs/ai-comment-reply/0002-twikoo-ai-reply-wrapper.patch`（13.4KB，4 文件 300+/6-）— 在 `rumian0/twikoo` 1.7.12 基线干净 apply（实测 `git am --3way` 通过）：
  - `package.json`：`twikoo-vercel` `1.7.12` → `1.7.19`
  - `api/index.js`（wrapper 重写）：拦截内部事件 `AI_REPLY` 自处理并立即响应；其余透传 `await twikoo(request, response)`；`POST_SUBMIT` 透传完成后 fire-and-forget `Promise.race([axiosPost(AI_REPLY 自调), delay(5000)])`，自调头复用原始请求的 `x-twikoo-recursion`
  - `api/ai-reply.js`（新增 253 行）：自连 MongoDB（独立缓存 `db`/`config`），`aiReply(event, request)` 校验 `x-twikoo-recursion` 头 → DB 重读评论 → 守卫（isAiReply/master/isSpam/非文章页）→ pid 去重 → `AI_REPLY_THREAD_MAX` 线程上限 → 抓正文（`#markdown-wrapper, .markdown, article` fallback `main`）→ PROMPT 组装 → `callAi`（SSE 解流、429 指数退避 `AI_RETRY_MAX=4`、`AI_REPLY_TIMEOUT`）→ `insertOne` AI 回复（`isAiReply=true, master=false`）
  - `vercel.json`：`functions.api/index.js.maxDuration = 60`
- `docs/ai-comment-reply/README.md` — 更新为路线 A 说明 + 触发流程图 + 参数表 + 博客端 CDN 升级说明
- `src/components/comment/Twikoo.astro:9` — 客户端 CDN `cdnjs .../1.7.12/twikoo.all.min.js` → `https://cdn.jsdelivr.net/npm/twikoo@1.7.19/dist/twikoo.all.min.js`
- `src/content/posts/astro/index.mdx:137` — 教程示例 CDN `cdnjs .../1.6.41/...` → 同上 jsDelivr 1.7.19

**验证：** 补丁在干净 1.7.12 基线 `git am` 干净应用；`npm install` 后在临时目录 require wrapper（`typeof === 'function'`）+ `aiReply` 导出正常 + `twikoo-vercel` 实际版本 1.7.19；博客端 `pnpm exec astro check` 0 errors / 0 warnings / 0 hints。

**坑（换行符）：** 临时仓库若以默认 `core.autocrlf=true` 克隆，git 写工作区 CRLF，`git format-patch` 导出的补丁在目标库 `git am` 会 3-way 失败（`autocrlf` 需设 `false` 保证 LF）。已按 `twikoo-patch2` 同款流程修正并重新提交。

**⚠️ 用户侧待办（仓库只读边界外）：** ① 把 `0002` 补丁合入 `rumian0/twikoo` 并 `vercel deploy --prod`；② 确认 `twikoo.mingcy.cn` 部署的环境变量含 `MONGODB_URI`（Vercel 后台或 wrangler 无）、`ADMIN_PASS`（config 存 DB，通常无需额外设）；③ 等 AI_REPLY 独立实例跑完（maxDuration 60s），`ai.mingcy.cn` 证书需有效；④ 博客 `pnpm build` 后重新部署使 CDN 客户端升级生效。

### 2026-08-17 - AI 自动回复功能彻底移除（用户决定弃用）

**背景：** 用户反馈「这个项目不好用」，决定**弃用 Twikoo AI 自动评论回复**，要求删除全部相关实现，同时保留版本统一（前端客户端 1.7.19 ↔ 云函数 twikoo-vercel 1.7.19，面板版本不再告警）。

**修改文件：**

- 部署仓库 `rumian0/twikoo`（仓库只读边界外）：
  - `api/ai-reply.js`（**删除**）
  - `api/index.js`（**恢复纯薄包装**）：`module.exports = require('twikoo-vercel')`（撤销 wrapper 的 AI_REPLY 拦截 + POST_SUBMIT 自调触发）
  - `vercel.json`（还原）：移除 `functions.maxDuration`，仅保留 `rewrites`
  - `package.json`（**保留** twikoo-vercel `1.7.19`，与前端配套）
- `docs/ai-comment-reply/`（**整目录删除**：0001.patch / 0002.patch / README.md）
- `src/components/comment/Twikoo.astro`（**保留** jsDelivr 1.7.19，版本升级需求不变）
- `src/content/posts/astro/index.mdx`（**保留** 1.7.19 教程示例）

**原因：** AI 自动回复上线后不稳定（AI_REPLY 自调返回 200 但回复未写回、Vercel 无函数运行时日志可查、难以定位），用户评估后决定不采用该功能。本次回滚还原云函数为纯净薄包装，仅删除 AI 回复相关代码与文档，**前端版本升级（1.7.12 → 1.7.19）为独立需求予以保留**，确保版本面板一致。构建通过（205 html、Pagefind 86 pages）。

### 2026-08-18 - 主题视觉重构：参考 astro-devosfera（深蓝边框卡片 + 深蓝/浅绿背景 + 弹簧切换 + 玫粉行内代码 + 科技感排版）

**背景：** 用户反馈首页卡片 hover 放大卡顿、背景与行内代码不够美观、页面切换平淡、排版缺科技感。要求将参考主题 `F:\桌面\study\opencode\astro-devosfera`（localhost:4321）的视觉风格移植到本主题：**只改卡片方框样式不改排列方式**（保持纵向单列 grid）；黑→深蓝、白→浅绿；弹簧文章切换动画；行内代码玫粉色；代码块参考实例样式并**新增复制按钮**（原主题本无复制功能）；增强既有排版特效并新增一批科技感特效。用户确认：保留随机 accent（卡片高光跟随每页随机色）、移动端保留隐藏封面、新增复制按钮、增强+新增特效。

**修改文件：**

- `src/config.json` — 背景色：`bg.primary` 亮 `#ffffff`→`#f2f5ec`（浅绿）/ 暗 `#1c1c1e`→`#10131a`（深蓝）；`bg.secondary` 亮 `#f4f4f5`→`#e9eddb` / 暗 `#27272a`→`#1a2131`；`border.primary` 亮 `#e4e4e7`→`#d5dcc6` / 暗 `#3f3f46`→`#2e3b59`（蓝色系）；`text` 微调
- `src/components/head/AccentColorInjector.astro` — 亮色根背景混合基线 `rgb(250,250,250)` → `rgb(242,245,236)`（浅绿底）
- `src/styles/global.css` — 新增 `--post-card-border`（亮 `rgba(48,92,220,.45)` / 暗 `rgba(78,134,255,.45)` 深蓝边框）；`.post-list .card-glass` 专属样式（`rgb(var(--color-bg-primary)/.55)` 半透明底 + `blur(6px)` + 深蓝边框 + hover 上浮 4px + 蓝边高亮）；`.card-glow-effect` 鼠标跟随径向高光（`--mouse-x/--mouse-y` 定位、`rgb(var(--color-accent)/.16)` 随机强调色）；`.card-press` 点击弹簧弹出（`scale(1.03)` + overshoot 曲线）；`--page-bg` 亮 `#f2f5ec` / 暗 `#10131a`
- `src/components/post/PostCard.astro` — 首个子元素加高光层 `<div class="card-glow-effect">`；`<a>` 加 `relative z-10`（内容盖过高光）；封面图 hover 缩放 `scale-105`→`scale-[1.03]`（解决大缩放卡顿）
- `src/components/post/PostList.astro` — 新增脚本：document 委托 `mousemove`（rAF 节流、`closest('.post-list .card-glass')`、注入 `--mouse-x/--mouse-y`）+ 点击加 `.card-press`；`window.__postListGlowBound` 守卫防重复注册；TS 类型安全（`as HTMLElement`、`Record<string,boolean>`）
- `src/styles/swup.css` — 重写：进入用弹簧 `cubic-bezier(0.34,1.56,0.64,1)`（scale 0.965→1 + 淡入 + 去模糊 0.55s）；离开 0.3s 淡出+缩小+模糊（低于 Swup 4.9.2 默认超时，Swup 按计算 duration 等待，已验证 timeout:0 默认）；`prefers-reduced-motion` 降级
- `src/styles/shiki.css` — `.shiki` 背景改 `var(--shiki-light-bg)` / 暗 `var(--shiki-dark-bg)`（Shiki `defaultColor:false` 内联变量在 pre 上）
- `src/styles/markdown.css` — ①行内代码玫粉：亮 `#d63384` 深玫粉底 10% / 暗 `#f472b6` 浅玫粉底 16% + 细边框；②代码块重做：`.code-block` 仅相对定位，`pre` 圆角边框 + Shiki 主题背景，`.lang-tag` 与 `.copy-code` 浮动药丸（`-top-0.8rem` 左右各一，bg-secondary + 边框 + hover accent 辉光）；③科技感增强：`c-*` 彩色文字霓虹 text-shadow、`rainbow` 加 drop-shadow 辉光、`label` 悬停霓虹上浮、`kbd` 辉光悬停变 accent、`blockquote` 左侧呼吸光动画（quote-glow）；④新增特效类：`.neon`（青/粉/蓝/绿霓虹 + 微闪烁）、`.glitch`（`data-text` 双层错位故障，青/粉通道）、`.typewriter`（accent 光标闪烁）、`.scanline`（CRT 扫描线滑动）、`.gradient-text`（accent→青→紫流动渐变 + 辉光）；`prefers-reduced-motion` 统一降级
- `src/plugins/rehypeCodeBlock.js` — 代码块内注入 `<button class="copy-code" type="button">复制</button>`（md/mdx 双管道生效）
- `src/layouts/Layout.astro` — 新增 `is:inline` 委托点击脚本：`closest('.copy-code')` → 取同块 `pre.innerText` → `navigator.clipboard.writeText` → 「已复制 ✓」800ms 还原（Swup 切页后依然生效，document 级委托）
- `src/pages/links/fcircle.astro` — 暗色硬编码 `#1c1c1e` → `#10131a`（3 处）
- `src/content/posts/remark/index.md` — 新增「科技感文字特效」章节：`.neon/.glitch/.typewriter/.scanline/.gradient-text` 用法示例 + 既有特效增强说明

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete（130.52s）；dist 产物核验：首页含 `card-glow-effect`、CSS 含 `.post-list .card-glass`/`.card-press`/`.neon`/`.glitch`/`.scanline`/`.typewriter`/`.gradient-text`/玫粉 `#d63384`/Shiki 背景/弹簧 `cubic-bezier(.34,1.56,.64,1)`/`quote-glow`，remark 页含 `copy-code` 按钮 + `lang-tag`，Layout 内联复制脚本在每页 HTML。

**注意：** ①卡片深蓝边框为固定色，高光/辉光用随机 accent；②`card-press` 类由 JS 运行时添加（HTML 静态无引用属正常）；③MDX 文章无 Shiki 高亮（`extendPlugins:false` 未配 rehypeCodeHighlight），pre 背景走 fallback 色；④复制按钮依赖安全上下文（https/localhost），生产 mingcy.cn 为 https 可用。

### 2026-08-18 - 随机强调色修复：注入器改 is:inline 内联脚本（脱离共享 bundle）

**背景：** 用户反馈主题视觉重构后「随机色消失、刷新后颜色完全不变」（真 bug）。排查过程：config.json accent 数组完好（10 组）、`.text-accent/.bg-accent` 类正常生成、注入器逻辑 node 实测无异常、首页 bundle `hoisted.DvEci2uC.js` 确实静态 import 注入器。最终用 node vm 模拟浏览器环境加载完整模块链定位根因：

- **根因（注入器被"连坐"）**：AccentColorInjector 原为打包脚本，与 `@vercel/speed-insights`、`@vercel/analytics`、PrintVersion、ThemeLoader 合并进同一模块 `hoisted.BrM3nOr8.js`；该模块在**模块作用域**执行 `customElements.define("vercel-speed-insights"/"vercel-analytics", ...)`（vm 实测在此抛错）。该共享模块任一环节出错（重复定义、customElements 环境问题等）都会使**整个模块失效**，模块内的注入器随之不执行 → `--color-accent` 永不注入 → 随机色全消失、刷新不变。

**修改文件：**

- `src/components/head/AccentColorInjector.astro`（**重写**）：打包脚本 → `is:inline` + `define:vars` 内联脚本
  - `define:vars` 注入 `accentList / bgPrimary / bgSecondary / textPrimary / textSecondary / borderPrimary`（构建期序列化 config.json）
  - **零依赖纯原生 JS**：自实现 `hexToRgb`（parseInt 位运算）与 `mixRgb`（RGB 线性插值，node 实测与原 `chroma.mix(...,'rgb')` 结果逐位一致：如亮色根 `242 237 228`、暗色根 `6 13 35`），**chroma-js 移出运行时**（旧 42.85KB hoisted chunk 消失，站点 JS 更轻）
  - 行为不变：`Math.random()` 每页随机选 accent、`html{}`/`[data-theme='dark']{}` 双组 CSS 变量、`swup:content:replace` 切页重新注入
  - 执行时机更早：HTML 解析期同步执行（模块脚本是 defer 的），彻底免疫模块加载/打包/共享模块错误

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist 核验：首页与文章页 HTML 均含内联注入脚本（`const accentList` + `--color-accent` 模板）、`_astro/*.js` 中已无 `pickRandomAccent/accent.length|0`（注入器彻底脱离 bundle）、`node --check` 内联脚本语法 OK、mock DOM 执行实测 `INJECTED style contains --color-accent: true`。

**注意：** 若日后重新引入打包式脚本注入 CSS 变量，务必与含 `customElements.define`/模块作用域副作用的代码隔离，避免被连坐。

### 2026-08-18 - 友圈页面重构：iframe → Friend-Circle-Lite 直嵌（参考 astro-devosfera circle.astro 定制）

**背景：** 用户反馈 `/links/fcircle` 原样式（纯 iframe 嵌入 fc.mingcy.cn + 悬浮玻璃徽标）太丑，要求参考 `F:\桌面\study\opencode\astro-devosfera\src\pages\links\circle.astro` 定制专属本主题的朋友圈样式；要求：①随黑白模式自动切换（无需在页面内单独切换）；②去掉模板最上头的「聚合友链文章与站点状态」描述；③在「加载更多」按钮下方加一行「更新时间：xxxx」。

**关键技术发现（插件机制验证）：**

- Friend-Circle-Lite 插件（`https://fastly.jsdelivr.net/gh/willow-god/Friend-Circle-Lite/main/fclite.{min.js,min.css}`，jsDelivr 实测 200）**自动初始化**：`whenDOMReady()` 找 `#friend-circle-lite-root` 渲染，另监听 `pjax:complete`
- **主题机制：插件 CSS 用 `[data-theme=light/dark]` 选择器定义 `--text-color/--background-color/--author-color-*/--border-color-*/--hover-color` 等变量**——与 gyoza 的 `html[data-theme]`（ThemeLoader 维护）天然匹配，黑白切换自动跟随，**无需 `__fcliteTheme` 之类的 JS 桥接**
- 插件 stats 结构：`#stats-container` 含 3 行（Powered by / Designed By / **更新时间:xxx**），位于「加载更多」按钮下方
- 数据源：`https://fc.mingcy.cn/all.json`（140 篇 + `statistical_data.last_updated_time`）+ `status.json`（33 个友链状态）实测可用
- Swup 兼容：插件脚本放 main 容器内，@swup/astro 自带 ScriptsPlugin 在切页时重新执行 → 进入本页自动初始化；cleanFooter 监听 `swup:content:replaced` 重跑

**修改文件：**

- `src/pages/links/fcircle.astro`（**重写**，iframe 方案删除）：
  - **Hero**：好友数徽标（`allFriends.length 位好友`，数据源 `src/data/links.ts` flatMap，实测 44 位）+ 渐变标题「朋友圈」（`linear-gradient(text-primary→accent)` + background-clip:text）+ 好友头像条（44 个 friend-chip，无头像 fallback 首字母）+ 3 个 aurora 光球动画；**已去掉「聚合友链文章与站点状态」描述**
  - **Feed**：`#friend-circle-lite-root` 插件挂载点 + `UserConfig`（private_api_url=fc.mingcy.cn、page_turning_number=24、error_img 用 jsDelivr 默认 favicon）
  - **友链状态区**：`status.json` fetch → 正常/异常计数 + 状态卡片网格（绿/红指示点）
  - **更新时间**：cleanFooter 脚本保留 stats-container 最后一行并规范为「更新时间：xxx」（全角冒号）
  - **全套主题变量化样式**（`<style is:global>`）：全部颜色用 gyoza CSS 变量（`rgb(var(--color-accent))`、`rgb(var(--color-bg-secondary)/.5)`、`rgb(var(--color-text-primary))`、`rgb(var(--color-border-primary))`），覆盖插件的 random-article 卡、文章卡片、加载更多按钮、弹窗、spinner、状态区；**刻意不用 backdrop-filter**（避免滚动重绘卡顿）；`prefers-reduced-motion` 降级光球/卡片动画；移动端响应式
  - 变量映射：devosfera `--color-foreground`→`rgb(var(--color-text-primary))`、`--color-background`→`rgb(var(--color-bg-primary))`、`--color-border`→`rgb(var(--color-border-primary))`、`--color-accent`→`rgb(var(--color-accent))`（gyoza accent 是 RGB triplet，需 `rgb()` 包裹）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist `links/fcircle/index.html` 核验：hero-title/好友徽标/friend-chip ×44/插件挂载点/UserConfig/fclite 脚本样式/状态区/cleanFooter 均在；「聚合友链文章与站点状态」「了解朋友们在做什么」均已不存在；旧 iframe 已移除。

**注意：** ①插件卡片等元素刻意不设 backdrop-filter，与站点滚动降级策略一致；②`rgb(from #22c55e r g b / .3)`（十六进制输入）为合法 CSS，与既有 markdown.css 模式一致；③好友头像依赖友链站点的远程图片，加载失败回退 error_img（jsDelivr 默认图）。

### 2026-08-18 - 朋友圈插件本地化：CDN 引用 → public/fclite 本地精简版（去版权、card-bg 定稿 100×100）

**背景：** 用户要求：①`#friend-circle-lite-root .card-bg` 尺寸定为 100×100px（确认值）；②清理没用的 CSS/JS 避免缓存过大；③页面不能出现 "Powered by: FriendCircleLite / Designed By: LiuShen"（用户误以为在 CSS 中，实际是**插件 JS 动态渲染** stats-container 时写入的 `a.innerHTML=` 模板，CDN 版无法改）。

**关键技术事实（源码验证）：**

- 插件 CDN 版（fastly.jsdelivr.net/gh/willow-god/Friend-Circle-Lite/main/fclite.{min.js,min.css}）：JS 7504B / CSS 9906B，均带 sourcemap 注释
- 版权两行在 `function c(n)` 的 stats 渲染：`<div>Powered by: <a ...>FriendCircleLite</a>...` + `<div>Designed By: ...LiuShen...` + `<div>更新时间:${o.last_updated_time}</div>`，位于「加载更多」按钮下方
- 插件 CSS 原始 `#friend-circle-lite-root .card-bg` 为 **140×140px、opacity .4**；主题此前覆盖为 100×100、opacity .15

**修改文件：**

- `public/fclite/fclite.js`（**新建**，本地化插件 JS）：`a.innerHTML=` 改为**只渲染「更新时间:${o.last_updated_time}」一行**（正则替换删除 Powered/Designed 两行）；移除 sourcemap 注释；其余功能（随机文章/分页/弹窗/localStorage 10min 缓存）不变；7174B
- `public/fclite/fclite.css`（**新建**，本地精简 CSS）：仅保留**布局/结构/动画**（grid/flex/position/transform/keyframes/响应式），**删除被 fcircle.astro 主题覆盖的颜色/边框/阴影属性**（颜色统一由主题 `#friend-circle-lite-root` 覆盖接管、走 CSS 变量随黑白切换）；保留 `:root`/`[data-theme]` 变量定义作兜底；**`#friend-circle-lite-root .card-bg` 定稿 width/height 100×100px** + `opacity .15`、hover `scale(1.1) + opacity .3`；8343B
- `public/fclite/avatar-fallback.svg`（**新建**，236B）：头像加载失败兜底图（灰色圆 + 人形），替代原 jsDelivr favicon.ico（207KB）
- `src/pages/links/fcircle.astro`：`<link>`/`<script src>` 改引用本地 `/fclite/fclite.css`、`/fclite/fclite.js`；`UserConfig.error_img` → `/fclite/avatar-fallback.svg`；**删除 cleanFooter 运行时清理脚本**（本地 JS 已不渲染版权行，无需兜底）；删除 fcircle.astro 内重复的 `.card-bg` 覆盖块（已并入本地 CSS）

**验证：** `pnpm exec astro build` 206 pages Complete；dist 核验：`links/fcircle/index.html` 仅引用本地 `/fclite/fclite.css`、`/fclite/fclite.js`、`/fclite/avatar-fallback.svg`，**无 fastly.jsdelivr 残留**（页面中唯一 jsdelivr 是友链数据里好友自己的头像 URL，属数据内容非插件依赖）；本地 JS `node --check` 语法 OK 且无 Powered/Designed、保留更新时间渲染；dist/fclite 共 3 文件 15934B。

**注意：** 本地化后文件无 hash，改内容后部署需留意浏览器缓存；插件 JS/CSS 若上游更新需手动同步（private_api_url 数据接口 `fc.mingcy.cn` 不变）。

### 2026-08-18 - 朋友圈 Hero 区块移除（用户截图确认：红框圈住的整个顶部 hero）

**背景：** 用户截图（红框标注）确认想去掉的是**整个 Hero 区域**——「44 位好友」徽标 + 渐变「朋友圈」标题 + 6 排好友头像条（此前"去掉'聚合友链文章与站点状态'"的诉求实际指整个区块，非仅描述文字）。

**修改文件：** `src/pages/links/fcircle.astro`

**修改内容：** ①删除 frontmatter 中 `import { friendLinks }` 与 `allFriends` 计算（仅 hero 使用）；②删除整个 `.circle-hero` HTML 块（aurora 光球 ×3、hero-badge、hero-title、friend-strip 头像条）；③删除全部 hero 相关 CSS（`.circle-hero/.aurora-orb/.hero-inner/.hero-badge/.badge-dot/.hero-title/.friend-strip*/.friend-chip/.chip-*` 及 orb-a1~a3/pulse-dot keyframes、响应式与 reduced-motion 中的引用）；④页面现直接以插件动态流开头（统计 + 随机文章 + 文章卡片），其后是友链状态区。

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist `links/fcircle/index.html` 核验：`位好友`/`hero-title`/`friend-chip`/`<h1>` 均不存在，`friend-circle-lite-root`/本地 fclite CSS/友链状态保留。

### 2026-08-18 - 文章页评论悬浮按钮（CommentFAB）：右下角 BackToTop 上方、点击平滑滚动到评论区

**背景：** 用户要求为文章页右下角添加评论悬浮小功能，位置在 `fixed right-4 bottom-6 z-10`（BackToTopFAB）的上方，尺寸参考 BackToTopFAB，图标自定（iconfont 无评论气泡图标，用 inline SVG），点击后平滑滚动到 Twikoo 评论区；完成后执行 `node scripts/sync.mjs` 同步源码到 GitHub。

**修改文件：**

- `src/components/post/CommentFAB.astro`（**新建**，纯 Astro + is:inline 脚本，无 React 生命周期问题）：
  - 结构：`#comment-fab` 固定定位 `right: 1rem; bottom: 6rem`（BackToTop 占 1.5rem+2.5rem，其上方留 2rem 间距）、`z-index: 10`；`size-10`（2.5rem）圆形按钮，样式同 BackToTopFAB（圆角/边框/`bg-primary` 半透明 + `blur(8px)` + 阴影），hover 变 accent + 辉光
  - 图标：inline SVG 评论气泡（lucide message-circle 线条风格，1.15rem）
  - **运行时守卫**：`#comment-fab` 初始 `data-hidden`（display:none）；脚本检查 `document.getElementById('twikoo')` 存在才移除隐藏——`frontmatter comments:false` 的无评论区文章永远不显示
  - 滚动浮现：scroll 事件 rAF 节流，`window.scrollY > 100` 时加 `is-visible`（opacity + translateY/scale 弹簧过渡）
  - 点击：`target.scrollIntoView({ behavior: 'smooth', block: 'start' })`（html `scroll-padding-top: 64px` 自动避开固定 header）
  - Swup 兼容：组件在 main 容器内、`swup-transition-fade` 外（避免 fixed 定位受页面切换 transform 影响）；Swup 切页重建 main 时 inline 脚本随新 HTML 重新执行
- `src/layouts/MarkdownLayout.astro`：import 并挂载 `<CommentFAB />`（main 内、HeadGradient 旁、swup 动画容器外）——仅文章页布局包含

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist 核验：文章页（remark）含 `comment-fab` + `id="twikoo"` + `scrollIntoView` 脚本 + SVG 图标，首页无 `comment-fab`；无评论区文章的按钮由运行时 `#twikoo` 检查隐藏（HTML 保留 `data-hidden` 初始态）。

**注意：** 评论按钮依赖 Twikoo.astro 静态渲染的 `#twikoo` 容器（与 twikoo.init 的异步加载无关），滚动定位始终可用。

### 2026-08-18 19:35 - 控制台报错排查结论：ERR_BLOCKED_BY_CLIENT / ERR_CONNECTION_CLOSED 为浏览器自带跟踪防护拦截（不做代码更改）

**背景：** 用户反馈文章页（localhost:4322/2026/08/16/deepseek-harness）控制台报错：`Failed to load resource: net::ERR_CONNECTION_CLOSED` ×1、`Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` ×3，另有 32 条「Tracking Prevention blocked access to storage」警告。

**排查过程（截图 + 实测）：**

- 控制台截图逐字转录：所有报错均来自 `script.js:1`（即两个 Umami 统计脚本 `um.mingcy.cn/script.js` 与 `cloud.umami.is/script.js`）；Vercel SpeedInsights/Analytics 那几条是 **dev 模式调试日志**（Debug mode enabled，生产不发请求），非错误
- 实测两个域名（本机）：`https://um.mingcy.cn/script.js` → **200**（4595B）、`https://cloud.umami.is/script.js` → **200**（4717B），服务均正常
- **结论：报错是浏览器侧行为，非站点代码问题**：
  - `ERR_BLOCKED_BY_CLIENT`：用户浏览器为 Edge，其**跟踪防护（Tracking Prevention）/广告拦截扩展**拦截第三方统计脚本（`cloud.umami.is` 为典型被拦目标），代码无法绕过
  - `ERR_CONNECTION_CLOSED`：`um.mingcy.cn` 服务实测正常（200），为用户浏览器/网络侧连接被关闭（瞬时问题或拦截表现）
  - 32 条 storage 拦截警告同样是 Edge 跟踪防护对第三方存储访问的常规提示

**处理：**

- 曾尝试移除 `cloud.umami.is` 云版脚本以消除报错（Layout.astro 一度删除该行并构建）
- **用户决定不做更改**：报错属浏览器自带拦截行为，保留双 Umami 实例（自建 `um.mingcy.cn` + 云版 `cloud.umami.is`，CLAUDE.md 2026-07-17 记录的双实例保障统计不中断）
- `src/layouts/Layout.astro` **已还原**（恢复 `cloud.umami.is/script.js` 行）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist `index.html` 核验两条 Umami 脚本均恢复。

**注意：** 若访客在 Edge/带广告拦截的浏览器打开站点，控制台仍会出现同类拦截报错——属浏览器自带行为，非站点缺陷，无需处理；统计功能在未拦截环境下正常收集（自建实例为主）。

### 2026-08-18 20:25 - 朋友圈 Swup 切页空白修复 & 初次加载优化（初始化移入 Layout body 级常驻脚本）

**背景：** 用户反馈生产环境 `/links/fcircle` 异常：**初次访问（从首页 Swup 导航进入）插件区空白、友链状态卡"加载中…"，整页刷新后才正常**。截图证据：页面仅显示"友链状态 加载中…"，`#friend-circle-lite-root` 完全空白。

**根因（关键机制修正）：** 朋友圈的插件脚本与状态拉取此前放在 fcircle 页面（`main` 容器）内的 `is:inline` 脚本中。**`@swup/astro` 切页时只替换 `main` 容器，容器内的 inline 脚本不会重新执行**——之前误以为 SwupScriptsPlugin 会执行（实际未生效）。因此从首页 Swup 导航进朋友圈时：插件脚本（fclite.js）未加载/未初始化 → 动态区空白；status fetch 未执行 → 卡"加载中…"；只有整页刷新（脚本随 HTML 重新解析执行）才正常。

**修改文件：**

- `src/layouts/Layout.astro`：body 末尾新增 `is:inline` **常驻全局脚本**（Swup 永不替换 body，监听器一直有效）：
  - `window.UserConfig` 兜底定义（`private_api_url: https://fc.mingcy.cn/`、`page_turning_number: 24`、`error_img: /fclite/avatar-fallback.svg`）
  - `ensureFclite(cb)`：`typeof initialize_fc_lite === 'function'` 已加载直接回调；否则动态创建 `<script data-fclite src="/fclite/fclite.js">` 加载后回调（防重复）
  - `boot()`：① 找到 `#friend-circle-lite-root` → 确保 fclite.js → `root.children.length === 0` 时才 `initialize_fc_lite()`；② 找 `#links-summary/#links-grid` → fetch `fc.mingcy.cn/status.json` 渲染（`dataset.state` 防重复，`esc()` 防 XSS）
  - 触发时机：DOMContentLoaded / `swup:content:replaced` / `astro:page-load`（均 setTimeout 150-200ms 兜底）
- `src/pages/links/fcircle.astro`：删除原 main 内三个 inline 脚本（UserConfig、fclite.js 静态引用、status fetch）后，**恢复 UserConfig 静态定义 + `<script is:inline src="/fclite/fclite.js">` 静态引用**（初次整页加载时浏览器尽早并行下载，Layout 兜底负责 Swup 切页）

**双路径覆盖：**

- 初次整页加载（直接访问/刷新）：静态 `<script src>` 立即下载执行 → 插件初始化；Layout 脚本 DOMContentLoaded 后 boot，`ensureFclite` 检测已加载跳过、`root.children` 非空跳过初始化；status 由 Layout 拉取
- Swup 切页（首页→友圈）：main 内静态脚本不执行 → Layout 常驻脚本在 `swup:content:replaced` 后动态加载 fclite.js（或复用已加载）→ 初始化 → 渲染；status 重新拉取

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist 核验：fcircle 页含静态 UserConfig + `/fclite/fclite.js` 引用 + 挂载点 + `/fclite/fclite.css`；Layout 含 `FCLITE_JS` 全局脚本 + `data-fclite` 守卫 + `links-summary` 拉取 + UserConfig 兜底；用户截图确认页面已正常渲染（统计卡 + 随机文章 + 文章卡片）。

**注意：** 若日后在 `main` 容器内放置依赖 Swup 切页后重新执行的逻辑，必须挂到 body 级常驻脚本（Layout.astro）或 document 级委托 + 一次性守卫，不能依赖 main 内 inline 脚本在切页后重跑。

### 2026-08-18 20:45 - 朋友圈 Swup 切页样式丢失修复（fclite.css 移入 Layout head 全局加载）

**背景：** 用户用截图（1.webp vs 2.webp）精确定位：**从任意页面 Swup 进入朋友圈显示 @1**（统计/随机文章正常，但文章卡片区只有一张巨大的封面图、无网格布局），**整页刷新后显示 @2**（完整卡片网格）。**根因是 fclite.css 未加载**：`<link rel="stylesheet" href="/fclite/fclite.css">` 此前放在 fcircle 页面（`main` 容器内），Swup 用 innerHTML 替换 main 时该 link 未被正确加载/应用 → 插件 DOM 无布局样式：`.card-bg` 失去 100×100 尺寸限制（封面图显示为原始巨大尺寸）、卡片网格塌陷。刷新时 link 随 HTML 正常解析 → 正常。

**修改文件：**

- `src/layouts/Layout.astro`：`<link rel="stylesheet" href="/fclite/fclite.css" />` 移入 **head 全局加载**（Swup 不替换 head，所有页面样式始终可用）；全局兜底脚本新增 `ensureFcliteCss()`（遍历 `document.styleSheets` 检查 `/fclite/fclite.css`，未加载则创建 `<link data-fclite-css>` 补挂 head），`boot()` 开头调用；并将 `swup:content:replaced`（Swup 4 无此事件）改为 `swup:page:view`（真实替换后事件）+ `astro:page-load` 双监听、150ms/700ms 双次兜底、`ensureFclite` 的 script 加 `onerror` 自动重试
- `src/pages/links/fcircle.astro`：删除 main 内 fclite.css `<link>`（由 Layout head 提供），保留静态 `window.UserConfig` + `<script src="/fclite/fclite.js">`

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 206 pages Complete；dist 核验：`index.html` 的 `</head>` 前含 `/fclite/fclite.css` + `ensureFcliteCss`；fcircle 页 head（继承 Layout）含 fclite.css、main 内 link 已移除、静态 fclite.js + UserConfig 保留。

**注意：** 关键教训——**凡被 Swup 替换容器（main）内的 `<link>` 样式与 `<script>` 脚本都不可靠**，样式应放 head（Layout 全局）、逻辑应放 body 级常驻脚本；fclite.css 全局加载会让所有页面多 ~7.7KB 未使用样式（可接受）。

### 2026-08-18 21:00 - Twikoo 1.7.19 邮件通知模板（白天模式，适配博客主题）

**背景：** 用户要求为博客的 Twikoo 评论系统写邮件通知模板，使用 1.7.19 版本、适配本站主题（浅绿背景 + 深蓝强调 + 圆角卡片 + 科技感）、白天模式风格。

**关键机制（从 twikoo-vercel@1.7.19 → twikoo-func@1.7.19 源码 utils/notify.js 确认）：**

- 邮件模板**不是 EJS**，而是 **`${变量}` 字符串替换**（`.replace(/\${SITE_URL}/g, ...)`），模板粘贴到管理后台「邮件通知」配置项
- 两个模板配置项 + 两个主题配置项：`MAIL_TEMPLATE_ADMIN`（博主通知，变量 `SITE_URL/SITE_NAME/NICK/IMG/IP/MAIL/COMMENT/POST_URL`）、`MAIL_TEMPLATE`（回复通知，变量 `IMG/PARENT_IMG/SITE_URL/SITE_NAME/PARENT_NICK/PARENT_COMMENT/NICK/COMMENT/POST_URL`）、`MAIL_SUBJECT_ADMIN`、`MAIL_SUBJECT`
- `NICK/MAIL/PARENT_NICK` 已由官方 `escapeHtml` 转义；`${COMMENT}/${PARENT_COMMENT}` 未转义（与官方默认一致），仅作文本展示
- 头像变量 `${IMG}` 为完整 URL

**交付文件：**

- `docs/twikoo-mail-template/README.md` — 配置位置（Twikoo 管理后台 → 设置 → 邮件通知）、变量表、使用步骤
- `docs/twikoo-mail-template/notify-admin.html` — 博主新评论通知模板（白天模式）
- `docs/twikoo-mail-template/notify-reply.html` — 回复通知模板（白天模式）

**模板设计（白天模式）：** 邮件背景 `#f2f5ec`（博客亮色 bg-primary）、主卡片白色圆角 16px + 边框 `#d5dcc6`、头部深蓝渐变条（`#3b82f6→#2563eb`）白字博客名、正文 `#33373a`、次要 `#5f6b5a`、评论内容块浅绿底 + 左侧 3px 蓝边、回复区分主/次内容块（浅蓝底 vs 浅绿底 + 头像蓝框区分）、蓝色圆角按钮「查看完整内容/查看回复」（POST_URL）、底部博客地址 + 「Powered by Twikoo」；**table 内联样式**（兼容 Outlook/Gmail/QQ 邮箱，无 flex/grid/外部依赖）。

**验证：** node 校验两模板 table 标签闭合完整（5/5、6/6）、使用变量与源码替换列表逐一比对——无缺失、无多余。

**注意：** `${COMMENT}` 未转义，勿将评论内容拼进 href/属性；模板变量名不可改动，否则 Twikoo 无法替换会原样输出 `${...}`。

### 2026-09-12 - 灯箱修复（Fancybox 本地化 + 相册 Lightbox Swup 兼容）& EdgeOne 预热 + 百度收录自动化工作流

**背景：** 用户反馈两个灯箱问题：①文章页 Fancybox 点击无放大效果（Edge 跟踪防护拦截 CDN 脚本）；②相册页（galleries/[slug]）点击图片无灯箱反应（Swup 切页后 inline 脚本不重新执行）。同时需要接入 EdgeOne 缓存预热和百度收录推送自动化。

**修改文件：**

- `public/fancybox/fancybox.min.css`（**新建**，fancyapps-ui 6.0.29 CSS 本地化，28KB）
- `public/fancybox/fancybox.umd.min.js`（**新建**，fancyapps-ui 6.0.29 JS 本地化，98KB）
- `src/layouts/Layout.astro`（Fancybox CDN 引用 → 本地 `/fancybox/` 路径；body 末尾新增 gallery lightbox 常驻初始化脚本）
- `src/pages/galleries/[slug].astro`（删除原 `is:inline` inline 脚本块，保留 `<dialog>` HTML + CSS）
- `scripts/edgeone_prefetch.py`（**新建**，EdgeOne 缓存预热脚本：腾讯云 SDK、分批提交、限速、重试、轮询任务状态）
- `scripts/baidu_push.py`（**新建**，百度普通收录推送脚本：从 sitemap 收集页面 URL、分批推送、解析返回结果）
- `.github/workflows/deploy-warmup-push.yml`（**新建**，GitHub Actions 工作流：push main → EdgeOne 预热 → 百度推送；支持 workflow_dispatch 手动触发、定时 cron）

**修改内容：**

- **Fancybox 本地化**：从 `cdnjs.cloudflare.com` 下载 CSS/JS 到 `public/fancybox/`，Layout.astro 引用改为同源 `/fancybox/fancybox.min.css` + `/fancybox/fancybox.umd.min.js`，解决 Edge 跟踪防护拦截第三方 CDN 脚本导致 `typeof Fancybox === 'undefined'` → 灯箱失效的问题
- **相册 Lightbox Swup 兼容修复**：原 `galleries/[slug].astro` 的 inline 脚本监听 `astro:after-swap`（Swup 4 不存在的事件），且 Swup 用 innerHTML 替换 main 时 inline 脚本不重新执行 → 灯箱 click 事件从未绑定。修复方案：将 `initGalleryLightbox()` 提升到 `Layout.astro` body 级常驻脚本（与 fclite、复制按钮同模式），监听 `swup:page:view` + `astro:page-load` 事件，`grid.dataset.lightboxInit` 防重复绑定
- **EdgeOne 预热脚本**：使用腾讯云 SDK（`tencentcloud-sdk-python`）调用 `CreatePrefetchTask` API，从 sitemap + dist 目录收集 URL，分批提交（每批 ≤5000 条，`time.sleep(0.2)` 限速，指数退避重试），可选轮询任务状态（间隔 10s，超时 900s），输出 GitHub Actions Step Summary
- **百度收录推送脚本**：从 sitemap 收集页面 URL（不包含静态资源），分批推送给百度 `data.zz.baidu.com/urls` API（每批 ≤2000 条），解析 success/remain/not_same_site/not_valid，支持 dry-run 测试模式
- **GitHub Actions 工作流**：`deploy-warmup-push.yml`，触发条件：push main（dist/public/out 变更）、定时 cron（每天 UTC 18:00 / 北京时间 02:00）、手动 workflow_dispatch（可附加额外 URL）；`concurrency` 防并发；Job 1 EdgeOne 预热 → Job 2 百度推送（`needs` 依赖确保预热先完成）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 208 pages Complete（133.7s）；dist 核验：`/fancybox/fancybox.min.css` + `fancybox.umd.min.js` 存在、所有文章页引用本地 `/fancybox/` 路径（非 CDN）、galleries 页面含 `initGalleryLightbox` 常驻脚本 + `<dialog id="lightbox">` 结构保留、`initGalleryLightbox` 监听 `swup:page:view`/`astro:page-load`；`pnpm d` 推送成功（`bb906fe`）。

**注意：** ①自动化工作流需在 GitHub 仓库 Settings > Secrets 配置 `TENCENTCLOUD_SECRET_ID/KEY`、`EDGEONE_ZONE_ID`、`BAIDU_SITE/TOKEN`，Variables 配置 `SITE_ORIGIN`、`SITEMAP_URL`；②首次运行百度推送建议设 `BAIDU_DRY_RUN=true` 干跑验证 URL 列表；③百度 token 如泄露需去搜索资源平台重置。

### 2026-09-13 - 灯箱统一：文章 + 相册全部使用 Fancybox（删除自建 Lightbox）& 修复导航/选择器 + new-friend.js 补充 friend.json 写入

**背景：** 用户反馈两个灯箱问题：①文章页 Fancybox 有点击放大但没有左右滑动功能；②相册页 Lightbox 需要等所有图片加载完才能点击放大，现在点击功能消失。用户决定将文章和相册全部换成 Fancybox 统一处理。同时发现 `new-friend.js` 只写 `links.ts` 不写 `friend.json`。

**修改文件：**

- `src/layouts/Layout.astro`（Fancybox 配置更新 + 修复初始化逻辑）
- `src/pages/galleries/[slug].astro`（删除自建 Lightbox，改用 Fancybox）
- `scripts/new-friend.js`（新增 `friend.json` 追加逻辑）

**修改内容：**

- **galleries/[slug].astro 统一使用 Fancybox**：
  - `<button class="gallery-item">` 改为 `<a href={img.src.src} data-fancybox="gallery" data-caption={img.alt}>`
  - 删除自建 Lightbox dialog HTML（`<dialog id="lightbox">` 及其全部子元素）
  - 删除自建 Lightbox CSS 样式（`.lightbox` 相关全部规则）
- **Layout.astro 删除自建 Lightbox 初始化脚本**：
  - 删除 `initGalleryLightbox()` 函数及其 Swup 兼容监听代码（约 70 行）
  - Fancybox 初始化函数 `initFancybox()` 已包含相册页图片绑定
- **Layout.astro Fancybox 修复（Fancybox 6 源码验证）**：
  - 移除无效 Toolbar 配置（`prev`/`counter`/`next` 不是 fancybox 6 的合法 toolbar 项，fancybox 6 仅支持 `infobar`/`close`/`slideshow`/`thumbs`；prev/next 箭头由 Carousel 组件自动渲染）
  - 选择器从 `[data-fancybox="gallery"], [dataFancybox="gallery"]` 简化为 `[data-fancybox]`（`dataFancybox` camelCase 不是合法 HTML 属性，fancybox 的 `fromEvent` 用 `el.closest(n)` 匹配，只需 `data-fancybox` 即可同时覆盖文章页和相册页）
  - `Fancybox.bind()` 前新增 `Fancybox.unbind(document.body)`（fancybox 6 的 `unbind` 会删除已注册选择器并移除 click 监听器，`bind` 重新注册时 size 为 1 会重新添加监听器——解决 Swup 切页后重复绑定问题）
- **new-friend.js 补充 friend.json 写入**：
  - 新增 `friendJsonFile` 路径常量（`public/js/friend.json`）
  - 成功写入 `links.ts` 后，读取 `friend.json`、解析 JSON、向 `friends` 数组追加 `[name, link, avatar]` 元组、写回文件
  - try/catch 包裹，写入失败仅 console.error 不中断流程

**效果：**

- 文章页：Markdown 图片点击放大 + 左右滑动 + 计数器 + 无限循环
- 相册页：网格图片点击放大 + 左右滑动 + 计数器 + 无限循环 + 不需要等所有图片加载完
- 两套系统统一为 Fancybox，代码更简洁
- 新增友链时同时写入 `links.ts`（分类展示）和 `friend.json`（外部引用）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 208 pages Complete；dist 核验：文章页和相册页均引用 `/fancybox/fancybox.umd.min.js`，相册页无 `<dialog id="lightbox">` 残留，`data-fancybox="gallery"` 属性正确注入；`pnpm d` 推送成功（`7ec217a`）。

**关键发现（Fancybox 6 源码分析）：** `Fancybox.bind(selector, options)` 在 `document.body` 上仅添加一次 click 监听器（`openers Map size === 1` 时）；`Fancybox.unbind(element)` 删除该容器的所有注册选择器并移除 click 监听器；`fromEvent` 用 `r.closest(n)` 匹配点击目标与注册选择器——因此 `data-fancybox` 属性名必须全小写，selector 用 `[data-fancybox]` 即可。

### 2026-09-13 - 相册灯箱改用 SimpleLightbox（修复 Fancybox 无法拦截相册直链跳转）& new-friend.js 补充 friend.json

**背景：** 用户反馈相册页（`/galleries/[slug]`）点击图片直接跳转到图片直链（浏览器 navigate 到 .webp 文件），Fancybox 灯箱未弹出。根因：Fancybox 6 的 delegated click（`document.body` 上 `fromEvent`）在相册页未能拦截 `<a href="...webp">` 的原生点击——`preventDefault()` 未生效，浏览器在 Fancybox 处理前已触发导航。用户决定相册改用 SimpleLightbox（独立于 Fancybox，互不干扰）。

**修改文件：**

- `public/simplelightbox/simple-lightbox.min.css`（**新建**，SimpleLightbox 2.14.3 CSS，3.8KB）
- `public/simplelightbox/simple-lightbox.min.js`（**新建**，SimpleLightbox 2.14.3 JS，48.6KB）
- `src/layouts/Layout.astro`（head 追加 SimpleLightbox CSS；body 追加 SimpleLightbox JS + `initSimpleLightbox()`；`initFancybox()` 增加相册页排除逻辑）
- `src/pages/galleries/[slug].astro`（移除 `<a>` 上的 `data-fancybox="gallery"` 属性，保留 `data-caption`）

**修改内容：**

- **SimpleLightbox 本地化**：从 unpkg 下载 CSS/JS 到 `public/simplelightbox/`，Layout head 引用 `/simplelightbox/simple-lightbox.min.css`，body 引用 `/simplelightbox/simple-lightbox.min.js`
- **Fancybox 排除相册页**：`initFancybox()` 新增 `isGalleryPage()` 守卫——检测 `document.querySelector('.gallery-grid')` 存在则跳过 Fancybox 初始化，避免两个灯箱同时绑定同一 `<a>` 标签
- **SimpleLightbox 初始化**：`initSimpleLightbox()` ——检测 `.gallery-grid` 存在且未初始化（`dataset.slInit` 防重复）→ `new SimpleLightbox('.gallery-grid a.gallery-item', { captionsData: 'data-caption', swipeClose: true, scrollZoom: true, doubleTapZoom: 2 })`
- **统一 Swup 切页**：`initAllLightboxes()` 同时调用 `initFancybox()` + `initSimpleLightbox()`，监听 `swup:page:view` + `astro:page-load` 事件
- **相册 HTML 简化**：`<a>` 标签移除 `data-fancybox="gallery"`（Fancybox 不再处理相册），保留 `data-caption` 供 SimpleLightbox 读取

**效果：**

- 文章页：Fancybox 灯箱（点击放大 + 左右滑动 + 无限循环）
- 相册页：SimpleLightbox 灯箱（点击放大 + 左右滑动 + 滚轮缩放 + 双击放大）
- 两套灯箱互不干扰：`isGalleryPage()` 守卫确保同一页面只激活一个
- 新增友链时同时写入 `links.ts`（分类展示）和 `friend.json`（外部引用）

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 208 pages Complete；dist 核验：相册页引用 `/simplelightbox/simple-lightbox.min.css` + `/simplelightbox/simple-lightbox.min.js`，`<a>` 标签无 `data-fancybox`，有 `data-caption`；文章页仍引用 `/fancybox/` + `data-fancybox`；`pnpm d` 推送成功（`ad49fb6`）。

### 2026-09-14 - 灯箱统一：移除 SimpleLightbox，全站 Fancybox 唯一组件 + 分组轮播

**背景：** 用户要求全站统一使用 Fancybox 作为唯一图片预览组件，移除所有 SimpleLightbox 相关代码。同时修复两个 BUG：①相册页点击图片跳转直链导致返回后 CSS 丢失；②文章页图片点击无放大弹窗。要求图片分组逻辑：相册内图片共享一个轮播组（`data-fancybox="gallery"`），文章内图片各自独立分组（`data-fancybox="article"`）。

**修改文件：**

- `src/layouts/Layout.astro`（移除 SimpleLightbox，重写 Fancybox 初始化脚本）
- `src/plugins/rehypeImage.js`（文章图片 `data-fancybox` 从 `"gallery"` 改为 `"article"`）
- `src/pages/galleries/[slug].astro`（`<a>` 标签添加 `data-fancybox="gallery"`）
- `public/simplelightbox/`（**整目录删除**）

**修改内容：**

- **Layout.astro head**：移除 `<link rel="stylesheet" href="/simplelightbox/simple-lightbox.min.css" />`，仅保留 Fancybox CSS
- **Layout.astro body**：移除 `<script is:inline src="/simplelightbox/simple-lightbox.min.js">`；删除 `isGalleryPage()`、`initSimpleLightbox()`、`initAllLightboxes()` 函数；重写 `initFancybox()` 为全站统一初始化：
  - `Fancybox.unbind(document.body)` 先销毁旧实例（防止 Swup 切页重复绑定）
  - `Fancybox.bind('[data-fancybox]')` 绑定所有带属性元素（不再排除相册页）
  - 配置：`touch: { vertical: true }`（左右滑动切换、垂直滑动关闭）、`Carousel: { infinite: true }`（无限循环）、`preload: 1`（预加载1张）、`Caption: { type: 'auto' }`（读取 alt 作为标题）、`Toolbar: { display: { infobar: true, close: true } }`（计数器+关闭按钮）、`Keyboard`（方向键切换）、`backdrop: true`（灰色遮罩）
  - 事件监听：`DOMContentLoaded` + `swup:page:view` + `astro:page-load`
- **rehypeImage.js**：`'data-fancybox': 'gallery'` → `'data-fancybox': 'article'`（文章图片独立分组）
- **galleries/[slug].astro**：`<a>` 标签添加 `data-fancybox="gallery"`（同相册图片共享轮播组），保留 `data-caption`

**效果：**

- 相册页：点击图片 → Fancybox 弹窗（不跳转直链）→ 同相册内左右滑动轮播
- 文章页：点击图片 → Fancybox 弹窗 → 单篇文章内图片独立轮播
- 修复：相册点击不再跳转直链（`preventDefault()` 生效），返回后 CSS 不丢失
- 修复：文章页图片点击正常弹出放大弹窗 + 左右滑动

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 构建成功（astro check + vite build 均无错误）。

### 2026-09-15 23:10 - Twikoo 改官方 CDN 加载 + 两行评论头 CSS + 友圈移动端溢出修复

**背景：** 用户要求把 Twikoo 从本地静态文件改为官方 CDN 引入，同时应用两套 CSS：①Twikoo 评论样式（两行评论头 / 子回复缩进收敛 / 禁止中文昵称竖排）；②友圈页面移动端卡片横向溢出修复（PC 端完全不动）。约束：只动 Twikoo 引入代码 + 新增自定义 CSS，不改文章、相册等其他页面逻辑。

**前置事实（从本地 bundle 源码逐字验证，v1.7.19）：**

- Twikoo 评论 DOM 为 `.tk-comment > (.tk-avatar + .tk-main)`，`.tk-main > (.tk-row + .tk-content + .tk-replies)`；`.tk-row > (.tk-meta + .tk-action)`——**不存在** `tk-header` / `tk-comment-content` / `tk-btn` / `tk-action-btn` 这些类（旧 CSS 里后两个是死选择器，点赞/回复按钮实际是 `.tk-action-link`）
- 官方 CSS 硬编码 `word-break: break-all` 在 `.tk-comment` 上、`.tk-content img { max-width: 300px }`、`.tk-replies { max-height: 200px }`（JS 用 `scrollHeight > 236` 判定是否显示「展开」）
- `public/twikoo/twikoo.all.min.js` 实为 **35941 行、1.63MB**（被 `pnpm lint` 的 prettier 重排过，官方原始包只有 772KB）——`.prettierignore` 未排除 `public/`，再次本地化会被同样污染
- CDN 实测：`https://cdn.jsdelivr.net/npm/twikoo@1.7.19/dist/twikoo.all.min.js` → 200 / 772129B（与官方一致）；unpkg 同版本同体积可用作备源
- 友圈溢出根因：`public/fclite/fclite.css` 的 `.articles-container` 用 `repeat(auto-fill, minmax(220px, 1fr))`，220px 是网格轨道**硬下限**，容器比 220px 窄时轨道不收缩 → 卡片墙撑出视口

**修改文件：**

- `src/layouts/Layout.astro`（Twikoo 加载源 + 多源降级）
- `public/twikoo/`（**整目录删除**）
- `src/components/comment/Twikoo.astro`（**重写** `<style is:global>`，46 条规则）
- `src/pages/links/fcircle.astro`（追加 `@media (max-width: 768px)` 块）

**修改内容：**

- **Layout.astro**：`TWIKOO_JS` 从字符串 `/twikoo/twikoo.all.min.js` 改为**数组**（jsDelivr 主源 + unpkg 备源，版本钉死 1.7.19 与云函数 twikoo-vercel 对齐）；新增 `twikooTryIndex` + `loadTwikooScript()`，`onerror` 时自动换下一个源，两个源都失败才走原有 `setLoader(..., 'Twikoo 加载失败，请刷新重试')`；`adoptTwikooStyles()` 与 `mountTwikoo()` 一字未改（CDN bundle 内同样是 webpack vue-style-loader，样式挪出 head 的机制依然必需）
- **Twikoo.astro 两行评论头（纯 CSS，零 JS）**：`.tk-main > .tk-row { flex-wrap: wrap }` + `.tk-meta { flex: 1 1 100% }`（第一行：头像+昵称+标签+日期）+ `.tk-action { flex: 0 0 100%; border-top: 1px ... }`（第二行：点赞/回复）。**嵌套的 `.tk-replies .tk-comment` 天然复用同一套规则**，子回复自动两行，无需额外选择器
- **禁止昵称竖排（三重保险）**：①`.tk-comment` 的 `word-break: break-all` → `normal`；②`.tk-nick` 显式 `writing-mode: horizontal-tb !important` + `text-orientation: mixed` + `overflow-wrap: anywhere`（允许整词换行）；③`.tk-meta { min-width: 0 }` + `.tk-main { min-width: 0 }`（容器可收缩，杜绝 flex 挤压）
- **子回复缩进**：`.tk-replies` 从 `margin-left:.5rem + padding-left:1rem` 收敛到 `padding: .15rem 0 .15rem .55rem`（总缩进 1.5rem → 0.55rem，保留左侧 2px accent 竖线层级），`max-height` 200px → 220px（仍小于官方 JS 的 236px 判定阈值，「展开」逻辑不变）
- **移动端评论**：新增 `@media (max-width: 640px)`（头像 2.5rem→2rem、内边距/字号收窄、子回复缩进 0.4rem）；`.tk-content img { max-width: 100% !important }`（官方 300px 在窄屏仍溢出）、`.tk-content pre { white-space: pre-wrap }`
- **新增覆盖**：评论列表头 `.tk-comments-title` 细线分隔、`.tk-sort-item` 药丸、`.tk-comment.tk-master` 左侧 accent 光带、`.tk-tag-*` 三色调色板、`.tk-expand` 展开按钮、`.el-input__inner/.el-textarea__inner` + `.tk-submit .el-button`（旧 CSS 的 `.tk-btn`/`.tk-action-btn` 是死选择器，element-ui 按钮此前完全没样式）
- **fcircle.astro 移动端溢出修复**（仅 `≤768px`，PC 零影响）：`.articles-container { grid-template-columns: minmax(0, 1fr) !important }`（核心：允许轨道收缩到 0）+ `.card` 与 `.card-title/.card-author/.card-date` 全链路 `min-width: 0; max-width: 100%` + `#random-article`/`.random-stats`（2 列 `minmax(0,1fr)`）/`.random-container`/`.random-meta`/`#load-more-btn` 同步可收缩 + `.fcircle-wrap` 与 `#friend-circle-lite-root` 的 `overflow-x: clip` 兜底（`clip` 不产生滚动容器、不裁纵向，`.card:hover` 的 `translateY` 悬浮不受影响）+ `.status-grid` 用 `repeat(2, minmax(0, 1fr))` 升级原 640px 断点的 `1fr 1fr`

**与 Fancybox 的隔离：** 所有新选择器锁在 `[data-engine='twikoo']` 或 `#friend-circle-lite-root` 作用域内，不含 `.fancybox` / `[data-fancybox]`，不覆盖 `z-index` / `position: fixed`；Twikoo 自带的 `tk-lightbox` 保持官方实现（dist 中 `data-engine` 选择器与 `fancybox` 零交集，实测 0 处交叉）。

**验证：** `pnpm exec astro check` 0 errors / 0 warnings / 0 hints；`pnpm exec astro build` 210 pages Complete。dist 核验：`dist/twikoo/` 已不存在；209 个 HTML 同时引用 jsDelivr 主源与 unpkg 备源，`/twikoo/twikoo.all.min.js` 残留 0 处；`_spec_.*.css` 含 `flex:1 1 100%` / `flex:0 0 100%` / `writing-mode:horizontal-tb` / `.55rem` 缩进 / `max-height:220px`；`fcircle.*.css` 含 `@media (max-width:768px)` 块与 3 处 `minmax(0,1fr)`。

**注意：** ①CDN 版本钉死 1.7.19，升级需同时改 `Layout.astro` 两处 URL 与云函数 `twikoo-vercel` 版本；②若用户浏览器把 jsDelivr 与 unpkg 都拦掉（跟踪防护），评论会显示「Twikoo 加载失败」——这正是本项目此前 cdnjs→jsDelivr 的同类风险，回退方案是把官方包重新放回 `public/twikoo/` 并把 `.prettierignore` 加上 `public/`（避免再被 prettier 重排膨胀）；③本次仅删 `public/twikoo/`，`.prettierignore` 未改；④`public/waline/`、`public/fclite/`、`public/fancybox/` 仍为本地静态文件，不受影响。

### 2026-09-24 - Live Photo 瀑布流交付 `docs/live-photo-waterfall/index.html`（瀑布流 + HeoLivePhoto 缩略图实况 + Fancybox 灯箱视频，零第三方库）

**背景：** 用户要一个「图片瀑布流 + 点击放大 + 灯箱里播放实况」的交付页。要求瀑布流**不引第三方库**，但实况播放允许用本地 `/livephoto/`，点击放大可用本地 `/fancybox/`。用户中途补充三点：① 支持「封面 + 独立视频文件」形态（`.pvt` / `data-video` / Motion Photo 三种都覆盖）；② 尽量不用第三方，**不依赖 Swup**；③ 瀑布流布局**必须像瀑布流**——宽度有变化、高度有变化、不规则。

**交付物：** `docs/live-photo-waterfall/index.html`（单文件，约 900 行，可整份复制走），依赖仅两个本地静态文件：`/fancybox/fancybox.min.css` + `fancybox.umd.min.js`、`/livephoto/heolivephoto.js`。零 jQuery、零 Masonry、零 CDN。

**瀑布流：CSS `column-count`（核心决策）**

- 纯 CSS，零 JS 零布局计算；`column-count:4` + `column-gap:20px`，断点 1100/700/460px 逐级降到 3/2/1 列
- `li { break-inside:avoid; -webkit-column-break-inside:avoid; page-break-before:avoid; margin:0 0 20px }` —— 缺 `-webkit-` 前缀时 Safari 会把卡片拦腰劈开
- **不规则从哪来**：`<img>` 天然保留各自宽高比 + 每张卡 `padding:7px 7px 40px` 的相框边距 + 标题行数 1~3 行浮动（`line-clamp:2`）→ 每张卡片高度天然不同，同一列从上到下宽度也各不相同，视觉上就是真正的瀑布流，而不是等高网格
- 明确拒绝 `display:grid`（会撑成等高行）与 `display:flex` 分列（高度分配靠 JS、列数变化要重排）

**数据契约（三种实况形态 + 静态图，全部走同一个 `<a>`）**

```html
<a
  data-fancybox="live-gallery"
  data-type="html"
  data-lp-id="demo-1"
  data-lp="1"
  data-pvt="/assets/pvt/IMG_0001.pvt"
  data-cover="/assets/jpg/IMG_0001.JPG"
  data-caption="实况照片"
  ><span class="lp-item">…</span></a
>
```

- `data-pvt`（ZIP：JPEG 封面 + MP4） / `data-cover`+`data-video`（封面 + 独立视频） / `data-cover`+`data-motion="1"`（Motion Photo，视频嵌在 jpg 里） / 无 `data-*` = 纯静态图
- 优先级：`data-video` > 缩略图解出来的 blob > `data-pvt` > `data-cover` 兜底
- **关键**：`<a>` 上不放 `href`（Fancybox 靠 `data-fancybox` + `data-type` 接管，不会去导航）；`href` 一旦带 `#` 锚点，浏览器会在 Fancybox 处理前先改 hash → 页面滚到目标元素下方、灯箱看不见（本项目相册页踩过同款坑）

**HeoLivePhoto 接入（源码级核实，非猜）**

- `data-live-pvt` / `data-live-video` / `data-live-motion` 三个属性名**逐字核实**存在于 `heolivephoto.js` 的 `enhance()`（`/\.pvt$/i.test(src) || getAttribute('data-live-pvt')`、`getAttribute('data-live-video')`）；`data-live-badge` 也支持
- **`scan()` 是异步的且会在 DOMContentLoaded 对**整个 document**自动跑一次**（`window.HeoLivePhoto = { scan, bindPlayback, resetPlayback }`，`scan` 返回 `Promise.allSettled(jobs)`）→ 属性归一化必须**同步**完成，否则 Heo 先扫会把 `.pvt` 项当成普通 jpg 去探测 Motion Photo。故内联脚本直接 `init()`，不再挂 DOMContentLoaded
- **`.pvt` 项的 `img.src` 会被 Heo 换成 blob 封面**，所以缩略图视频要复用就用 `querySelector('video[src^="blob:"]')` 取；实测 Heo 全文件 **0 处 `revokeObjectURL`**，blob 全页有效，可安全复用到灯箱
- **Heo 只对 `src` 以 `.jpg`/`.jpeg`/`blob:` 结尾的 img 发 Motion Photo 探测请求（会整份重下一遍）** → 静态图请用 `.webp`/`.png`/`.avif`，那种后缀 `enhance()` 直接 `return null`，零多余请求
- **Heo 会往缩略图里塞内联样式**（`span` 包 `display:inline-block`、`img` 改 `width:100%;height:auto`）→ 必须用 `!important` 顶掉：`.lp-item > span { display:block !important; height:auto !important; ... }` + `.lp-cover { display:block !important; width:100% !important; height:auto !important; aspect-ratio:3/4; object-fit:cover }`。不用固定高度反而正好让瀑布流的不规则高度成立

**Fancybox 6.0.29（本地版）HTML 类型 + 视频播放（源码逐条核对）**

- `data-type="html"` 合法：构造器把 `'html'` 映射到 `options.html`；`resolveSource` 里 `i === "html"` 分支直接把字符串当 HTML 注入
- **`type: 'html'` 选项不存在**（6.0.29），文档里写的是 `data-type`
- **`contentClick` 选项不存在**；点内容区域触发的是**可 `preventDefault` 取消的 `backdropClick`** 事件，用 `event.composedPath()[0]` 判断点的是内容还是遮罩
- **`Carousel.attachSlideEl` 事件不存在**（Fancybox 无公开事件常量表，只能翻 bundle）；真正挂 HTML 单张的是 `Carousel.contentReady`，远端 slide 被重新挂回 DOM 时触发的是 **`Carousel.attachSlideEl`**——两者都要监听，否则「切走再切回」视频不会重播
- **`data-caption` 读取走 `.textContent.trim()`**（`r.contentDocument.querySelector(o).textContent`），所以 caption 必须作为 HTML 里的一个文本节点，不能只挂属性
- **单实例 + 全页轮播 vs 多实例**：所有 `<a>` 挂同一个 `data-fancybox="live-gallery"` 值 → Fancybox 归为同一组，左右键 / 触屏滑动 / 无限循环全打通；不同值 = 独立实例、各自独立轮播
- 配置：`touch:{vertical:true}`、`Carousel:{infinite:true}`、`preload:1`、`Keyboard:{enable:true}`、`backdrop:true`、`dragToClose:false`（否则点内容区关闭，与视频播放冲突）
- **`Carousel.settle` 只保证「过渡动画结束」**，不保证视频帧解码完成 → 不能拿它当「封面可以淡出」的信号，必须用 `video.canplay`

**播放器生命周期（防「同时播好几个」）**

- `Fancybox.unbind(document.body)` + 重新 `bind()`：不 unbind 会累积重复实例，每次切页多绑一个
- **`is-selected` 类确实加在 slide 元素上**（bundle 里 `we(ne(s), b.classes.isSelected)`，`we`=addClass、`Le`=removeClass）→ 据此判断播放器归属
- `prunePlayers()`：只保留「当前 slide」的播放器，其余 `pause()` + 摘掉 `autoplay` 防自动重播；挂到 `Carousel.change` / `Carousel.settle` / `close` / `destroy`
- `resumeVideo()` 切回来要**重新登记**到 `activePlayers`，否则上次 `prune` 拿掉记录后再也停不掉它
- **自动播放可能被浏览器拦下**（还没和页面交互过）→ `.catch()` 静默降级为静态封面 + 转圈消失，不报错不卡死

**实况视频叠层的显示时机（易错点）**

- `video` 初始 `opacity:0` + `is-waiting`，`.lp-spin` 转圈可见，直到 `canplay` 才 `opacity:1` —— 这样「封面打底 + 视频覆盖」的架构在整个加载期都成立，不会白屏
- 转圈用 `border:2px solid rgba(255,255,255,.25)` + `border-top-color: var(--accent)` + `border-radius:50%`（**不能** `border-style:dotted`，那是圆点边框不是转圈）

**`.pvt` 解包器（Node 实测逐字节通过）**

- 手写 ZIP 解析：EOCD 尾部**反向**扫描 → 中央目录逐个条目 → 本地文件头 data offset → `method===0` 直接切片、`method===8` 走 `DecompressionStream('deflate-raw')`
- 支持 ZIP64 回退；**无 zip 库依赖**，只用 `TextDecoder` / `DecompressionStream` / `URL.createObjectURL`（均 Chromium/Firefox/Safari 全支持）
- 同一 URL 的解码结果用 Map 缓存，缩略图和灯箱共用一次解码
- **实测**：Node 22 合成一个真 ZIP（JPEG 走 method 0、MP4 走 method 8 deflate）→ 解出的封面 42 字节与原文**完全一致**、视频 200 字节与原文**完全一致**、`ftyp` 魔数正确、缓存复用命中、`escapeAttr` 正确转义。测的是**从交付文件里原样抽出的代码**，不是重打一份

**验证：** 内联脚本 `node --check` 语法通过（18627 字符）；关键 DOM 标识核验 `data-type="html"` 存在、`href="#lp-player"` 出现 **0 次**；`heolivephoto.js` 30KB / `fancybox.umd.min.js` 98KB 均为本地静态文件，页面无任何 CDN 引用。

**注意：** ①三个 `<a>` 的 `data-*` 都是**示例值**（`/assets/...` 指向的文件并不存在），用户要接自己的数据得替换 `demoData` 或直接改 HTML，缺文件时降级为静态封面不崩；②「不规则」靠 `.lp-item .live-photo { height:auto !important; object-fit:contain !important }` 实现——每张卡高度由图片**内建比例**决定，同列的卡上下拼接后高低不一、总宽度也各不相同；如果要固定比例封面（比如全部 3:4），改成 `aspect-ratio:3/4` + `object-fit:cover` 就行，但那就变成等高格子而非瀑布流；③`data-fancybox` 同值才会归为同一组轮播；示例已预填三种形态（`data-motion` 用真实 CDN 图，`data-video` 与 `data-pvt` 指向 `assets/` 下不存在的示例文件，接自己的数据时替换即可）；④`data-lp-id` **不用手写**——内联脚本给每张卡自动分配 `lp-item-0/1/2…`，并写进生成的 `.lp-player` 里；只要保证**每张卡的锚点唯一**（天然成立）且 `data-fancybox` 同值归为一组轮播即可。真实接数据时只需改 `<a>` 上的 `data-cover` / `data-video` / `data-pvt` / `data-motion` / `data-caption` 与内部 `<img src>`；⑤如果之后给相册页加了 Swup 页内导航，Fancybox 的 `data-swup-ignore-script` + `Fancybox.unbind(document.body)` 重新绑定那套还得照搬一遍（本项目 2026-09-13 记录的坑）；⑥Heo 的全局 scan 会对每个 `.jpg` 缩略图**多发一次整份下载**去探测 Motion Photo，静态图换 `.webp` 即可消除。

### 2026-09-24 - Live Photo 素材工具链：Motion Photo → 拆分/.pvt 转换器 + demo 接真实素材 + 七牛 HTTPS 诊断

**背景：** 用户问「能否把 jpg 转成 .pvt 加快加载」以及「七牛云的修改方案」。交付了两样东西：一个零依赖的转换脚本 + 对 `cdn.mingcy.cn` HTTPS 不可用的根因诊断。

**交付文件：**

- `docs/live-photo-waterfall/convert.mjs`（**新建**，Node ESM 零依赖，约 230 行）
- `docs/live-photo-waterfall/sample-live.jpg`（**新建**，838537 B，从七牛拉的真实 Motion Photo，做本地示例）
- `docs/live-photo-waterfall/assets/sample-live-cover.jpg`（226660 B）
- `docs/live-photo-waterfall/assets/sample-live-video.mp4`（611877 B）
- `docs/live-photo-waterfall/assets/sample-live.pvt`（838771 B）
- `docs/live-photo-waterfall/index.html`（3 个示例锚点从占位路径改为真实素材；说明区补流量对比表）

**流量实测（同一张 818.9 KB 的 Motion Photo）：**

| 形态              | 总流量                      | 说明                                              |
| ----------------- | --------------------------- | ------------------------------------------------- |
| Motion Photo 现状 | **1.64 MB**（2 × 818.9 KB） | `<img>` 下一次 + `fetch` 下一次，同一份字节下两次 |
| 封面 + 视频分离   | **0.82 MB**                 | 最省，且 `<video>` 标签不需要 CORS                |
| `.pvt` + 单独封面 | **1.04 MB**                 | 比现状省一半                                      |

**结论修正（用户原假设不成立）：** 转 `.pvt` 确实能把流量砍掉一半，但**「封面 + 视频分离」才是最优解**——比 `.pvt` 还省 20%，而且 `<video src>` 不走 `fetch`、不需要 CORS、跨域也能播。`.pvt` 的价值只在「一个文件对应一张照片」的批量部署场景。

**转换算法（与 Heo 逐分支一致，非自创）：** 从 `heolivephoto.js` 的 `extractMotionFromBuffer` 移植：①先读 EXIF 的 `GCamera:MicroVideoOffset="N"`（Google 相机，精度最高），`videoStart = length - N`；②回退扫 `ffd9`（JPEG EOI）后 100 字节内找 `ftyp`，视频从 `ftyp` 前 4 字节起；③回找最近 `ffd9` 作为封面结束位；④双向校验（各 ≥1024 B、封面 `ffd8`、视频 `ft`@+4）。**纯字节切分，零重编码、零画质损失**——Motion Photo 本来就是 `[JPEG][MP4]` 粘连拼接。

**ZIP 打包用 method 0（store）：** JPEG/MP4 本身已压缩，deflate 只会白费 CPU 且几乎不缩体积。

**闭环实测（Node 22）：**

- 转出 `.pvt` → `unzip -l` 正确列出 `sample-live.JPG` (226660) + `sample-live.MP4` (611877)，`file` 识别为 `Zip archive data, method=store`
- **Heo 自己的 `extractPvt` 解析我生成的 .pvt**：解出字节与磁盘拆分文件**逐字节一致**（`cover == disk: true`、`video == disk: true`）
- **交付 HTML 里原样抽出的 `unpackPvt` 解析同一个 .pvt**：封面 226660 B（FFD8/FFD9 完整）、视频 611877 B（`ftyp` 魔数正确），同样逐字节一致 → 生成端与消费端双向闭环

**七云 HTTPS 根因（openssl 实测，非推测）：**

```
subject=CN=*.a.bdydns.com    ← 百度 DNS 的泛域名证书
issuer=sslTrus (RSA) OV CA
curl https://cdn.mingcy.cn/... → SEC_E_WRONG_PRINCIPAL（主机名不匹配）
加 -k 忽略证书 → 403 Forbidden（nginx，Host 未匹配任何 HTTPS 监听）
```

即 `cdn.mingcy.cn` 的 443 端口当前挂在**另一个租户的证书**上 → 该域名的 HTTPS 绑定在七牛侧压根没生效。**CORS 不是问题**：http 下已回 `Access-Control-Allow-Origin: *`，无需改。唯一要修的就是证书。

**⚠️ 混合内容铁律：** `http://` 的图片在 `https://` 页面上，`<img>` 能加载（被动混合内容放行），但 **`fetch()` 被主动混合内容拦截** → Motion Photo 探测失败 → 降级成死图。所以外链 Motion Photo 必须 `https://` + 证书主机名匹配 + CORS 放行，三个条件缺一不可；最稳的路径仍是把素材放本站同域（同源 fetch 不需要任何 CORS 头）。

**注意：** ①`convert.mjs` 是 Node CLI（ESM），不能当浏览器脚本用；②`.pvt` 里内部文件名必须匹配 `/\.jpe?g$/i` 与 `/\.(mp4|mov)$/i`，脚本已按 `原名.JPG` / `原名.MP4` 生成；③`assets/` + `sample-live.jpg` 共约 2.46 MB 落在仓库里，若要瘦身只保留 `sample-live-cover.jpg` + `sample-live-video.mp4`（分离形态最省），删掉 `.pvt` 与源 jpg 即可；④demo 现在是**完全离线可跑**的，不再依赖七牛。

### 2026-09-24 - Live Photo demo 收敛为 .pvt 主形态（删 Motion Photo 示例与源文件）

**背景：** 用户拍板「不需要七牛云，先用 .pvt 看效果」。据此把 demo 从「三形态对照」收敛为「.pvt 主形态 + 分离形态对照」，彻底摆脱外部依赖。

**修改文件：**

- `docs/live-photo-waterfall/index.html`（示例锚点 3 → 2）
- `docs/live-photo-waterfall/sample-live.jpg`（**删除**，838537 B）

**修改内容：**

- **删掉 Motion Photo 示例**：那种形态要 `<img>` 下整份 + `fetch` 再下一整份（818.9 KB × 2 = 1.64 MB），而且必须跨域 CORS 放行、证书主机名匹配、`https://`——三个条件绑死七牛的证书状态，正是用户想甩掉的依赖
- **`.pvt` 升为示例 1（主形态）**，分离形态降为示例 2（对照）
- 两个示例的 `data-fancybox` 都是 `live-gallery`，同一组轮播

**最终形态与流量：**

| 示例      | 属性                        | 总流量  | 备注                                  |
| --------- | --------------------------- | ------- | ------------------------------------- |
| 1（主）   | `data-pvt` + `data-cover`   | 1.04 MB | 一个 `.pvt` 打包封面+视频，下一次拿全 |
| 2（对照） | `data-cover` + `data-video` | 0.82 MB | 各取所需，且 `<video>` 不需要 CORS    |

`data-cover` 在两种形态下**都必需**——它是缩略图首帧，不能等 `fetch` 解包完才有画面。

**验证：**

- 内联脚本 `node --check` 通过（18627 字符）
- 剔除 HTML 注释后真实锚点 **2 个**，`href=` 出现 **0 次**（Fancybox 靠 `data-fancybox` + `data-type="html"` 接管，锚点带 `#` 会让浏览器先改 hash 把灯箱顶下去）
- `data-fancybox` 两组值全为 `live-gallery`（第三处匹配是 JS 模板串 `GROUP`，非 DOM）
- 所有 `data-cover`/`data-video`/`data-pvt` 与 `src="assets/..."` 均指向存在的文件：`sample-live-cover.jpg` 221.3KB、`sample-live-video.mp4` 597.5KB、`sample-live.pvt` 819.1KB
- demo 总占 **1.7 MB**（删源 jpg 前 2.5 MB）

**注意：** ①demo 现在完全离线可跑，零外部请求；②`data-motion` 在文件里仍有 8 处，全部在 `<script>` 逻辑与用法说明注释里（示例锚点已无），别当成残留；③若要再瘦 598 KB 可删 `sample-live-video.mp4` 并去掉示例 2，只留 `.pvt` 单形态；④用户自己的批量照片走 `node convert.mjs 图片.jpg --out assets` 即可，产物文件名带原名前缀。

### 2026-09-24 - person-life 相册 12 张 Motion Photo 转 .pvt，demo 从占位换真实素材

**背景：** 用户拍板「不需要七牛云，先用 .pvt」，并指定用 `src/content/galleries/person-life/` 里的真实照片做实体转 .pvt。

**关键发现（必须先知道）：** `src/pages/galleries/[slug].astro` 的 glob 是
`/src/content/galleries/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}`，**递归匹配所有图片扩展名**。所以 `.pvt` 产物**不能**放回 `person-life/` 目录——`1000015647-cover.jpg` 会被扫进普通相册页，造成图片重复。产物一律放 `public/` 下走绝对路径引用。

**修改文件：**

- `public/live-photos/person-life/`（**新建**，12 × `.pvt` + 12 × `-cover.jpg` = 20.94 MB）
- `docs/live-photo-waterfall/convert.mjs`（新增 `--dry-run` / `--pvt-only` 两个开关 + 汇总统计）
- `docs/live-photo-waterfall/index.html`（示例锚点 2 → 12，全部指向真实素材）
- `docs/live-photo-waterfall/assets/`（**删除**，1.64 MB 占位素材已被真实素材取代）

**转换命令：**

```bash
node docs/live-photo-waterfall/convert.mjs \
  src/content/galleries/person-life/*.jpg \
  --out public/live-photos/person-life --pvt-only
```

**结果：12 / 12 全部是真 Motion Photo**（无一漏网），总源体积 16.71 MB：

| 封面合计 | 视频合计 | .pvt 合计 |
| -------- | -------- | --------- |
| 4.22 MB  | 12.49 MB | 16.71 MB  |

单张最大 `1000015651.pvt` 2.66 MB（封面 761KB + 视频 1.83MB），最小 `1000015654.pvt` 369KB。

**验证（Heo 真实 `extractPvt` 批量解析全部 12 个产物）：**

- **12 / 12 通过**：封面字节与磁盘 `-cover.jpg` **逐字节一致**、JPEG 魔数 `FFD8`/`FFD9` 完整、视频 `ftyp` 魔数正确
- 解析耗时 6–23 ms / 张（2.6MB 的大文件 23ms）
- 锚点核验：真实锚点 **12 个**、`href=` **0 次**、素材引用 24 条（12 `.pvt` + 12 `cover`）**全部命中 `public/`**
- 内联脚本 `node --check` 通过
- **原件未动**：`src/content/galleries/person-life/` 仍是 12 个原始 jpg，相册页不受影响

**流量账（12 张全量）：**

| 形态              | 总流量                                        |
| ----------------- | --------------------------------------------- |
| Motion Photo 现状 | **33.42 MB**（2 倍下载）                      |
| `.pvt` + 单独封面 | **20.94 MB** ← 当前方案，省 37%               |
| 封面 + 视频分离   | **16.71 MB** ← 极限，但多 24 个文件、目录更碎 |

**注意：** ①`public/live-photos/` 新增 21 MB，仓库体积明显上升；要瘦身可把大文件（`1000015648/49/51/52/53`，单张 1.4–2.6MB）先压一遍再转，或用分离形态省 4.2MB 封面重复；②demo 里 12 个锚点的 `data-fancybox` 全是 `live-gallery`，同一组轮播；③素材在 `public/` 下走**同源**，不需要任何 CORS 头，跟外部 CDN 彻底解耦；④`1000015647` 就是之前从七牛拉下来测过的那张，转换结果可交叉印证；⑤`.download-tmp/` 是空目录（之前下载残留），无害。

### 2026-09-24 - 实况照片落进真实相册页：person-life 12 张改 .pvt，省一半流量

**背景：** 用户看不到效果图——`/docs/live-photo-waterfall` 在 Astro 下 404（`docs/` 不是路由目录，Astro 只伺服 `src/pages/`），`npx serve` 装不上。用户拍板「直接在 person-life 目录下更改即可」。

**⚠️ 先纠正一个认知：person-life 相册页原本就已经在放实况了。** `HeoLivePhoto` 的 `scan()` 会自动匹配 `img[src$=".jpg" i]` 并把 Motion Photo 候选整份 fetch 出来抽内嵌视频。所以之前 12 张原图一直是实况态——只是每次要看就要下两遍整份文件（`<img>` 一遍 + Heo 抽视频 fetch 再一遍）。真正的相册 URL 是 `http://localhost:4321/galleries/person-life`。

**修改文件：**

- `src/content/galleries/person-life/`：新增 12 个 `.pvt`（16.71 MB），**12 张原始 jpg 一个字节没动**
- `src/pages/galleries/[slug].astro`：新增实况分支
- `docs/live-photo-waterfall/index.html`：锚点改指源码目录
- `public/live-photos/`：**删除**（之前误建的 21 MB 重复副本）

**关键实现（`[slug].astro`）：**

```js
const allPvt =
  import.meta.glob <
  string >
  ('/src/content/galleries/**/*.pvt',
  {
    query: '?url',
    import: 'default',
    eager: true,
  })
```

- **`.pvt` 不会被图片 glob 误扫**：图片 glob 只匹配 `{jpg,jpeg,png,webp,avif,gif}`，`.pvt` 不在其中 → 可以直接跟原图同目录放
- **缩略图用 `.pvt`，灯箱用原 jpg**：`src={img.live ? img.pvt! : img.src}` + `data-live-pvt`；`href` 仍指原图 → Fancybox 照常开静态预览，**不会跳到 zip 直链**，左右滑动/键盘切换全保留
- **`opacity:0` 破图遮罩**：浏览器会先尝试把 ZIP 当图片渲染出一帧破图。`.pvt` 分支里 Heo 是 `img.style.cssText += '...opacity:1...'`（追加不是覆盖，后面的声明胜出），配合 `.gallery-img` 的 `transition: opacity 0.3s` 得到淡入；解包期间用户看到的是 `.gallery-item` 的浅灰背景，等于加载占位
- Vite 对 `.pvt` 只做哈希改名，**内容零改动**（12/12 字节一致 + `PK\x03\x04` 魔数正确）

**验证：** `astro check` 0 errors / 0 warnings / 0 hints；`astro build` 211 pages。dist 核验 `dist/galleries/person-life/index.html`：`data-live-pvt` **12**、`style="opacity:0"` **12**、`data-fancybox="gallery"` **12**（灯箱保留）、`gallery-img` **12**。用 Heo 真实 `extractPvt` 跑 dist 全部 12 个 `.pvt`：**12/12 通过**（封面 `FFD8…FFD9` 完整、视频 `ft` 魔数正确，耗时 2–7 ms）。

**流量账（12 张全量）：**

|                               | 总下载       | 缩略图首帧                       |
| ----------------------------- | ------------ | -------------------------------- |
| 改前（Motion Photo 双下）     | **33.42 MB** | 快（jpg 段可流式渲染）           |
| 改后（`.pvt` + 灯箱按需原图） | **16.71 MB** | 快一帧（等 .pvt 解包，灰底占位） |

灯箱点开单张才额外下 1–2.6 MB 原图，且走浏览器缓存。

**注意：** ①`.pvt` 经 Vite 哈希改名（`1000015643.Ca00nQr7.pvt`），改图会换全部 URL，静态站全量重建无影响；②若某张 `.pvt` 解包失败，该格会一直停在灰底占位（原图被隐藏了）——原文件仍在磁盘，删掉对应 `.pvt` 即回退；③`.download-tmp/` 是空目录（历史下载残留），无害；④`docs/live-photo-waterfall/` 现在是独立静态设计稿，需在仓库根起静态服务器；真实现以相册页为准。

### 2026-09-24 - 【修正】实况照片在 Swup 切页后完全失效：HeoLivePhoto 无切页重扫钩子

**现象：** 用户反馈 `localhost:4321/galleries/person-life` 实况"不能正常读取"——12 个格子全停在灰色占位，一点反应都没有。

**根因（上一条记录的技术方案本身是错的）：**

1. **`HeoLivePhoto` 只在 `DOMContentLoaded` 扫一次，没有任何 Swup/MutationObserver 钩子。** 源码 588–591 行：`if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan() }) else scan()`。Swup 用 innerHTML 替换 `<main>`，新进来的 `img[data-live-pvt]` 永远不会被 `enhance()`。站点里其它所有客户端逻辑（Fancybox、Twikoo、评论驱动、朋友圈、滚动降级）全都自己补了 `swup:page:view` + `astro:page-load` 监听，**只有 HeoLivePhoto 这个第三方脚本没人替它补**。
2. **上一条记录加的 `style="opacity:0"` 把"没被扫描"从"破图"变成"永久隐形"，把 bug 掩盖成了"完全没反应"。** 之前如果 Heo 没扫，用户至少还能看到破图；现在只看到灰底，误以为是我改坏了。

**修正 ①（主修）— `src/layouts/Layout.astro` 667 行后新增 body 级常驻脚本：**

```html
<script is:inline src="/livephoto/heolivephoto.js" defer></script>
<script is:inline data-swup-ignore-script>
  ;(function () {
    var LIVE_SEL =
      'img[data-live-pvt], img[data-live-video], img[data-live-motion], img[data-live-photo], img[src$=".pvt" i], img[src$=".jpg" i], img[src$=".jpeg" i]'
    function rescanLivePhotos() {
      if (typeof HeoLivePhoto === 'undefined' || !HeoLivePhoto.scan) return
      if (!document.querySelector(LIVE_SEL)) return
      try {
        var r = HeoLivePhoto.scan()
        if (r && typeof r.then === 'function') r.catch(function () {})
      } catch (e) {}
    }
    document.addEventListener('swup:page:view', function () {
      setTimeout(rescanLivePhotos, 200)
    })
    document.addEventListener('astro:page-load', function () {
      setTimeout(rescanLivePhotos, 200)
    })
  })()
</script>
```

- `HeoLivePhoto.scan()` 是官方公开 API（592 行 `window.HeoLivePhoto = { scan, bindPlayback, reset }`），幂等（`img.dataset.liveReady` 守卫 + `pvtCache` 去重），重复调用无副作用
- `LIVE_SEL` 完整照抄 `scan()` 自己的两个 `querySelectorAll` 选择器并集，**Motion Photo 原图模式（无 `data-*` 属性）同样能被重扫**——之前它在 Swup 切页后也是坏的
- `data-swup-ignore-script` 必须加：监听器挂在 `document` 上、Swup 永不替换；不加标记会被 `SwupScriptsPlugin` 每切一次页克隆重跑、监听器无限累加（和 Fancybox 初始化脚本同一个坑，写法一致）
- `setTimeout(..., 200)` 与 Fancybox 的 `initFancybox` 同款延迟，等 Swup 把新 DOM 落完

**修正 ② — `[slug].astro` 把 `opacity:0` 换成透明 1×1 gif 占位：**

```js
const LIVE_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
// src={img.live ? LIVE_PLACEHOLDER : img.src}   ← 原来是无条件的 opacity:0
```

- **绝不能用 `opacity:0` 做加载遮罩**：Heo 的 `opacity:1` 是 `img.style.cssText += '...'` 追加出来的，只在 `enhance()` 真正执行时才会出现。一旦扫描没跑（或 `.pvt` 解包失败），图就永久隐形——正是这次故障的直接放大器
- 透明占位让 `.gallery-item` 自己的浅灰渐变当加载态，视觉是"加载中"而不是"坏了"，失败模式可诊断
- Heo 解包完成后自己把 `img.src` 换成 blob 封面（`loadPvt → img.src = m.cover`），不需要我在外面再动一次

**端到端验证（对运行中的 dev server 走真实 HTTP 链路）：** 直接 `eval` heolivephoto.js 的 `entryData / extractPvt / pvtCache / loadPvt` 四段原样代码（17–100 行，一字节没改），用 `fetch` 打 `http://localhost:4399/src/content/galleries/person-life/*.pvt`，**12/12 全部返回 `{cover: blob URL, video: blob URL}`**，耗时 11–132 ms。说明 fetch → arrayBuffer → ZIP 解包 → blob 这条链在浏览器同等环境下是通的，问题 100% 出在"没人调 `scan()`"。

**dev 产物核验：** `data-live-pvt` 12、透明 gif 占位 12、`style="opacity:0"` **0**、`data-fancybox="gallery"` 12、"12 张照片"；`dist/index.html` 含 `rescanLivePhotos`×3 + `HeoLivePhoto.scan` + `swup:page:view` + `astro:page-load` + `data-swup-ignore-script`。`astro check` 0 errors / 0 warnings / 0 hints；`astro build` 211 pages。

**⚠️ 事故记录（务必看）：** 排查中发现 **12 张原始 jpg 从工作区凭空消失**（`git status` 显示 ` D` 12 个 tracked 文件被删，`.pvt` 幸存）。用 `git checkout -- src/content/galleries/person-life/` 全量恢复，事后逐个字节校验：12/12 仍是合法 Motion Photo（JPEG 头 + 全文件扫描到 `ftyp`）且与最初下载件字节一致。**根因未查明**，排查过的方向都排除了：`docs/live-photo-waterfall/convert.mjs` 无 `unlink/rmSync` 逻辑；`.git/hooks/pre-commit` 是 `lint-staged`（我这次会话没 commit）；Astro 的图片处理不会删源文件。`.download-tmp/` 里留着一份原始下载件（21 MB）已一并删除——jpg 在 git 里就是备份。若再发生同类丢失，直接从 git 恢复，不要试图用 `.pvt` 里的封面倒推（那是重压缩过的，不是原文件）。

**教训（写进以后的实现准则）：** ①**接任何第三方客户端脚本，第一件事就是确认它自己的 DOMContentLoaded/resize/路由钩子有哪些，站点是 Swup SPA，缺的钩子必须自己在 body 级补上**——HeoLivePhoto 就是漏了这一环；②**加载遮罩不要用 `opacity:0` 依赖"第三方稍后会改回来"这种假设**，第三方不跑就等于永久隐形，要用透明占位这类"看起来是加载中"的中性形态；③改文件前先 `git status`，别信 `ls | grep -v` 这种过滤后的输出就断言"文件还在"。

### 2026-09-25 - 正式相册页落地演示标准：Heo 补丁 + Layout 实况灯箱 + 瀑布流原生比例

**背景：** 用户在 `docs/live-photo-waterfall-v2/` 演示页验证满意后，要求把同一套标准（DOM 解耦实况灯箱 / 事件隔离 / 原生比例无裁切 / IO 懒加载）落到正式相册页 `src/content/galleries`。正式相册页跑在 Astro + Swup 里，Fancybox 与 HeoLivePhoto 都由 `Layout.astro` body 级常驻脚本统一管理（`[slug].astro` 内联脚本在 Swup 切页后不重跑，放页面里不可靠），故必须改 Layout 与共享 Heo 文件。

**关键 API 复核（本地 Fancybox 6.0.29 bundle 逐字验证）：**

- **`done` 事件不存在**于本 bundle（`'done'` 字串 MISS）；`Carousel.contentReady`（`F('contentReady', i)`）是 slide 内容就绪的准确钩子，**仅当 slide 有 `html` 选项时触发**（Html 插件条件 `i.html ? ... : void 0`）→ 实况项给 `data-html` 空骨架才触发，静态项无 `data-html` 走默认 image 灯箱，**分流天然成立**。
- 元素**所有 `data-*` 映射成 slide 选项**（option 组装 `for(var u in t){ a[u]=e }`）→ `data-pvt`/`data-cover`/`data-video`/`data-caption`/`data-html` 全进 slide 对象，`slide.triggerEl` 是触发 `<a>`。
- `backdropClick` 是 `on:` 事件（`w('backdropClick', e)` 先调 on-handler，再 `!e.defaultPrevented && b('backdropClick')` 查选项）→ handler 里 `event.preventDefault()` 阻止点内容关闭，默认 `'close'` 仍关遮罩。
- Carousel `c.on('*', (e,t,...n)=>w('Carousel.'+t,...))` 把 Carousel 事件重发为 `Carousel.<name>`。
- 类型猜测有 `if(he(o))` 守护，`<a>` 无 href/src 不崩。

**修改文件：**

- `public/livephoto/heolivephoto.js`（打补丁）
- `src/layouts/Layout.astro`（initFancybox 重构为 IIFE + rescanLivePhotos 改 IO 懒加载）
- `src/pages/galleries/[slug].astro`（网格→瀑布流 + 标记重构）

**修改内容：**

- **`public/livephoto/heolivephoto.js` 补丁**：删 IIFE 末尾 `if(document.readyState==='loading')...else scan()` 自动扫描调用，保留 `window.HeoLivePhoto={scan,bindPlayback,reset}` 导出。**必须打**：原版自动 scan 会在首屏一次性拉全部 `.pvt` + 对所有 `img[src$=".jpg"]` 做 Motion Photo 探测（整份 fetch），IO 懒加载被击穿。全站只有 `person-life` 用 Heo（文章页图是 webp），打补丁后行为等价、改由 Layout 的 IO 按需 `scan(item)`。
- **`Layout.astro` initFancybox 重写为 IIFE**：内含 `unpackPvt`（零依赖 ZIP 解析，与 Heo 内部算法一致）、实况播放器生命周期（`activePlayers`/`prunePlayers`/`stopAll`/`mountLivePlayer`）、`getAssets(slide)`（从 `slide.triggerEl.dataset` 读 cover/video/pvt，**绝不读缩略图 DOM**）、时长隔离（`[data-fancybox][data-pvt]` 项 touchstart 记时，≥300ms 且未移动→屏蔽随后 click）。bind 选项加 `on:{'Carousel.contentReady':activateSlide, 'Carousel.attachSlideEl':activateSlide, 'Carousel.change':prune, 'Carousel.settle':prune, backdropClick(点 `.lp-player` 内 preventDefault), close:stopAll, destroy:stopAll}`。unbind 后给 `[data-fancybox][data-pvt]:not([data-html])` 注入 `data-html='<div class="lp-player"></div>'` 空骨架（JS 设避免 SSR 属性转义）。`mountLivePlayer`：有 `data-pvt` 时不预铺 cover（避免下载原图 jpg），让 `unpackPvt` 出封面（.pvt 已被缩略图缓存）；pvt 解包失败才回退 `data-cover`。
- **`Layout.astro` rescanLivePhotos 改 IO 懒加载**：切页后对页内 `img[data-live-pvt]` 逐个 `IntersectionObserver`（`rootMargin:'200px 0px'`）observe，进入视口才 `scan(item)`（root=item 子树只增强那一张）+ `unobserve` 一次性；切页 `disconnect()` 旧 observer 重建。不支持 IO 的浏览器回退全量。
- **`[slug].astro` 重构**：`gallery-grid`(2/3/4 列 grid + `aspect-ratio:1/1` + `object-fit:cover` **裁切**) → `gallery-waterfall`(CSS `column-count` 3/2/1，断点 768/480，gap 16px，`break-inside:avoid`)；img 去 `aspect-ratio`/固定高，`width:100% height:auto object-fit:contain` → **原生比例无裁切**。`GalleryImage` 加 `width/height`（取自 `ImageMetadata`），实况项 img `src=透明占位 gif` + `width/height` 属性预留 intrinsic 尺寸防布局跳动（不下载原图 jpg 避免与 .pvt 双下载）。实况项 `<a>` **去 href**（否则 Fancybox 当 image 拉 jpg），加 `data-pvt`/`data-cover`(原图 jpg，pvt 解包失败才回退)`/`data-video=""`/`data-caption`；`data-html`骨架由 Layout 注入。静态项（webp）保持`href=src`+`data-fancybox="gallery"` 走 image 默认灯箱。`<style is:global>` 加 Heo wrap 兼容（`.gallery-item>span`+`.gallery-img`带`!important`，去 1:1 方格）+ 灯箱 `.lp-player`/`.lp-cover`(Ken Burns 8s)/`.lp-video`/`.lp-spin`/`.lp-caption`+`prefers-reduced-motion` 降级。

**验证：** `pnpm exec astro check` 119 files / **0 errors / 0 warnings / 0 hints**（清理了 3 个自引 hint：`pending`/`fancybox` 未用参数 + unpackPvt `.then` 转 `async/await`）；`pnpm exec astro build` 211 pages Complete。dist 核验：`person-life` 12 个实况项各带 `data-pvt`/`data-cover`/`data-live-pvt`/`data-fancybox="gallery"` + 透明占位 gif + width/height 属性，`href` 在实况项 0 处、`aspect-ratio` 残留 0；`junxun` 35 个静态项带 `href` 走 image 灯箱、`data-pvt` 0；首页含 `Carousel.contentReady`×3/`attachSlideEl`/`backdropClick`/`unpackPvt`×3/`IntersectionObserver`×3/`rootMargin`/`HeoLivePhoto.scan(item)`；`dist/livephoto/heolivephoto.js` `DOMContentLoaded` 0 处、导出在。

**注意：**

- ①**实况灯箱 contentReady 注入与 image 默认灯箱共用一个 `Fancybox.bind('[data-fancybox]')`**：实况项（带 `data-pvt`+`data-html` 骨架）触发 contentReady 注入视频；静态项（无 `data-html`）走默认 image，互不干扰。`backdropClick` handler 对所有 group 生效——文章页 image 灯箱也变成"点内容不关"（防误触，行为微调）。
- ②`data-cover` 在实况项是 **pvt 解包失败的兜底**，正常路径不下载原图 jpg（避免与 .pvt 双下载）；缩略图用透明占位 + width/height 属性，Heo 解 .pvt 后换 blob 封面。
- ③Heo 补丁后全站不再自动 scan；若日后新页面用 `.jpg`/`.pvt` 实况，需确保该页的 `img[data-live-pvt]` 被 Layout 的 IO 脚本覆盖（当前 IO 选择器是 `img[data-live-pvt]`，[slug].astro 实况项满足）。
- ④时长隔离只对 `[data-fancybox][data-pvt]` 项起作用，静态相册项（webp）长按仍会开灯箱（无播放冲突，无需隔离）。
- ⑤演示页 `docs/live-photo-waterfall-v2/` 保留作独立设计稿；正式相册页以 `src/pages/galleries/[slug].astro` + `Layout.astro` 为准。

## 2026-09-25 20:00 相册页三个连环问题（只排一列 / 打开慢 / 空白块）

**背景**：2026-09-25 15:00 把实况标准落地正式相册页后，用户反馈三个问题：①相册只排了一列、没占满页面；②打开相册非常慢；③切页后相册显示空白。

### 1. 只排一列 → `column-fill: auto` 的坑

**根因**：给 `.gallery-waterfall` 设了 `column-fill: auto`。CSS column 布局里 `auto` 的语义是"按顺序填满一列再进下一列"，**当容器没有明确高度时，第一列可以无限高，Chrome 就把所有图片全堆进第一列**，表现为只有一列。演示页只有 3 张图，堆一列看着像移动端单列没察觉；正式页 12 张堆一列才暴露。

**修复**：删掉 `column-fill: auto`，用默认 `column-fill: balance`（图片平衡分布到各列）。同步改了 `docs/live-photo-waterfall-v2/index.html` 的 `.lp-waterfall`。

### 2. 打开非常慢 → IO 懒加载无并发控制

**根因**：改成 IO 懒加载时 `rootMargin: '200px 0px'`，首屏 12 张实况项**同时**进入 200px 范围 → 同时触发 12 次 `HeoLivePhoto.scan(item)`，每个 scan 要 fetch 整份 `.pvt`（1–2.6MB/个，共 ~16.7MB）+ CPU 解压 ZIP → 带宽打满 + CPU 占满。更糟的是切到别的页面后这些下载还在后台跑，继续拖慢新页面。

**修复**（`Layout.astro` 的 rescanLivePhotos IO 脚本）：

- `MAX_CONCURRENT = 2` 并发池：进入视口只入队，出队时同时最多 2 个 `.pvt` 在下载/解压，其余排队，前一个 promise 结算（`.then(done, done)`）才拉下一个。
- `rootMargin: '0px'`：只解包真正滚进视口的那张，不预取。
- `generation` 递增 token：每次 `setup()` 递增，回调与出队里 `if (gen !== generation) return` —— **切页后旧队列立即作废，不再追加新下载**（这是"切到别的页面加载慢"的直接原因）。
- 原代码里的 `initItem()` 无返回值，改成 `scanItem(item, done)` 带回调才能做并发控制。

### 3. 空白块 → 实况缩略图透明 gif 无可见底色

**根因**：实况缩略图 `src` 是 1x1 透明 gif（等 Heo 解包后换 blob 封面），`.gallery-item` 原本只有 `background: rgb(... / 0.05)` 的 5% 微底色 → 解包前就是一块**看起来全空**的矩形，被误判成"页面空白"。问题 2 让它更严重：12 个 `.pvt` 串行加载慢，空白块停留时间更长。

**修复**（`[slug].astro`）：实况项 `<a>` 加 `gallery-live` class，给一个可见的深灰扫光（shimmer）：`linear-gradient` 90deg + `background-size: 400% 100%` + `@keyframes gallery-shimmer` 1.8s 无限循环，颜色用 `rgb(from var(--color-text-primary) r g b / 0.08~0.16)` 自适应明暗。解包后 img 换成不透明 blob 封面，把扫光完全盖住。`prefers-reduced-motion: reduce` 下关掉动画。

**验证**：`astro check` 119 files 0/0/0；`astro build` 211 pages。dist 核验 person-life：`MAX_CONCURRENT` 3 处、`generation` 7 处、`rootMargin: '0px'` 1 处、旧 `200px 0px` 残留 0；`gallery-live` 2 处 + `gallery-shimmer` 1 处；`data-pvt` 12、透明占位 gif 12、`aspect-ratio` 残留 0。

**注意**：

- ① 并发上限 2 是折中值。改大（如 4）会更快但更卡；改小（1）最顺但滚到底要等。
- ② 实况缩略图的首帧成本没法再降：Motion Photo 本质是"一份文件里 JPEG 封面 + MP4"，必须整份下载才能拆出封面。要再快只能预先拆成"封面 webp + 视频 mp4"两文件（封面 webp 走 `<img>` 天然 lazy，视频只在灯箱点开时下载）——那是另一套素材管线，本次未做。
- ③ 若日后把实况素材换成**远端 CDN 直连**（非 .pvt），仍要走 `data-live-pvt`/`data-live-motion` 并保证 Layout 的 IO 选择器覆盖到；跨域 fetch 需要 CDN 响应 `Access-Control-Allow-Origin`，否则解包失败回退静态图。

## 2026-09-25 20:40 person-life 相册迁到 CDN 直连（删 34MB 本地素材，改 Motion Photo）

**背景**：12 张实况照片原本是本仓库里的 `.jpg`（原 Motion Photo）+ `.pvt` 双份，共 **34MB** 打进 git 和构建产物。素材已在七牛 CDN（`cdn.mingcy.cn`），所以删本地、改直连。

**CDN 侧实测**（`Range: bytes=0-499999` 只取头部逐个验）：

- 12/12 都是真 Motion Photo，EXIF 均含 `GCamera:MicroVideoOffset`，尾部挂着 188KB–2049KB 的 MP4
- `Access-Control-Allow-Origin: *` → 跨域 `fetch` 能解包（**这是硬条件**，没有就解包失败回退静态图）
- `Cache-Control: public, max-age=31536000` → `<img>` 与 `fetch()` **共用同一份缓存，不会下两遍**（硬条件 2）
- `Accept-Ranges: bytes` 支持断点
- 流量账：12 张共 **16.71MB**（封面 4.22MB + 视频 12.49MB），与 `.pvt` 方案**完全等价**（`.pvt` 也是同样大小）。迁移收益不在流量，在仓库瘦身 + 带宽卸到七牛

**清单位置坑**：清单最初放在 `src/content/galleries/person-life/images.json`，直接报 `MixedContentDataCollectionError: "galleries" contains a mix of content and data entries` —— **`src/content` 下任何 `.json` 都会被内容集合当成 data entry**，与 `.md` 内容混用即报错。改放 `src/data/gallery-manifests/<slug>.json`（与 `links.ts`、`ai-summaries.json` 同级，该目录不被集合扫描）。

**修改文件**：

1. **新建** `src/data/gallery-manifests/person-life.json`：12 条 `{src, alt, width, height, live:"motion"}`，尺寸是实测 CDN 文件 SOF0 拿到的真实值（9 张 2558×1098、2 张 1920×824、2 张竖图 1648×3840 / 1200×2608）
2. **改** `src/pages/galleries/[slug].astro`：
   - `import.meta.glob('/src/data/gallery-manifests/*.json')`，按 slug 取；有清单则**整页只用清单**，不再走 glob 本地文件
   - `<a>` 加 `data-motion`（灯箱素材源）、`data-cover`/`data-video` 只在 `.pvt` 项给
   - `<img>` 加 `data-live-motion`；**motion 项的 img src 就是 CDN 直链**（浏览器原生渲染 Motion Photo 的 JPEG 封面），不再用透明占位
   - `loading`：远端项一律 `lazy`（单张 1MB+，不能 eager），本地项维持「前 6 张 eager」；全部加 `decoding="async"`
   - glob 的 JSON 模块结果是 `{ default: {...} }`，代码用 `"default" in manifestMod` 两分支兼容
3. **改** `src/layouts/Layout.astro`：
   - 新增 `unpackMotion(url)`：fetch 整份 → 读 `MicroVideoOffset`（语义是「从文件末尾往回数的字节数」= 视频体积）→ 按 `ftyp` 魔数校准 `videoStart` → 反向找 JPEG EOI → 切出封面/视频两个 blob。算法与 HeoLivePhoto 内部 `extractMotionFromBuffer` 一致，但**灯箱不复用缩略图的 blob**（保持 DOM 解耦），所以自己解一遍；`motionCache` 按 url 去重、失败即删缓存
   - `getAssets` 加 `motion`；`resolveAssets` 在 pvt 之后加 motion 分支
   - `mountLivePlayer`：`if (!assets.pvt && !assets.motion && assets.cover) setCover(...)` —— motion 项不预铺 cover（解包器自己出封面，同一份字节已缓存）
   - 选择器扩容：时长隔离 `LIVE_SEL` 与 `data-html` 空骨架注入都从 `[data-fancybox][data-pvt]` 扩到 `[data-fancybox][data-pvt], [data-fancybox][data-motion]`
   - IO 懒加载选择器扩到 `img[data-live-pvt], img[data-live-motion]`
4. **删除** `src/content/galleries/person-life/` 下 12 个 `.jpg` + 12 个 `.pvt`（34MB，git 可恢复）；`index.md` 保留

**验证**：`astro check` 119 files 0/0/0；`astro build` 211 pages（120s，比带本地素材时快一倍）。dist 精确属性核验：

- person-life：`<a data-fancybox>` 12、`data-motion` 12、`data-pvt` **0**、SSR `data-html` **0**（由 JS 注入）、透明占位 gif **0**、`loading="lazy"` 12、`decoding="async"` 12、`width/height` 13/13、`alt="实况照片 N"` 12、本地 `_astro/*.jpg|*.pvt` 引用 **0**、12 个 URL 全唯一
- junxun / tree-photo：`data-motion` **0**、`data-pvt` **0**，静态相册完全不受影响

**端到端实测**（把 `Layout.astro` 里**真实的** `unpackMotion` 源码抽出 `eval`，喂**真实 CDN 下载件**，Node 22 + stub fetch/Blob）：2/2 通过 —— 封面 JPEG 头 `FFD8` ✓、视频 `ftyp` 魔数 ✓、封面+视频字节数之和等于原始文件字节数（**一份字节两用，无重复下载**）；同 url 二次调用命中缓存返回同一 promise ✓；错误路径正确抛错 ✓。

**注意**：

- ① **Motion Photo 直连省不掉缩略图阶段的整份下载**：JPEG 封面在文件头部、视频在尾部，`<img>` 渲染封面就必须拿全整份。真要砍首屏流量，得把每张拆成「小封面 webp + 视频 mp4」两个文件传 CDN（封面走 `<img>` 天然 lazy，视频只在点开灯箱时下载），首屏从 16.71MB 降到 4.22MB —— 那是另一套素材管线，本次未做。
- ② 若 CDN 哪天改掉 `Access-Control-Allow-Origin: *` 或短缓存策略，实况会退化：跨域拦 → `unpackMotion` 抛错 → 灯箱回退 `data-cover`（motion 项没给 cover，只显示静态封面 + `console.warn`）；短缓存 → `<img>` 与 fetch 各下一遍，流量翻倍。
- ③ `.pvt` 路径完整保留，其它相册日后仍可用同名 `.pvt` 走实况（本地零改动接入）。
- ④ `images.json` 这个文件名在 `src/content` 下尤其危险（Astro 约定内容入口前缀），改名也没用 —— 关键是**别放 `src/content` 里**。

### 2026-09-25 - person-life 切「封面+视频分离」模式 & 新增 Love-eyes 相册（Motion Photo 直连）

**背景**：上一条记录把 person-life 迁到 CDN 直连 Motion Photo 后，首屏 4 张仍要下 4.88MB（JPEG 封面在文件头部、视频在尾部，`<img>` 渲染封面必须拿全整份）。本轮把 person-life 的 12 张拆成「小封面 jpg + 独立 mp4」上传七牛，走分离模式；同时新建 Love-eyes 相册（8 张，用户明确「不需要拆分」，走 Motion Photo 直连）。

**素材侧（本仓库只读边界外）**：

- 拆分用 `docs/live-photo-waterfall/convert.mjs`（纯字节切片，无损、零重编码、无 sharp/ffmpeg 依赖）。原图从 git 历史 `de7467d~1` 取回（`git show <sha>:src/content/galleries/person-life/<id>.jpg`），与 CDN 上那份同源，不需要原始 URL 清单
- 产物命名 `<原始ID>-cover.jpg` / `<原始ID>-video.mp4`，ID 用原照片编号（`1000015643`…`1000015654`）而不是自编序号，即使七牛上传工具加随机前缀，**后缀仍能一一对应**
- 12/12 全部是真 Motion Photo，24/24 校验通过（封面 `FFD8`、视频偏移 4 处 `ftyp`）
- **CDN 侧 24/24 已验**：HTTP 200、`Content-Length` 与本地**逐字节相等**（说明七牛没转码没改名）、`Access-Control-Allow-Origin: *`、`Cache-Control: public, max-age=31536000`

**首屏流量账**：

|                               | 手机首屏 4 张 | 全量                                           |
| ----------------------------- | ------------- | ---------------------------------------------- |
| Motion Photo 单文件（上一条） | 4.88 MB       | 16.71 MB                                       |
| 封面+视频分离（本轮）         | **1.06 MB**   | 封面 4.22 MB；视频 12.49 MB 只在点开灯箱时按需 |

**修改文件**：

- `src/pages/galleries/[slug].astro`
- `src/layouts/Layout.astro`
- `src/data/gallery-manifests/person-life.json`（motion → 分离模式）
- `src/data/gallery-manifests/Love-eyes.json`（**新建**，8 张 motion）
- `src/content/galleries/Love-eyes/index.md`（用户已建，frontmatter 原样保留）
- `.gitignore`（加 `upload/`，待上传素材不进 git）

**manifest 现在是判别联合**（`[slug].astro` 里 `RemoteManifest`）：

```ts
type RemoteManifest = {
  images: Array<
    | { alt: string; width: number; height: number; cover: string; video: string } // 分离模式
    | { alt: string; width: number; height: number; src: string; live: 'motion' } // Motion Photo
  >
}
```

`"cover" in img` 分支映射，TS 自行收窄，无断言。

**分离模式怎么接线**：

- `<a>`：`data-cover` = 封面 URL、`data-video` = 视频 URL；**不给 `data-motion`**
- `<img>`：`src` = 封面 URL、`data-live-video` = 视频 URL（HeoLivePhoto 原生支持，`img.src` 留作封面、视频挂到新建的 `<video>` 上）
- `resolveAssets` 在 pvt 之前优先取 `assets.video`，直接返回 `{cover, video}`，**完全不走解包**（无需 ZIP/Motion 解析）
- `data-html` 空骨架注入、时长隔离选择器、IO 懒加载选择器都扩到 `[data-fancybox][data-video]` / `img[data-live-video]`

**排掉的一个雷**：Fancybox 会不会把 `data-video` 当成自己的视频类型选项抢先接管？不会。UMD bundle 里 `.video` 26 处全是 YouTube 的 `t.videoId` / `f-iframe_<videoId>`，**没有 `slide.video` 选项**；且实况项无 `href`、有 `data-html`，类型被锁定为 `html`，不会走 video type。

**属性语义（三种形态速查）**：

| 形态           | `<a>`                                              | `<img>`                           | 灯箱取料                |
| -------------- | -------------------------------------------------- | --------------------------------- | ----------------------- |
| 分离           | `data-cover` + `data-video`                        | `src=cover` + `data-live-video`   | 直接返回，不解包        |
| Motion Photo   | `data-motion`                                      | `src=单文件` + `data-live-motion` | `unpackMotion` 整份解包 |
| `.pvt`（本地） | `data-pvt` + `data-cover`（兜底）+ `data-video=""` | `src=透明 gif` + `data-live-pvt`  | `unpackPvt` ZIP 解包    |

`data-video=""` 是空串，`assets.video` 判定为 falsy，才会落到 pvt 分支——别误删。

**Love-eyes 素材实测（8 张，Motion Photo 直连）**：

- 全部 `MicroVideoOffset` 存在；按 `fileSize - offset` 算出的 `videoStart` 处，**JPEG EOI（`ffd9`）在 -2、`ftyp` 在 +4**，8/8 精确吻合 —— 位置对得上，Heo 与灯箱解包器都能正确切分
- 体积很小：单张 191–384 KB，8 张共 **2.23 MB**，首屏 4 张约 1.14 MB
- 尺寸：720×540 ×5、720×480、720×960（竖）、1920×1080
- `Access-Control-Allow-Origin: *` + `Cache-Control: public, max-age=31536000` 齐全

**验证**：`astro check` 119 files 0/0/0；`astro build` 212 pages。dist 精确 DOM 核验：

- `person-life`：`<a data-fancybox>` 12、`data-cover=CDN` **12**、`data-video=CDN` **12**、`data-motion` **0**、`data-pvt` **0**、`href` **0**、`<img src=CDN 封面>` 12、`data-live-video` 12、`data-live-motion` **0**、`data-live-pvt` **0**、`loading="lazy"` 12、`width+height` 13/13、本地 `_astro/*.jpg|*.pvt` 引用 **0**、唯一 CDN URL **24**（12 cover + 12 video）
- `Love-eyes`：`<a data-fancybox>` 8、`data-motion=CDN` **8**、`href` **0**、`data-pvt/data-video/data-cover` **0**、`<img src=Motion 直链>` 8、`data-live-motion` 8、`loading="lazy"` 8、唯一素材 URL **8**、`alt="眼睛与偏爱 N"` 8 个全在
- `junxun` 35 / `scenery-cartoon` 38 / `tree-photo` 16 / `cloud-photography` 16：`data-pvt`/`data-video`/`data-cover` 全 **0**，走本地 `_astro/*.webp`，静态相册零影响

**注意**：

- ① 核验 dist 时别直接用 `grep -o 'data-pvt' | wc -l` —— 页面内联的 Fancybox/实况脚本里也有这些选择器字符串（LIVE_SEL、`data-html` 注入器），会算进 JS 里。要精确得先抽 DOM 标签再数属性
- ② **Motion Photo 的 `MicroVideoOffset` 是「从文件末尾往回数」，即视频体积**，`videoStart = fileSize - offset`。这批 Love-eyes 的照片封面很小（26–179 KB）、视频在文件前段，所以抽样取文件**尾部** 64KB 是找不到 `ftyp` 的（上次误报 `ftyp=False` 就是这个原因）—— 要验就按 `videoStart` 精确取那 64 字节
- ③ `galleries/index.astro` 的相册卡片封面只看**本地**图片（`getGalleryImages` glob `/src/content/galleries/**/*.{jpg,...}`），CDN 相册没有本地文件 → 卡片显示占位 SVG 图标且无「N 张照片」计数。**person-life 与 Love-eyes 都是这个状态**（本轮引入但未修，属既有局限，等确认再改）
- ④ `upload/` 目录里的 24 个拆分素材已删（上传完成后被清理）；`upload/` 仍留在 `.gitignore`，下次拆素材可继续用同一位置
- ⑤ 分离模式的封面是**原始 JPEG 切片**，未转 webp（本机无 sharp/ffmpeg）；若要再压 30% 需另装依赖或改用 CDN 图片处理参数

---

### 2026-10-13 - 文章图片点击放大修复：运行时注入 data-src 让 Fancybox 取到图片源

**背景：** 用户要求为文章功能添加点击图片放大功能。排查发现项目**早已接入 Fancybox 6**（本地化 `public/fancybox/`，`Layout.astro` 有 `initFancybox()` 全站初始化，相册页实况灯箱也在用），`src/plugins/rehypeImage.js` 也已给每张文章 `<img>` 加了 `data-fancybox="article"` + `data-caption`。**但点击不弹灯箱** —— 根因在 Fancybox 6 的取源机制。

**根因（对照官方文档确认）：** Fancybox 6 的触发元素必须用 **`href` 或 `data-src`** 指定要显示的大图源（官方文档反复强调「Use `href` or `data-src` attribute to specify the content source」），所有官方示例都是 `<a href="image.jpeg" data-fancybox><img src="thumb"></a>`。而当前文章图片经 rehype + Astro 图片优化后渲染为：

```html
<figure>
  <img src="/_astro/image-xxx.webp" data-fancybox="article" data-caption="官网截图" />
</figure>
```

`<img>` 上**只有 `data-fancybox`，没有 `href` 也没有 `data-src`** → Fancybox 取不到源 → 点击无反应（或弹空）。dist 实测 `deepseek-harness` 文章页每张图都是这个状态。

**为什么不在 rehype 阶段直接加 data-src / 包 `<a>`：**

- **rehype 阶段 img.src 还是 markdown 原始路径**（`./x.webp`），而 Astro 图片优化在更后面的阶段才把 img.src 改写成 `/_astro/x.hash.webp`。rehype 阶段写 `data-src` 会停留在原始相对路径，按文章 URL（`/2026/08/16/slug`）解析后大概率 404。
- **包 `<a href>` 同理**：`<a>` 的 href 不被 Astro 图片优化改写，会停留在原始路径，与 img 最终 src 不一致。
- **包 `<a>` 还会引入 Swup 坑**：Swup 的 delegate-it 会把图片链接当页面导航拦截（见 2026-09-17 记录），需额外 `data-no-swup`，徒增复杂度。

**最终方案：运行时注入 data-src（最小改动，1 处）。** 在 `Layout.astro` 的 `initFancybox()` 里，`Fancybox.unbind` 之后、`Fancybox.bind` 之前插入：

```js
// 文章页普通图片：<img data-fancybox> 上无 href/data-src，Fancybox 取不到
// 大图源。运行时用 img 的最终 src（Astro 图片优化已改写成 /_astro/x.hash.webp）
// 补 data-src。currentSrc 优先（响应 srcset 选中的图），回退 src 属性。
document.querySelectorAll('img[data-fancybox]:not([data-src])').forEach(function (img) {
  var src = img.currentSrc || img.getAttribute('src') || ''
  if (src) img.setAttribute('data-src', src)
})
```

**关键决策理由：**

- 运行时 `img.currentSrc`（或 `img.src`）已是 Astro 优化后的最终 URL（`/_astro/x.hash.webp`），绝对可靠，不存在相对路径解析问题
- `img` 本身就是缩略图，Fancybox 6 的 `zoomEffect` 放大动画能正确从缩略图定位
- 选择器 `img[data-fancybox]:not([data-src])` 限定只命中 img 上的 data-fancybox —— 相册实况项的 `data-pvt/data-motion/data-video` 都在 `<a>` 上、相册静态项 img 本来就没 `data-fancybox`，**均不会误伤**
- 已有的 `data-caption` 由 Fancybox `Caption: { type: 'auto' }` 读取，无需改动
- 不改 rehype、不包 `<a>`、不碰 Swup、不影响相册实况灯箱逻辑

**修改文件：** `src/layouts/Layout.astro`（仅 1 处，约 8 行）

**功能链路：** 页面加载 → `initFancybox()` → `Fancybox.unbind` 清旧绑定 → 给实况项注 `data-html` 骨架 → **给文章 img 注 `data-src` = 最终 src** → `Fancybox.bind('[data-fancybox]')` 绑定 click → 点击文章图片 → Fancybox 取 `data-src` → 弹出放大图（左右滑动 / 无限循环 / 键盘方向键 / Caption 显示 alt）

**验证：** `astro check` 114 files / 0 errors / 0 warnings / 0 hints；`astro build` 213 pages Complete（69.94s）。dist 核验：

- 文章页 SSR 态 `<img data-fancybox="article" data-caption="...">` 保留（无 data-src，符合预期，由运行时补）
- 运行时注入脚本在产物：`img[data-fancybox]:not([data-src])` 选择器 + `img.currentSrc` → `setAttribute('data-src', ...)` 逻辑均在（含注释共 2 处匹配）
- 相册页不受影响：`junxun` 静态项 img 无 `data-fancybox`（data-fancybox 在外层 `<a>` 上）；`person-life` 实况项 `data-pvt/data-motion` 也在 `<a>` 上、img 无 `data-fancybox` → 选择器不会误伤

**注意：**

- ① 放大显示的是 Astro 优化后的 webp（`/_astro/x.hash.webp`），质量足够；若要显示**原图**需在 rehype 阶段额外保留原图路径（Astro 图片优化不暴露原图 URL），是另一个改动，本次未做
- ② Fancybox 6 的 `data-fancybox` 放在 `<img>` 上时**必须配 `data-src` 或 `href`** 才能取源 —— 这是官方文档明确的，之前 rehype 只加 `data-fancybox` + `data-caption` 漏了取源属性，是这次 bug 的直接原因
- ③ 本次只补 `data-src`，不重构 rehype 包 `<a>`，避免引入 Swup 图片链接导航坑（2026-09-17 教训）与相对路径 404 坑
- ④ 首次访问慢 / EBUSY 构建报错与本次改动无关（图片优化固有成本 + 文件锁），清 dist 重跑即过
