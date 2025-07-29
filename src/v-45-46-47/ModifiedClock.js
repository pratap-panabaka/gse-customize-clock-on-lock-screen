import St from 'gi://St';
import GObject from 'gi://GObject';
import GnomeDesktop from 'gi://GnomeDesktop';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';

import {formatDateWithCFormatString} from 'resource:///org/gnome/shell/misc/dateUtils.js';

const HINT_TIMEOUT = 4;
const CROSSFADE_TIME = 300;

const ModifiedClock = GObject.registerClass(
    class ModifiedClock extends St.BoxLayout {
        _init(settings) {
            super._init({style_class: 'unlock-dialog-clock', vertical: true});

            this._settings = settings;
            this._customStyle = this._settings.get_boolean('custom-style');
            this._customizeClock = this._settings.get_string('custom-time-text');
            this._customizeDate = this._settings.get_string('custom-date-text');

            this._time = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-time',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this._time.set_style(this._customStyle
                ? `color: ${this._settings.get_string('time-color')};
                        font-size: ${this._settings.get_int('time-size')}px;
                        font-family: ${this._settings.get_string('font-style')}, serif;
                        `
                : null
            );

            this._date = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-date',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this._date.set_style(this._customStyle
                ? `color: ${this._settings.get_string('date-color')};
                        font-size: ${this._settings.get_int('date-size')}px;
                        font-family: ${this._settings.get_string('font-style')}, serif;
                        `
                : null
            );

            this._hint = new St.Label({
                style_class: this._customStyle ? null : 'unlock-dialog-clock-hint',
                x_align: Clutter.ActorAlign.CENTER,
                opacity: 0,
            });

            this._hint.set_style(
                this._customStyle
                    ? `color: ${this._settings.get_string('hint-color')};
                        font-size: ${this._settings.get_int('hint-size')}px;
                        font-family: ${this._settings.get_string('font-style')}, serif;
                        `
                    : null
            );

            const removeTime = this._settings.get_boolean('remove-time');
            const removeDate = this._settings.get_boolean('remove-date');
            const removeHint = this._settings.get_boolean('remove-hint');

            if (!removeTime)
                this.add_child(this._time);

            if (!removeDate)
                this.add_child(this._date);

            if (!removeHint)
                this.add_child(this._hint);

            this._wallClock = new GnomeDesktop.WallClock({time_only: true});
            this._wallClock.connect('notify::clock', this._updateClock.bind(this));

            this._seat = Clutter.get_default_backend().get_default_seat();
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

        _updateClock() {
            let date = new Date();
            let dateFormat = Shell.util_translate_time_string('%A %B %-d');

            let timeFormat = Shell.util_translate_time_string(this._customizeClock);
            let customDateFormat = Shell.util_translate_time_string(this._customizeDate);

            if (!this._customizeClock)
                this._time.text = this._wallClock.clock;
            else if (this._customizeClock.startsWith('%'))
                this._time.text = formatDateWithCFormatString(date, timeFormat);
            else
                this._time.text = this._customizeClock;

            if (!this._customizeDate)
                this._date.text = formatDateWithCFormatString(date, dateFormat);
            else if (this._customizeDate.startsWith('%'))
                this._date.text = formatDateWithCFormatString(date, customDateFormat);
            else
                this._date.text = this._customizeDate;
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
