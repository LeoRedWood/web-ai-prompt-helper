let tagBar = null;
let cachedTemplates = [];
let activeTags = new Set();

function waitForInput(timeout = 10000) {
    
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const el = document.querySelector(PLATFORM.input);
      if (el) { clearInterval(timer); resolve(el); }
      else if (Date.now() - start > timeout) { clearInterval(timer); reject(new Error("等不到输入框")); }
    }, 200);
  });
}

// ===== 标签行 =====

const TAG_STYLE = `
  .pi-bar { display:flex; flex-wrap:wrap; gap:3px; padding:0 0 4px 0; align-items:center; }
  .pi-imgtag { cursor:pointer; display:inline-block; padding:0 2px; background:none; border:none; }
`;

function injectStyle() {
  if (document.getElementById("pi-style")) return;
  const s = document.createElement("style");
  s.id = "pi-style";
  s.textContent = TAG_STYLE;
  document.head.appendChild(s);
}

function injectTagBar(inputEl) {
  if (tagBar) tagBar.remove();
  // ponytail: 每个平台可自定义挂载点，默认往上 3 层
  let anchor = inputEl;
  if (PLATFORM.mount) {
    anchor = PLATFORM.mount(inputEl);
  } else {
    for (let i = 0; i < 3; i++) anchor = anchor.parentElement;
  }
  tagBar = document.createElement("div");
  tagBar.className = "pi-bar";
  anchor.parentElement.insertBefore(tagBar, anchor);
  renderTags();
}

// ponytail: 刷新插件后旧 content script 的 chrome API 失效
function safeURL(path) {
  if (!chrome.runtime?.id) return path;
  return chrome.runtime.getURL(path);
}

function renderTags() {
  if (cachedTemplates.length === 0) { tagBar.innerHTML = ""; return; }
  try {
    tagBar.innerHTML = cachedTemplates.map((t, i) => {
      const on = activeTags.has(t.id);
      const d = t.display || {};
      const sc = on ? (d.on || d.off) : (d.off || d.on);
      const st = (sc && sc.type) || d.type;
      if (st === "image" || t.iconOff || t.iconOn) {
        let src, imgStyle = "height:24px;display:block;";
        if (sc) {
          src = safeURL(typeof sc === "string" ? sc : (sc.src || ""));
          if (sc.style) imgStyle = toStyle(sc.style);
        } else {
          src = on ? (t.iconOn || t.iconOff) : (t.iconOff || t.iconOn);
        }
        return `<span data-id="${t.id}" class="pi-imgtag" title="${escapeHtml(t.name)}">
          <img src="${src}" style="${imgStyle}">
        </span>`;
      }
      const s = sc ? toStyle(sc.style) : toStyle(on ? d.onStyle : d.style);
      return `<span data-id="${t.id}" style="${s}">${escapeHtml(t.name)}</span>`;
    }).join("");
  } catch (e) {
    console.log("[renderTags]", e.message);
    return;
  }

  tagBar.querySelectorAll("[data-id]").forEach(tag => {
    tag.addEventListener("click", e => {
      e.stopPropagation();
      const id = tag.dataset.id;
      activeTags.has(id) ? activeTags.delete(id) : activeTags.add(id);
      renderTags();
      rebuildTextarea();
    });
  });
}

// 支持字符串 "a:1;b:2" 或数组 ["a:1","b:2"]
function toStyle(v) {
  if (!v) return "";
  return Array.isArray(v) ? v.join(";") : v;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== 输入框实时拼接 =====

let _rebuilding = false; // ponytail: 防止 contenteditable 写入触发 MutationObserver 死循环

function rebuildTextarea() {
  if (_rebuilding) return;
  const inputEl = document.querySelector(PLATFORM.input);
  if (!inputEl) return;
  _rebuilding = true;
  try {
    let userText = PLATFORM.read(inputEl) || "";
    for (const t of cachedTemplates) {
      userText = userText.replaceAll(t.text, "");
    }
    userText = userText.replaceAll("\n\n---\n\n", "").trim();

    const toInject = cachedTemplates.filter(t => activeTags.has(t.id));
    if (toInject.length > 0) {
      const prefix = toInject.map(t => t.text).join("\n\n");
      PLATFORM.write(inputEl, prefix + "\n\n---\n\n" + userText);
    } else {
      PLATFORM.write(inputEl, userText);
    }
    PLATFORM.changed(inputEl);
  } finally {
    _rebuilding = false;
  }
}

// hotkey: Alt + num

document.addEventListener("keydown", (e) => {

  if (!e.altKey || e.ctrlKey) return;
  const n = +e.key;
  if (isNaN(n) || n < 1 || n > 10) return;
  const idx = n === 10 ? 9 : n - 1;
  if (idx >= cachedTemplates.length) return;
  e.preventDefault();
  const id = cachedTemplates[idx].id;
  activeTags.has(id) ? activeTags.delete(id) : activeTags.add(id);
  renderTags();
  rebuildTextarea();
}, true);

// ===== DOM 变化：SPA 切路由后重新挂标签行 =====

// ponytail: observer 只负责恢复标签栏 UI，绝不碰输入框文字
// 文字只由三处写入：启动、点击标签、快捷键
let _reinjectTimer = null;

function tryReinject() {
  if (tagBar && tagBar.isConnected) return;
  if (_reinjectTimer) return;
  _reinjectTimer = setTimeout(() => {
    _reinjectTimer = null;
    if (tagBar && tagBar.isConnected) return;
    if (!PLATFORM.isNewChat()) {
      activeTags.clear();
    }
    const inputEl = document.querySelector(PLATFORM.input);
    if (inputEl) {
      injectTagBar(inputEl);
    }
  }, 200);
}

new MutationObserver(() => tryReinject()).observe(document.body, {
  childList: true, subtree: true,
});

// ===== 启动 =====

(async () => {
  try {
    if (!chrome.runtime?.id) return; // 旧 content script，扩展已刷新
    injectStyle();
    const resp = await fetch(safeURL("templates.json"));
    cachedTemplates = await resp.json();
    for (const t of cachedTemplates) {
      if (t.file) {
        const tr = await fetch(safeURL(t.file));
        t.text = await tr.text();
      }
    }
    cachedTemplates.forEach(t => { if (t.isDefault) activeTags.add(t.id); });
    const inputEl = await waitForInput();
    injectTagBar(inputEl);
    rebuildTextarea();
  } catch (e) {
    console.log("[PromptInjector]", e.message);
  }
})();
