import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

export class ChromeBridge {
  constructor(port = 7331) {
    this.port = port;
    this.client = null;
    this.pending = new Map();
    this.wss = null;
  }

  start() {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({ port: this.port });
      this.wss.on("connection", (ws) => {
        this.client = ws;
        this._log("extension connected");
        ws.on("message", (data) => this._handleResponse(data));
        ws.on("close", () => { this.client = null; this._log("extension disconnected"); });
      });
      this.wss.on("listening", () => { this._log(`listening on port ${this.port}`); resolve(); });
      this.wss.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          this.wss = null;
          process.stderr.write(`Port ${this.port} in use, retrying in 1s...\n`);
          setTimeout(() => this.start().then(resolve), 1000);
        }
      });
    });
  }

  stop() {
    this.wss?.close();
  }

  get connected() {
    return this.client?.readyState === 1;
  }

  async send(method, params = {}, timeout = 30000) {
    if (!this.connected) {
      await this._waitForConnection(timeout);
    }

    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }, timeout);

      this.pending.set(id, { resolve, reject, timer });
      this.client.send(JSON.stringify({ id, method, params }));
    });
  }

  _waitForConnection(timeout = 30000) {
    if (this.connected) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error("Chrome extension not connected")), timeout);
      const check = setInterval(() => {
        if (this.connected) {
          clearInterval(check);
          clearTimeout(deadline);
          resolve();
        }
      }, 500);
    });
  }

  _log(msg) {
    process.stderr.write(`[chrome-mcp] ${msg}\n`);
  }

  _handleResponse(data) {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    // Ignore keep-alive pings from extension
    if (msg.id === "ping" && msg.method === "ping") return;

    const req = this.pending.get(msg.id);
    if (!req) return;

    this.pending.delete(msg.id);
    clearTimeout(req.timer);

    if (msg.error) {
      req.reject(new Error(msg.error));
    } else {
      req.resolve(msg.result);
    }
  }
}
