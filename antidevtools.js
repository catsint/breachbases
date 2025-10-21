// antidevtools_strict.js
// Non obfuscated aggressive detector + friendly black overlay
// Put in head as earliest script

(function () {
  'use strict';

  // CONFIG
  const CONFIG = {
    checkIntervalMs: 500,
    resizeThresholdPx: 160,
    warningTitle: '⚠️ Warning',
    warningMessage: 'Dev tools detected\n\nPlease close dev tools then refresh the page to continue',
    btnText: 'Refresh page 🔄',
    tryCloseAttempts: 6,         // how many times try window.close / replace
    tryCloseIntervalMs: 400,     // delay between close attempts
    blockContextMenu: true,
    blockShortcuts: true,
    blockSelection: true
  };

  // STATE
  let overlayShown = false;
  let closeAttemptCounter = 0;
  let detectionActive = false;

  // UTILITIES
  function safe(fn) {
    try { return fn(); } catch (e) { return undefined; }
  }

  // Create and show the full black overlay with animated icons
  function showOverlay() {
    if (overlayShown) return;
    overlayShown = true;

    // remove existing body content visually but do not destroy head
    safe(() => {
      // create overlay root
      const root = document.createElement('div');
      root.id = 'adt-overlay-root';
      root.style.position = 'fixed';
      root.style.inset = '0';
      root.style.background = '#000';
      root.style.color = '#ff416c';
      root.style.display = 'flex';
      root.style.alignItems = 'center';
      root.style.justifyContent = 'center';
      root.style.zIndex = '2147483647';
      root.style.fontFamily = "Inter, system-ui, 'Segoe UI', Arial, sans-serif";
      root.style.textAlign = 'center';
      root.style.padding = '20px';
      root.style.flexDirection = 'column';

      // animated icon (shield with pulse)
      const iconWrap = document.createElement('div');
      iconWrap.style.marginBottom = '18px';
      iconWrap.innerHTML = `
        <svg width="120" height="120" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="adg" x1="0" x2="1">
              <stop offset="0" stop-color="#ff6b95"/>
              <stop offset="1" stop-color="#ff2d5e"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <path fill="url(#adg)" d="M12 2c-4.97 0-9 3.58-9 9 0 5.43 4.82 9.91 9 11 4.18-1.09 9-5.57 9-11 0-5.42-4.03-9-9-9zm0 13.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>
            <circle cx="12" cy="9" r="2" fill="#fff" opacity="0.95">
              <animate attributeName="r" values="2;8;2" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      `;

      // message box
      const card = document.createElement('div');
      card.style.maxWidth = '820px';
      card.style.padding = '26px';
      card.style.borderRadius = '12px';
      card.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
      card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8)';
      card.style.backdropFilter = 'blur(6px)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'center';
      card.style.gap = '12px';

      const title = document.createElement('div');
      title.textContent = CONFIG.warningTitle;
      title.style.fontSize = '22px';
      title.style.color = '#fff';
      title.style.fontWeight = '700';

      const msg = document.createElement('div');
      msg.textContent = CONFIG.warningMessage;
      msg.style.whiteSpace = 'pre-line';
      msg.style.color = '#ffd6e1';
      msg.style.fontSize = '16px';
      msg.style.lineHeight = '1.45';
      msg.style.maxWidth = '640px';

      const btn = document.createElement('button');
      btn.textContent = CONFIG.btnText;
      btn.style.marginTop = '12px';
      btn.style.background = '#ff2d5e';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '10px 18px';
      btn.style.borderRadius = '10px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '700';
      btn.onclick = function () { try { location.reload(); } catch (e) {} };

      card.appendChild(title);
      card.appendChild(msg);
      card.appendChild(btn);

      root.appendChild(iconWrap);
      root.appendChild(card);

      // remove pointer events on everything else
      document.documentElement.style.pointerEvents = 'none';
      // allow pointer only to overlay
      root.style.pointerEvents = 'auto';

      // append
      (document.body || document.documentElement).appendChild(root);

      // pause all media
      try { document.querySelectorAll('video,audio').forEach(m => { try { m.pause(); m.currentTime = 0; } catch(e) {} }); } catch(e) {}

      // clear console output and override console to no-op
      try {
        console.clear();
        window.__adt_original_console = window.console;
        window.console = {
          log: ()=>{},
          info: ()=>{},
          warn: ()=>{},
          error: ()=>{},
          debug: ()=>{},
          trace: ()=>{}
        };
      } catch (e) {}

      // keyboard and context menu lock
      try {
        window.addEventListener('keydown', stopEvent, true);
        if (CONFIG.blockContextMenu) window.addEventListener('contextmenu', stopEvent, true);
      } catch (e) {}

    });
  }

  // remove overlay and restore
  function hideOverlay() {
    if (!overlayShown) return;
    overlayShown = false;
    try {
      const root = document.getElementById('adt-overlay-root');
      if (root && root.parentNode) root.parentNode.removeChild(root);
      // restore pointer events
      document.documentElement.style.pointerEvents = '';
      // restore console
      if (window.__adt_original_console) {
        window.console = window.__adt_original_console;
        delete window.__adt_original_console;
      }
      window.removeEventListener('keydown', stopEvent, true);
      window.removeEventListener('contextmenu', stopEvent, true);
    } catch (e) {}
  }

  function stopEvent(e) {
    try {
      e.preventDefault();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      e.stopPropagation && e.stopPropagation();
    } catch (err) {}
    return false;
  }

  // Detection methods
  function detectByResize() {
    try {
      const dx = Math.abs(window.outerWidth - window.innerWidth);
      const dy = Math.abs(window.outerHeight - window.innerHeight);
      if (dx > CONFIG.resizeThresholdPx || dy > CONFIG.resizeThresholdPx) return {detected: true, reason: 'resize:' + dx + 'x' + dy};
    } catch (e) {}
    return {detected: false};
  }

  function detectByConsoleGetter() {
    try {
      let detected = false;
      const obj = { toString: function () { detected = true; return ''; } };
      console.log(obj);
      return {detected: detected, reason: 'console-getter'};
    } catch (e) {}
    return {detected: false};
  }

  function detectByImageGet() {
    // using a getter on an Image property that is accessed when logged
    try {
      let detected = false;
      const img = new Image();
      Object.defineProperty(img, 'id', {
        get: function () { detected = true; return 'x'; },
        configurable: true
      });
      console.log(img);
      return {detected: detected, reason: 'image-getter'};
    } catch (e) {}
    return {detected: false};
  }

  function detectByDebuggerTiming() {
    try {
      const t0 = performance.now();
      // small busy loop (fast) then check time - if paused by debugger the delta is large
      for (let i = 0; i < 100000; i++) { /* intentionally empty */ }
      const t1 = performance.now();
      if (t1 - t0 > 100) { // threshold 100ms indicates likely paused/intervened
        return {detected: true, reason: 'slow-loop:' + Math.round(t1 - t0)};
      }
    } catch (e) {}
    return {detected: false};
  }

  // aggregator
  function runDetectors() {
    if (detectionActive) return;
    // run detectors individually and if any returns detected true then act
    const dets = [
      detectByResize(),
      detectByConsoleGetter(),
      detectByImageGet(),
      detectByDebuggerTiming()
    ];
    for (let i = 0; i < dets.length; i++) {
      if (dets[i] && dets[i].detected) {
        return dets[i];
      }
    }
    return {detected: false};
  }

  // aggressive response loop
  function onDetected(info) {
    detectionActive = true;
    showOverlay();

    // repeatedly try to neutralize
    const interval = setInterval(function () {
      // keep overlay present
      showOverlay();

      // try to navigate away or close window multiple times
      tryCloseAttempts();

      // if devtools closed reset overlay
      const still = runDetectors();
      if (!still.detected) {
        clearInterval(interval);
        hideOverlay();
        detectionActive = false;
      }
    }, 500);
  }

  function tryCloseAttempts() {
    try {
      if (closeAttemptCounter < CONFIG.tryCloseAttempts) {
        closeAttemptCounter++;
        // attempt replace
        try { location.replace(location.href); } catch (e) {}
        // attempt self close (rarely works)
        try { window.open('','_self').close(); } catch (e) {}
      }
    } catch (e) {}
  }

  // Main polling loop
  function startMonitoring() {
    // Block selection if desired
    if (CONFIG.blockSelection) {
      safe(() => {
        const style = document.createElement('style');
        style.innerHTML = 'html,body{user-select:none;-webkit-user-select:none;-moz-user-select:none;}';
        (document.head || document.documentElement).appendChild(style);
      });
    }

    // Block shortcuts and context menu
    if (CONFIG.blockShortcuts) {
      window.addEventListener('keydown', function (e) {
        try {
          const k = (e.key || '').toLowerCase();
          if (e.key === 'F12' ||
              (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) ||
              (e.ctrlKey && ['u', 's'].includes(k))) {
            stopEvent(e);
            // immediate show overlay
            onDetected({reason: 'shortcut:' + e.key});
            return false;
          }
        } catch (err) {}
      }, true);
    }

    if (CONFIG.blockContextMenu) {
      window.addEventListener('contextmenu', function (e) { stopEvent(e); return false; }, true);
    }

    // periodic check
    setInterval(function () {
      try {
        if (detectionActive) return;
        const r = runDetectors();
        if (r.detected) {
          onDetected(r);
        }
      } catch (e) {}
    }, CONFIG.checkIntervalMs);

    // one immediate run
    setTimeout(function () {
      try {
        const r = runDetectors();
        if (r.detected) onDetected(r);
      } catch (e) {}
    }, 150);
  }

  // Start
  startMonitoring();

})();
