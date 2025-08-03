import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';

import getFonts from '../utils/getFonts.js';

class CreateGroup extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor(title, settings, keysArray, hintText) {
        super({
            title,
        });

        this._settings = settings;

        const [remove, color, size, text, fontStyle, reset] = keysArray;

        this._removeRow = new Adw.SwitchRow({title: 'Remove'}); // 1 - remove row

        let rgba = new Gdk.RGBA();
        let boolean = rgba.parse(this._settings.get_string(color));
        if (!boolean)
            rgba.parse('#ABCDEF00');


        this._colorButton = new Gtk.ColorDialogButton({
            dialog: new Gtk.ColorDialog(),
            rgba,
        });
        this._colorButton.connect('notify::rgba', this._onPanelColorChanged.bind(this, color));

        this._colorRow = new Adw.ActionRow({title: 'Color'}); // 2 - font color row
        this._colorRow.add_suffix(this._colorButton);
        this._colorRow.add_suffix(this._resetColorButton(this._colorButton, color));

        this._fontSizeAdjustment = new Gtk.Adjustment({
            lower: 24,
            upper: 96,
            page_increment: 2,
            step_increment: 4,
            value: this._settings.get_int(size),
        });
        this._fontSizeAdjustment.connect('value-changed', entry => {
            this._settings.set_int(size, entry.get_value());
        });

        this._fontSizeRow = new Adw.SpinRow({title: 'Font Size', adjustment: this._fontSizeAdjustment, wrap: false}); // 3 - font size row
        this._fontSizeRow.value = this._settings.get_int(size);
        this._fontSizeRow.connect('notify::value', () => {
            this._settings.set_int(size, this._fontSizeRow.value);
        });
        this._fontSizeRow.add_suffix(this._resetFontSize(size, reset));

        this._dropDownItems = new Gtk.StringList();
        this._fontStyleRow = new Adw.ComboRow({title: 'Select Font', model: this._dropDownItems}); // 4 - font style row
        this._generateDropDownItems(fontStyle);

        if (text) { // no need to add for hint text
            this._entryRow = new Adw.EntryRow({title: hintText}); // 5 - entry row
            this._entryRow.set_text(this._settings.get_string(text));
            this._entryRow.connect('changed', entry => {
                this._settings.set_string(text, entry.get_text());
            });
        }

        this._settings.bind(remove, this._removeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        this.add(this._removeRow);
        this.add(this._colorRow);
        this.add(this._fontSizeRow);
        this.add(this._fontStyleRow);
        if (text)
            this.add(this._entryRow);
    }

    _resetFontSize(key, size) {
        let resetButton = new Gtk.Button();
        resetButton.set_label('Reset');
        resetButton.connect('clicked', () => {
            this._settings.set_int(key, size);
            this._fontSizeRow.value = this._settings.get_int(key);
        });

        return resetButton;
    }

    _resetColorButton(button, key) {
        let resetButton = new Gtk.Button();
        resetButton.set_label('Reset');
        resetButton.connect('clicked', () => {
            let rgba = new Gdk.RGBA();
            let hexString = '#ABCDEF00';
            rgba.parse(hexString);
            button.set_rgba(rgba);
            this._settings.set_string(key, '');
        });

        return resetButton;
    }

    async _generateDropDownItems(fontStyle) {
        const fonts = await getFonts();
        fonts.forEach(font => this._dropDownItems.append(font));

        let currentFont = this._settings.get_string(fontStyle);
        let index = fonts.indexOf(currentFont);
        if (index !== -1)
            this._fontStyleRow.selected = index;

        this._fontStyleRow.connect('notify::selected', () => {
            let selectedFont = fonts[this._fontStyleRow.selected];
            this._settings.set_string(fontStyle, selectedFont);
        });
    }

    _onPanelColorChanged(color) {
        let rgba = this._colorButton.rgba;
        let css = rgba.to_string();
        let hexString = this._cssHexString(css);
        this._settings.set_string(color, hexString);
    }

    _cssHexString(css) {
        let rrggbb = '#';
        let start;
        for (let loop = 0; loop < 3; loop++) {
            let end = 0;
            let xx = '';
            for (let loop1 = 0; loop1 < 2; loop1++) {
                while (true) {
                    let x = css.slice(end, end + 1);
                    if (x === '(' || x === ',' || x === ')')
                        break;
                    end += 1;
                }
                if (loop1 === 0) {
                    end += 1;
                    start = end;
                }
            }
            xx = parseInt(css.slice(start, end)).toString(16);
            if (xx.length === 1)
                xx = `0${xx}`;
            rrggbb += xx;
            css = css.slice(end);
        }
        return rrggbb;
    }
}

export default CreateGroup;
