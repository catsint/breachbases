// ip-blacklist-blocker-immediate.js
(function(){
  'use strict';

  // === CONFIG ===
  // przyklad: pojedyncze IPv4 oraz CIDR
  const BLOCKED = [
    '203.0.113.5',
    '198.51.100.0/28',
    '176.221.124.54'
  ];

  const IP_API = 'https://api.ipify.org?format=json';
  const FETCH_TIMEOUT = 3000; // ms
  const TITLE_TEXT = 'Access denied';
  const MSG_TEXT = 'Your IP is blacklisted';
  // =================

  // natychmiast wstrzyknij element overlay zanim cokolwiek się pokaże
  function createInitialOverlay() {
    // wstrzykuj style synchronously
    var css = '\
    html,body{height:100%;margin:0}\
    .bb-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;\
      background:linear-gradient(180deg,#070708,#121214);color:#eee;z-index:2147483647;\
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;\
      opacity:0;pointer-events:none;transition:opacity .28s ease}\
    .bb-overlay.visible{opacity:1;pointer-events:auto}\
    .bb-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);\
      padding:28px;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.75);max-width:720px;width:calc(100% - 40px);text-align:center;backdrop-filter:blur(8px)}\
    .bb-icon{width:72px;height:72px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center}\
    .bb-title{font-size:20px;font-weight:600;margin:0 0 8px;color:#fff}\
    .bb-msg{font-size:15px;color:#cfcfcf;margin:0;line-height:1.45;white-space:pre-line}\
    .bb-hidden-body{visibility:hidden !important}\
    ';
    var style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);

    // overlay markup
    var overlay = document.createElement('div');
    overlay.className = 'bb-overlay';
    overlay.id = 'bb_overlay_blocker';

    var card = document.createElement('div');
    card.className = 'bb-card';

    var iconWrap = document.createElement('div');
    iconWrap.className = 'bb-icon';
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','64');
    svg.setAttribute('height','64');
    svg.innerHTML = '<defs><linearGradient id="bggrad" x1="0" x2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#ff3b6b"/></linearGradient></defs><path fill="url(#bggrad)" d="M12 2C7.3 2 3.4 5.2 2.2 9.6c-.3 1 .5 2 1.6 2.1 0 0 2.6.3 5 1.9 1.9 1.3 4.2 1.3 6.1 0 2.4-1.6 5-1.9 5-1.9 1.1-.1 1.9-1.1 1.6-2.1C20.6 5.2 16.7 2 12 2z"/>';
    iconWrap.appendChild(svg);

    var titleEl = document.createElement('div');
    titleEl.className = 'bb-title';
    titleEl.textContent = TITLE_TEXT;

    var msgEl = document.createElement('div');
    msgEl.className = 'bb-msg';
    msgEl.textContent = MSG_TEXT;

    card.appendChild(iconWrap);
    card.appendChild(titleEl);
    card.appendChild(msgEl);
    overlay.appendChild(card);

    // append immediately to DOM to avoid flash
    // also hide body visibility so nothing shows underneath while we check
    try { document.documentElement.classList.add('bb-hidden-body'); } catch(e){}
    document.documentElement.appendChild(overlay);

    // ensure overlay becomes visible smoothly once we decide to show it
    setTimeout(function(){
      overlay.classList.add('visible');
    }, 20);

    return overlay;
  }

  // utility ip functions
  function ipToInt(ip){
    var p = ip.split('.');
    if(p.length !== 4) return null;
    var n = 0;
    for(var i=0;i<4;i++){ n = (n<<8) + (parseInt(p[i],10) & 0xff); }
    return n >>> 0;
  }
  function cidrMatch(ip, cidr){
    var parts = cidr.split('/');
    if(parts.length !== 2) return false;
    var net = parts[0], maskLen = parseInt(parts[1],10);
    if(Number.isNaN(maskLen) || maskLen < 0 || maskLen > 32) return false;
    var ipInt = ipToInt(ip), netInt = ipToInt(net);
    if(ipInt === null || netInt === null) return false;
    var mask = maskLen === 0 ? 0 : (~0 << (32 - maskLen)) >>> 0;
    return (ipInt & mask) === (netInt & mask);
  }
  function isBlockedIp(ip, list){
    if(!ip) return false;
    for(var i=0;i<list.length;i++){
      var b = list[i].trim();
      if(!b) continue;
      if(b.indexOf('/') !== -1){
        if(cidrMatch(ip,b)) return true;
      } else {
        if(ip === b) return true;
      }
    }
    return false;
  }
  function maskIp(ip){
    // mask middle parts of IPv4 a.b.c.d -> a.xxx.c.d style hide center
    if(!ip) return '';
    var p = ip.split('.');
    if(p.length !== 4) return ip;
    return p[0] + '.x.x.' + p[3];
  }

  // fetch with timeout
  function fetchWithTimeout(url, t){
    return new Promise(function(resolve,reject){
      var timer = setTimeout(function(){ reject(new Error('timeout')) }, t);
      fetch(url, { cache:'no-store' }).then(function(r){
        clearTimeout(timer);
        resolve(r);
      }).catch(function(e){
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  // MAIN
  var overlayEl = createInitialOverlay(); // appended and body hidden
  var removedOverlay = false;

  function removeOverlayAndRestore(){
    // restore normal page if not blocked
    try{ document.documentElement.classList.remove('bb-hidden-body'); }catch(e){}
    if(!overlayEl) return;
    // hide overlay smoothly then remove
    overlayEl.classList.remove('visible');
    setTimeout(function(){
      try{ if(overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl); }catch(e){}
      overlayEl = null;
      removedOverlay = true;
    }, 280);
  }

  function keepOverlayAndBlock() {
    // ensure overlay visible and body stays hidden
    try{ document.documentElement.classList.add('bb-hidden-body'); }catch(e){}
    if(overlayEl) overlayEl.classList.add('visible');
  }

  function checkIpAndDecide(){
    fetchWithTimeout(IP_API, FETCH_TIMEOUT).then(function(resp){
      if(!resp.ok) { removeOverlayAndRestore(); return; }
      resp.json().then(function(j){
        var ip = (j && j.ip) ? String(j.ip).trim() : null;
        // log masked ip locally only
        try{ console.info('[ip-blacklist] visitor ip', maskIp(ip)); }catch(e){}
        if(isBlockedIp(ip, BLOCKED)){
          keepOverlayAndBlock();
        } else {
          removeOverlayAndRestore();
        }
      }).catch(function(){ removeOverlayAndRestore(); });
    }).catch(function(){ removeOverlayAndRestore(); });
  }

  // run check asap
  try {
    // if document already interactive then run quickly else wait DOMContentLoaded
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ checkIpAndDecide(); }, { once:true });
    } else {
      // already loaded
      checkIpAndDecide();
    }
  } catch(e) {
    // on error, restore page so user not stuck
    removeOverlayAndRestore();
  }

  // optional periodic re-check if IP changes (e.g. user toggles VPN)
  setInterval(function(){
    // only recheck if overlay not permanently present by user action
    if(removedOverlay) return;
    checkIpAndDecide();
  }, 5 * 60 * 1000);

})();
