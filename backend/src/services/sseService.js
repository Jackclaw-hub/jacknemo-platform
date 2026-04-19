// Server-Sent Events service — manages per-provider SSE connections
const EventEmitter = require('events');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // providerId -> Set of res objects
  }

  addClient(providerId, res) {
    if (!this.clients.has(providerId)) {
      this.clients.set(providerId, new Set());
    }
    this.clients.get(providerId).add(res);
    console.log(`[SSE] Provider ${providerId} connected (${this.clients.get(providerId).size} connections)`);
  }

  removeClient(providerId, res) {
    const set = this.clients.get(providerId);
    if (set) {
      set.delete(res);
      if (set.size === 0) this.clients.delete(providerId);
    }
  }

  emitToProvider(providerId, event, data) {
    const set = this.clients.get(String(providerId));
    if (!set || set.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
      try { res.write(payload); } catch (e) { /* client disconnected */ }
    }
  }

  emitHeartbeat() {
    for (const [, set] of this.clients) {
      for (const res of set) {
        try { res.write(': heartbeat\n\n'); } catch (e) {}
      }
    }
  }
}

const sseService = new SSEService();

// Heartbeat every 30s to keep connections alive
setInterval(() => sseService.emitHeartbeat(), 30000);

module.exports = sseService;
