(function(){
  'use strict';

  const CONFIG = {
    checkIntervalMs: 700,
    resizeThresholdPx: 160,
    warningMessage: "Dev tools detected\n\nPlease close dev tools and refresh this page to continue",
    blockContextMenu: true,
    blockShortcuts: true,
    blockSelection: true
  };

  let warningShown = false;

  function showWarning(){
    if (warningShown) return;
    warningShown = true;
    console.clear();

    document.body.innerHTML = `
      <div style="
        position: fixed;
        inset: 0;
        background: #0b0b0f;
        color: #ff2d5e;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', sans-serif;
        text-align: center;
        padding: 20px;
        z-index: 999999999;
      ">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Warning</h1>
        <p style="white-space: pre-line; font-size: 1.1rem; max-width: 600px;">
          ${CONFIG.warningMessage}
        </p>
        <button id="refreshBtn" style="
          margin-top: 2rem;
          background: #ff2d5e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        ">Refresh page 🔄</button>
      </div>
    `;
    document.getElementById('refreshBtn').onclick = () => location.reload();
  }

  function detectDevTools() {
    const threshold = CONFIG.resizeThresholdPx;
    if (Math.abs(window.outerWidth - window.innerWidth) > threshold ||
        Math.abs(window.outerHeight - window.innerHeight) > threshold) {
      showWarning();
    }
  }

  if (CONFIG.blockShortcuts) {
    window.addEventListener('keydown', e => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i','j','c','k'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && ['u','s'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showWarning();
        return false;
      }
    }, true);
  }

  if (CONFIG.blockContextMenu) {
    window.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
  }

  if (CONFIG.blockSelection) {
    const style = document.createElement('style');
    style.innerHTML = `body { user-select: none; -webkit-user-select: none; }`;
    document.head.appendChild(style);
  }

  setInterval(detectDevTools, CONFIG.checkIntervalMs);
})();
