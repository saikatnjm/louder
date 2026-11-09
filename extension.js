// SPDX-License-Identifier: GPL-2.0-or-later
// Louder: a Quick Settings slider that sets the current
// output device's volume anywhere from 0% to 300%.
// Click the slider's speaker icon to turn the boost on or off.

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickSlider, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js';

const MAX_BOOST = 3.0;   // 3.0 = 300%. Change this to allow more or less.
const SNAP_TO_100 = 0.03; // the slider sticks to 100% when within 3% of it
const OFF_OPACITY = 100;  // how faded the slider looks while boost is off (0-255)

const BoostSlider = GObject.registerClass(
class BoostSlider extends QuickSlider {
    _init(settings) {
        super._init({
            iconName: 'audio-volume-overamplified-symbolic',
            iconReactive: true, // the icon is the on/off button
        });

        this._settings = settings;

        // Percentage label to the right of the slider.
        this._label = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            style: 'min-width: 3.5em; text-align: right; font-weight: bold;',
        });
        this.child.add_child(this._label);

        // The same mixer GNOME's own volume slider uses.
        this._control = Volume.getMixerControl();
        this._norm = this._control.get_vol_max_norm(); // the value that means 100%
        this._stream = null;
        this._streamId = 0;

        this._sliderId = this.slider.connect('notify::value', () => this._onSliderMoved());
        this.connect('icon-clicked', () =>
            this._settings.set_boolean('boost-enabled', !this._isOn()));
        this._settingsId = this._settings.connect('changed::boost-enabled', () => this._onToggled());
        this._controlIds = [
            this._control.connect('default-sink-changed', () => this._watchDefaultOutput()),
            this._control.connect('state-changed', () => this._watchDefaultOutput()),
        ];
        this.connect('destroy', () => this._cleanup());

        this._watchDefaultOutput();
        this._showOnOff();
    }

    _isOn() {
        return this._settings.get_boolean('boost-enabled');
    }

    // Follow whichever output is the default (switches when you change
    // from built-in speakers to Bluetooth, for example).
    _watchDefaultOutput() {
        if (this._stream && this._streamId)
            this._stream.disconnect(this._streamId);
        this._stream = this._control.get_default_sink();
        this._streamId = this._stream
            ? this._stream.connect('notify::volume', () => this._showCurrentVolume())
            : 0;
        this.visible = this._stream !== null;
        this._showCurrentVolume();
    }

    // Volume changed elsewhere (keyboard keys, GNOME's slider): update ours.
    _showCurrentVolume() {
        if (!this._stream)
            return;
        const ratio = this._stream.volume / this._norm;
        this.slider.block_signal_handler(this._sliderId);
        this.slider.value = Math.min(ratio / MAX_BOOST, 1);
        this.slider.unblock_signal_handler(this._sliderId);
        this._label.text = this._isOn() ? `${Math.round(ratio * 100)}%` : 'Off';
    }

    _onSliderMoved() {
        if (!this._stream || !this._isOn())
            return;
        let ratio = this.slider.value * MAX_BOOST;
        if (Math.abs(ratio - 1) < SNAP_TO_100)
            ratio = 1;
        this._setVolume(ratio);
        if (ratio > 0 && this._stream.is_muted)
            this._stream.change_is_muted(false);
        this._label.text = `${Math.round(ratio * 100)}%`;
    }

    _setVolume(ratio) {
        this._stream.volume = Math.round(ratio * this._norm);
        this._stream.push_volume();
    }

    _onToggled() {
        // Turning boost off: bring an over-100% volume back down to 100%,
        // so the regular volume slider is in charge again.
        if (!this._isOn() && this._stream && this._stream.volume > this._norm)
            this._setVolume(1);
        this._showOnOff();
    }

    _showOnOff() {
        const on = this._isOn();
        this.slider.reactive = on;
        this.slider.opacity = on ? 255 : OFF_OPACITY;
        this._label.opacity = on ? 255 : OFF_OPACITY;
        this.iconLabel = on ? 'Turn volume boost off' : 'Turn volume boost on';
        this._showCurrentVolume();
    }

    _cleanup() {
        if (this._stream && this._streamId)
            this._stream.disconnect(this._streamId);
        this._controlIds.forEach(id => this._control.disconnect(id));
        this._settings.disconnect(this._settingsId);
        this._stream = null;
    }
});

const BoostIndicator = GObject.registerClass(
class BoostIndicator extends SystemIndicator {
    _init(settings) {
        super._init();
        this.quickSettingsItems.push(new BoostSlider(settings));
    }
});

export default class Louder extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new BoostIndicator(this._settings);
        // 2 = full width, like GNOME's own volume slider.
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator, 2);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        this._indicator = null;
        this._settings = null;
    }
}
