// Doubao: Semi Design React textarea
const PLATFORM = {
    input: 'textarea.semi-input-textarea',

    read(el)   { return el.value; },
    write(el, v) {
        const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        s.call(el, v);
    },
    changed(el) { el.dispatchEvent(new InputEvent("input", { bubbles: true })); },

    mount(el) {
        let c = el;
        for (let i = 0; i < 9; i++) c = c.parentElement;
        return c;
    },

    isNewChat() {
        return window.location.pathname === "/chat";
    }
};