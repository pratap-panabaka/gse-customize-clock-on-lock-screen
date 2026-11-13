### Customize Clock On Lock Screen - Extension (GNOME 45–51)

### Install
```
git clone https://github.com/pratap-panabaka/gse-customize-clock-on-lock-screen
cd gse-customize-clock-on-lock-screen
./install.sh
```

The shared source directory retains its historical name `src/v-45-46-47-48-49-50`;
its metadata supports GNOME 45 through 51. GNOME 45–47 use the legacy widget
orientation/backend APIs, while 48–51 use their replacements. GNOME 51's
clock layout reference and authentication hints are supported.

After updating, log out and back in so GNOME Shell loads the new files, then run:
```
gnome-extensions enable CustomizeClockOnLockScreen@pratap.fastmail.fm
```

Commands run as your user while the lock-screen extension is active. Only use
trusted commands, and avoid output containing private information: anyone
looking at the lock screen can read it.

### Validation

```
node --test tests/extension.test.cjs
bash -n install.sh uninstall.sh
glib-compile-schemas --strict --dry-run src/v-45-46-47-48-49-50/schemas
```

Real lock/unlock testing is needed on each GNOME release; automated lifecycle
tests cover both the older stack and GNOME 51's clock-aware stack.

### Uninstall
```
./uninstall.sh
```

<hr/>

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=☕&slug=pratap.panabaka&button_colour=FFDD00&font_colour=000000&font_family=Lato&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/pratap.panabaka)


