import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import CreateGroup from './preferences/createGroup.js';

export default class CustomizeClockExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        let gsettingsKeys;
        let group;

        const pageOne = new Adw.PreferencesPage({
            title: 'Cmd Output',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-command-output', 'command-output-font-color', 'command-output-font-size', 'command', 'command-output-font-family', 'command-output-font-weight', 'command-output-font-style', 48];
        group = new CreateGroup('Command Output as Text', window._settings, gsettingsKeys, 'Enter bash command - the output will be displayed on lockscreen');
        pageOne.add(group);

        const pageTwo = new Adw.PreferencesPage({
            title: 'Time',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-time', 'time-font-color', 'time-font-size', 'custom-time-text', 'time-font-family', 'time-font-weight', 'time-font-style', 96];
        group = new CreateGroup('Clock Time', window._settings, gsettingsKeys, 'Leave it blank for default time format');
        pageTwo.add(group);
        pageTwo.add(this._createFormatsHelp());

        const pageThree = new Adw.PreferencesPage({
            title: 'Date',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-date', 'date-font-color', 'date-font-size', 'custom-date-text', 'date-font-family', 'date-font-weight', 'date-font-style', 28];
        group = new CreateGroup('Clock Date', window._settings, gsettingsKeys, 'Leave it blank for default date format');

        pageThree.add(group);
        pageThree.add(this._createFormatsHelp());

        const pageFour = new Adw.PreferencesPage({
            title: 'Hint',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-hint', 'hint-font-color', 'hint-font-size', null, 'hint-font-family', 'hint-font-weight', 'hint-font-style', 20];
        group = new CreateGroup('Unlock Hint', window._settings, gsettingsKeys, null);
        pageFour.add(group);

        window.add(pageOne);
        window.add(pageTwo);
        window.add(pageThree);
        window.add(pageFour);

        window.set_default_size(800, 800);
    }

    _createFormatsHelp() {
        let row;

        const hintGroup = new Adw.PreferencesGroup({title: 'Date/Time Formats Help'});

        row = new Adw.ActionRow({title: 'Note 1'});
        row.add_suffix(new Gtk.Label({
            label: "Use custom format in above entry box. custom format starts with '%', for example '%A %B %Y %T %Z' or use your own text",
            selectable: true,
            wrap: true,
            halign: 'left',
        }));
        hintGroup.add(row);

        const url = 'https://help.gnome.org/users/gthumb/stable/gthumb-date-formats.html.en';
        const linkButton = Gtk.LinkButton.new_with_label(url, 'Web link for valid Date/Time Format Codes');
        linkButton.set_halign('left');
        row = new Adw.ActionRow({title: 'Note 2'});
        row.add_suffix(linkButton);
        hintGroup.add(row);

        return hintGroup;
    }
}
