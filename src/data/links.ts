export interface LinkItem {
  name: string
  url: string
  avatar?: string
  desc?: string
}

export interface LinkCategory {
  title: string
  links: LinkItem[]
}

export const friendLinks: LinkCategory[] = [
  {
    title: '大佬们',
    links: [
      {
        name: '茗辰原 の 异世界(老站点)',
        url: 'https://not.mcy.cloudns.org/',
        avatar: 'https://mingcy.cn/image/mcy.png',
        desc: '茗辰原，一个与众不同的异世界，等待你的探索与发现。',
      },
      {
        name: '茗辰原',
        url: 'https://mingcy.cn',
        avatar: 'https://mingcy.cn/image/mcy.png',
        desc: '茶香四溢,编程世界',
      },
      {
        name: '清羽飞扬',
        url: 'https://blog.liushen.fun/',
        avatar: 'https://blog.liushen.fun/info/siteshot.jpg',
        desc: '柳影曳曳，清酒孤灯，扬笔撒墨，心境如霜',
      },
      {
        name: '张洪 Heo',
        url: 'https://blog.zhheo.com/',
        avatar: 'https://mingcy.cn/image/heo.webp',
        desc: '分享设计与科技生活',
      },
      {
        name: 'Mr. Nyampasu',
        url: 'https://blog.mpsxx.top/',
        avatar: 'https://blog.mpsxx.top/img/favicon.svg',
        desc: '分享、学习、生活',
      },
    ],
  },
  {
    title: '朋友们',
    links: [
      {
        name: '周天记',
        url: 'https://zhoutian.com/',
        avatar: 'https://bu.dusays.com/2023/01/29/63d5bf7fa0d2c.png',
        desc: '记录生活里的小美好',
      },
      {
        name: '云萧的咕咕屋',
        url: 'https://blog.crrashh.com',
        avatar: 'https://i.cdn.crrashh.com/avatar.jpg',
        desc: '以万象之不息，致不息之万象。',
      },
      {
        name: 'echeverra',
        url: 'https://echeverra.cn',
        avatar: 'https://echeverra.cn/favicon.jpg',
        desc: "let's go, together!",
      },
      {
        name: '叶泯希',
        url: 'https://blog.418121.xyz',
        avatar: 'https://blog.418121.xyz/images/avatar.webp',
        desc: '意义是自己赐予的',
      },
      {
        name: '紗夕里',
        url: 'https://blog.ovofish.com',
        avatar: 'https://blog.ovofish.com/img/avatar.webp',
        desc: '在你心里-直到永远',
      },
      {
        name: '青桔气球',
        url: 'https://blog.qjqq.cn/',
        avatar: 'https://avatar.qjqq.cn/1/6503bb1b7fa1a.webp!avatar',
        desc: '分享网络安全与科技生活',
      },
      {
        name: '夏柔 APi',
        url: 'https://api.aa1.cn/link/',
        avatar: 'https://api.aa1.cn/assets/img/favicon.png',
        desc: '提供免费接口调用平台',
      },
      {
        name: '梦爱吃鱼',
        url: 'https://blog.bsgun.cn/',
        avatar: 'https://oss-cdn.bsgun.cn/logo/avatar.256.png',
        desc: '但愿日子清静抬头遇见的满是柔情',
      },
      {
        name: "BOB'S BLOG",
        url: 'https://www.itbob.cn/',
        avatar: 'https://static.wukongsec.com/public/images/info/avatar_64x64.png',
        desc: '数据采集、逆向安全',
      },
      {
        name: 'Mo的记事簿',
        url: 'https://blog.xiowo.net/',
        avatar: 'https://blog.xiowo.net/img/avatar.png',
        desc: '万年鸽王，哈哈OvO',
      },
      {
        name: 'XingJiのBlog',
        url: 'https://love.xingji.fun/',
        avatar: 'https://i.p-i.vip/47/20240920-66ed7b168c38c.jpg',
        desc: '迄今所有人生都大写着失败，但不妨碍我继续向前✨',
      },
      {
        name: 'leorain',
        url: 'https://www.leorain.cn',
        avatar: 'https://www.leorain.cn/images/logo.png',
        desc: '一个对技术和生活充满热爱的文艺型技术青年',
      },
      {
        name: "Wcowin's Blog",
        url: 'https://wcowin.work/',
        avatar: 'https://pica.zhimg.com/80/v2-74ecd899c7c4cc0258930eaff239a21b_1440w.webp',
        desc: '循此苦旅，以达星辰',
      },
      {
        name: 'LinJHS个人小站',
        url: 'https://linjhs.com',
        avatar: 'https://linjhs.com/upload/logo.webp',
        desc: '分享网络安全技术、资讯、生活',
      },
      {
        name: '唯知笔记',
        url: 'https://note.weizwz.com',
        avatar: 'https://p.weizwz.com/logo_a4353391cbf0889b.webp',
        desc: '探索知识的无限可能',
      },
      {
        name: '程序员鸡皮',
        url: 'https://www.xvzhu.cn',
        avatar: 'https://www.xvzhu.cn/upload/20240705/1720146745.jpg',
        desc: '一名北漂程序员编程学习以及日常的博客',
      },
      {
        name: '冷月笙寒的小窝',
        url: 'https://lygalaxy.cn/',
        avatar: 'https://q1.qlogo.cn/g?b=qq&nk=2648181326&s=640',
        desc: '发现巷子里的那颗星星(技术与生活分享)',
      },
      {
        name: "Jack's Space",
        url: 'https://veryjack.com',
        avatar: 'https://pix.veryjack.com/i/2023/04/04/fsxnkv.webp',
        desc: '一切都是最好的安排',
      },
      {
        name: '云墨观窗',
        url: 'https://mojue88.com/',
        avatar: 'https://mojue88.com/logo.png',
        desc: '',
      },
      {
        name: '王一君Mew',
        url: 'https://wyjmew.cn/',
        avatar: 'https://wyjmew.cn/app.png',
        desc: '你奔向我的每一步，都是我心动的理由',
      },
      {
        name: 'SeaEpoch',
        url: 'https://www.seaepoch.com',
        avatar: 'https://www.seaepoch.com/img/avatar.png',
        desc: '她站在那里，就像一个小小的永恒！',
      },
      {
        name: 'UpXuu`s blog',
        url: 'https://upxuu.com',
        avatar: 'https://upxuu.com/images/me.jpg',
        desc: '逐光而上',
      },
      {
        name: '团子和蛋糕',
        url: 'https://blog.tsh520.cn',
        avatar: 'https://re.tsh520.cn/zl/tx.webp',
        desc: '如果你喜欢那么欢迎来到我的世界！',
      },
      {
        name: '拾柒',
        url: 'https://www.s17.cn',
        avatar: 'https://www.s17.cn/logo.png',
        desc: '奇奇怪怪。',
      },
      {
        name: 'SeaEpoch',
        url: 'https://www.seaepoch.com',
        avatar: 'https://www.seaepoch.com/img/avatar.png',
        desc: '她站在那里，就像一个小小的永恒！',
      },
      {
        name: 'Aimerting',
        url: 'https://blog.xuioo.com/',
        avatar: 'https://blog.xuioo.com/avatar.jpg',
        desc: '「纯粹祈愿皆成真」',
      },
      {
        name: 'x小曦的园子',
        url: 'https://xiaoxi.ac.cn/',
        avatar: 'https://img.xiaoxi.ac.cn/logo.png',
        desc: '打理好自己的小园子',
      },
      {
        name: '朝朝听雨',
        url: ' https://rainzt.cn/',
        avatar: 'https://rainzt.cn/zzty.png',
        desc: '物物而不物于物，念念而不念于念',
      },
      {
        name: 'Ditto',
        url: ' https://blog.blueke.top/',
        avatar: 'https://gcore.jsdelivr.net/gh/Keduoli03/My_img@img/img/头像.jpg',
        desc: '请为一切不真实之物骄傲，因为我们高于这个世界！',
      },
      {
        name: '酥米的小站',
        url: 'https://www.sumi233.top',
        avatar:
          'https://cdn.sumi233.top/gh/huang233893/blog-image-bed@main/top/huang233893/imgs/blog/usersumi.png',
        desc: '终有一日，寻梦中人',
      },
      {
        name: '柯希兔',
        url: 'https://kexitu.com',
        avatar: 'https://img.kexitu.com/p1/kexitu.png',
        desc: '平凡亦有诗意',
      },
      {
        name: 'Mete0r’s Blog | 壹人小站',
        url: 'https://www.xscnet.cn/',
        avatar: 'https://img.xscnet.cn//i/2026/06/28/6a40e72d6a01e.jpg',
        desc: 'Trust the process.',
      },
      {
        name: '桃之天天',
        url: 'https://taozhiyy.top',
        avatar: 'https;//taozhiyy.top/cos/1.png',
        desc: '桃之天天的小屋',
      },
      {
        name: '叁拾玖の小站',
        url: 'https://www.sanshijiu.cn',
        avatar: 'https://www.sanshijiu.cn/static/avatar/1/1787397803188bebb136a.jpg',
        desc: '无人扶我青云志，我自踏雪至山巅！',
      },
      {
        name: 'Wangxinyang ',
        url: 'https://wangxinyang.top/',
        avatar: 'https://wangxinyang.top/avatar.png',
        desc: '个人博客 / 学习交流 / 生活日常',
      },
    ],
  },
  {
    title: 'Link3',
    links: [
      {
        name: '烛·夜',
        url: 'https://link3.cc/ys520',
        avatar: 'http://img.magicalapp.cn/api/image/show/ec99ff165092639a33de1111970f2558',
        desc: '用心分享每一个资源',
      },
    ],
  },
  {
    title: '软件阁',
    links: [
      {
        name: '果核剥壳',
        url: 'https://www.ghxi.com',
        avatar:
          'https://www.ghxi.com/wp-content/uploads/member/avatars/d88a60f80f244ce5.1583550011.jpg',
        desc: '果核剥壳是一家综合科技站点，看新闻，分享精品、绿色软件，Windows 系统。守住互联网最后的一片净土。',
      },
      {
        name: '小众软件',
        url: 'https://www.appinn.com/',
        avatar: 'https://www.appinn.com/wp-content/uploads/apple-touch-icon-144x144.png',
        desc: '小众软件是一个分享、体验、评测电脑软件、手机应用、互联网产品的网站',
      },
      {
        name: '酷安',
        url: 'https://coolapk.com/',
        avatar: 'https://coolapk.com/favicon.ico',
        desc: '酷安是全球应用商店，提供各种应用、游戏、主题、漫画、音乐、视频、直播等。',
      },
    ],
  },
  {
    title: '大家庭',
    links: [
      {
        name: '笔墨迹',
        url: 'https://blogscn.fun/blogs/01kjj05pth5tpkqq91gcnjyzwt',
        avatar: 'https://photo.xiangming.site/img/blogscn_icon.png',
        desc: '致敬还在写博客的我们！',
      },
      {
        name: '博友圈',
        url: 'https://www.boyouquan.com/blogs/mingcy.cn',
        avatar: 'https://www.boyouquan.com/assets/images/sites/logo/logo-small-dark.png',
        desc: '博客人的朋友圈，博客收录与文章 RSS 聚合网站。',
      },
      {
        name: '博客录（boke.lu）',
        url: 'https://boke.lu',
        avatar: 'https://boke.lu/logo.png',
        desc: 'boke.lu · 博客收录展示平台~',
      },
      {
        name: '好站网',
        url: 'https://haozhan.wang/site_detail.php?id=151',
        avatar: 'https://haozhan.wang/favicon.ico',
        desc: '发现好站、展示好站',
      },
      {
        name: 'BLogsClub',
        url: 'https://www.blogsclub.org/blog/437.html',
        avatar: 'https://www.blogsclub.org/usr/uploads/2025/01/805458213.jpg',
        desc: '个人博客俱乐部',
      },
      {
        name: '八零圈',
        url: 'https://www.80tz.cn/certificates/mingcy.cn',
        avatar: 'https://www.80tz.cn/assets/images/sites/logo/logo-small.svg',
        desc: '自由、共享给原创博客写作一个空间！',
      },
      {
        name: '中文独立博客聚合列表',
        url: 'https://blogroll.online/',
        avatar: 'https://blogroll.online/wp-content/uploads/2026/07/android-chrome-512x512-1.png',
        desc: '又一个博客聚合站',
      },
    ],
  },
]
