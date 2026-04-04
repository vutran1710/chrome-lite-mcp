import { ensureTab, evaluate, sleep } from "./helpers.js";

export default {
  name: "slack",
  url: "https://app.slack.com",

  async init(bridge) {
    const tabId = await ensureTab(bridge, "https://app.slack.com");
    await sleep(3000);
    return evaluate(bridge, tabId, `
      (() => {
        if (document.querySelector('[data-qa="channel_sidebar"]')) {
          return { loggedIn: true };
        }
        return { loggedIn: false, message: "Please log in to Slack" };
      })()
    `);
  },
  tools: {
    list_channels: {
      description: "List Slack channels and DMs with unread status",
      async handler(bridge) {
        const tabId = await ensureTab(bridge, "https://app.slack.com");
        await sleep(1000);
        return evaluate(bridge, tabId, `
          (() => {
            const items = document.querySelectorAll('[data-qa="channel_sidebar_item"]');
            const channels = [];
            items.forEach(item => {
              const name = item.querySelector('[data-qa="channel_sidebar_label_text"]')?.textContent || '';
              const unread = item.querySelector('[data-qa="channel_sidebar_unread_badge"]')?.textContent || '';
              if (name) channels.push({ name, unread: unread || null });
            });
            return channels;
          })()
        `);
      },
    },

    read_messages: {
      description: "Read messages from a channel. Params: { channel: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://app.slack.com");
        if (params.channel) {
          await evaluate(bridge, tabId, `
            (() => {
              const items = document.querySelectorAll('[data-qa="channel_sidebar_item"]');
              for (const item of items) {
                const label = item.querySelector('[data-qa="channel_sidebar_label_text"]');
                if (label?.textContent?.trim() === ${JSON.stringify(params.channel)}) {
                  item.click();
                  return { ok: true };
                }
              }
              return { error: 'channel not found' };
            })()
          `);
          await sleep(2000);
        }
        return evaluate(bridge, tabId, `
          (() => {
            const msgs = document.querySelectorAll('[data-qa="message_container"]');
            const results = [];
            msgs.forEach(m => {
              const author = m.querySelector('[data-qa="message_sender_name"]')?.textContent || '';
              const content = m.querySelector('[data-qa="message-text"]')?.textContent || '';
              const time = m.querySelector('time')?.getAttribute('datetime') || '';
              if (content) results.push({ author, content, time });
            });
            return results.slice(-20);
          })()
        `);
      },
    },

    send_message: {
      description: "Send a message in the current channel. Params: { text: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://app.slack.com");
        return evaluate(bridge, tabId, `
          (() => {
            const editor = document.querySelector('[data-qa="message_input"] [role="textbox"]');
            if (!editor) return { error: 'message input not found' };
            editor.focus();
            document.execCommand('insertText', false, ${JSON.stringify(params.text || '')});
            return { ok: true };
          })()
        `);
      },
    },
  },
};
