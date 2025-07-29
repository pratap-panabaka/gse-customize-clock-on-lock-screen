// SPDX-FileCopyrightText: 2020 Florian Müllner <fmuellner@gnome.org>
//
// SPDX-License-Identifier: GPL-2.0-or-later

// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

// we use async/await here to not block the mainloop, not to parallelize
/* eslint-disable no-await-in-loop */

// source code: https://extensions.gnome.org/extension/19/user-themes/
// Below code is tweaked by PRATAP PANABAKA <pratap@fastmail.fm>

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {recursiveFileOperation, recursiveGetFileNamesCallback} from './recursiveFileOperation.js';

const FONT_DIRECTORIES = ['/usr/local/share/fonts', '/usr/share/fonts'];

class FontsPrefsWidget extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor(settings) {
        super({title: 'Fonts'});

        this._actionGroup = new Gio.SimpleActionGroup();
        this.insert_action_group('font', this._actionGroup);

        this._settings = settings;
        this._actionGroup.add_action(
            this._settings.create_action('font-style'));

        this.connect('destroy', () => (this._settings = null));

        this._createFontsList();
    }

    async _collectFonts() {
        let fontNames = [];
        for (const dirName of FONT_DIRECTORIES) {
            const dir = Gio.File.new_for_path(dirName);
            if (dir.query_exists(null))
                await recursiveFileOperation(dir, recursiveGetFileNamesCallback, fontNames, 'fonts');
        }
        const modified = fontNames
            .map(name => name.trim()) // remove white spaces if any
            .filter(name => name.endsWith('.ttf') || name.endsWith('.otf')) // get only font files
            .map(name => name.slice(0, -4)) // remove file extension
            .map(s => s.split('-')[0]) // remove hypen and after
            .map(s => s.split(/(?<=[a-z])(?=[A-Z])/).join(' ')); // based on Font naming convention split the strig with Capital letters

        return [...new Set(modified)];
    }

    async _createFontsList() {
        const fontsCollections = await this._collectFonts();
        for (const fontName of fontsCollections)
            this.add(new FontRow(fontName));
    }
}

class FontRow extends Adw.ActionRow {
    static {
        GObject.registerClass(this);
    }

    constructor(name) {
        const check = new Gtk.CheckButton({
            action_name: 'font.font-style',
            action_target: new GLib.Variant('s', name),
        });

        super({
            title: name,
            activatable_widget: check,
        });
        this.add_prefix(check);
    }
}

export default FontsPrefsWidget;
