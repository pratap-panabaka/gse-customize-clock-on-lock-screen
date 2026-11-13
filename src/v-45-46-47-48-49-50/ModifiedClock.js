import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import GnomeDesktop from 'gi://GnomeDesktop';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import PangoCairo from 'gi://PangoCairo';

import { formatDateWithCFormatString } from 'resource:///org/gnome/shell/misc/dateUtils.js';
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
            this._commandCancellable = new Gio.Cancellable();
            this.connect('destroy', this._onDestroy.bind(this));

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
            this._clockStyle = this._settings.get_string('clock-style');

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
            if (!removeTime) {
                if (this._clockStyle === 'analog') {
                    this._analogClock = this._createAnalogClock(size);
                    this.add_child(this._analogClock);
                } else if (this._clockStyle === 'led') {
                    this._ledClock = this._createLedClock(size);
                    this.add_child(this._ledClock);
                } else {
                    this.add_child(this._time);
                }
            }

            if (!removeDate)
                this.add_child(this._date);

            if (!removeHint)
                this.add_child(this._hint);

            this._wallClock = new GnomeDesktop.WallClock({ time_only: true });
            this._wallClockConnectId = this._wallClock.connect('notify::clock', this._updateClock.bind(this));

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

            this._clockTickId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                1,
                () => {
                    this._updateClock();
                    return GLib.SOURCE_CONTINUE;
                }
            );

            this._commandTickId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                1,
                () => {
                    const command = this._settings.get_string('command');
                    const removeCustomCommand =
                        this._settings.get_boolean('remove-command-output');

                    if (!removeCustomCommand && command)
                        this._createCommandText();

                    return GLib.SOURCE_CONTINUE;
                }
            );

            this._updateClock();
            this._updateHint();
        }

        async _createCommandText() {
            if (this._commandRunning)
                return;

            this._commandRunning = true;

            try {
                const text = await execCommunicate(
                    this._settings.get_string('command').split(' '),
                    null, this._commandCancellable
                );

                if (!this._destroyed)
                    this._commandOutput.text = text.trim();
            } catch (e) {
                if (!this._destroyed) {
                    console.log(e);
                    this._commandOutput.text = 'Sorry Command Output has thrown error';
                }
            } finally {
                this._commandRunning = false;
            }
        }

        _updateClock() {
            let date = new Date();
            let timeText;
            if (this._customTimeText?.startsWith('%')) {
                let customTimeFormat = Shell.util_translate_time_string(this._customTimeText);
                timeText = formatDateWithCFormatString(date, customTimeFormat);
            } else if (this._customTimeText) {
                timeText = this._customTimeText;
            } else {
                timeText = this._wallClock.clock.trim();
            }
            this._currentTimeText = timeText;

            // time
            if (this._clockStyle === 'analog') {
                this._analogArea?.queue_repaint();
            } else if (this._clockStyle === 'led') {
                this._ledArea?.queue_repaint();
            } else {
                this._time.text = timeText;
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

        selectAuthHint(hint) {
            this._authHint = hint;
            this._updateHint();
        }

        _updateHint() {
            if (this._authHint) {
                this._hint.text = this._authHint;
                return;
            }
            this._hint.text = this._seat.touch_mode
                ? 'Swipe up to unlock'
                : 'Click or press a key to unlock';
        }

        _createAnalogClock(size) {
            const diameter = Math.max(180, size * 2);

            this._analogArea = new St.DrawingArea({
                style_class: 'unlock-dialog-analog-clock',
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                width: diameter,
                height: diameter,
            });
            this._analogArea.set_size(diameter, diameter);
            this._analogAreaConnectId = this._analogArea.connect('repaint', area => {
                const cr = area.get_context();
                const [width, height] = area.get_surface_size();
                this._paintAnalogClock(cr, width, height);
            });
            this._analogArea.queue_repaint();

            return this._analogArea;
        }

        _createLedClock(size) {
            const diameter = Math.max(200, size * 2);

            this._ledArea = new St.DrawingArea({
                style_class: 'unlock-dialog-led-clock',
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                width: diameter,
                height: diameter,
            });
            this._ledArea.set_size(diameter, diameter);
            this._ledAreaConnectId = this._ledArea.connect('repaint', area => {
                const cr = area.get_context();
                const [width, height] = area.get_surface_size();
                this._paintLedClock(cr, width, height);
            });
            this._ledArea.queue_repaint();

            return this._ledArea;
        }

        _paintAnalogClock(cr, width, height) {
            const radius = Math.min(width, height) / 2 - 4;
            const primary = this._parseRgba(this._settings.get_string('time-font-color'),
                { red: 1, green: 1, blue: 1, alpha: 1 });
            const accent = this._parseRgba(this._settings.get_string('hint-font-color'),
                { red: 1, green: 0.3, blue: 0.3, alpha: 1 });

            const now = new Date();
            const hours = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
            const minutes = now.getMinutes() + now.getSeconds() / 60;
            const seconds = now.getSeconds();

            cr.save();
            cr.translate(width / 2, height / 2);

            // Clock face
            cr.setLineWidth(Math.max(2, radius * 0.05));
            cr.setSourceRGBA(primary.red, primary.green, primary.blue, primary.alpha * 0.6);
            cr.arc(0, 0, radius, 0, 2 * Math.PI);
            cr.strokePreserve();
            cr.setSourceRGBA(primary.red, primary.green, primary.blue, primary.alpha * 0.1);
            cr.fill();

            // Hour ticks
            cr.setLineWidth(Math.max(2, radius * 0.04));
            cr.setSourceRGBA(primary.red, primary.green, primary.blue, primary.alpha * 0.7);
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI / 6) * i;
                const inner = radius * 0.8;
                const outer = radius * 0.95;
                cr.moveTo(inner * Math.sin(angle), -inner * Math.cos(angle));
                cr.lineTo(outer * Math.sin(angle), -outer * Math.cos(angle));
            }
            cr.stroke();

            // Hour hand
            cr.setLineWidth(Math.max(3, radius * 0.07));
            const hourAngle = (Math.PI / 6) * hours;
            cr.setSourceRGBA(primary.red, primary.green, primary.blue, primary.alpha);
            cr.moveTo(0, 0);
            cr.lineTo(radius * 0.5 * Math.sin(hourAngle), -radius * 0.5 * Math.cos(hourAngle));
            cr.stroke();

            // Minute hand
            cr.setLineWidth(Math.max(2, radius * 0.05));
            const minuteAngle = (Math.PI / 30) * minutes;
            cr.moveTo(0, 0);
            cr.lineTo(radius * 0.75 * Math.sin(minuteAngle), -radius * 0.75 * Math.cos(minuteAngle));
            cr.stroke();

            // Second hand
            cr.setLineWidth(Math.max(1.5, radius * 0.03));
            const secondAngle = (Math.PI / 30) * seconds;
            cr.setSourceRGBA(accent.red, accent.green, accent.blue, accent.alpha);
            cr.moveTo(0, 0);
            cr.lineTo(radius * 0.82 * Math.sin(secondAngle), -radius * 0.82 * Math.cos(secondAngle));
            cr.stroke();

            // Center cap
            cr.setLineWidth(1);
            cr.arc(0, 0, radius * 0.05, 0, 2 * Math.PI);
            cr.setSourceRGBA(primary.red, primary.green, primary.blue, primary.alpha);
            cr.fill();

            cr.restore();
        }

        _paintLedClock(cr, width, height) {
            const radius = Math.min(width, height) / 2 - 8;
            const base = this._parseRgba(this._settings.get_string('time-font-color'),
                { red: 1, green: 0, blue: 0, alpha: 1 });
            const accent = this._parseRgba(this._settings.get_string('hint-font-color'),
                { red: 1, green: 0.2, blue: 0.2, alpha: 1 });

            const now = new Date();
            const hours = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
            const minutes = now.getMinutes() + now.getSeconds() / 60;
            const seconds = now.getSeconds();

            const hourPos = (hours % 12) * 5;
            const minutePos = Math.floor(minutes);
            const secondPos = seconds;

            const dotRadius = Math.max(2.5, radius * 0.05);
            const baseAlpha = 0.1;
            const litAlpha = 0.85;
            const hourAlpha = 0.55;
            const minuteAlpha = 0.75;

            cr.save();
            cr.translate(width / 2, height / 2);

            // Subtle outer glow ring
            cr.setSourceRGBA(base.red, base.green, base.blue, baseAlpha * 0.6);
            cr.setLineWidth(dotRadius * 1.4);
            cr.arc(0, 0, radius - dotRadius, 0, 2 * Math.PI);
            cr.stroke();

            // LED dots around the circle (seconds accumulate, minute/hour markers accent)
            for (let i = 0; i < 60; i++) {
                const angle = (Math.PI / 30) * i;
                const x = (radius - dotRadius * 1.2) * Math.sin(angle);
                const y = -(radius - dotRadius * 1.2) * Math.cos(angle);

                let alpha = i <= secondPos ? litAlpha : baseAlpha;
                let color = base;

                if (i === minutePos) {
                    alpha = Math.max(alpha, minuteAlpha);
                    color = accent;
                }
                if (i === Math.floor(hourPos)) {
                    alpha = Math.max(alpha, hourAlpha);
                    color = accent;
                }

                cr.setSourceRGBA(color.red, color.green, color.blue, alpha);
                cr.arc(x, y, dotRadius, 0, 2 * Math.PI);
                cr.fill();
            }

            // Center digital time in 7-segment style (uses time color)
            const timeText = this._currentTimeText || this._wallClock.clock.trim();
            const maxWidth = width * 0.7;
            const targetHeight = height * 0.25;
            this._drawSevenSegmentText(cr, timeText, maxWidth, targetHeight,
                { color: base, background: { red: 0, green: 0, blue: 0, alpha: 0 } });

            cr.restore();
        }

        _drawSevenSegmentText(cr, text, maxWidth, targetHeight, colors) {
            const segments = {
                '0': ['a', 'b', 'c', 'd', 'e', 'f'],
                '1': ['b', 'c'],
                '2': ['a', 'b', 'g', 'e', 'd'],
                '3': ['a', 'b', 'c', 'd', 'g'],
                '4': ['f', 'g', 'b', 'c'],
                '5': ['a', 'f', 'g', 'c', 'd'],
                '6': ['a', 'f', 'g', 'c', 'd', 'e'],
                '7': ['a', 'b', 'c'],
                '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                '9': ['a', 'b', 'c', 'd', 'f', 'g'],
            };

            let thickness = targetHeight * 0.08;
            let length = targetHeight * 0.3;
            let digitHeight = 2 * length + 3 * thickness;
            let scaleH = targetHeight / digitHeight;
            thickness *= scaleH;
            length *= scaleH;
            digitHeight = 2 * length + 3 * thickness;
            let digitWidth = length + 2 * thickness;
            let spacing = thickness * 1.4;
            let colonWidth = thickness * 0.8;

            const totalWidth = Array.from(text).reduce((sum, ch, idx) => {
                if (ch === ':')
                    return sum + colonWidth + (idx < text.length - 1 ? spacing : 0);
                return sum + digitWidth + (idx < text.length - 1 ? spacing : 0);
            }, 0);

            const scaleW = totalWidth > maxWidth ? maxWidth / totalWidth : 1;
            const scale = Math.min(1, scaleW);

            thickness *= scale;
            length *= scale;
            digitWidth *= scale;
            digitHeight *= scale;
            spacing *= scale;
            colonWidth *= scale;

            let x = - (Array.from(text).reduce((sum, ch, idx) => {
                if (ch === ':')
                    return sum + colonWidth + (idx < text.length - 1 ? spacing : 0);
                return sum + digitWidth + (idx < text.length - 1 ? spacing : 0);
            }, 0)) / 2;
            const y = -digitHeight / 2;

            const drawSegment = (id) => {
                switch (id) {
                    case 'a':
                        cr.rectangle(x + thickness, y, length, thickness);
                        break;
                    case 'b':
                        cr.rectangle(x + thickness + length, y + thickness, thickness, length);
                        break;
                    case 'c':
                        cr.rectangle(x + thickness + length, y + 2 * thickness + length, thickness, length);
                        break;
                    case 'd':
                        cr.rectangle(x + thickness, y + 2 * length + 2 * thickness, length, thickness);
                        break;
                    case 'e':
                        cr.rectangle(x, y + 2 * thickness + length, thickness, length);
                        break;
                    case 'f':
                        cr.rectangle(x, y + thickness, thickness, length);
                        break;
                    case 'g':
                        cr.rectangle(x + thickness, y + length + thickness, length, thickness);
                        break;
                }
            };

            cr.setSourceRGBA(colors.color.red, colors.color.green, colors.color.blue, 0.9);
            for (const ch of text) {
                if (ch === ':') {
                    const dotRadius = thickness * 0.7;
                    cr.arc(x + colonWidth / 2, y + thickness * 1.2 + length * 0.6, dotRadius, 0, 2 * Math.PI);
                    cr.fill();
                    cr.arc(x + colonWidth / 2, y + digitHeight - (thickness * 1.2 + length * 0.6), dotRadius, 0, 2 * Math.PI);
                    cr.fill();
                    x += colonWidth + spacing;
                    continue;
                }

                const segs = segments[ch] || [];
                for (const id of segs) {
                    cr.rectangle(0, 0, 0, 0); // reset path
                    drawSegment(id);
                    cr.fill();
                }
                x += digitWidth + spacing;
            }
        }

        _parseRgba(value, fallback) {
            const match = value?.match(/rgba?\(([^)]+)\)/i);
            if (!match) {
                return fallback;
            }

            const parts = match[1].split(',').map(part => parseFloat(part.trim()));
            if (parts.length < 3)
                return fallback;

            const [r, g, b, a = 1] = parts;
            return {
                red: isNaN(r) ? fallback.red : r / 255,
                green: isNaN(g) ? fallback.green : g / 255,
                blue: isNaN(b) ? fallback.blue : b / 255,
                alpha: isNaN(a) ? fallback.alpha : a,
            };
        }

        _onDestroy() {
            this._destroyed = true;
            this._commandCancellable.cancel();
            this._seat.disconnectObject(this);
            this._monitorManager.disconnectObject(this);
            this._idleMonitor.remove_watch(this._idleWatchId);
            if (this._clockTickId) {
                GLib.source_remove(this._clockTickId);
                this._clockTickId = null;
            }

            if (this._commandTickId) {
                GLib.source_remove(this._commandTickId);
                this._commandTickId = null;
            }

            if (this._analogAreaConnectId) {
                this._analogArea.disconnect(this._analogAreaConnectId);
            }

            if (this._ledAreaConnectId) {
                this._ledArea.disconnect(this._ledAreaConnectId);
            }

            if (this._wallClockConnectId) {
                this._wallClock.disconnect(this._wallClockConnectId);
            }

            this._wallClock.run_dispose();
        }
    }
);

export default ModifiedClock;
