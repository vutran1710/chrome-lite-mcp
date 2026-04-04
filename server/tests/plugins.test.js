import { describe, it } from "node:test";
import assert from "node:assert";
import { PluginLoader } from "../plugin-loader.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = join(__dirname, "..", "..", "plugins");

describe("Plugin loading", () => {
  it("loads all plugins from plugins/ directory", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const names = loader.listPlugins();
    assert.ok(names.includes("gmail"), "should load gmail");
    assert.ok(names.includes("discord"), "should load discord");
    assert.ok(names.includes("zalo"), "should load zalo");
    assert.ok(names.includes("messenger"), "should load messenger");
    assert.ok(names.includes("slack"), "should load slack");
  });

  it("each plugin has valid tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    for (const name of loader.listPlugins()) {
      const tools = loader.listTools(name);
      assert.ok(tools.length > 0, `${name} should have at least one tool`);
      for (const tool of tools) {
        assert.ok(tool.name, `${name} tool should have a name`);
        assert.ok(tool.description, `${name}.${tool.name} should have a description`);
        const handler = loader.getHandler(name, tool.name);
        assert.strictEqual(typeof handler, "function", `${name}.${tool.name} handler should be a function`);
      }
    }
  });
});

describe("Gmail plugin", () => {
  it("has expected tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const tools = loader.listTools("gmail").map((t) => t.name);
    assert.ok(tools.includes("list_emails"));
    assert.ok(tools.includes("select_by_sender"));
    assert.ok(tools.includes("select_all"));
    assert.ok(tools.includes("mark_read"));
    assert.ok(tools.includes("delete_selected"));
    assert.ok(tools.includes("archive_selected"));
  });
});

describe("Discord plugin", () => {
  it("has expected tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const tools = loader.listTools("discord").map((t) => t.name);
    assert.ok(tools.includes("list_dms"));
    assert.ok(tools.includes("read_chat"));
    assert.ok(tools.includes("send_message"));
  });
});

describe("Zalo plugin", () => {
  it("has expected tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const tools = loader.listTools("zalo").map((t) => t.name);
    assert.ok(tools.includes("list_chats"));
    assert.ok(tools.includes("read_chat"));
    assert.ok(tools.includes("send_message"));
  });
});

describe("Messenger plugin", () => {
  it("has expected tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const tools = loader.listTools("messenger").map((t) => t.name);
    assert.ok(tools.includes("list_chats"));
    assert.ok(tools.includes("read_chat"));
    assert.ok(tools.includes("send_message"));
  });
});

describe("Slack plugin", () => {
  it("has expected tools", async () => {
    const loader = new PluginLoader();
    await loader.loadDir(PLUGINS_DIR);
    const tools = loader.listTools("slack").map((t) => t.name);
    assert.ok(tools.includes("list_channels"));
    assert.ok(tools.includes("read_messages"));
    assert.ok(tools.includes("send_message"));
  });
});
