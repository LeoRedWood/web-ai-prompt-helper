// Doubao: Semi Design React textarea
const PLATFORM = {
    input: 'textarea.semi-input-textarea',

    read(el)   { return el.value; },
    write(el, v) {
        const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        s.call(el, v);
    },
    changed(el) { el.dispatchEvent(new InputEvent("input", { bubbles: true })); },

    isNewChat() {
        return window.location.pathname === "/chat";
    }
};