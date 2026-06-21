const PLATFORM = {
    input: 'textarea[name="search"]',

    read(el)   { return el.value; },
    write(el, v) { el.value = v; },
    changed(el) { el.dispatchEvent(new Event("input", { bubbles: true })); },

    isNewChat() {
        return window.location.pathname === "/";
    }
};