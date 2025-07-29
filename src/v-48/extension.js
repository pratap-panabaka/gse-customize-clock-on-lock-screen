import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import ModifiedClock from './ModifiedClock.js';

export default class CustomizeClockOnLockScreenExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        
        this._screenShieldDialog = Main.screenShield._dialog;
        this._originalPromptBox = this._screenShieldDialog._promptBox;
        this._originalClock = this._screenShieldDialog._clock;
        this._originalStack = this._screenShieldDialog._stack;

        let currentMonitor = Main.layoutManager.currentMonitor;
        let {x, y, width, height} = currentMonitor;

        this._actorBox = new Clutter.ActorBox();

        this._actorBox.x1 = x;
        this._actorBox.y1 = y;
        this._actorBox.x2 = x + width;
        this._actorBox.y2 = y + height;

        if (this._screenShieldDialog) {
            this._screenShieldDialog._stack.remove_child(this._originalPromptBox);
            this._screenShieldDialog._stack.remove_child(this._originalClock);
            this._screenShieldDialog.remove_child(this._originalStack);

            this._screenShieldDialog._stack = new Shell.Stack(); // to be destroyed
            this._screenShieldDialog._stack.allocate(this._actorBox);
            this._screenShieldDialog._stack.set_width(width);
            this._screenShieldDialog._stack.set_height(height);

            this._screenShieldDialog.add_child(this._screenShieldDialog._stack);//

            this._screenShieldDialog._clock = new ModifiedClock(this._settings); // to be destroyed
            this._screenShieldDialog._clock.set_pivot_point(0.5, 0.5);

            this._screenShieldDialog._stack.add_child(this._originalPromptBox); //
            this._screenShieldDialog._stack.add_child(this._screenShieldDialog._clock); //

            this._screenShieldDialog._promptBox.set_y_align(Clutter.ActorAlign.CENTER);
            this._screenShieldDialog._stack.set_style('border: 2px solid orangered');
        }
    }

    // unlock-dialog is used in session-modes because this extension purpose is
    // to tweak the clock on lock screen itself.
    disable() {
        this._actorBox = null;

        this._screenShieldDialog._stack.remove_child(this._originalPromptBox);
        this._screenShieldDialog._stack.remove_child(this._screenShieldDialog._clock);

        this._screenShieldDialog._clock.destroy(); // destroyed
        this._screenShieldDialog._clock = null;

        this._screenShieldDialog.remove_child(this._screenShieldDialog._stack);
        this._screenShieldDialog._stack.destroy(); // destroyed
        this._screenShieldDialog._stack = null;
        this._screenShieldDialog.add_child(this._originalStack);

        this._originalPromptBox.set_y_align(Clutter.ActorAlign.DEFAULT);

        this._screenShieldDialog = null;

        this._settings = null;
    }
}
