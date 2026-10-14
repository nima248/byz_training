function getCaller() {
  const stack = new Error().stack;
  const lines = stack.split("\n");
  return lines[2]?.trim();
}

class Logger {
  constructor({ maxEntries = 2000 } = {}) {
    this._entries = [];
    this._maxEntries = maxEntries;
  }

  _log(level, args) {
    const caller = getCaller();
    const entry = {
      level,
      time: new Date().toISOString(),
      caller: caller,
      args,
    };

    this._entries.push(entry);

    if (this._entries.length > this._maxEntries) {
      this._entries.shift();
    }

    console[level](...args);
  }

  debug(...args) {
    this._log("debug", args);
  }
  info(...args) {
    this._log("info", args);
  }
  warn(...args) {
    this._log("warn", args);
  }
  error(...args) {
    this._log("error", args);
  }

  getEntries() {
    return this._entries.map(e => this._formatEntry(e));
  }
  _formatEntry(entry) {
    return `[${entry.level.toUpperCase()}] ${entry.time}\n${entry.caller}\n${entry.args}`
  }
}

export const logger = new Logger();

window.addEventListener("error", (event) => {
  logger.error("Unhandled error", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", event.reason);
});

function formatValue(v) {
  if (v instanceof Error) return v.stack;
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}
