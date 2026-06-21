# web-ai-prompt-helper

网页版 AI prompt 增强助手

## 支持平台（目前）

| 平台 | 网址 |
|------|------|
| DeepSeek | chat.deepseek.com |
| Kimi | www.kimi.com |
| Qwen (通义千问) | chat.qwen.ai |
| Doubao (豆包) | www.doubao.com |

## 安装

1. 下载 zip 解压，或 clone 本仓库
2. 打开 `chrome://extensions/`，开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择项目根目录

./prompts下放prompts，并在templates.json中的file字段指定。

或者直接在templates.json的text字段填写较短的提示词。

## 美化配置

编辑 `templates.json`，每个模板可配置：

- `id` — 唯一标识
- `name` — 标签显示名
- `text` — 提示词内容（短的直接写）
- `file` — 或引用外部文件，如 `"prompts/foo.md"`（长的推荐）
- `isDefault` — `true` 则页面加载时自动激活
- `display` — 标签展示方式

### display 类型

**text** — 文字标签：

```json
"display": {
  "type": "text",
  "style": ["font-size:10px", "padding:1px 4px", ...],
  "onStyle": ["background:#6366f1", ...]
}
```

**image** — 图片/GIF 标签：

```json
"display": {
  "off": { "src": "icons/off.png", "style": ["height:24px"] },
  "on":  { "src": "icons/on.gif",  "style": ["height:48px"] }
}
```

`off`/`on` 可各自声明 `type: "text"` 或 `type: "image"`，混合使用。

## 使用

- **点击标签** — 切换 on/off
- **`Alt+1` ~ `Alt+9`** — 切换第 1~9 个模板
- **`Alt+0`** — 切换第 10 个

修改 `templates.json` 后刷新插件，再刷新目标网页即可生效。

## 目录结构

```
├── manifest.json
├── templates.json      ← 配置文件（手改）
├── icons/              ← 图片素材
├── prompts/            ← 长提示词 .md 文件
└── src/
    ├── content.js      ← 核心逻辑
    └── platforms/      ← 各平台适配
```

## 注意

1. 建议在内存充足的情况下使用，或选择体积较小的img文件
2. 部分代码由AI配合生成，不保证绝对的安全性
3. 测试平台：win10 chrome
4. chatgpt, gemini, grok等平台编辑器暂不支持，up懒得做了

## 鸣谢

deepseek-v4-pro