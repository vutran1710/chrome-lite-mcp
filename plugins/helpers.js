/**
 * Shared helpers for plugins.
 * Handles tab management and page interaction via the Chrome bridge.
 */

// Cache of tab IDs by URL prefix
const tabCache = new Map();

/**
 * Ensure a tab exists for the given URL. Reuses existing tabs.
 */
export async function ensureTab(bridge, url) {
  const cached = tabCache.get(url);
  if (cached) {
    try {
      const tabs = await bridge.send("tabs_list");
      if (tabs.some((t) => t.id === cached)) return cached;
    } catch {}
    tabCache.delete(url);
  }

  // Check if any open tab matches
  const tabs = await bridge.send("tabs_list");
  const match = tabs.find((t) => t.url?.startsWith(url));
  if (match) {
    tabCache.set(url, match.id);
    return match.id;
  }

  // Create new tab
  const tab = await bridge.send("tab_create", { url });
  tabCache.set(url, tab.id);
  return tab.id;
}

/**
 * Navigate an existing tab to a URL and wait for load.
 */
export async function navigate(bridge, tabId, url) {
  return bridge.send("tab_navigate", { tabId, url });
}

/**
 * Run JavaScript in a page via DevTools Protocol.
 */
export async function evaluate(bridge, tabId, code) {
  return bridge.send("page_eval", { tabId, code });
}

/**
 * Click an element by CSS selector.
 */
export async function click(bridge, tabId, selector) {
  return bridge.send("page_click", { tabId, selector });
}

/**
 * Simulate a real click (mousedown + mouseup + click) via page_eval.
 * Needed for apps like Gmail that use custom event systems.
 */
export async function realClick(bridge, tabId, selectorOrCode) {
  return evaluate(bridge, tabId, `
    (() => {
      function realClick(el) {
        for (const type of ['mousedown', 'mouseup', 'click']) {
          el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        }
      }
      ${selectorOrCode}
    })()
  `);
}

/**
 * Sleep helper.
 */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
