import { ensureTab, evaluate, realClick, sleep } from "./helpers.js";

export default {
  name: "zalo",
  url: "https://chat.zalo.me",

  async init(bridge) {
    const tabId = await ensureTab(bridge, "https://chat.zalo.me");
    await sleep(3000);
    return evaluate(bridge, tabId, `
      (() => {
        if (document.title.includes('Zalo') && !document.title.includes('Đăng nhập')) {
          return { loggedIn: true };
        }
        return { loggedIn: false, message: "Please scan QR code to log in to Zalo" };
      })()
    `);
  },
  tools: {
    list_chats: {
      description: "List Zalo conversations with last message preview",
      async handler(bridge) {
        const tabId = await ensureTab(bridge, "https://chat.zalo.me");
        await sleep(1000);
        return evaluate(bridge, tabId, `
          (() => {
            const items = document.querySelectorAll('.conv-item');
            const chats = [];
            items.forEach(item => {
              const name = item.querySelector('.conv-item-title__name')?.textContent?.trim() || '';
              const lastMsg = item.querySelector('[class*="conv-last"]')?.textContent?.trim() || '';
              const time = item.querySelector('[class*="conv-item-time"]')?.textContent?.trim() || '';
              if (name) chats.push({ name, lastMsg, time });
            });
            return chats;
          })()
        `);
      },
    },

    read_chat: {
      description: "Read messages from a conversation. Params: { chat: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://chat.zalo.me");
        if (params.chat) {
          // Click on the conversation
          await realClick(bridge, tabId, `
            const items = document.querySelectorAll('.conv-item');
            for (const item of items) {
              if (item.textContent.includes(${JSON.stringify(params.chat)})) {
                realClick(item);
                return { ok: true };
              }
            }
            return { error: 'chat not found' };
          `);
          await sleep(2000);
        }
        return evaluate(bridge, tabId, `
          (() => {
            const msgs = document.querySelectorAll('.chat-message, .chat-message-v2');
            const results = [];
            msgs.forEach(m => {
              const sender = m.querySelector('.message-sender-name-content')?.textContent?.trim() || '';
              const text = m.querySelector('.text-message__container')?.textContent?.trim() || '';
              const img = m.querySelector('.img-msg-v2') ? '[image]' : '';
              const sticker = m.querySelector('.sticker-message') ? '[sticker]' : '';
              const isMe = !!m.closest('.message-wrapper--me');
              results.push({
                sender: isMe ? 'Me' : (sender || 'same'),
                content: text || img || sticker || '[other]',
              });
            });
            return results.slice(-25);
          })()
        `);
      },
    },

    send_message: {
      description: "Send a message in the current chat. Params: { text: string }",
      async handler(bridge, params) {
        const tabId = await ensureTab(bridge, "https://chat.zalo.me");
        return evaluate(bridge, tabId, `
          (() => {
            const editor = document.querySelector('[class*="chat-input"] [contenteditable="true"]');
            if (!editor) return { error: 'input not found' };
            editor.focus();
            document.execCommand('insertText', false, ${JSON.stringify(params.text || '')});
            return { ok: true };
          })()
        `);
      },
    },
  },
};
