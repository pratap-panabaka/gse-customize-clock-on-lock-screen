// SPDX-FileCopyrightText: 2020 Florian Müllner <fmuellner@gnome.org>
//
// SPDX-License-Identifier: GPL-2.0-or-later

// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

// we use async/await here to not block the mainloop, not to parallelize
/* eslint-disable no-await-in-loop */

// source code: https://extensions.gnome.org/extension/19/user-themes/
// Below code is tweaked by PRATAP PANABAKA <pratap@fastmail.fm>

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {recursiveFileOperation, recursiveGetFileNamesCallback} from './recursiveFileOperation.js';

const FONT_DIRECTORIES = [`${GLib.get_user_data_dir()}/fonts`, '/usr/local/share/fonts', '/usr/share/fonts'];

const getFonts = async () => {
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
        .map(s => s.split(/(?<=[a-z])(?=[A-Z])/).join(' ')) // based on Font naming convention split the strig with Capital letters
        .sort();

    return [...new Set(modified)];
};

export default getFonts;
