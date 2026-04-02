import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TOOLS, TOOL_NAMES } from "../tools.js";

describe("TOOLS", () => {
  const EXPECTED = [
    "tabs_list", "tab_create", "tab_navigate", "tab_close",
    "tab_switch", "page_read", "page_click", "page_type", "page_screenshot",
  ];

  it("defines all expected tools", () => {
    assert.deepEqual(TOOL_NAMES, EXPECTED);
  });

  it("every tool has description and schema", () => {
    for (const [name, tool] of Object.entries(TOOLS)) {
      assert.ok(tool.description, `${name}: missing description`);
      assert.ok(typeof tool.schema === "object", `${name}: missing schema`);
    }
  });

  it("tools requiring tabId have it in schema", () => {
    const needsTabId = ["tab_navigate", "tab_close", "tab_switch", "page_read", "page_click", "page_type", "page_screenshot"];
    for (const name of needsTabId) {
      assert.ok(TOOLS[name].schema.tabId, `${name}: should have tabId in schema`);
    }
  });

  it("tab_navigate has url in schema", () => {
    assert.ok(TOOLS.tab_navigate.schema.url);
  });

  it("page_type has text in schema", () => {
    assert.ok(TOOLS.page_type.schema.text);
  });

  it("tabs_list has empty schema", () => {
    assert.deepEqual(TOOLS.tabs_list.schema, {});
  });
});
