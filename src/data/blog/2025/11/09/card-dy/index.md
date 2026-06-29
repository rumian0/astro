---
title: "抖音热门温柔提醒"
pubDatetime: 2025-11-09T00:00:00.000Z
description: "最近总是在抖音刷到这个,好多人说让我做一个,那就整!"
tags: []
featured: false
draft: false
---

# 茗叙

咳咳,失踪人口也是回归了.最近吗还行吧,上个月考试了,还不错.英语明显进度了,但是之前的优势科目拉下了,也是拆东墙补西墙.转眼间又要考试了(下周)

也是好久没更新了,之前看到一个文章hexo  添加  ai总结的,但是不晓得我收藏到哪里了,哎呀,拖延症又犯了.

今天这个文章主要为抖音上蛮火的 '卡片提醒'  这个吗?你要说我自己写的吗?对对,是我自己用输入提示词告诉AI生成的,哈哈哈~    (娱乐就好!)

# 茗述

浅浅的水一篇文章吧! 

展示效果如下!     网址如下:

> https://mingcy.cn/music/card.html
>
> https://mingcy.cn/music/cards.html

![image-20251109143453002](image-20251109143453002.png)

这个音乐吗!  后面再说吧,有兴趣的可以自己添加哦!,不说了我要去做头部组织切割手术了!

## 源码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>茗辰原 的 温柔提醒生成器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
        }

        body {
            background-color: #f0f2f5;
            padding: 20px;
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 500px;
            width: 100%;
        }

        .step {
            background-color: #fff;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .step h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #666;
        }

        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }

        button {
            padding: 10px 20px;
            background-color: #409eff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }

        button:hover {
            background-color: #66b1ff;
        }

        .color-options, .size-options, .music-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }

        .color-option, .size-option, .music-option {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
        }

        .color-option.selected, .size-option.selected, .music-option.selected {
            border-color: #409eff;
            background-color: rgba(64, 158, 255, 0.1);
        }

        .message-bubbles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #fff;
            border-radius: 0;
            padding: 20px;
            overflow: hidden;
            z-index: 999;
        }

        .bubble {
            position: absolute;
            border-radius: 15px;
            padding: 8px 12px;
            max-width: 140px;
            word-break: break-all;
            animation: bubbleCycle 7s ease-in-out infinite;
            opacity: 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05); /* 轻微阴影增加层次 */
        }

        /* 新增悬浮移动：上下左右轻微晃动 */
        @keyframes bubbleCycle {
            0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
            15% { opacity: 1; transform: scale(1) translate(0, 0); }
            35% { transform: translate(5px, -3px); }
            55% { transform: translate(-4px, 5px); }
            75% { transform: translate(3px, -2px); }
            85% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
        }

        .btn-group {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        .hidden {
            display: none;
        }

        .mt-10 {
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="step1" class="step">
            <h2>温柔提醒</h2>
            <div class="form-group">
                <label>你想给哪个朋友？</label>
                <input type="text" id="friendName" placeholder="输入朋友昵称">
            </div>
            <button onclick="goToStep2()">下一步</button>
        </div>

        <div id="step2" class="step hidden">
            <h2>选择方框颜色</h2>
            <div class="color-options" id="colorOptions">
                <div class="color-option selected" data-color="random">随机彩色</div>
                <div class="color-option" data-color="pink">温柔粉</div>
                <div class="color-option" data-color="blue">天空蓝</div>
                <div class="color-option" data-color="yellow">阳光黄</div>
                <div class="color-option" data-color="green">清新绿</div>
                <div class="color-option" data-color="purple">梦幻紫</div>
            </div>
            <div class="btn-group">
                <button onclick="goToStep1()">上一步</button>
                <button onclick="goToStep3()">下一步</button>
            </div>
        </div>

        <div id="step3" class="step hidden">
            <h2>选择方框大小</h2>
            <div class="size-options" id="sizeOptions">
                <div class="size-option" data-size="small">小巧</div>
                <div class="size-option selected" data-size="medium">适中</div>
                <div class="size-option" data-size="large">大气</div>
            </div>
            <div class="btn-group">
                <button onclick="goToStep2()">上一步</button>
                <button onclick="goToStep4()">下一步</button>
            </div>
        </div>

        <div id="step4" class="step hidden">
            <h2>选择背景音乐</h2>
            <div class="music-options" id="musicOptions">
                <div class="music-option selected" data-music="random">随机选择</div>
                <div class="music-option" data-music="song1">好想爱这个世界啊 - 华晨宇</div>
                <div class="music-option" data-music="song2">I Miss You So - Laufey</div>
                <div class="music-option" data-music="https://s1.aigei.com/src/aud/mp3/fe/fe5fc3bfae5d434da89dfb9b3e89e357.mp3?e=1762674780&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:cT9MNNHcuF6ZNA6AOhJzZg-x4sw=">路过人间 - 郁可唯</div>
                <div class="music-option" data-music="song4">恋人 - 李荣浩</div>
                <div class="music-option" data-music="song5">说好不哭 - 周杰伦</div>
            </div>
            <div class="btn-group">
                <button onclick="goToStep3()">上一步</button>
                <button onclick="goToStep5()">下一步</button>
            </div>
        </div>

        <div id="step5" class="step hidden">
            <h2>选择内容</h2>
            <button onclick="useDefaultContent()">使用自带内容</button>
            <button onclick="useCustomContent()">自己写内容</button>
            <button onclick="goToStep4()" class="mt-10">上一步</button>
        </div>

        <div id="step6" class="step hidden">
            <h2>写下你想说的话</h2>
            <textarea id="customContent" rows="5" placeholder="每行一句，至少写15句"></textarea>
            <div class="btn-group">
                <button onclick="goToStep5()">上一步</button>
                <button onclick="generateBubbles()">下一步</button>
            </div>
        </div>

        <div id="result" class="message-bubbles hidden">
            <button onclick="goToStep1()" style="position: absolute; top: 10px; right: 10px; z-index: 100;">重新开始</button>
        </div>
    </div>

    <script>
        let currentStep = 1;
        let friendName = '';
        let color = 'random';
        let size = 'medium';
        let music = 'random';
        let content = [];
        let bubbleInterval;

        // 扩充全色系颜色库（新增柔和深色，增加层次）
        const allColors = [
            '#ff9aa2', '#ffb7b2', '#ffddd2', '#e2f0cb', '#b5ead7',
            '#c7ceea', '#b5d8eb', '#ffeaa7', '#dda0dd', '#98d8c8',
            '#f7dc6f', '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa',
            '#ffc3a0', '#dab894', '#f0e68c', '#e6e6fa', '#ffb6c1',
            '#add8e6', '#f0fff0', '#fff8dc', '#faf0e6', '#f5f5dc',
            '#ffecd2', '#fcb69f', '#cbd5e1', '#94a3b8', '#7dd3fc',
            '#a5d6a7', '#ce93d8', '#ffab91', '#80deea', '#b39ddb'
        ];

        // 步骤切换函数
        function goToStep1() {
            if (bubbleInterval) clearInterval(bubbleInterval);
            hideAllSteps();
            document.getElementById('step1').classList.remove('hidden');
            currentStep = 1;
        }

        function goToStep2() {
            friendName = document.getElementById('friendName').value;
            if (!friendName) {
                alert('请输入朋友昵称');
                return;
            }
            hideAllSteps();
            document.getElementById('step2').classList.remove('hidden');
            currentStep = 2;
        }

        function goToStep3() {
            hideAllSteps();
            document.getElementById('step3').classList.remove('hidden');
            currentStep = 3;
        }

        function goToStep4() {
            hideAllSteps();
            document.getElementById('step4').classList.remove('hidden');
            currentStep = 4;
        }

        function goToStep5() {
            hideAllSteps();
            document.getElementById('step5').classList.remove('hidden');
            currentStep = 5;
        }

        function goToStep6() {
            hideAllSteps();
            document.getElementById('step6').classList.remove('hidden');
            currentStep = 6;
        }

        function hideAllSteps() {
            document.querySelectorAll('.step, #result').forEach(el => el.classList.add('hidden'));
        }

        // 选择项通用处理
        document.querySelectorAll('.color-option, .size-option, .music-option').forEach(option => {
            option.addEventListener('click', function() {
                const parent = this.parentElement;
                parent.querySelectorAll('div').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                const type = parent.id.replace('Options', '');
                window[type] = this.getAttribute(`data-${type}`);
            });
        });

        // 使用自带内容
        function useDefaultContent() {
            const defaultMessages = [
                "记得好好吃饭", "早点休息", "多喝热水", "别熬夜了", "注意身体",
                "天冷了多穿点衣服", "累了就休息一下吧", "不开心可以找我聊", "你已经很棒了", "慢慢来没关系",
                "有我陪着你", "我一直都在你身边", "出门记得带伞", "你不是一个人", "我想你了",
                "要保重身体", "别想太多", "开心最重要", "心情不好就说出来吧", "别太勉强自己",
                "做自己就好", "谢谢你的存在", "有你真好", "今天也辛苦了，给自己一点时间", "你很重要",
                "听听喜欢的音乐吧", "出去走走吧", "吃点好吃的犒劳自己", "睡睡大心情会好一点", "我相信你可以",
                "别忘了笑一笑", "做点让自己开心的事", "给自己放个假吧", "可以依靠别人的", "求助不是软弱",
                "不需要完美", "接纳真实的自己", "你的节奏很好", "别和别人比", "你有自己的时区",
                "每一步都算数", "休息不是浪费时间", "把自己放在第一位", "要照顾好自己", "学会说不",
                "守护自己的边界", "你的需求很重要", "困难会过去的", "允许自己犯错", "别委屈自己",
                "对自己好一点", "重新开始也可以", "给自己多点耐心", "失败了也没关系", "一切都会好起来的",
                "已经做得很好了", "你比想象中强"
            ];
            content = defaultMessages.map(msg => `${friendName}，${msg}`);
            generateBubbles();
        }

        // 使用自定义内容
        function useCustomContent() {
            goToStep6();
        }

        // 生成消息气泡（优化调整）
        function generateBubbles() {
            if (currentStep === 6) {
                const customText = document.getElementById('customContent').value;
                content = customText.split('\n').filter(line => line.trim()).map(line => `${friendName}，${line.trim()}`);
                if (content.length < 15) {
                    alert('请至少输入15句内容');
                    return;
                }
            }

            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '';
            
            // 重新开始按钮
            const button = document.createElement('button');
            button.onclick = goToStep1;
            button.style.position = 'absolute';
            button.style.top = '10px';
            button.style.right = '10px';
            button.style.zIndex = '100';
            button.textContent = '重新开始';
            resultDiv.appendChild(button);

            // 气泡大小映射（微调尺寸，更协调）
            const sizeMap = { small: '12px', medium: '14px', large: '16px' };
            const fontSize = sizeMap[size];

            function createRandomBubble() {
                const randomContentIndex = Math.floor(Math.random() * content.length);
                const msg = content[randomContentIndex];
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.textContent = msg;
                
                // 随机颜色
                const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
                bubble.style.backgroundColor = randomColor;
                bubble.style.fontSize = fontSize;
                
                // 优化随机位置（扩大范围，减少空白）
                bubble.style.left = `${Math.random() * 92 + 1}%`; // 1%-93%
                bubble.style.top = `${Math.random() * 92 + 1}%`;
                
                // 优化层级（1-200），层级差异更大
                bubble.style.zIndex = Math.floor(Math.random() * 200);
                
                // 随机动画延迟（0-6秒），出现更错落
                bubble.style.animationDelay = `${Math.random() * 6}s`;
                
                resultDiv.appendChild(bubble);
                
                // 7秒后移除气泡（与动画周期一致）
                setTimeout(() => {
                    bubble.remove();
                }, 7000);
            }

            // 清除旧定时器
            if (bubbleInterval) clearInterval(bubbleInterval);
            
            // 调整生成节奏：初始65个，每0.12秒生成1个（更密集但不拥挤）
            for (let i = 0; i < 65; i++) createRandomBubble();
            bubbleInterval = setInterval(createRandomBubble, 120);

            hideAllSteps();
            resultDiv.classList.remove('hidden');
        }
    </script>
</body>
</html>

```