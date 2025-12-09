class WebSocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnects = 10;
  }

  getWsUrl() {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8000/ws/questions';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;

    // For localhost/dev: connect directly to port 8000
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `${protocol}://localhost:8000/ws/questions`;
    }

    // For production: use same host (Next.js rewrites will handle it)
    return `${protocol}://${window.location.hostname}/api/ws/questions`;
  }


  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(this.getWsUrl());
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.data || data);
    };
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
      if (this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 3000);
      }
    };
  }

  disconnect() {
    this.socket?.close();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

const wsManager = typeof window !== 'undefined' ? new WebSocketManager() : null;
export default wsManager;
