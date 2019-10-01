# CodeSnap

Take beautiful screenshots of your code in VS Code.

## Copy to Clipboard support in Linux

In order for this feature to work in Linux you must install `xclip`.

Usually you can simply install it using your distribution's package manager:

```sh
# ubuntu / debian
sudo apt install xclip

# arch / manjaro
pacman -S xclip
```

If you're using [Wayland](https://wayland.freedesktop.org/) (rather than X) as your compositing window manager install [`wl-clipboard`](https://github.com/bugaevc/wl-clipboard) instead.
