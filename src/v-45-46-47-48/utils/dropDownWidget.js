class DropDownWidget {
    constructor(settings, comboRow, model, key, fonts) {
        model.append('Default');

        if (key.endsWith('family')) {
            fonts.forEach(font => model.append(font));
        } else if (key.endsWith('weight')) {
            const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900].map(String);
            weights.forEach(wt => model.append(wt));
        } else if (key.endsWith('style')) {
            const styles = ['normal', 'italic', 'oblique'];
            styles.forEach(sty => model.append(sty));
        }

        const strToIndex = {};
        const indexToString = {};

        for (let i = 0; i < model.get_n_items(); i++) {
            const str = model.get_item(i).get_string();
            strToIndex[str] = i;
            indexToString[i] = str;
        }

        const current = settings.get_string(key);

        if (current in strToIndex)
            comboRow.selected = strToIndex[current];


        comboRow.connect('notify::selected', () => {
            const selectedIndex = comboRow.selected;
            const selectedString = indexToString[selectedIndex];

            settings.set_string(key, selectedString);
        });
    }
}

export default DropDownWidget;
