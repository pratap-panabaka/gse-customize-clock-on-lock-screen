import getFonts from './getFonts.js';

class DropDownWidget {
    constructor(settings, comboRow, model, key) {
        this._settings = settings;
        this._comboRow = comboRow;
        this._model = model;
        this._key = key;

        this._model.append('Default');

        if (key.endsWith('family')) {
            getFonts().then(fonts => {
                fonts.forEach(font => this._model.append(font));
                this._dropDown();
            });
        } else if (key.endsWith('weight')) {
            const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900].map(String);
            weights.forEach(wt => this._model.append(wt));
            this._dropDown();
        } else if (key.endsWith('style')) {
            const styles = ['normal', 'italic', 'oblique'];
            styles.forEach(sty => this._model.append(sty));
            this._dropDown();
        }
    }

    _dropDown() {
        const strToIndex = {};
        const indexToString = {};

        for (let i = 0; i < this._model.get_n_items(); i++) {
            const str = this._model.get_item(i).get_string();
            strToIndex[str] = i;
            indexToString[i] = str;
        }

        const current = this._settings.get_string(this._key);

        if (current in strToIndex)
            this._comboRow.selected = strToIndex[current];


        this._comboRow.connect('notify::selected', () => {
            const selectedIndex = this._comboRow.selected;
            const selectedString = indexToString[selectedIndex];

            this._settings.set_string(this._key, selectedString);
        });
    }
}

export default DropDownWidget;
