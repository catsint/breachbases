(function () {
  'use strict';

  const CFG = {
    checkIntervalMs: 700,
    resizeThresholdPx: 160,
    hideMessage: 'Security: access denied.',
    hardRedirect: true,
    tryCloseWindow: true,
    blockTextSelection: true,
    disableContextMenu: true,
    maxConsoleOpenDurationMs: 200,
    minRequestsBeforeDisable: 1, 
    autoInit: true
  };

  const state = {
    activeIntervals: [],
    detected: false
  };

  function safeTry(fn){ try { return fn(); } catch(e) { return undefined; } }

  function triggerDefense(reason) {
    if (state.detected) return;
    state.detected = true;

    state.activeIntervals.forEach(id => clearInterval(id));
    window.removeEventListener('keydown', keyDownHandler, true);
    if (CFG.disableContextMenu) window.removeEventListener('contextmenu', contextHandler, true);

    safeTry(() => {

      document.documentElement.innerHTML = '';
      document.write('');
      document.close();
    });

    if (CFG.tryCloseWindow) {
      safeTry(() => { window.open('','_self').close(); });
    }

    if (CFG.hardRedirect) {
      safeTry(() => { location.replace('about:blank'); });
      safeTry(() => { location.href = 'data:text/plain;base64,' + btoa(CFG.hideMessage + '\n\nDetected: ' + reason); });
    }

    safeTry(() => {
      const el = document.createElement('div');
      el.id = 'devguard-blocker';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.zIndex = '2147483647';
      el.style.background = '#0b0b0b';
      el.style.color = '#fff';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontFamily = 'system-ui, Arial, sans-serif';
      el.style.fontSize = '18px';
      el.style.textAlign = 'center';
      el.textContent = CFG.hideMessage;
      document.body && document.body.appendChild(el);
    });

    safeTry(() => {
      document.querySelectorAll('audio,video').forEach(m => { try{ m.pause(); m.src=''; }catch(e){} });
    });

  }

  function keyDownHandler(e) {
    if (!e) return;
    const k = e.key || e.keyIdentifier || '';
    const blocked =
      k === 'F12' ||
      (e.ctrlKey && e.shiftKey && /^(I|J|C|K)$/i.test(k)) ||
      (e.ctrlKey && /^u$/i.test(k)) ||
      (e.ctrlKey && /^s$/i.test(k)) ||
      (e.metaKey && e.altKey && /^i$/i.test(k)) ||
      k === 'ContextMenu';
    if (blocked) {
      e.preventDefault();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      triggerDefense('blocked-shortcut:' + k);
      return false;
    }

    if (k === 'PrintScreen') { try { alert('Zrzuty ekranu są niedozwolone.'); } catch(e){} }
  }

  function contextHandler(e) {
    if (CFG.disableContextMenu) {
      e.preventDefault();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      return false;
    }
  }

  const detectors = [];

  detectors.push(function detectByResize() {
    try {
      const dx = Math.abs(window.outerWidth - window.innerWidth);
      const dy = Math.abs(window.outerHeight - window.innerHeight);
      if (dx > CFG.resizeThresholdPx || dy > CFG.resizeThresholdPx) {
        return {detected:true, reason:'resize-diff:'+dx+','+dy};
      }
    } catch(e){}
    return {detected:false};
  });

  detectors.push(function detectByConsoleGetter() {
    try {
      let detected = false;
      const start = performance.now();

      const re = /./;
      re.toString = function () {
        detected = true;
        return '';
      };

      console.log(re);
      const dur = performance.now() - start;
      if (detected || dur > CFG.maxConsoleOpenDurationMs) {
        return {detected:true, reason:'console-getter: timed:'+Math.round(dur)};
      }
    } catch(e){}
    return {detected:false};
  });

  detectors.push(function detectByDebuggerTiming() {
    try {
      const start = performance.now();

      debugger; 
      const dur = performance.now() - start;
      if (dur > CFG.maxConsoleOpenDurationMs) {
        return {detected:true, reason:'debugger-timing:'+Math.round(dur)};
      }
    } catch(e){}
    return {detected:false};
  });

  detectors.push(function detectByDevtoolsSources() {
    try {
      const all = performance.getEntriesByType && performance.getEntriesByType('resource') || [];
      for (let i=0;i<all.length;i++){
        const name = all[i].name || '';

        if (/(\/__webpack_dev_server__\/)|(devtools|debugger|webpack-dev-server)/i.test(name)) {
          return {detected:true, reason:'resource-name:'+name};
        }
      }
    } catch(e){}
    return {detected:false};
  });

  detectors.push(function detectByFnToStringPat() {
    try {
      const fn = function(){};
      const s = Function.prototype.toString.call(fn);

      if (typeof s !== 'string') return {detected:false};

      if (s.length > 10000) return {detected:true, reason:'fn-toString-large'};
    } catch(e){}
    return {detected:false};
  });

  function runChecksOnce() {
    for (let i=0;i<detectors.length;i++){
      try {
        const r = detectors[i]();
        if (r && r.detected) {
          triggerDefense(r.reason || 'detector-'+i);
          return;
        }
      } catch(e){}
    }
  }

  function init() {
    if (state.detected) return;

    if (CFG.blockTextSelection) {
      safeTry(() => {
        const css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode('html,body{user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;}'));
        (document.head || document.documentElement).appendChild(css);
      });
    }

    window.addEventListener('keydown', keyDownHandler, true);
    if (CFG.disableContextMenu) window.addEventListener('contextmenu', contextHandler, true);

    const id = setInterval(runChecksOnce, CFG.checkIntervalMs);
    state.activeIntervals.push(id);

    const id2 = setInterval(() => {
      try {
        const r = detectors[0](); 
        if (r && r.detected) triggerDefense(r.reason);
      } catch(e){}
    }, 400);
    state.activeIntervals.push(id2);

    safeTry(runChecksOnce);
  }

  if (CFG.autoInit) {

    if (document.readyState === 'loading') {

      safeTry(init);
      document.addEventListener('DOMContentLoaded', function(){  }, {once:true});
    } else {
      safeTry(init);
    }
  }

  window.__devguard = {
    trigger: triggerDefense,
    init: init,
    cfg: CFG
  };

})();
