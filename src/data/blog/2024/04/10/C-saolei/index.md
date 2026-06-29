---
title: "C语言扫雷"
pubDatetime: 2024-04-10T00:00:00.000Z
description: ""
tags: ["C++", "编程语言"]
featured: false
draft: false
---

# **前言**

选自：PandaX Blog：[https://pandax.wiki/15/](https://pandax.wiki/15/)

# **代码设计要求**

- Main 函数中不能出现具体实现的操作，必须通过调用函数实现各种操作。
- 程序中必须通过**结构体**来储存必要信息。
- 要有一定的代码规范。

# **程序实现要求**

- 打开程序后，首先进入主界面，主界面至少需要有 “开始游戏” 与 “退出游戏 “功能，其中，选择开始游戏后则开始扫雷游戏，选择退出游戏后则程序结束。
- 开始扫雷后，每次输入两个数字，视为点击 XY 坐标上的格子，其中，当数字超过接线范围后，应输出 “坐标不对” 等报错信息。
- 首次输入 XY 坐标时，必须保证不会踩到雷。
- 当输入的 XY 坐标是雷的坐标时，应显示游戏失败，并且结束游戏 (但是程序不结束)。
- 当输入的 XY 坐标不是雷的坐标的时候，显示此时周围 8 格存在的雷的数量。
- 当输入的 XY 坐标不是雷且此时该坐标周围雷的数量为 0 时，显示上下左右的格子，若上下左右格子周围的雷数也为 0，则继续显示其上下左右格子，直到当前格子周围雷数不为 0 则停止。
- 当输入的 XY 坐标不是雷且该格子已经被显示，应输出 “坐标已显示 “等报错信息。
- 当所有非雷的格子都被点完后，应显示游戏胜利，并且结束游戏。
- 游戏结束后程序不能直接结束，要有 “再次尝试” 和 “退出游戏” 的功能。
- 所有的输入选项位置要有报错的能力。

# **部分效果图**

![https://pandax.wiki/wp-content/uploads/2023/01/1-1024x757.jpg](https://pandax.wiki/wp-content/uploads/2023/01/1-1024x757.jpg)

![https://pandax.wiki/wp-content/uploads/2023/01/2-1024x524.jpg](https://pandax.wiki/wp-content/uploads/2023/01/2-1024x524.jpg)

![https://pandax.wiki/wp-content/uploads/2023/01/3-1024x492.jpg](https://pandax.wiki/wp-content/uploads/2023/01/3-1024x492.jpg)

# **代码如下**

```csharp
#define _CRT_SECURE_NO_WARNINGS  1
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#define M 9//行数
#define N 9//列数
#define B 10//炸弹数
 
#define MS M + 2
#define NS N + 2
struct list {
    int boom, click;//boom 随机生成的雷 0不是雷1是雷
    char display;
};
struct list pri[MS][NS];
int o = 0;//用于判断是否结束
int win = 0;
//打印菜单
void menu(void) {
    printf("1.开始游戏\n");
    printf("2.退出游戏\n");
    printf("请选择\n");
}
void menu2(void) {
    printf("1.再次尝试\n");
    printf("2.退出游戏\n");
    printf("请选择\n");
}
//随机生成雷
void random() {
    int m, n;
    srand(time(NULL));
    for (int i = 0; i < B; i++) {
        int m = rand() % M + 1;
        int n = rand() % N + 1;
 
        //printf("%d %d\n", m, n);  //打印随机出现的雷，方便调试使用
 
        if (pri[m][n].boom == 1)
            i -= 1;
        else if (pri[m][n].boom == 0) {
            pri[m][n].boom = 1;
        }
    }
}
//棋盘初始化
void renew() {
    for (int i = 0; i < M; i++) {
        for (int j = 0; j < N; j++) {
            pri[i + 1][j + 1].display = '*';
        }
    }
    for (int i = 0; i < M + 2; i++) {
        for (int j = 0; j < N + 2; j++) {
            pri[i][j].boom = 0;
            pri[i][j].click = 0;
        }
    }
    for (int i = 0; i <= M + 2; i++) {
        pri[0][i].click = 1;
        pri[M + 1][i].click = 1;
        pri[i][0].click = 1;
        pri[i][N + 1].click = 1;
    }
}
//打印棋盘
void print() {
    //打印第一行的数字
    printf("   ");
    for (int i = 0; i < M; i++) {
        printf("%d  ", i + 1);
    }
    printf("\n");
    //打印下面的
    for (int i = 0; i < N; i++) {
        printf("%d", i + 1);
        for (int j = 0; j < M; j++) {
            printf("  %c", pri[i + 1][j + 1].display);
        }
        printf("\n");
    }
}
//判断周围雷数
void scan(int m, int n) {
    int num = pri[m - 1][n - 1].boom + pri[m - 1][n].boom + pri[m - 1][n + 1].boom + pri[m][n - 1].boom + pri[m][n + 1].boom + pri[m + 1][n - 1].boom + pri[m + 1][n].boom + pri[m + 1][n + 1].boom;
    if (num != 0) {
        pri[m][n].display = num + '0';
    }
    else if (num == 0) {
        pri[m][n].display = '   ';
        if (m > 0 && m <= M + 1 && n > 0 && n <= N + 1) {
            if (pri[m - 1][n - 1].click == 0) {
                pri[m - 1][n - 1].click = 1;
                scan(m - 1, n - 1);
            }
            if (pri[m - 1][n].click == 0) {
                pri[m - 1][n].click = 1;
                scan(m - 1, n);
            }
            if (pri[m - 1][n + 1].click == 0) {
                pri[m - 1][n + 1].click = 1;
                scan(m - 1, n + 1);
            }
            if (pri[m][n - 1].click == 0) {
                pri[m][n - 1].click = 1;
                scan(m, n - 1);
            }
            if (pri[m][n + 1].click == 0) {
                pri[m][n + 1].click = 1;
                scan(m, n + 1);
            }
            if (pri[m + 1][n - 1].click == 0) {
                pri[m + 1][n - 1].click = 1;
                scan(m + 1, n - 1);
            }
            if (pri[m + 1][n].click == 0) {
                pri[m + 1][n].click = 1;
                scan(m + 1, n);
            }
            if (pri[m + 1][n + 1].click == 0) {
                pri[m + 1][n + 1].click = 1;
                scan(m + 1, n + 1);
            }
        }
    }
}
//判断胜负
void win_or_not() {
    win = 0;
    for (int i = 0; i < M; i++) {
        for (int j = 0; j < N; j++) {
            if (pri[i + 1][j + 1].click == 1)
                win += 1;
        }
    }
    if (win == (M * N - B)) {
        printf("恭喜您扫雷成功\n");
        o = 1;
    }
}
//用户输入
void input(int* c) {
    int x, y;
    int p = scanf("%d %d", &x, &y);
 
    while (p == 0 || p == 1)
    {
        rewind(stdin);
        printf("输入错误，请重新输入\n");
        p = scanf("%d %d", &x, &y);
    }
    rewind(stdin);
    //判断第一次踩雷
    if (*c == 1) {
        *c += 1;
        if (x <= M && y <= N) {
            if (pri[x][y].boom == 0) {
                pri[x][y].click = 1;
                scan(x, y);
            }
 
 
            else if (pri[x][y].boom == 1) {
                renew();
                random();
                scan(x, y);
            }
        }
        else {
            printf("输入有误，请重新输入\n");
        }
    }
    //剩下的次数
    else
    {
        if (x <= M && y <= N)
        {
            if (pri[x][y].click == 1) {
                printf("此位置已经被排除\n");
            }
            else if (pri[x][y].boom == 0) {
                pri[x][y].click = 1;
                scan(x, y);
            }
            else if (pri[x][y].boom == 1) {
                printf("你踩到雷了\n");
                o = 1;
            }
        }
        else {
            printf("输入有误，请重新输入\n");
        }
    }
}
void game() {
    int c = 1;//判断是否是第一次
    renew();
    print();
    random();
    do {
        input(&c);
        print();
        win_or_not();
    } while (o == 0);
}
int main() {
    int option = 0;
    int i;
    for (i = 1;; i++) {
        o = 0;
        if (i == 1)
            menu();
        else
            menu2();
        while (scanf("%d", &option) == 0)
        {
            rewind(stdin);
            printf("输入错误，请重新输入\n\n");
            if (i == 1)
                menu();
            else
                menu2();
        }
        rewind(stdin);
        if (option == 1)
            game();
        else if (option == 2) {
            printf("退出游戏\n");
            break;
        }
        else {
            printf("输入有误，请重新输入\n\n");
            i -= 1;
        }
    }
    return 0;
}
```