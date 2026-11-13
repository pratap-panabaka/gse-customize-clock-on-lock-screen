const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/v-45-46-47-48-49-50/extension.js', 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace('export default class', 'globalThis.ExtensionClass = class');
function setup(modern) {
    const original = {visible: true, opacity: 255, destroy() {this.destroyed = true;}};
    const stack = {child: original, replace_child(before, after) {
        assert.equal(this.child, before);
        this.child = after;
    }};
    if (modern) stack._clock = original;
    const dialog = {_clock: original, _stack: stack, _activePage: original,
        _selectedAuthMechanism: {hint: 'Use your security key'},
        _promptBox: {y_align: 7, set_y_align(value) {this.y_align = value;}},
        connect(name, cb) {this.onDestroy = cb; return 1;},
        disconnect(id) {assert.equal(id, 1);}};
    class Clock {
        set_pivot_point() {}
        selectAuthHint(hint) {this.hint = hint;}
        destroy() {this.destroyed = true;}
    }
    const context = {Clutter: {ActorAlign: {CENTER: 2}},
        Extension: class {getSettings() {return {}; }}, ModifiedClock: Clock,
        Main: {screenShield: {_dialog: dialog}, layoutManager: {primaryMonitor: {width: 1920}}}};
    vm.runInNewContext(source, context);
    return {extension: new context.ExtensionClass(), dialog, original, context};
}
for (const modern of [false, true]) {
    test(`restore clock and active page over repeated cycles, modern=${modern}`, () => {
        const {extension, dialog, original} = setup(modern);
        for (let i = 0; i < 3; i++) {
            extension.enable();
            const custom = dialog._clock;
            assert.notEqual(custom, original);
            assert.equal(custom.hint, 'Use your security key');
            assert.equal(dialog._activePage, custom);
            if (modern) assert.equal(dialog._stack._clock, custom);
            extension.disable();
            assert.equal(dialog._clock, original);
            assert.equal(dialog._activePage, original);
            assert.equal(dialog._stack.child, original);
            if (modern) assert.equal(dialog._stack._clock, original);
            assert.equal(dialog._promptBox.y_align, 7);
            assert.equal(custom.destroyed, true);
            assert.equal(original.destroyed, undefined);
        }
        extension.disable();
    });
}
test('missing dialog is harmless', () => {
    const {extension, context} = setup(true);
    context.Main.screenShield._dialog = null;
    extension.enable();
    extension.disable();
});
test('dialog destruction also destroys detached original', () => {
    const {extension, dialog, original} = setup(true);
    extension.enable();
    dialog.onDestroy();
    assert.equal(original.destroyed, true);
    extension.disable();
});
