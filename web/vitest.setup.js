import { TextEncoder, TextDecoder } from 'node:util';

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

globalThis.PIXI = {
  Application: class {
    constructor() {
      this.view = document.createElement('canvas');
      this.stage = { addChild() {} };
    }
  },
  Container: class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.addChild = () => {};
    }
  },
  Graphics: class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.eventMode = '';
      this.cursor = '';
      this.__pos = null;
    }
    beginFill() {}
    lineStyle() {}
    drawRect() {}
    endFill() {}
    clear() {}
    on() {}
  },
  Text: class {
    constructor() {
      this.y = 0;
    }
  },
};

class FakeAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'square',
      frequency: { value: 440 },
      connect() { return this; },
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: { value: 0.05 },
      connect() { return this; },
    };
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(1),
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect() { return this; },
      start() {},
    };
  }
  resume() { return Promise.resolve(); }
}

globalThis.AudioContext = FakeAudioContext;

globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({ status: 'ok' }),
});

class FakeWebSocket {
  static OPEN = 1;
  constructor() {
    this.readyState = FakeWebSocket.OPEN;
    this._listeners = {};
    setTimeout(() => this._emit('open'), 0);
  }
  addEventListener(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }
  send() {}
  close() {
    this.readyState = 3;
    this._emit('close');
  }
  _emit(event, data) {
    (this._listeners[event] || []).forEach((cb) => cb(data));
  }
}

globalThis.WebSocket = FakeWebSocket;
