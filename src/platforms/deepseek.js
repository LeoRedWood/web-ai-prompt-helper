const PLATFORM = {
    input: 'textarea[name="search"]',

    isNewChat() {
        return window.location.pathname === "/";
    }
};