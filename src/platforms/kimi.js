// Kimi: Lexical — 模拟 Ctrl+A 全选，再粘贴替换
const PLATFORM = {
    input: '.chat-input-editor',

    read(el)   { return el.innerText; },
    write(el, v) {
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));
        const dt = new DataTransfer();
        dt.setData('text/plain', v);
        el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
    },
    changed(el) {},

    isNewChat() {
        return window.location.pathname === "/";
    }
};