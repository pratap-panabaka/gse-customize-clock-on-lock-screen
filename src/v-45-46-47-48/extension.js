import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import ModifiedClock from './ModifiedClock.js';

export default class CustomizeClockOnLockScreenExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._dialog = Main.screenShield._dialog;
        this._originalClock = this._dialog._clock;
        if (this._dialog) {
            this._dialog._stack.remove_child(this._dialog._clock);
            this._dialog._clock = new ModifiedClock(this._settings);
            this._dialog._clock.set_pivot_point(0.5, 0.5);
            this._dialog._stack.add_child(this._dialog._clock);
        }
    }

    // unlock-dialog is used in session-modes because this extension purpose is
    // to tweak the clock on lock screen itself.
    disable() {
        this._dialog._stack.remove_child(this._dialog._clock);
        this._dialog._stack.add_child(this._originalClock);
        this._dialog._clock.destroy();
        this._dialog._clock = null;
        this._dialog = null;

        this._settings = null;
    }
}
