# Plugin Lifecycle & Extension UI

## Plugin States

```
unloaded → initializing → awaiting_login → ready
                                             ↓
                                           error
```

- **unloaded**: Plugin JS loaded, but not initialized
- **initializing**: Tab opened, checking login status
- **awaiting_login**: Needs user to log in and confirm
- **ready**: Logged in, tools are usable
- **error**: Init failed

## Plugin Interface (updated)

```js
export default {
  name: "gmail",
  url: "https://mail.google.com",

  // Check if already logged in on the current page
  // Returns { loggedIn: true } or { loggedIn: false, message: "...", qr: "base64..." }
  loginCheck: `
    (() => {
      if (document.title.includes('Inbox')) return { loggedIn: true };
      return { loggedIn: false, message: "Please log in to Gmail" };
    })()
  `,

  tools: { ... }
}
```

- `url`: The app URL to open during init
- `loginCheck`: JS expression evaluated on the page to check login status.
  Returns `{ loggedIn: true }` or `{ loggedIn: false, message, qr? }`

## Init Flow

```
1. MCP client calls: post("gmail", { tool: "init" })

2. Server:
   a. Opens tab → plugin.url
   b. Evaluates plugin.loginCheck on the page
   c. If loggedIn: mark ready, return { ready: true }
   d. If not: mark awaiting_login, notify extension popup
      → return { awaiting_login: true, message: "..." }

3. Extension popup shows:
   ┌─────────────────────────────┐
   │  Chrome Lite MCP            │
   │                             │
   │  Gmail      ⏳ Needs login  │
   │  Discord    ✓ Ready         │
   │  Zalo       — Not initialized│
   │                             │
   │  [Confirm Gmail Login]      │
   └─────────────────────────────┘

4. User logs in via the tab (or VNC if remote)

5. User clicks "Confirm" in extension popup

6. Extension sends confirm message to MCP server via WebSocket

7. Server re-evaluates loginCheck
   - If loggedIn: mark ready
   - If not: keep awaiting_login
```

## MCP Tools (updated)

Existing plugin tools + new init tool:

| Tool | Description |
|------|-------------|
| `init` | Built-in for every plugin. Opens URL, checks login, returns status |
| `status` | Built-in. Returns current plugin state |

These are auto-registered — plugin authors don't implement them.

```
post("gmail", { tool: "init" })
  → { ready: true }
  OR
  → { awaiting_login: true, message: "Please log in to Gmail" }

get("gmail", { tool: "status" })
  → { state: "ready", tabId: 123 }
```

## WebSocket Protocol (updated)

New message types between server and extension:

```json
// Server → Extension: notify popup of plugin status
{
  "id": "notify",
  "method": "plugin_status",
  "params": {
    "plugin": "gmail",
    "state": "awaiting_login",
    "message": "Please log in to Gmail",
    "tabId": 123
  }
}

// Extension → Server: user confirmed login
{
  "id": "confirm",
  "method": "plugin_confirm",
  "params": { "plugin": "gmail" }
}
```

## Extension UI

### Popup (popup.html)

Activated by clicking the extension icon. Shows:
- List of plugins with status (ready / awaiting login / not initialized)
- "Confirm" button for plugins awaiting login
- Auto-refreshes when status changes

### Manifest changes

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}
```

## File Structure (updated)

```
chrome-lite-mcp/
├── server/
│   ├── index.js
│   ├── bridge.js
│   ├── plugin-loader.js     # updated: manages plugin state
│   ├── plugin-api.js        # updated: auto-registers init/status tools
│   ├── scheduler.js
│   └── tools.js
├── plugins/
│   ├── helpers.js
│   ├── gmail.js              # updated: adds url + loginCheck
│   ├── discord.js
│   ├── zalo.js
│   ├── messenger.js
│   └── slack.js
├── extension/
│   ├── manifest.json         # updated: adds action popup
│   ├── background.js         # updated: handles plugin_status/plugin_confirm
│   ├── content.js
│   ├── popup.html            # new
│   ├── popup.js              # new
│   └── popup.css             # new
└── docs/
```
