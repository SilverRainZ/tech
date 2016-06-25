---
layout: post
title: 编写便于打包的 Makefile
tags: Linux C Makefile ArchLinux
---

网络上关于 Makefile 的教程不少，但似乎都止于「如何用 Makefile 自动编译程序」，
而关于如何用 Makefile 安装程序的文章却寥寥无几。（也可能是我关键词不对，反正我搜了好久都没搜到）
最近在做 [Srain](https://github.com/LastAvenger/srain) 的时候，算是琢磨出了对于 `make install` 的比较正确的写法，

首先，对于生成的项目是单可执行文件的情况下，直接 `install -755 xxx /usr/bin/xxx` 就好了。
但是并非所有项目都只要单个可执行文件，程序可能还包含了 man 文档，icons，图片，配置文件等，这里只考虑项目需要已。

假设项目结构如下，代码文件里写了什么不重要~

```
.
├── build
├── data
│   └── pixmaps
│       └── srain-avatar.png
├── Makefile
└── srain.c
```

## 题外话：关于图标

对于图标，[1] 规定了图标在文件系统上的位置，程序只需要根据图标的名称就可已获得图标（当然要借助各种库函数，比如 gtk 的 `gtk_image_new_from_icon_name`），
根据 spec 看，程序应该依次检查 `$HOME/.icons`、`$XDG_DATA_DIRS/icons` 和 `/usr/share/pixmaps`。

当 `$XDG_DATA_DIRS` 为空时，`$XDG_DATA_DIRS` 会默认为 `/usr/local/share/:/usr/share/` [2]（感谢 csslayer 指出）。

因此把图标安装在 `/usr/share/pixmaps`、`/usr/local/share/icons` 和 `/usr/share/icons` 下都是可行的，Arch Linux 偏向于安装在最后一个目录。
于是可以像这样安装 16x16 的图标：

```Makefile
cd data/icons/16x16; \
for png in *.png; do \
			install -Dm644 "$$png" \
				"$(DESTDIR)/usr/share/icons/hicolor/16x16/apps/$$png"; \
		done
```

## PREFIX
除了图标之外，其他的数据文件应该如何组织？
对此 GNU 给出了他的规范 [3]：

GNU make 提供了 prefix 等变量确定各种文件安装的位置：

* `prefix` 是下述变量的前缀，默认的 prefix 值应该是 `/usr/loacl`
    * `exec_prefix` 是下述变量的前缀，通常和 `prefix` 相等
        * `bindir` 安装可执行文件的位置，其值应为 `$(exec_prefix)/bin`
        * ...
    * `datarootdir` 用来安装只读的，架构无关的数据文件，其值应为 `$(prefix)/share`
    * `sysconfdir` 用来安装只读的配置文件，其值应为 `$(predix)/etc`
    * ...

[3] 中列出了各种用途的目录，但事实上我们不需要把数据文件分成那么细的粒度。对于简单的项目，只有 prefix
是必要的，其他路径都可以 hardcode。

`make install` 可以这么写（为了命名统一，prefix 用大写）：

```Makefile
PREFIX = /usr/local

install:
	install -Dm755 "build/srain" "$(PREFIX)/bin/srain"
	cd data/pixmaps; \
		for png in *.png; do \
			install -Dm644 "$$png" \
				"$(PREFIX)/share/srain/pixmaps/$$png"; \
		done
```

放置各种文件的规范有了，但程序应该如何找到他的数据文件呢？
用 gcc 的 `-D` 参数声明一个宏，在编译的时候告诉程序的 prefix：

```Makefile
CC = gcc
CFLAGS = -O2 -Wall 
DEFS = -DPACKAGE_DATA_DIR=\"$(PREFIX)\"

TARGET = build/srain

$(TARGET): srain.c
	$(CC) $(CFLAGS) $(DEFS) $^ -o $@
```

在程序中你就可以根据这个宏在获得你的数据文件：

```c
#ifndef PACKAGE_DATA_DIR
#define PACKAGE_DATA_DIR "/usr/local"
#endif

gchar *get_pixmap_path(const gchar *filename){
    gchar *path;

    path = g_build_filename(PACKAGE_DATA_DIR, "share",
            "srain", "pixmaps", filename, NULL);

    if (g_file_test(path, G_FILE_TEST_EXISTS)){
        return path;
    }

    g_free(path);
    return NULL;
}
```

注意上面的代码使用了 glib 函数库，当指定 prefix 为 `/usr`，程序便会从 `/usr/share/srain/pixmaps` 里寻找图片。

> 自行编译安装的程序通常被安装在 `/usr/local`, 这也是 GNU 推荐的 prefix  
> Arch Linux 的包的 prefix 通常是 `/usr`。

如上一番设定后，程序经过编译和安装后便可以运行指定的任意目录上了，你也可以指定为 `$(PWD)/build` 方便调试。

`make PREFIX=/usr; make PREXI=/usr install` 后，产生的文件如下：

```
/usr/bin/srain
/usr/share/srain/pixmaps/srain-avatar.png
```

## DESTDIR
上面的 `make install` 直接将各种文件安装在了目的文件系统上，如果 Makefile 写错的话，可能对系统造成破坏，
直接安装也不利于打包，正确的做法是，由 `make install` 得到程序所有文件的列表和路径，
再由包管理器把这些文件和路径存为软件包， 安装的时候根据路径把文件放到应该放的位置（这大概就是 Staged Install？）。
（这里感谢青蛙老师 hexchain 的指导）

变量 `DESTDIR` 就是用来实现 Staged Install 的，把之前的 `make install` 改成这样：

```Makefile
PREFIX = /usr/local
install:
	install -Dm755 "build/srain" "$(DESTDIR)$(PREFIX)/bin/srain"
	cd data/pixmaps; \
		for png in *.png; do \
			install -Dm644 "$$png" \
				"$(DESTDIR)$(PREFIX)/share/srain/pixmaps/$$png"; \
		done
```

注意 DESTDIR 变量只应该作用在 install 阶段，`make PREFIX=/usr; make PREFIX=/usr DESTDIR=/tmp/` 会把所有文件都安装在 `/tmp` 下，
所有的影响都被限制在该目录内。这次生成的文件应该是：

```
/tmp/usr/bin/srain
/tmp/usr/share/srain/pixmaps/srain-avatar.png
```

之后再由包管理器把这些文件打成包，安装到系统中。

## Configure
上面的 Makefile 有处不优雅的地方是，`make` 和 `make install` 的时候必须指定相同的 PREFIX，不然安装后的程序肯定是运行不了的，而 make 本身并不能
解决这个问题，因为 make 是「无状态」的。

[5] 提供了一个脚本来让解决这个问题，将 Makefile 改名为 Makefile.in，运行 `./configure --prefix=xxx` 来获得一个拥有指定 prefix 的
Makefile，这样就可以不用每次敲 make 都输入 `PREFIX=xxx` 了。

~~于是大家都去用 autotool 了~~

```sh
#!/bin/sh

prefix=/usr/local

for arg in "$@"; do
    case "$arg" in
    --prefix=*)
        prefix=`echo $arg | sed 's/--prefix=//'`
        ;;

    --help)
        echo 'usage: ./configure [options]'
        echo 'options:'
        echo '  --prefix=<path>: installation prefix'
        echo 'all invalid options are silently ignored'
        exit 0
        ;;
    esac
done

echo 'generating makefile ...'
echo "PREFIX = $prefix" >Makefile
cat Makefile.in >>Makefile
echo 'configuration complete, type make to build.'
```

## PKGBUILD
这样的一个项目打包起来是很愉快的 :)

```sh
pkgname=srain

...
build() {
    cd ${pkgname}
    mkdir build || true
    ./configure --prefix=/usr
    make
}

package() {
    cd ${pkgname}
    make DESTDIR=$pkgdir install
}
```

## 参考
1. [Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html)
2. [XDG Base Directory Specification#Environment variables](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html#Environment%20variables)
3. [GNU Coding Standards#Variables for Installation Directories](https://www.gnu.org/prep/standards/html_node/Directory-Variables.html)
4. [GNU Coding Standards#DESTDIR: Support for Staged Installs](https://www.gnu.org/prep/standards/standards.html#DESTDIR)
5. [Practical Makefiles, by example](http://nuclear.mutantstargoat.com/articles/make)
