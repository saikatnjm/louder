UUID    := louder@saikat
VERSION := $(shell sed -n 's/.*"version": *\([0-9]*\).*/\1/p' metadata.json)
SCHEMA  := schemas/org.gnome.shell.extensions.louder.gschema.xml
SOURCES := extension.js metadata.json LICENSE $(SCHEMA)
BUILD   := build

.PHONY: all zip deb install uninstall clean

all: zip deb

# Standard GNOME extension bundle (for `gnome-extensions install` and extensions.gnome.org)
zip: $(BUILD)/$(UUID).shell-extension.zip
$(BUILD)/$(UUID).shell-extension.zip: $(SOURCES)
	mkdir -p $(BUILD)
	gnome-extensions pack --force --extra-source=LICENSE --out-dir=$(BUILD) .

# Double-click installer for Ubuntu/Debian (opens in App Center)
deb: $(BUILD)/gnome-shell-extension-louder_$(VERSION)_all.deb
$(BUILD)/gnome-shell-extension-louder_$(VERSION)_all.deb: $(SOURCES) packaging/control
	rm -rf $(BUILD)/deb
	mkdir -p $(BUILD)/deb/DEBIAN $(BUILD)/deb/usr/share/gnome-shell/extensions/$(UUID) \
	         $(BUILD)/deb/usr/share/doc/gnome-shell-extension-louder
	sed 's/@VERSION@/$(VERSION)/' packaging/control > $(BUILD)/deb/DEBIAN/control
	install -m 644 extension.js metadata.json $(BUILD)/deb/usr/share/gnome-shell/extensions/$(UUID)/
	mkdir -p $(BUILD)/deb/usr/share/gnome-shell/extensions/$(UUID)/schemas
	install -m 644 $(SCHEMA) $(BUILD)/deb/usr/share/gnome-shell/extensions/$(UUID)/schemas/
	glib-compile-schemas $(BUILD)/deb/usr/share/gnome-shell/extensions/$(UUID)/schemas
	install -m 644 LICENSE $(BUILD)/deb/usr/share/doc/gnome-shell-extension-louder/copyright
	find $(BUILD)/deb -type d -exec chmod 755 {} +
	find $(BUILD)/deb -type f -exec chmod 644 {} +
	dpkg-deb --root-owner-group --build $(BUILD)/deb $@
	rm -rf $(BUILD)/deb

# Install for the current user only (no admin rights needed)
install: zip
	gnome-extensions install --force $(BUILD)/$(UUID).shell-extension.zip
	@echo "Installed. Log out and back in, then turn it on in the Extensions app."

uninstall:
	gnome-extensions uninstall $(UUID) || rm -rf $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

clean:
	rm -rf $(BUILD)
