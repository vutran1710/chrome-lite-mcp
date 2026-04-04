import { ensureTab, evaluate, navigate, sleep } from "./helpers.js";

export default {
  name: "messenger",
  url: "https://www.messenger.com",

  async init(bridge) {
    const tabId = await ensureTab(bridge, "https://www.messenger.com");
    await sleep(3000);
    return evaluate(bridge, tabId, `
      (() => {
        if (document.title.includes('Messenger') && !document.querySelector('[name="email"]')) {
          return { loggedIn: true };
        }
        return { loggedIn: false, message: "Please log in to Messenger" };
      })()
    `);
  },
  tools: {
    list_chats: {
      description: "List Messenger conversations with last message preview",
      async handler(bridge) {
        const tabId = await ensureTab(bridge, "https://www.messenger.com");
        await sleep(2000);
        return evaluate(bridge, tabId, `
          (() => {
            const rows = document.querySelectorAll('[role="row"], [role="listitem"]');
            const convos = [];
            const seen = new Set();
            rows.forEach(r => {
              const spans = r.querySelectorAll('span[dir="auto"]');
              const texts = Array.from(spans).map(s => s.textContent.trim()).filter(t => t.length > 0);
              if (texts.length >= 1) {
                const key = texts[0];
                if (!seen.has(key)) {
                  seen.add(key);
                  convos.push({ name: texts[0], preview: texts.slice(1, 3).join(' ') });
                }
              }
            });
            return convos.slice(0, 20);
          })()
        `);
      },
    },

    read_chat: {
      description: "Read messages from a conversation. Params: { contact: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://www.messenger.com");
        if (params.contact) {
          // Find and navigate to the contact's chat
          const href = await evaluate(bridge, tabId, `
            (() => {
              const links = document.querySelectorAll('a[href*="/t/"]');
              for (const a of links) {
                if (a.textContent.includes(${JSON.stringify(params.contact)})) {
                  return a.href;
                }
              }
              return null;
            })()
          `);
          if (href) {
            await navigate(bridge, tabId, href);
            await sleep(2000);
          }
        }
        return evaluate(bridge, tabId, `
          (() => {
            const rows = document.querySelectorAll('[role="row"]');
            const messages = [];
            rows.forEach(row => {
              const texts = row.querySelectorAll('[dir="auto"]');
              const content = Array.from(texts).map(t => t.textContent.trim()).filter(t => t.length > 0 && t.length < 500);
              if (content.length > 0) messages.push({ content: content.join(' | ') });
            });
            return messages.slice(-20);
          })()
        `);
      },
    },

    send_message: {
      description: "Send a message in the current chat. Params: { text: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://www.messenger.com");
        return evaluate(bridge, tabId, `
          (() => {
            const editor = document.querySelector('[role="textbox"][contenteditable="true"]');
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
