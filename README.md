# Louder

**Louder** is a tiny GNOME Shell extension that adds a **Boost** slider to the Quick Settings
menu (top-right corner). It sets your speaker's volume anywhere from **0% to 300%**
and shows the percentage next to the slider.

- Goes past GNOME's 150% limit, up to 300%
- Click the slider's speaker icon to turn the boost off: the slider greys out,
  anything above 100% drops back to 100%, and only the regular volume slider
  works. Click it again to turn the boost back on. Louder remembers your choice.
- Sticks to 100% when you drag near it, so getting back to normal is easy
- Follows whichever output is active (built-in speakers, Bluetooth, HDMI…)
- Stays in sync with the volume keys and GNOME's own volume slider
- About 100 lines of plain JavaScript, no dependencies

Works on GNOME Shell 48, 49 and 50 (Ubuntu 25.04 and newer).

## Install

### Option 1: Double-click (Ubuntu / Debian)

1. Download `gnome-shell-extension-louder_<version>_all.deb` from the
   [Releases](https://github.com/saikatnjm/louder/releases) page.
2. Double-click it and press **Install** in App Center.
3. Log out and log back in.
4. Open the **Extensions** app and turn on **Louder**.

### Option 2: Zip file (any distro)

Download `louder@saikat.shell-extension.zip` from Releases, then:

```bash
gnome-extensions install louder@saikat.shell-extension.zip
```

Log out and back in, then turn it on in the **Extensions** app.

### Option 3: From source

```bash
git clone https://github.com/saikatnjm/louder.git
cd louder
make install
```

## Uninstall

- Installed the `.deb`: `sudo apt remove gnome-shell-extension-louder`
- Installed the zip or from source: `make uninstall`, or remove it in the Extensions app.

## Settings

To change the maximum boost, edit `MAX_BOOST` near the top of `extension.js`
(`3.0` = 300%) and reinstall.

> **Note:** Boosting above roughly 150–200% can make sound distort or crackle,
> especially on small speakers. Turn it down if that happens.

## Building the packages

```bash
make        # builds both packages into build/
make zip    # build/louder@saikat.shell-extension.zip
make deb    # build/gnome-shell-extension-louder_<version>_all.deb
```

Needs `gnome-extensions` (comes with GNOME) and `dpkg-deb` (comes with Ubuntu/Debian).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
