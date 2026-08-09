const DEBUG_ENABLED = new URLSearchParams(location.search).has("debug");

(() => {
  if (!DEBUG_ENABLED) return;

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
  //hookConsole();
  //hookErrors();

  console.log(state.diagnostics);
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
}

.min .content {
  display: none;
}

</style>

<div id="debugDiv" class="dbg min">
  <div class="content">
    yaaaaaaaaaaaaaaaasssssssss
  </div>
  <button id="showBtn">Show debug window</button>
</div>
`;

  return shadow;
}
