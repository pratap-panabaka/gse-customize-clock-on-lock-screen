import Adw from 'gi://Adw';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import CreateGroup from './preferences/createGroup.js';

export default class CustomizeClockExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        let gsettingsKeys;
        let group;

        const pageOne = new Adw.PreferencesPage({
            title: 'cmd output',
            icon_name: '',
        });

        gsettingsKeys = ['remove-command-output', 'command-output-font-color', 'command-output-font-size', 'command', 'command-output-font-style'];
        group = new CreateGroup('Command Output as Text', 'description', window._settings, gsettingsKeys);
        pageOne.add(group);

        const pageTwo = new Adw.PreferencesPage({
            title: 'time',
            icon_name: '',
        });

        gsettingsKeys = ['remove-time', 'time-font-color', 'time-font-size', 'custom-time-text', 'time-font-style'];
        group = new CreateGroup('Clock Time', 'description', window._settings, gsettingsKeys);
        pageTwo.add(group);

        const pageThree = new Adw.PreferencesPage({
            title: 'date',
            icon_name: '',
        });

        gsettingsKeys = ['remove-date', 'date-font-color', 'date-font-size', 'custom-date-text', 'date-font-style'];
        group = new CreateGroup('Clock Date', 'description', window._settings, gsettingsKeys);
        pageThree.add(group);

        const pageFour = new Adw.PreferencesPage({
            title: 'hint',
            icon_name: '',
        });

        gsettingsKeys = ['remove-hint', 'hint-font-color', 'hint-font-size', null, 'hint-font-style'];
        group = new CreateGroup('Unlock Hint', 'description', window._settings, gsettingsKeys);
        pageFour.add(group);

        window.add(pageOne);
        window.add(pageTwo);
        window.add(pageThree);
        window.add(pageFour);
    }
}
