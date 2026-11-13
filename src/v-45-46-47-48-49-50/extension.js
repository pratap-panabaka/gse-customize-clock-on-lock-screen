import Clutter from 'gi://Clutter';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import ModifiedClock from './ModifiedClock.js';

export default class CustomizeClockOnLockScreenExtension extends Extension {
    enable() {
        const dialog = Main.screenShield._dialog;
        const monitor = Main.layoutManager.primaryMonitor;
        if (!dialog?._clock || !dialog._stack || !monitor)
            return;

        this._settings = this.getSettings();
        this._dialog = dialog;
        this._originalClock = dialog._clock;
        this._originalPromptAlign = dialog._promptBox.y_align;
        this._customClock = new ModifiedClock(this._settings, monitor.width);
        this._customClock.set_pivot_point(0.5, 0.5);
        this._customClock.selectAuthHint(dialog._selectedAuthMechanism?.hint);
        this._replaceClock(this._originalClock, this._customClock);
        dialog._promptBox.set_y_align(Clutter.ActorAlign.CENTER);
        this._dialogDestroyId = dialog.connect('destroy', () => {
            this._originalClock.destroy();
            this._dialog = null;
            this._originalClock = null;
            this._customClock = null;
            this._dialogDestroyId = 0;
        });
    }

    _replaceClock(previous, next) {
        const dialog = this._dialog;
        // GNOME 51's UnlockStack keeps a separate reference for measurement.
        if (dialog._stack._clock === previous)
            dialog._stack._clock = next;
        if (dialog._activePage === previous)
            dialog._activePage = next;
        next.visible = previous.visible;
        next.opacity = previous.opacity;
        dialog._stack.replace_child(previous, next);
        dialog._clock = next;
    }

    disable() {
        if (this._dialog) {
            this._dialog.disconnect(this._dialogDestroyId);
            this._replaceClock(this._customClock, this._originalClock);
            this._originalClock.selectAuthHint?.(this._dialog._selectedAuthMechanism?.hint);
            this._dialog._promptBox.set_y_align(this._originalPromptAlign);
            this._customClock.destroy();
        }
        this._dialogDestroyId = 0;
        this._customClock = null;
        this._originalClock = null;
        this._dialog = null;
        this._settings = null;
    }
}
