import St from 'gi://St';
import GObject from 'gi://GObject';
import GnomeDesktop from 'gi://GnomeDesktop';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';

import {formatDateWithCFormatString} from 'resource:///org/gnome/shell/misc/dateUtils.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

import execCommunicate from './utils/getCommandOutput.js';

const HINT_TIMEOUT = 4;
const CROSSFADE_TIME = 300;
const SHELL_VERSION = parseInt(Config.PACKAGE_VERSION.split(' ')[0]);

const ModifiedClock = GObject.registerClass(
    class ModifiedClock extends St.BoxLayout {
        _init(settings, width) {
            let initObj = {
                style_class: 'unlock-dialog-clock',
                y_align: Clutter.ActorAlign.CENTER,
            };

            if (SHELL_VERSION >= 48)
                initObj.orientation = Clutter.Orientation.VERTICAL;
            else
                initObj.vertical = true;

            super._init(initObj);

            this._settings = settings;

            this._customTimeText = this._settings.get_string('custom-time-text');
            this._customDateText = this._settings.get_string('custom-date-text');

            const DEFAULT = 'Default';

            let color, size, family, weight, style, css;

            // command output as text
            this._commandOutput = new St.Label({
                style_class: 'unlock-dialog-clock-date',
                x_align: Clutter.ActorAlign.CENTER,
            });

            color = this._settings.get_string('command-output-font-color');
            size = this._settings.get_int('command-output-font-size');
            family = this._settings.get_string('command-output-font-family');
            weight = this._settings.get_string('command-output-font-weight');
            style = this._settings.get_string('command-output-font-style');

            css = '';
            if (color)
                css += `color: ${color};\n`;

            if (size)
                css += `font-size: ${size}px;\n`;

            if (family !== DEFAULT)
                css += `font-family: "${family}", sans-serif;\n`;

            if (weight !== DEFAULT)
                css += `font-weight: ${weight};\n`;

            if (style !== DEFAULT)
                css += `font-style: ${style};\n`;

            css += 'text-align: center;\n';
            css += `max-width: ${width}px;`;

            this._commandOutput.set_style(css);
            this._commandOutput.clutter_text.set_line_wrap(true);
            //

            // time text
            this._time = new St.Label({
                style_class: 'unlock-dialog-clock-time',
                x_align: Clutter.ActorAlign.CENTER,
            });

            color = this._settings.get_string('time-font-color');
            size = this._settings.get_int('time-font-size');
            family = this._settings.get_string('time-font-family');
            weight = this._settings.get_string('time-font-weight');
            style = this._settings.get_string('time-font-style');

            css = '';
            if (color)
                css += `color: ${color};\n`;

            if (size)
                css += `font-size: ${size}px;\n`;

            if (family !== DEFAULT)
                css += `font-family: "${family}", sans-serif;\n`;

            if (weight !== DEFAULT)
                css += `font-weight: ${weight};\n`;

            if (style !== DEFAULT)
                css += `font-style: ${style};\n`;

            css += 'text-align: center;\n';
            css += `max-width: ${width}px;`;

            this._time.set_style(css);
            this._time.clutter_text.set_line_wrap(true);
            //

            // date text
            this._date = new St.Label({
                style_class: 'unlock-dialog-clock-date',
                x_align: Clutter.ActorAlign.CENTER,
            });

            color = this._settings.get_string('date-font-color');
            size = this._settings.get_int('date-font-size');
            family = this._settings.get_string('date-font-family');
            weight = this._settings.get_string('date-font-weight');
            style = this._settings.get_string('date-font-style');

            css = '';
            if (color)
                css += `color: ${color};\n`;

            if (size)
                css += `font-size: ${size}px;\n`;

            if (family !== DEFAULT)
                css += `font-family: "${family}", sans-serif;\n`;

            if (weight !== DEFAULT)
                css += `font-weight: ${weight};\n`;

            if (style !== DEFAULT)
                css += `font-style: ${style};\n`;

            css += 'text-align: center;\n';
            css += `max-width: ${width}px;`;

            this._date.set_style(css);
            this._date.clutter_text.set_line_wrap(true);
            //

            // hint text
            this._hint = new St.Label({
                style_class: 'unlock-dialog-clock-hint',
                x_align: Clutter.ActorAlign.CENTER,
                opacity: 0,
            });

            color = this._settings.get_string('hint-font-color');
            size = this._settings.get_int('hint-font-size');
            family = this._settings.get_string('hint-font-family');
            weight = this._settings.get_string('hint-font-weight');
            style = this._settings.get_string('hint-font-style');

            css = '';
            if (color)
                css += `color: ${color};\n`;

            if (size)
                css += `font-size: ${size}px;\n`;

            if (family !== DEFAULT)
                css += `font-family: "${family}", sans-serif;\n`;

            if (weight !== DEFAULT)
                css += `font-weight: ${weight};\n`;

            if (style !== DEFAULT)
                css += `font-style: ${style};\n`;

            if (css !== '')
                this._hint.set_style(css);
            //

            const removeCustomCommand = this._settings.get_boolean('remove-command-output');
            const command = this._settings.get_string('command');
            const removeTime = this._settings.get_boolean('remove-time');
            const removeDate = this._settings.get_boolean('remove-date');
            const removeHint = this._settings.get_boolean('remove-hint');

            if (!removeCustomCommand && command) {
                this.add_child(this._commandOutput);
                this._createCommandText();
            }

            if (!removeTime)
                this.add_child(this._time);

            if (!removeDate)
                this.add_child(this._date);

            if (!removeHint)
                this.add_child(this._hint);

            this._wallClock = new GnomeDesktop.WallClock({time_only: true});
            this._wallClock.connect('notify::clock', this._updateClock.bind(this));

            if (SHELL_VERSION >= 48) {
                const backend = this.get_context().get_backend();
                this._seat = backend.get_default_seat();
            } else {
                this._seat = Clutter.get_default_backend().get_default_seat();
            }

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
            if (this._customTimeText?.startsWith('%')) {
                let customTimeFormat = Shell.util_translate_time_string(this._customTimeText);
                this._time.text = formatDateWithCFormatString(date, customTimeFormat);
            } else if (this._customTimeText) {
                this._time.text = this._customTimeText;
            } else {
                this._time.text = this._wallClock.clock.trim();
            }

            // date
            if (this._customDateText?.startsWith('%')) {
                let customDateFormat = Shell.util_translate_time_string(this._customDateText);
                this._date.text = formatDateWithCFormatString(date, customDateFormat);
            } else if (this._customDateText) {
                this._date.text = this._customDateText;
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
