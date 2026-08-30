const DEBUG_ENABLED = new URLSearchParams(location.search).has("debug");

(() => {
  if (!DEBUG_ENABLED) return;

  function formatValue(v) {
    if (v instanceof Error) return v.stack;

    if (typeof v === "object") return JSON.stringify(v, null, 2);

    return String(v);
  }

  function addConsoleLog(level, args) {
    const time = new Date().toTimeString().split(" ")[0];
    const text = args.map(formatValue).join(" ");
    state.logs.push({
      time: time,
      level,
      text: text,
    });
    debugContent.textContent += `[${time}] ${level.toUpperCase()}\n${text}\n\n`;
  }

  function addErrorLog(event) {
    state.logs.push({
      level: "error",
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
    });
    debugContent.textContent += `ERROR\n${event.message}\n${event.filename}:${event.lineno}:${event.colno}\nStack:\n${event.error?.stack}\n\n`;
  }

  function addUnhandledRejectionLog(event) {
    state.logs.push({
      level: "promise",
      reason: String(event.reason),
      stack: event.reason?.stack,
    });
    debugContent.textContent += `PROMISE\n${String(event.reason)}\nStack:\n${event.reason?.stack}`;
  }

  function generateDebugText() {
    let text = `
Version: ${state.diagnostics.version}
URL: ${state.diagnostics.url}
Browser: ${state.diagnostics.browser}
Language: ${state.diagnostics.language}
Platform: ${state.diagnostics.platform}
Screen: ${state.diagnostics.screen}
Started: ${state.diagnostics.started}\n\n`;

    text += debugContent.textContent;

    return text;
  }

  async function shareDebugInfo() {
    const text = generateDebugText();
    if (navigator.share) {
      await navigator.share({
        title: "Bug report",
        text,
      });
    } else {
      alert("Sharing isn't supported.");
    }
  }

  async function copyDebugInfo() {
    try {
      await navigator.clipboard.writeText(generateDebugText());
      alert("Copied!");
    } catch {
      alert("Couldn't copy.");
    }
  }

  const MINIMIZE_CLASS = "min";

  console.log("In debug mode");

  const state = {
    minimized: true,
    logs: [],
    diagnostics: {
      version: globalThis.APP_VERSION ?? "no version",
      url: location.href,
      browser: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width} × ${screen.height}`,
      started: new Date().toISOString(),
    },
  };

  const debugOverlay = createOverlay();

  const debugDiv = debugOverlay.getElementById("debugDiv");
  const showBtn = debugOverlay.getElementById("showBtn");
  const shareBtn = debugOverlay.getElementById("shareBtn");
  const copyBtn = debugOverlay.getElementById("copyBtn");
  const debugContent = debugOverlay.getElementById("content");

  showBtn.addEventListener("click", () => {
    if (state.minimized === true) {
      debugDiv.classList.remove(MINIMIZE_CLASS);
      showBtn.innerText = "Hide debug window";
      state.minimized = false;
    } else {
      debugDiv.classList.add(MINIMIZE_CLASS);
      showBtn.innerText = "Show debug window";
      state.minimized = true;
    }
  });

  shareBtn.addEventListener("click", () => {
    shareDebugInfo();
  });

  copyBtn.addEventListener("click", () => {
    copyDebugInfo();
  });

  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const original = console[level];

    console[level] = (...args) => {
      addConsoleLog(level, args);
      original.apply(console, args);
    };
  }

  window.addEventListener("error", (event) => {
    addErrorLog(event);
  });

  window.addEventListener("unhandledrejection", (event) => {
    addUnhandledRejectionLog(event);
    logs.push({
      level: "promise",
      reason: String(event.reason),
      stack: event.reason?.stack,
    });
  });
})();

function createOverlay() {
  const host = document.createElement("div");
  document.body.append(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
<style>
:host {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 9999999999999999;
}

.dbg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 380px;
  background: #222;
  color: white;
  border-radius: 8px;
  font: 13px sans-serif;
  box-shadow: 0 4px 16px rgb(0 0 0 / .4);
  padding: 10px;
}

.dbg button {
  cursor: pointer;
  font-size: 16px;
  background: #222;
  color: white;
  border: 2px solid #999;
  border-radius: 5px;
  padding: 6px;
  margin: 6px;
}

.dbg button:hover {
  background: #555;
}

.content {
  margin: 10px;
  white-space: pre-wrap;
}

.min .content,
.min #shareBtn,
.min #copyBtn {
  display: none;
}

</style>

<div id="debugDiv" class="dbg min">
  <div id="content" class="content"></div>
  <button id="shareBtn">Share debug info</button>
  <button id="copyBtn">Copy debug info</button>
  <button id="showBtn">Show debug window</button>
</div>
`;

  return shadow;
}
