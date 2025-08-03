import Gtk from 'gi://Gtk';

class FontsDropDown {
    constructor(settings, model) {
        this._settings = settings;
        this._model = model;
        this._dropdown = new Gtk.DropDown({
            model,
            selected: 0,
        });

        this._dropdown.connect('notify::selected', () => {
            const index = this._dropdown.get_selected();
            const selected = this._model.get_string(index);
            this._settings.set_string('font-style', selected);
        });
    }
}

export default FontsDropDown;
