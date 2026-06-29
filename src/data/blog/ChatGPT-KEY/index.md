---
title: "ChatGPT-KEY的获取[无需手机号绑定]"
pubDatetime: 2024-01-20T16:00:00.000Z
description: "ChatGPT-KEY的获取[无需手机号绑定]/保姆级搭建镜像网站教程"
tags: ["ChatGPT", "Openai", "建站"]
featured: false
draft: false
ogImage: "https://view.lixingyong.com/images/2024/08/21/1.webp"
---

<aside>
😆 **前言**：最近ChatGPT官方解除了注册时的手机号绑定要求，使我们注册账号和使用变得更加容易，但Api-Key的获取还是需要手机号绑定，接下来的教程会教你如何绕过手机号的绑定获取到可以的KEY，并使用获取到的KEY来搭建自己的镜像网站【实现使用时免科学】，无限制使用ChatGPT。【教程内的网站还是需要在使用科学的前提下操作的，但部署后就不需要了。】

</aside>

**该教程所需的网站地址：**

- **1、ChatGPT官网：[Introducing ChatGPT (openai.com)](https://openai.com/blog/chatgpt)**
- **2、临时邮箱网站：[主页 – Temp Mail – Free Edu / .COM Temporary Mails (etempmail.com)](https://etempmail.com/zh)**
- **3、ChatGPTNextWeb项目：[ChatGPTNextWeb/ChatGPT-Next-Web: A well-designed cross-platform ChatGPT UI (Web / PWA / Linux / Win / MacOS). 一键拥有你自己的跨平台 ChatGPT 应用。 (github.com)](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)**
- **4、Vercel注册地址：[Sign Up – Vercel](https://vercel.com/signup)**
- **5、Watt Toolkit【原STEAM++】：[瓦特工具箱(Steam++官网) – Watt Toolkit (steampp.net)](https://steampp.net/)**

**使用临时邮箱注册ChatGPT账号并获取KEY：**

**1、进入ChatGPT注册页面**

选择Log in

![1](https://wkphoto.cdn.bcebos.com/c2cec3fdfc0392453cb007649794a4c27d1e2550.jpg "chatgpt")

选择SIGN UP【注册模式】

![2](https://wkphoto.cdn.bcebos.com/10dfa9ec8a1363272b262558818fa0ec09fac796.jpg "chatgpt")

进入注册模式页面


![3](https://wkphoto.cdn.bcebos.com/eac4b74543a98226d3a9cd4c9a82b9014a90eb75.jpg "chatgpt")

**2、使用临时邮箱注册我们的ChatGPT账号**

复制临时邮箱进行注册


![4](https://wkphoto.cdn.bcebos.com/91529822720e0cf38a9ca8901a46f21fbe09aa76.jpg "chatgpt")

填写邮箱和密码注册

![5](https://wkphoto.cdn.bcebos.com/37d12f2eb9389b50eedb06399535e5dde7116eb1.jpg "chatgpt")

注册后需要在邮箱进行确认验证



![6](https://wkphoto.cdn.bcebos.com/6609c93d70cf3bc7426b2b87c100baa1cd112a76.jpg "chatgpt")

收到官方验证邮件


![7](https://wkphoto.cdn.bcebos.com/42a98226cffc1e1794d56a5a5a90f603738de977.jpg "chatgpt")

进入信息填写页面


![8](https://wkphoto.cdn.bcebos.com/b7fd5266d016092450264470c40735fae6cd345e.jpg "chatgpt")

随意填写即可

![9](https://wkphoto.cdn.bcebos.com/10dfa9ec8a1363272aa02458818fa0ec08fac708.jpg "chatgpt")


根据不同需求选择模式


![10](https://wkphoto.cdn.bcebos.com/32fa828ba61ea8d33248926f870a304e251f5877.jpg "chatgpt")

**3、获取ChatGPT的Api-Key【为搭建镜像网站做准备】**



API模式进入API-keys页面


![11](https://wkphoto.cdn.bcebos.com/a50f4bfbfbedab641217ababe736afc379311e77.jpg "chatgpt")

打开网页控制台


![12](https://wkphoto.cdn.bcebos.com/d6ca7bcb0a46f21fdf51b838e6246b600c33ae70.jpg "chatgpt")
进行网络数据抓包


![13](https://wkphoto.cdn.bcebos.com/b219ebc4b74543a9993b1ca70e178a82b90114bc.jpg "chatgpt")

抓包获取到了账号的KEY【留着备用】

![14](https://wkphoto.cdn.bcebos.com/b58f8c5494eef01f8873feaef0fe9925bc317d72.jpg "chatgpt")
**4、Fork-Github的ChatGPTNextWeb项目**

登录GitHub，Fork项目


![15](https://wkphoto.cdn.bcebos.com/fd039245d688d43f6bce77996d1ed21b0ef43b72.jpg "chatgpt")
Create fork


![16](https://wkphoto.cdn.bcebos.com/cdbf6c81800a19d8757c626e23fa828ba61e465a.jpg "chatgpt")
添加成功


![17](https://wkphoto.cdn.bcebos.com/7acb0a46f21fbe090938257f7b600c338744ad73.jpg "chatgpt")
**5、进入Vercel部署我们的镜像网站**



选择个人项目，后输入昵称



![18](https://wkphoto.cdn.bcebos.com/faedab64034f78f0e4417c9869310a55b3191c16.jpg "chatgpt")
使用我们之前Fork项目的Github账号注册登录

![19](https://wkphoto.cdn.bcebos.com/6d81800a19d8bc3e7ba2e0a1928ba61ea8d34537.jpg "chatgpt")


Import开始部署

![20](https://wkphoto.cdn.bcebos.com/a8ec8a13632762d0be7a42d4b0ec08fa513dc611.jpg "chatgpt")

点击Deploy

![21](https://wkphoto.cdn.bcebos.com/6159252dd42a28344403d0604bb5c9ea15cebf30.jpg "chatgpt")

进入仪表盘【dashboard】

![22](https://wkphoto.cdn.bcebos.com/8c1001e93901213f2296a8b744e736d12f2e9530.jpg "chatgpt")
访问项目自动分配的域名

![23](https://wkphoto.cdn.bcebos.com/4afbfbedab64034f6a91246dbfc379310a551d78.jpg "chatgpt")
**6、Api-Key的导入设置**


进入设置

![24](https://wkphoto.cdn.bcebos.com/58ee3d6d55fbb2fb1074be795f4a20a44623dc7a.jpg "chatgpt")


勾选自定义接口并导入KEY

![25](https://wkphoto.cdn.bcebos.com/c83d70cf3bc79f3d26a7025baaa1cd11728b2913.jpg "chatgpt")


KEY值为之前抓包到的数据

![26](https://wkphoto.cdn.bcebos.com/7dd98d1001e93901b8806b556bec54e737d196df.jpg "chatgpt")
导入KEY后即可开始使用

![27](https://wkphoto.cdn.bcebos.com/bd3eb13533fa828b6ba17b88ed1f4134960a5adf.jpg "chatgpt")
**7、项目域名无法访问问题【挂科学最好】，最廉价的方法也可以使用STEAM++进行加速。**

勉强能用



![28](https://wkphoto.cdn.bcebos.com/a1ec08fa513d26971692ee3645fbb2fb4316d81c.jpg "chatgpt")
> 选自：[https://paperkiteblog.xyz/?p=545](https://paperkiteblog.xyz/?p=545)
>