import { logger } from "./logger.js";

const DEBUG_ENABLED = new URLSearchParams(location.search).has("debug");

(() => {
  if (!DEBUG_ENABLED) return;

  function generateDiagnostics() {
    return `
Version: ${state.diagnostics.version}
URL: ${state.diagnostics.url}
Browser: ${state.diagnostics.browser}
Language: ${state.diagnostics.language}
Platform: ${state.diagnostics.platform}
Screen: ${state.diagnostics.screen}
Started: ${state.diagnostics.started}\n\n`;
  }

  async function shareDebugInfo() {
    const text = generateDiagnostics();
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
      console.log(logger.getEntries());
      await navigator.clipboard.writeText(logger.getEntries());
      alert("Copied!");
    } catch {
      alert("Couldn't copy.");
    }
  }

  const MINIMIZE_CLASS = "min";

  logger.info("In debug mode");

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
  const debugContent = debugOverlay.getElementById("debugContent");
  const showBtn = debugOverlay.getElementById("showBtn");
  const shareBtn = debugOverlay.getElementById("shareBtn");
  const copyBtn = debugOverlay.getElementById("copyBtn");

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

  //hookConsole();
  //hookErrors();
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

.min #shareBtn,
.min #copyBtn {
display: none;
}
</style>

<div id="debugDiv" class="dbg min">
  <div id="debugContent"></div>
  <button id="shareBtn">Share debug info</button>
  <button id="copyBtn">Copy debug info</button>
  <button id="showBtn">Show debug window</button>
</div>
`;

  return shadow;
}
