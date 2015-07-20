---
layout: post
title: Arch Linux 折腾小记
path: /assets/2015-7-20-configure-of-archlinux
tags: Linux
---
这几天一直在折腾 Arch Linux 上的桌面, 弄到今天终于差不多了.
先上张图:
<img src="{{ page.path }}/1.png" width=100%>

##以 XMonad 为 WM 的桌面
没有用 DE, WM 用的是 XMonad.

关于 XMonad 的默认快捷键, [XMonad Guide Tour](http://xmonad.org/tour.html) 这篇官方的这篇文档很容易看懂.

需要安装的包如下:

```bash
➜  pacman -S    \
xmonad          \   
xmonad-contrib  \
xmobar          \
dmenu           \
trayer          \
feh             \
scrot           
```

xmobar, 配置文件在`.xmobarrc`, 是个基于文字的状态栏, 可以显示从 stdin 接收到的内容, 也可以自己获取系统信息, 我这里的中文显示还有问题, 部分中文乱码, 应该是字体的锅.

dmenu 是个启动器, 功能比较简单, 所以不需要什么特殊的配置, 在 XMonad 里按`mod + q`触发.

trayer 是个系统托盘, 用来容纳各种图标, 启动选项如下:

```bash
trayer --edge top --align right --widthtype percent --width 11 \
       --SetDockType true --SetPartialStrut true --transparent true --alpha 0 \
       --tint 0x000000 --expand true --heighttype pixel --height 17
```

本来已经设置了 xmobar 占据屏幕的 90%, 而 trayer 占 10%, 不过这样仍然会在屏幕上留下间隙, 所以这里设置成占据屏幕的 11%.

feh 用来设置桌面背景, 设置背景很有必要, 如果不设置的话, 关闭窗口的时候不会有明显的反馈, 浮动窗口也会留下难看的拖影.

```bash
feh --bg-scale /home/la/Pictures/Wallpapers/blog-bg.jpg
```

scrot 截图的快捷键在 XMonad 的配置文件`~/.xmonad/xmonad.hs`里面绑定:

```haskell
defaultConfig 
`additionalKeys` 
[ ( (controlMask, xK_Print)
  , spawn "sleep 0.2; scrot -s -e \'mv $f ~/Pictures/Screenshots/\'"
  )
, ((0, xK_Print), spawn "scrot -e \'mv $f ~/Pictures/Screenshots/\'")
]
```

`-s`参数可以让你自己选择截图的区域, 不过这个工具竟然没法指定图片的存放位置, 只能在截图后用`-e 'mv $f ~/Pictures/Screenshots'`把截图放到指定目录.

上面这些配置大多写在启动脚本`startup.sh`里, 每个命令后边都得加上一个`&`.

##无线网络管理

为了更方便地连接无线网络, 安装如下包:

```bash
➜  pacman -S            \
networkmanager          \
network-manager-applet  \
gnome-keyring   
```

注意如果你之前连接无线网络用的是`netctl`的话, 记得把有关的服务给 disable 了, 因为 networkmanager 和他有冲突, 安装完后执行 NetworkManager 启动服务.

network-manager-applet 是 networkmanager 的前端.

似乎不安装 `gnome-keyring`的话就无法连上加密的无线网络.

##IM
###QQ
TM2013 可能是运行在 Wine 上表现最好的一个版本了, 我下载了 [邓攀打包的TM2013](http://www.zhihu.com/question/23770274/answer/45703773), 似乎没有预期中的 out of box, 字体不行, 密码输入也不行. 不过根据错误提示和 Arch Linux Wiki, 装了几个包就解决问题了.

```bash
➜  pacman -S lib32-ncurses lib32-mpg123
➜  winetrick riched20 ie6 mfc42 cjkfonts wenquanyi
```

###其他
* IRC 客户端用火狐的 ChatZilla
* Telegram 客户端用 Cutegram, 得装 `fcitx-qt5` 才能正常输入, 另 TG 似乎已经被墙(手机上却仍然可以登录), Cutegram 无法登录, 挂个代理就行.

##GTK
默认的 gtk 界面在 XMonad 下相当地丑, 可以安装`lxappearance`来调整 GTK 的主题.

对于 Qt 程序, dolphin 有很好看的外观, 但是同为 kde-applications 的 konsole 的界面却依然很丑... 

##输入法:
在`~/.xprofile`中加入:

```bash
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS="@im=fcitx"
```

并在启动脚本里启动 fcitx.

##配置文件
上面有提到的全部配置文件如下:

###XMonad 配置文件 ~/.xmonad/xmonad.hs

```haskell
import XMonad
import XMonad.Hooks.DynamicLog
import XMonad.Hooks.ManageDocks
import XMonad.Util.Run(spawnPipe)
import XMonad.Util.EZConfig(additionalKeys)
import XMonad.Util.Cursor
import System.IO

myTerminal = "konsole"

myModMask = mod4Mask

myFocuseFollowsMouse = True
-- Border
myBorderWidth = 2
myNormalBorderColor = "#cccccc"
myFocusedBorderColor = "#00ffff"

myStartupHook = do
    setDefaultCursor xC_left_ptr
    -- Startup script
    spawn "~/.xmonad/startup.sh"

myWorkspaces = ["web", "code", "term", "im", "ext", "", "", "", "min"]
myManageHook = manageDocks <+> manageHook defaultConfig

myLoyoutHook = avoidStruts  $  layoutHook defaultConfig

myLogHook xmproc = dynamicLogWithPP xmobarPP
            { ppOutput = hPutStrLn xmproc
            , ppTitle = xmobarColor "green" "" . shorten 50
            }

main = do
    xmproc <- spawnPipe "/usr/bin/xmobar /home/la/.xmobarrc"
    xmonad $ defaultConfig 
        { modMask = myModMask
        , terminal = myTerminal
        , borderWidth = myBorderWidth
        , normalBorderColor = myNormalBorderColor
        , focusedBorderColor = myFocusedBorderColor
        , workspaces = myWorkspaces
        , startupHook = myStartupHook
        , manageHook = myManageHook
        , layoutHook = myLoyoutHook
        , logHook = myLogHook xmproc
        } 
        -- Key bind
        `additionalKeys`
        [ ((controlMask, xK_Print), spawn "sleep 0.2; scrot -s -e \'mv $f ~/Pictures/Screenshots/\'")
        , ((0, xK_Print), spawn "scrot -e \'mv $f ~/Pictures/Screenshots/\'")
        ]
```

###启动脚本 ~/.xmonad/startup.sh

```bash
#!/usr/bin/sh

# Set wallpaper wit feh
feh --bg-scale /home/la/Pictures/Wallpapers/blog-bg.jpg &

xflux -l 23 -g 113 -k 4300 &
 
# Load resources
xrdb -merge .Xresources &
 
# Set up an icon tray
trayer --edge top --align right --widthtype percent --width 11 \
       --SetDockType true --SetPartialStrut true --transparent true --alpha 0 \
       --tint 0x000000 --expand true --heighttype pixel --height 17 &
 
# Set up network mananger applet
nm-applet --sm-disable &

fcitx &

# Set the background color<
xsetroot -solid midnightblue
```

###XMobar 配置 ~/.xmonad/

```haskell
Config { font = "-misc-fixed-*-*-*-*-13-*-*-*-*-*-*-*"
       , bgColor = "black"
       , fgColor = "grey"
       , position = TopW L 90
       , commands = [ Run Cpu ["-L","3","-H","50","--normal","green","--high","red"] 10
                    , Run Memory ["-t","Mem: <usedratio>%"] 10
                    , Run CoreTemp [ "--template" , "Temp: <core0>°C|<core1>°C"
                                   , "--Low"      , "70"        -- units: °C
                                   , "--High"     , "80"        -- units: °C
                                   , "--low"      , "darkgreen"
                                   , "--normal"   , "darkorange"
                                   , "--high"     , "darkred"
                                   ] 50
                    , Run Battery [ "--template" , "Batt: <acstatus>"
                                  , "--Low"      , "10"        -- units: %
                                  , "--High"     , "80"        -- units: %
                                  , "--low"      , "darkred"
                                  , "--normal"   , "darkorange"
                                  , "--high"     , "darkgreen"
                                  , "--" -- battery specific options
                                  -- discharging status
                                  , "-o"	, "<left>% (<timeleft>)"
                                  -- AC "on" status
                                  , "-O"	, "<fc=#dAA520>Charging</fc>"
                                  -- charged status
                                  , "-i"	, "<fc=#006000>Charged</fc>"
                                  ] 50
                    , Run Swap [] 10
                    , Run Date "%a %b %_d %l:%M" "date" 10
                    , Run StdinReader
                    ]
       , sepChar = "%"
       , alignSep = "}{"
       , template = "LastAvengers@Arch %StdinReader% }{ %cpu% | %memory% * %swap% | %coretemp%  <fc=#ee9a00>%date%</fc> | %battery%    "
       }
```

