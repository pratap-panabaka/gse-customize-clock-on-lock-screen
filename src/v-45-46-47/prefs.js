import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import CreateGroup from './preferences/createGroup.js';

export default class CustomizeClockExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        let gsettingsKeys;
        let group;
        let url;
        let linkButton;

        const pageOne = new Adw.PreferencesPage({
            title: 'Cmd Output',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-command-output', 'command-output-font-color', 'command-output-font-size', 'command', 'command-output-font-style'];
        group = new CreateGroup('Command Output as Text', 'description', window._settings, gsettingsKeys, 'Enter bash command - the output will be displayed');
        pageOne.add(group);

        const pageTwo = new Adw.PreferencesPage({
            title: 'Time',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-time', 'time-font-color', 'time-font-size', 'custom-time-text', 'time-font-style'];
        group = new CreateGroup('Clock Time', 'description', window._settings, gsettingsKeys, 'Leave it blank for default time format');
        group.add(new Adw.Banner({
            title: "you can use custom format here. custom format starts with '%', or use your own text, ", revealed: true,
        }));
        url = 'https://help.gnome.org/users/gthumb/stable/gthumb-date-formats.html.en';
        linkButton = Gtk.LinkButton.new_with_label(url, 'Web link for valid Date/Time Format Codes');
        group.add(linkButton);
        pageTwo.add(group);

        const pageThree = new Adw.PreferencesPage({
            title: 'Date',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-date', 'date-font-color', 'date-font-size', 'custom-date-text', 'date-font-style'];
        group = new CreateGroup('Clock Date', 'description', window._settings, gsettingsKeys, 'Leave it blank for default date format');
        group.add(new Adw.Banner({
            title: "you can use custom format here. custom format starts with '%', or use your own text, ", revealed: true,
        }));
        url = 'https://help.gnome.org/users/gthumb/stable/gthumb-date-formats.html.en';
        linkButton = Gtk.LinkButton.new_with_label(url, 'Web link for valid Date/Time Format Codes');
        group.add(linkButton);
        pageThree.add(group);

        const pageFour = new Adw.PreferencesPage({
            title: 'Hint',
            icon_name: 'preferences-system-symbolic',
        });

        gsettingsKeys = ['remove-hint', 'hint-font-color', 'hint-font-size', null, 'hint-font-style'];
        group = new CreateGroup('Unlock Hint', 'description', window._settings, gsettingsKeys, null);
        pageFour.add(group);

        window.add(pageOne);
        window.add(pageTwo);
        window.add(pageThree);
        window.add(pageFour);

        window.set_default_size(800, 500);
    }
}
