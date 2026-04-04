import { ensureTab, evaluate, navigate, click, sleep } from "./helpers.js";

export default {
  name: "discord",
  url: "https://discord.com/channels/@me",

  async init(bridge) {
    const tabId = await ensureTab(bridge, "https://discord.com/channels/@me");
    await sleep(3000);
    return evaluate(bridge, tabId, `
      (() => {
        if (document.querySelector('[class*="guilds_"]')) return { loggedIn: true };
        return { loggedIn: false, message: "Please log in to Discord" };
      })()
    `);
  },
  tools: {
    list_dms: {
      description: "List Discord DMs with online status and last message preview",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://discord.com");
        await navigate(bridge, tabId, BASE_URL);
        await sleep(2000);
        return evaluate(bridge, tabId, `
          (() => {
            const items = document.querySelectorAll('a[href*="/channels/@me/"]');
            const dms = [];
            const seen = new Set();
            items.forEach(a => {
              const name = a.querySelector('[class*="name_"]')?.textContent?.trim() || '';
              if (!name || seen.has(name)) return;
              seen.add(name);
              const status = a.querySelector('[class*="status_"]')?.textContent?.trim() || '';
              const isUnread = !!a.querySelector('[class*="unread"]');
              dms.push({ name, status, unread: isUnread, href: a.href });
            });
            return dms;
          })()
        `);
      },
    },

    read_chat: {
      description: "Read recent messages from a DM or channel. Params: { channel: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://discord.com");
        // Click on the DM by name
        if (params.channel) {
          await click(bridge, tabId, `[aria-label*="${params.channel}"][aria-label*="direct message"]`);
          await sleep(2000);
        }
        return evaluate(bridge, tabId, `
          (() => {
            const msgs = document.querySelectorAll('[class*="message_"]');
            const results = [];
            msgs.forEach(m => {
              const author = m.querySelector('[class*="username_"]')?.textContent || '';
              const timestamp = m.querySelector('time')?.textContent || '';
              const content = m.querySelector('[class*="messageContent_"]')?.textContent || '';
              if (content || author) results.push({ author, timestamp, content });
            });
            return results.slice(-20);
          })()
        `);
      },
    },

    send_message: {
      description: "Send a message in the current chat. Params: { text: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://discord.com");
        return evaluate(bridge, tabId, `
          (() => {
            const editor = document.querySelector('[role="textbox"][class*="textArea_"]');
            if (!editor) return { error: 'textbox not found' };
            editor.focus();
            document.execCommand('insertText', false, ${JSON.stringify(params.text || '')});
            return { ok: true };
          })()
        `);
      },
    },
  },
};
