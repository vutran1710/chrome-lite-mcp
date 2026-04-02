import { z } from "zod";

export const TOOLS = {
  tabs_list: {
    description: "List all open browser tabs",
    schema: {},
  },
  tab_create: {
    description: "Create a new tab",
    schema: {
      url: z.string().optional().describe("URL to open"),
    },
  },
  tab_navigate: {
    description: "Navigate a tab to a URL",
    schema: {
      tabId: z.number().describe("Tab ID"),
      url: z.string().describe("URL to navigate to"),
    },
  },
  tab_close: {
    description: "Close a tab",
    schema: {
      tabId: z.number().describe("Tab ID"),
    },
  },
  tab_switch: {
    description: "Switch to (activate) a tab",
    schema: {
      tabId: z.number().describe("Tab ID"),
    },
  },
  page_read: {
    description:
      "Read page content. Modes: 'text' (default, readable text with flattened wrappers), 'interactive' (buttons/links/inputs only), 'accessibility' (Chrome accessibility tree via debugger). Optional CSS selector to scope.",
    schema: {
      tabId: z.number().describe("Tab ID"),
      selector: z.string().optional().describe("CSS selector to scope reading to a subtree"),
      mode: z
        .enum(["text", "interactive", "accessibility"])
        .optional()
        .describe("Read mode: text (default), interactive, or accessibility"),
    },
  },
  page_click: {
    description: "Click an element by CSS selector or coordinates",
    schema: {
      tabId: z.number().describe("Tab ID"),
      selector: z.string().optional().describe("CSS selector"),
      x: z.number().optional().describe("X coordinate"),
      y: z.number().optional().describe("Y coordinate"),
    },
  },
  page_type: {
    description: "Type text into an element",
    schema: {
      tabId: z.number().describe("Tab ID"),
      text: z.string().describe("Text to type"),
      selector: z.string().optional().describe("CSS selector (defaults to active element)"),
    },
  },
  page_screenshot: {
    description: "Capture a screenshot of the visible tab area",
    schema: {
      tabId: z.number().describe("Tab ID"),
    },
  },
  page_eval: {
    description:
      "Execute JavaScript in the page context via Chrome DevTools Protocol (bypasses CSP). Returns the evaluated result.",
    schema: {
      tabId: z.number().describe("Tab ID"),
      code: z.string().describe("JavaScript expression to evaluate"),
    },
  },
};

export const TOOL_NAMES = Object.keys(TOOLS);
