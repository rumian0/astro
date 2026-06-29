---
title: "Vercel部署Typecho 博客"
pubDatetime: 2024-05-25T00:00:00.000Z
description: "本文介绍了如何使用 Vercel 部署 Typecho 博客。"
tags: ["建站", "网站建站", "计算机"]
featured: false
draft: false
ogImage: "https://view.lixingyong.com/images/2024/08/21/23.webp"
---

<aside>
😀 这里写文章的概述：
本文介绍了如何使用 Vercel 部署 Typecho 博客。内容包括准备工作和具体操作步骤，如创建 GitHub 仓库、配置文件、上传主题等。通过 Vercel 部署项目并添加域名，实现博客部署和初始化。操作简单明了，适合初学者。文章重点强调了 Vercel 支持 PHP 部署，提供了详细的操作指南，包括代码示例和截图，让读者能够轻松完成部署过程。

</aside>

## 前言

相信很多人不知道 Vercel 可以部署 PHP，可以在 [**Vercel 文档**](https://vercel.com/docs/runtimes?query=php#advanced-usage/community-runtimes) 中看到确实支持

## 准备工作

1. [Github](https://github.com) 账号
2. [Vercel](https://vercel.com/) 账号
3. [Typecho](https://typecho.org/) 程序
4. 数据库
5. 自己的域名（可选，国内注册可以首年1元甚至免费）部署完成之后默认会给你的项目分配一个 vercel.app 的三级域名，但是在 2021 年 vercel.app 域名被墙，大陆地区无法访问，因此强烈建议自己准备域名

## 过程

1. 创建 Github 仓库
2. 本地解压 Typecho 程序
3. 在根目录下新建 `vercel.json` 并填入以下代码

```json
{
  "functions": {
    "api/index.php": {
      "runtime": "vercel-php@0.6.0"
    }
  },
  "routes": [{ "src": "/(.*)", "dest": "/api/index.php" }]
}

```

1. 在根目录下新建 `config.inc.php` 并填入以下代码

```php
<?php
/**
 * Typecho Blog Platform
 *
 * @copyright  Copyright (c) 2008 Typecho team (http://www.typecho.org)
 * @license    GNU General Public License 2.0
 * @version    $Id$
 */

/** 开启https */
define('__TYPECHO_SECURE__',true);

/** 定义根目录 */
define('__TYPECHO_ROOT_DIR__', dirname(__FILE__));

/** 定义插件目录(相对路径) */
define('__TYPECHO_PLUGIN_DIR__', '/usr/plugins');

/** 定义模板目录(相对路径) */
define('__TYPECHO_THEME_DIR__', '/usr/themes');

/** 后台路径(相对路径) */
define('__TYPECHO_ADMIN_DIR__', '/admin/');

/** 设置包含路径 */
@set_include_path(get_include_path() . PATH_SEPARATOR .
__TYPECHO_ROOT_DIR__ . '/var' . PATH_SEPARATOR .
__TYPECHO_ROOT_DIR__ . __TYPECHO_PLUGIN_DIR__);

/** 载入API支持 */
require_once 'Typecho/Common.php';

/** 程序初始化 */
Typecho_Common::init();

/** 定义数据库参数 */
$db = new Typecho_Db('Pdo_Mysql', 'typecho_');
$db->addServer(array (
  'host' => '数据库地址',
  'user' => '数据库用户名',
  'password' => '数据库密码',
  'charset' => 'utf8mb4',
  'port' => '3306',
  'database' => '数据库名称',
  'engine' => 'MyISAM',
), Typecho_Db::READ | Typecho_Db::WRITE);
Typecho_Db::set($db);

```

1. 在根目录下新建 `/api/index.php` 并填入以下代码

```php
<?php
$file= __DIR__ . '/..'.$_SERVER["PHP_SELF"];

if(file_exists($file))
{
   return false;
}
else
{
    require_once __DIR__ . '/../index.php';
}
#echo $_SERVER["PHP_SELF"];

```

1. 下载一个自己心仪的主题解压放到 `/usr/themes/` 目录下
2. 将所有文件上传到第一步创建好的 GitHub 仓库里
3. 打开 [**Vercel**](https://vercel.com/) 然后通过 GitHub 快捷登录
   
    ![https://cdn.xalaok.top/images/blog/2023/05/06/4.jpg](https://cdn.xalaok.top/images/blog/2023/05/06/4.jpg)
    
4. 登陆后会自动跳转 Dashboard，点击 Add new - Project
   
    ![https://cdn.xalaok.top/images/blog/2023/05/06/5.jpg](https://cdn.xalaok.top/images/blog/2023/05/06/5.jpg)
    
5. Import Git Repository 选择 Continue With GitHub此时会跳转到 GitHub 批准 Vercel 访问，建议选择允许访问全部仓库，当然你也可以设置仅可访问部分仓库。
6. 选择你的仓库
7. 即将开始部署，在这个界面你可以设置项目名称（可以随意设置），其他项全部保持默认即可，最后点击 Deploy 部署
8. 部署成功后会显示 Congratulation 页面
9. 如果你有域名，直接从此界面右边“Add Domain”进入添加域名，Vercel 会自动生成 SSL 证书（开启 https）。没有的话直接右上角“Go to Dashboard”就可以看到 Vercel 为你准备的域名
10. 打开 `https://你的网址/install.php` 初始化

SO easy!