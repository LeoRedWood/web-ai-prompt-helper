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
  let container = inputEl;
  for (let i = 0; i < 3; i++) container = container.parentElement;
  tagBar = document.createElement("div");
  tagBar.className = "pi-bar";
  container.parentElement.insertBefore(tagBar, container);
  renderTags();
}

function renderTags() {
  if (cachedTemplates.length === 0) { tagBar.innerHTML = ""; return; }
  tagBar.innerHTML = cachedTemplates.map((t, i) => {
    const on = activeTags.has(t.id);
    const d = t.display || {};
    const sc = on ? (d.on || d.off) : (d.off || d.on);
    const st = (sc && sc.type) || d.type;
    if (st === "image" || t.iconOff || t.iconOn) {
      let src, imgStyle = "height:24px;display:block;";
      if (sc) {
        src = chrome.runtime.getURL(typeof sc === "string" ? sc : sc.src);
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

function rebuildTextarea() {
  const inputEl = document.querySelector(PLATFORM.input);
  if (!inputEl) return;

  // 拿到用户手打的文字（去掉之前注入的模板文本和分隔符）
  let userText = inputEl.value || "";
  for (const t of cachedTemplates) {
    userText = userText.replace(t.text, "");
  }
  userText = userText.replace(/\n\n---\n\n/g, "").trim();

  // 拼上当前激活的模板
  const toInject = cachedTemplates.filter(t => activeTags.has(t.id));
  if (toInject.length > 0) {
    const prefix = toInject.map(t => t.text).join("\n\n");
    inputEl.value = prefix + "\n\n---\n\n" + userText;
  } else {
    inputEl.value = userText;
  }
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
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

function tryReinject() {
  if (tagBar && tagBar.isConnected) return;
  // 新对话第一条发完，默认标签灭掉
  if (!PLATFORM.isNewChat()) {
    activeTags.clear();
  }
  const inputEl = document.querySelector(PLATFORM.input);
  if (inputEl) {
    injectTagBar(inputEl);
    rebuildTextarea();
  }
}

new MutationObserver(() => tryReinject()).observe(document.body, {
  childList: true, subtree: true,
});

// ===== 启动 =====

(async () => {
  try {
    injectStyle();
    const resp = await fetch(chrome.runtime.getURL("templates.json"));
    cachedTemplates = await resp.json();
    // 解析 file 引用
    for (const t of cachedTemplates) {
      if (t.file) {
        const tr = await fetch(chrome.runtime.getURL(t.file));
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
