# chrome-mcp

Chrome extension + local MCP server for browser automation. No remote bridges, no account matching — purely localhost.

## Architecture

```
MCP Client
    ↕ stdio (MCP protocol)
MCP Server + WebSocket Server (Node.js, localhost:7331)
    ↕ WebSocket
Chrome Extension (connects as WS client to localhost:7331)
    ↕ Chrome Extensions API + chrome.debugger
Web pages
```

The Node.js process runs both the MCP server (stdio) and a WebSocket server. The Chrome extension connects to the WS server as a client on load. Commands flow: MCP client -> stdio -> Node.js -> WS -> extension -> Chrome API -> result back.

## API

### MCP Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `tabs_list` | — | List all tabs |
| `tab_create` | `url` | Create new tab |
| `tab_navigate` | `tabId`, `url` | Navigate tab to URL |
| `tab_close` | `tabId` | Close a tab |
| `tab_switch` | `tabId` | Focus/activate a tab |
| `page_read` | `tabId`, `selector?`, `mode?` | Read page content (modes: text, interactive, accessibility) |
| `page_click` | `tabId`, `selector` or `x,y` | Click element |
| `page_type` | `tabId`, `text`, `selector?` | Type text into element |
| `page_screenshot` | `tabId` | Capture screenshot (base64 PNG) |
| `page_eval` | `tabId`, `code` | Execute JS via Chrome DevTools Protocol (bypasses CSP) |

### page_read modes

- **text** (default) — Flattened readable content. Skips scripts/styles/svg/invisible elements. Collapses wrapper divs/spans with no semantic meaning. Depth limit: 30.
- **interactive** — Only returns interactive elements: buttons, links, inputs, textareas, selects. Useful for discovering what actions are available.
- **accessibility** — Uses `chrome.debugger` to read Chrome's full accessibility tree. Cleanest view for SPAs like Discord, Gmail. Returns flat list of `{ role, name, value, focused?, checked?, disabled?, expanded? }`.

### WebSocket Protocol (between Node server and extension)

```json
// Request (server -> extension)
{"id": "uuid", "method": "tabs_list", "params": {}}

// Response (extension -> server)
{"id": "uuid", "result": [...]}

// Error
{"id": "uuid", "error": "message"}

// Keep-alive ping (extension -> server, every 25s)
{"id": "ping", "method": "ping"}
```

## Key Implementation Details

### Service Worker Keep-Alive
Chrome kills inactive service workers after ~30s. The extension uses `chrome.alarms` (every 25s) to send WebSocket pings and prevent sleep.

### CSP Bypass
Many sites (Gmail, Discord) block inline script injection via Content Security Policy. The `page_eval` tool uses `chrome.debugger` with `Runtime.evaluate` which bypasses CSP entirely (equivalent to running code in the DevTools console).

### SPA Compatibility
Heavy SPAs require specific handling:
- Gmail: Closure Library needs full MouseEvent sequences (mousedown, mouseup, click)
- Discord: Hashed class names require partial `[class*="..."]` selectors
- See `docs/skills.md` for app-specific patterns

## File Structure

```
chrome-mcp/
├── .github/workflows/
│   └── release.yml        # GitHub Actions: build tarball on tag push
├── docs/
│   ├── design.md          # This file — architecture and API
│   └── skills.md          # App-specific automation patterns
├── extension/
│   ├── manifest.json      # Manifest V3, permissions: tabs, scripting, debugger, alarms
│   ├── background.js      # Service worker, WS client, Chrome API calls, debugger
│   └── content.js         # Injected into pages for DOM access
├── server/
│   ├── index.js           # MCP server (stdio) + WebSocket server
│   ├── bridge.js          # WebSocket bridge to Chrome extension
│   ├── tools.js           # Tool definitions with Zod schemas
│   └── package.json
├── mcp-config.json        # Example MCP client config
└── README.md
```

## Releases

Tagged releases (`git tag v0.2.0 && git push origin v0.2.0`) trigger GitHub Actions to build a tarball:

```
chrome-mcp-v0.2.0.tar.gz
├── server/          # index.js, bridge.js, tools.js, package.json, node_modules/
├── extension/       # manifest.json, background.js, content.js
└── docs/            # design.md, skills.md
```

Server deployments download and extract the tarball to `/opt/chrome-mcp/` — no `git clone` or `npm install` needed.

## Usage

```bash
# 1. Install extension in Chrome (load unpacked -> extension/)
# 2. Add to your MCP client config (see mcp-config.json)
# 3. Connect your MCP client
# Use with any MCP client
```

## MCP Config

```json
{
  "mcpServers": {
    "chrome": {
      "command": "node",
      "args": ["/path/to/chrome-mcp/server/index.js"]
    }
  }
}
```
