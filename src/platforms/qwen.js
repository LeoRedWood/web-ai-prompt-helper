// Qwen: React textarea
const PLATFORM = {
    input: '.message-input-textarea',

    read(el)   { return el.value; },
    write(el, v) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        s.call(el, v);
    },
    changed(el) { el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" })); },

    isNewChat() {
        return window.location.pathname === "/";
    }
};