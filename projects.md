---
title: 项目
layout: page
icon: fa-book
stat-finished: <strong>状态：</strong><span style="color:#159818;">■ </span> 已完成
stat-ing: <strong>状态：</strong><span style="color:#84b6eb;">■ </span> 进行中
stat-failed: <strong>状态：</strong><span style="color:#fc2929;">■ </span> 已弃坑
stat-update: <strong>状态：</strong><span style="color:#fbca04;">■ </span> 保持更新
---

自家制作的各种项目。
## OS67
<hr>
{% include github-card repo="LastAvenger/OS67" %}
{{ page.stat-finished }}

OS67 是一个基于 x86 的 unix-like 玩具内核，借鉴了大量 xv6 的代码。

实现了：

* 基础设备（PS/2 键盘，VGA，IDE 磁盘）的驱动
* 简单的内存管理和虚拟内存映射
* 基于轮转法实现的~~充满 bug 的~~多进程
* 部分的 Minix v1 文件系统
* 20 个常用的系统调用
* unix-like 的操作系统接口：文件描述符，IO 重定向
* 简单的用户程序

## silk-jekyll-theme
<hr>
{% include github-card repo="LastAvenger/silk-jekyll-theme "%}
{{ page.stat-update }}

这是本站使用的模版，改良自来自网易 LOFTER 的用户主题「丝」。

