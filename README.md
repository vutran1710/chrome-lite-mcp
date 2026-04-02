# chrome-mcp

Local Chrome browser automation via MCP (Model Context Protocol). No remote bridges, no account matching — purely localhost.

Works with any MCP-compatible client.

## How It Works

```
MCP Client <-stdio-> MCP Server <-WebSocket-> Chrome Extension <-Chrome API-> Web Pages
```

The Chrome extension connects to a local WebSocket server. The MCP client talks to the MCP server via stdio. Everything stays on localhost.

## Setup

### Local development

1. Open Chrome -> `chrome://extensions` -> Enable Developer Mode -> Load unpacked -> select `extension/`
2. `cd server && npm install`
3. Connect your MCP client to `server/index.js` via stdio

### Server deployment

Download the latest release tarball:

```bash
REPO="vutran1710/chrome-mcp"
DOWNLOAD_URL=$(curl -sfL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep -o 'https://[^"]*chrome-mcp-.*\.tar\.gz[^"]*' | head -1)
mkdir -p /opt/chrome-mcp
curl -sfL "$DOWNLOAD_URL" | tar -xz -C /opt/chrome-mcp
```

The tarball includes `server/` (with node_modules), `extension/`, and `docs/`.

Launch Chrome with the extension and start the MCP server:

```bash
# Start MCP server (WebSocket on port 7331)
node /opt/chrome-mcp/server/index.js &

# Launch Chrome with extension auto-loaded
chromium --load-extension=/opt/chrome-mcp/extension &
```

### MCP config

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

## Releases

Tagged releases are built automatically via GitHub Actions. To create a release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The workflow builds a tarball (`chrome-mcp-v0.2.0.tar.gz`) containing:
- `server/` — MCP server with bundled node_modules
- `extension/` — Chrome Manifest V3 extension
- `docs/` — Design docs and app-specific skills reference

## Tools

| Tool | Description |
|------|-------------|
| `tabs_list` | List all open tabs |
| `tab_create` | Create a new tab |
| `tab_navigate` | Navigate a tab to a URL |
| `tab_close` | Close a tab |
| `tab_switch` | Activate a tab |
| `page_read` | Read page content (modes: text, interactive, accessibility) |
| `page_click` | Click by CSS selector or coordinates |
| `page_type` | Type text into an element |
| `page_screenshot` | Capture visible tab as PNG |
| `page_eval` | Execute JS via DevTools Protocol (bypasses CSP) |

## Docs

- `docs/design.md` — Architecture, API reference, WebSocket protocol
- `docs/skills.md` — App-specific automation patterns (Gmail, Discord, Zalo, Messenger, Slack)

## Testing

```bash
cd server && npm test
```
