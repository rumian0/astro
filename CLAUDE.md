# 茗辰原博客 - Astro Devosfera

茗辰原的个人博客，从 Hexo (ShokaX) 迁移至 Astro (astro-devosfera)，托管于 GitHub + Vercel。

## 技术栈
- 语言：TypeScript
- 框架：Astro 5
- 包管理：pnpm
- 样式：Tailwind CSS + 局部 CSS
- 评论：Twikoo（CDN 加载）
- 统计：Umami Analytics
- 搜索：Pagefind
- 内容：Astro Content Collections（Markdown/MDX）

## 常用命令

### 开发
```bash
pnpm run dev           # 启动开发服务器 (localhost:4321)
pnpm run build         # 构建生产版本
pnpm run preview       # 预览构建结果
```

### 代码检查
```bash
pnpm run astro check   # 类型检查
pnpm run lint          # 代码检查（如已配置）
```

## 项目结构
- `src/config.ts` — 站点全局配置（标题、社交、功能开关等）
- `src/content.config.ts` — 内容集合定义（blog + galleries）
- `src/data/blog/` — 博客文章，路径格式：`slug/index.md`（flat 结构）
- `src/data/galleries/` — 相册内容
- `src/data/links.ts` — 本地友链数据
- `src/layouts/` — 页面布局组件（Layout, PostDetails, AboutLayout）
- `src/pages/` — 路由页面（首页、关于、友链、文章列表等）
- `src/pages/[...slug]/index.astro` — 文章详情页（路由为 `/YYYY/MM/DD/slug/`）
- `src/components/` — 可复用组件（Header, Footer, Card, Twikoo 等）
- `scripts/` — 工具脚本（迁移、新建文章、部署等）

## 编码规范
- 使用 `pnpm` 管理依赖
- 文章存放在 `src/data/blog/slug/index.md`（flat 结构，无日期目录）
- 文章 URL 格式：`https://s.mingcy.cn/YYYY/MM/DD/slug/`（由 frontmatter `pubDatetime` + slug 决定）
- 新文章可通过 `pnpm new:post "标题"` 快速创建
- 文章 frontmatter 必须包含 `title`、`pubDatetime`、`description`
- 所有页面使用 `<Layout>` + `<Header />` + `<Footer />` 统一框架

## 常用命令
```bash
pnpm run dev           # 启动开发服务器 (localhost:4321)
pnpm run build         # 构建生产版本
pnpm run preview       # 预览构建结果
pnpm new:post "标题"   # 新建文章
pnpm run deploy        # 构建 + 提交 + 推送 GitHub
```

## 注意事项
- 图片文件存放在文章同级目录下，引用路径用 `![](image.webp)`
- 自定义页面放在 `src/pages/`，必须与首页使用相同布局框架
- 友链数据来源：`src/data/links.ts`（本地数据，非远程 JSON）
- 不要修改原始 Hexo 源文件（位于 `../hexo/blog/shokax-can/source/_posts/`）
- 站点域名：`https://s.mingcy.cn/`
- 旧 `/posts/...` 路径已不再使用，现在 URL 直接位于根路径
- 文章详情页的 `post-hero-bg` 背景使用 frontmatter `ogImage` 作为封面背景图；无 `ogImage` 的文章保留原有的 Aurora 渐变效果
- Footer 社交区增加 QQ 联系链接（图标为简化版企鹅轮廓 SVG）
- `/links/fcircle/` 页面：iframe 无边框全屏嵌入，移除所有包裹元素和状态区块
- `/links/apply/` 页面：添加「一键填充」按钮，可自动填入申请格式到评论框

## 文章侧边目录（TableOfContents）

- 组件：`src/components/TableOfContents.astro`
- 在 `PostDetails.astro` 中通过 `render()` 的 `headings` 字段获取文章 h1~h5 标题
- 布局：`lg:flex lg:gap-x-8` 并在右侧 `lg:w-56` 固定侧边栏（`sticky top-24`）
- 树形视觉：每位条目渲染 `indent` 列竖线（h1=0 列，h2=1 列，h3=2 列...），竖线使用 `bg-border/30`，通过 `self-stretch` + `flex-1` 贯穿条目整高
- 圆点：h1 为实心 `bg-foreground`，h2~h5 为空心 `border-foreground/70`
- 激活态：`IntersectionObserver` 监听 `#article h1~h5`，当前可见标题对应条目高亮（`bg-accent/8 text-accent font-medium`，竖线变为 `accent/50`）
- 底部固定「评论」条目，点击平滑滚动到 `#tcomment`
- 所有色彩使用 Tailwind 主题变量（`text-foreground`、`border-border`、`bg-accent/8` 等），适配亮色/暗黑模式
- 已从 `astro.config.ts` 中移除 `remark-toc` 和 `remark-collapse`（不再有嵌入式目录，与侧边目录冲突）
- typography.css 中对应的嵌入式 TOC 样式（`details` / `summary` / 嵌套列表）为死代码，可清理

## 文章内容标签系统

支持在文章中使用 remark 插件 + 行内 HTML + MDX 组件实现丰富的内容装饰。

### 文字特效（remark 插件，`.md` / `.mdx` 通用）

| 语法 | 效果 | 插件 |
|---|---|---|
| `++文字++` | 红色下划线 `<ins>` | `remark-ins` |
| `==文字==` | 荧光高亮 `<mark>` | 自定义 `remark-mark`（`src/utils/remark-mark.ts`） |
| `H~2~O` / `29^th^` | 上下标 | `remark-supersub` |

### 行内标签（HTML，`.md` / `.mdx` 通用）

| 写法 | 效果 | CSS 类 |
|---|---|---|
| `<ins class="wavy">` | 波浪下划线 | `ins.wavy` |
| `<ins class="dot">` | 虚点下划线 | `ins.dot` |
| `<ins class="primary/success/warning/danger/info">` | 彩色下划线 | `ins.primary` 等 |
| `<span class="c-red/c-blue/...">` | 彩色文字（9 色） | `.c-red` `.c-blue` `.c-green` `.c-purple` 等 |
| `<span class="rainbow">` | 七彩渐变流动文字 | `.rainbow` |
| `<kbd>Ctrl</kbd>` | 键盘键 3D 样式 | `kbd` |
| `<span class="spoiler">` | 黑幕遮罩（悬停显示） | `.spoiler` |
| `<span class="spoiler blur">` | 模糊遮罩（悬停清晰） | `.spoiler.blur` |
| `<span class="label primary/...">` | 内联标签（6 色） | `.label` + `.primary/.success/.info/.warning/.danger` |

### 链接卡片（仅 `.mdx`）

- 组件：`src/components/LinkCard.astro`
- 使用：`import LinkCard from "@/components/LinkCard.astro"`
- 属性：`title`（必填）、`url`（必填）、`desc`（可选）、`image`（可选）
- 样式：友链风格方框卡片，hover 上浮 + 阴影，双列自适应

### 配置位置

- remark 插件配置：`astro.config.ts` 的 `markdown.remarkPlugins`
- 所有视觉样式：`src/styles/typography.css` 的 `.app-prose` 块内
- 自定义 remark-mark 插件：`src/utils/remark-mark.ts`
- 类型声明：`src/utils/remark-plugin-types.d.ts`
