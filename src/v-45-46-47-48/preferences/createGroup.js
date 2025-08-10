import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';

import DropDownWidget from '../utils/dropDownWidget.js';

class CreateGroup extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor(title, settings, keysArray, hintText) {
        super({
            title,
        });

        this._settings = settings;

        const [remove, color, size, text, family, weight, style, reset] = keysArray;
        let model, comboRow;

        this._removeRow = new Adw.SwitchRow({ title: 'Remove' }); // 1 - remove row
        this.add(this._removeRow);

        let rgba = new Gdk.RGBA();
        let boolean = rgba.parse(this._settings.get_string(color));
        if (!boolean)
            rgba.parse('#ABCDEF00');

        this._colorButton = new Gtk.ColorDialogButton({
            dialog: new Gtk.ColorDialog(),
            rgba,
        });
        this._colorButton.connect('notify::rgba', this._onPanelColorChanged.bind(this, color));

        this._colorRow = new Adw.ActionRow({ title: 'Color' }); // 2 - font color row
        this.add(this._colorRow);
        this._colorRow.add_suffix(this._colorButton);
        this._colorRow.add_suffix(this._resetColorButton(this._colorButton, color));

        this._fontSizeAdjustment = new Gtk.Adjustment({
            lower: 20,
            upper: 96,
            page_increment: 4,
            step_increment: 2,
            value: this._settings.get_int(size),
        });
        this._fontSizeAdjustment.connect('value-changed', entry => {
            this._settings.set_int(size, entry.get_value());
        });

        this._fontSizeRow = new Adw.SpinRow({ title: 'Font Size', adjustment: this._fontSizeAdjustment, wrap: false }); // 3 - font size row
        this.add(this._fontSizeRow);
        this._fontSizeRow.value = this._settings.get_int(size);
        this._fontSizeRow.connect('notify::value', () => {
            this._settings.set_int(size, this._fontSizeRow.value);
        });
        this._fontSizeRow.add_suffix(this._resetFontSize(size, reset));

        model = new Gtk.StringList();
        comboRow = new Adw.ComboRow({ title: 'Font Family', model }); // 4 - font family row
        this.add(comboRow);
        new DropDownWidget(this._settings, comboRow, model, family);

        model = new Gtk.StringList();
        comboRow = new Adw.ComboRow({ title: 'Font Weight', model }); // 5 - font weight row
        this.add(comboRow);
        new DropDownWidget(this._settings, comboRow, model, weight);

        model = new Gtk.StringList();
        comboRow = new Adw.ComboRow({ title: 'Font Style', model }); // 6 - font style row
        this.add(comboRow);
        new DropDownWidget(this._settings, comboRow, model, style);

        if (text) { // no need to add for hint text
            this._entryRow = new Adw.EntryRow({ title: hintText }); // 7 - entry row
            this._entryRow.set_text(this._settings.get_string(text));
            this._entryRow.connect('changed', entry => {
                this._settings.set_string(text, entry.get_text());
            });
            this.add(this._entryRow);
        }

        this._settings.bind(remove, this._removeRow, 'active', Gio.SettingsBindFlags.DEFAULT);
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

    _onPanelColorChanged(color) {
        let rgba = this._colorButton.rgba;
        let css = `rgba(${Math.round(rgba.red * 255)}, ${Math.round(rgba.green * 255)}, ${Math.round(rgba.blue * 255)}, ${rgba.alpha})`;
        this._settings.set_string(color, css);
    }
}

export default CreateGroup;
