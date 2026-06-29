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
- `src/data/blog/` — 博客文章，路径格式：`YYYY/MM/DD/slug/index.md`
- `src/data/galleries/` — 相册内容
- `src/layouts/` — 页面布局组件（Layout, PostDetails, AboutLayout）
- `src/pages/` — 路由页面（首页、关于、友链、文章列表等）
- `src/components/` — 可复用组件（Header, Footer, Card, Twikoo 等）
- `scripts/` — 工具脚本（迁移、新建文章等）

## 编码规范
- 使用 `pnpm` 管理依赖
- 文章存放在 `src/data/blog/YYYY/MM/DD/slug/index.md`
- 新文章可通过 `pnpm new:post "标题"` 快速创建
- 文章 frontmatter 必须包含 `title`、`pubDatetime`、`description`
- 所有页面使用 `<Layout>` + `<Header />` + `<Footer />` 统一框架

## 注意事项
- 图片文件存放在文章同级目录下，引用路径用 `![](image.webp)`
- 自定义页面放在 `src/pages/`，必须与首页使用相同布局框架
- 友链数据来源：`https://a.mingcy.cn/js/friend.json`
- 不要修改原始 Hexo 源文件（位于 `../hexo/blog/shokax-can/source/_posts/`）
- 站点域名：`https://mingcy.cn/`
