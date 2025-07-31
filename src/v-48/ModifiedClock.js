import St from 'gi://St';
import GObject from 'gi://GObject';
import GnomeDesktop from 'gi://GnomeDesktop';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';

import { formatDateWithCFormatString } from 'resource:///org/gnome/shell/misc/dateUtils.js';
import execCommunicate from './utils/getCommandOutput.js';

const HINT_TIMEOUT = 4;
const CROSSFADE_TIME = 300;

const ModifiedClock = GObject.registerClass(
    class ModifiedClock extends St.BoxLayout {
        _init(settings) {
            super._init({
                style_class: 'unlock-dialog-clock',
                orientation: Clutter.Orientation.VERTICAL,
                y_align: Clutter.ActorAlign.CENTER,
            });

            this._settings = settings;

            this._customTimeText = this._settings.get_string('custom-time-text');
            this._customDateText = this._settings.get_string('custom-date-text');

            this._commandOutput = new St.Label({
                style_class: 'unlock-dialog-clock-date',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this._commandOutput.set_style(
                `color: ${this._settings.get_string('command-output-font-color')};
                font-size: ${this._settings.get_int('command-output-font-size')}px;
                font-family: ${this._settings.get_string('command-output-font-style')}, serif;
                text-align: center;
                `
            );

            this._commandOutput.clutter_text.set_line_wrap(true);

            this._time = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-time',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this._time.set_style(
                `color: ${this._settings.get_string('time-font-color')};
                font-size: ${this._settings.get_int('time-font-size')}px;
                font-family: ${this._settings.get_string('time-font-style')}, serif;
                `
            );

            this._date = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-date',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this._date.set_style(
                `color: ${this._settings.get_string('date-font-color')};
                font-size: ${this._settings.get_int('date-font-size')}px;
                font-family: ${this._settings.get_string('date-font-style')}, serif;
                `
            );

            this._hint = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-hint',
                x_align: Clutter.ActorAlign.CENTER,
                opacity: 0,
            });

            this._hint.set_style(
                `color: ${this._settings.get_string('hint-font-color')};
                font-size: ${this._settings.get_int('hint-font-size')}px;
                font-family: ${this._settings.get_string('hint-font-style')}, serif;
                `
            );

            const removeCustomCommand = this._settings.get_boolean('remove-command-output');
            const removeTime = this._settings.get_boolean('remove-time');
            const removeDate = this._settings.get_boolean('remove-date');
            const removeHint = this._settings.get_boolean('remove-hint');

            if (!removeCustomCommand) {
                this.add_child(this._commandOutput);
                this._createCommandText();
            }

            if (!removeTime)
                this.add_child(this._time);

            if (!removeDate)
                this.add_child(this._date);

            if (!removeHint)
                this.add_child(this._hint);

            this._wallClock = new GnomeDesktop.WallClock({ time_only: true });
            this._wallClock.connect('notify::clock', this._updateClock.bind(this));

            const backend = this.get_context().get_backend();
            this._seat = backend.get_default_seat();
            this._seat.connectObject('notify::touch-mode',
                this._updateHint.bind(this), this);

            this._monitorManager = global.backend.get_monitor_manager();
            this._monitorManager.connectObject('power-save-mode-changed',
                () => (this._hint.opacity = 0), this);

            this._idleMonitor = global.backend.get_core_idle_monitor();
            this._idleWatchId = this._idleMonitor.add_idle_watch(HINT_TIMEOUT * 1000, () => {
                this._hint.ease({
                    opacity: 255,
                    duration: CROSSFADE_TIME,
                });
            });

            this._updateClock();
            this._updateHint();
        }

        async _createCommandText() {
            try {
                const text = await execCommunicate(this._settings.get_string('command').split(' '));
                this._commandOutput.text = text;
            } catch (e) {
                console.log(e);
                this._commandOutput.text = 'Sorry Command Output has thrown error';
            }
        }

        _updateClock() {
            let date = new Date();

            // time
            if (this._customTimeText) {
                this._time.text = this._customTimeText;
            } else if (this._customTimeText.startsWith('%')) {
                let customTimeFormat = Shell.util_translate_time_string(this._customTimeText);
                this._time.text = formatDateWithCFormatString(date, customTimeFormat);
            } else {
                this._time.text = this._wallClock.clock.trim();
            }

            // date
            if (this._customDateText) {
                this._date.text = this._customDateText;
            } else if (this._customDateText.startsWith('%')) {
                let customDateFormat = Shell.util_translate_time_string(this._customDateText);
                this._date.text = formatDateWithCFormatString(date, customDateFormat);
            } else {
                let dateFormat = Shell.util_translate_time_string('%A %B %-d');
                this._date.text = formatDateWithCFormatString(date, dateFormat);
            }
        }

        _updateHint() {
            this._hint.text = this._seat.touch_mode
                ? 'Swipe up to unlock'
                : 'Click or press a key to unlock';
        }

        destroy() {
            this._idleMonitor.remove_watch(this._idleWatchId);
            super.destroy();
        }
    }
);

export default ModifiedClock;
