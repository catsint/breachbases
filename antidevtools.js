// ip-blacklist-blocker.js
(function(){
  'use strict';

  // === Configure here ===
  // add single IPs or CIDR ranges like '203.0.113.0/24'
  const BLOCKED = [
    '203.0.113.5',
    '198.51.100.0/28',
    '176.221.124.54'
  ];

  // public IP provider and timeout ms
  const IP_API = 'https://api.ipify.org?format=json';
  const FETCH_TIMEOUT = 3000;

  // overlay styling and message
  const TITLE_TEXT = 'Access denied';
  const MSG_TEXT = 'Your IP is blacklisted';
  // =======================

  function el(tag, props, children){
    const n = document.createElement(tag);
    if(props) {
      Object.keys(props).forEach(k=>{
        if(k === 'class') n.className = props[k];
        else if(k === 'style') Object.assign(n.style, props[k]);
        else n.setAttribute(k, props[k]);
      });
    }
    if(children){
      if(Array.isArray(children)) children.forEach(c => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      else n.appendChild(typeof children === 'string' ? document.createTextNode(children) : children);
    }
    return n;
  }

  function injectStyles(){
    const css = `
    @keyframes bbFade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
    html,body{height:100%}
    .bb-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(180deg,#070708,#121214);color:#eee;z-index:2147483647;
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;animation:bbFade .18s ease both}
    .bb-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);
      padding:28px;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.75);max-width:720px;width:calc(100% - 40px);text-align:center;backdrop-filter:blur(8px)}
    .bb-icon{width:72px;height:72px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center}
    .bb-title{font-size:20px;font-weight:600;margin:0 0 8px;color:#fff}
    .bb-msg{font-size:15px;color:#cfcfcf;margin:0;line-height:1.45;white-space:pre-line}
    .bb-no-scroll{overflow:hidden !important}
    `;
    const s = el('style', {}, css);
    (document.head || document.documentElement).appendChild(s);
  }

  // convert IPv4 string to number
  function ipToInt(ip){
    const parts = ip.split('.');
    if(parts.length !== 4) return null;
    return parts.reduce((acc, p) => (acc<<8) + (parseInt(p,10) & 0xff), 0) >>> 0;
  }

  // check if ip is in cidr range
  function cidrMatch(ip, cidr){
    if(!cidr.includes('/')) return false;
    const [net, maskLenStr] = cidr.split('/');
    const maskLen = parseInt(maskLenStr,10);
    if(Number.isNaN(maskLen) || maskLen < 0 || maskLen > 32) return false;
    const ipInt = ipToInt(ip);
    const netInt = ipToInt(net);
    if(ipInt === null || netInt === null) return false;
    const mask = maskLen === 0 ? 0 : (~0 << (32 - maskLen)) >>> 0;
    return (ipInt & mask) === (netInt & mask);
  }

  // check if ip matches any entry in BLOCKED
  function isBlockedIp(ip){
    if(!ip) return false;
    for(let i=0;i<BLOCKED.length;i++){
      const b = BLOCKED[i].trim();
      if(!b) continue;
      if(b.includes('/')){
        if(cidrMatch(ip, b)) return true;
      } else {
        if(ip === b) return true;
      }
    }
    return false;
  }

  // overlay creation
  let overlayEl = null;
  function createOverlay(title, msg){
    if(overlayEl) return overlayEl;
    injectStyles();
    const wrap = el('div', { class: 'bb-overlay', role: 'alert' });

    const card = el('div', { class: 'bb-card' });

    const iconWrap = el('div', { class: 'bb-icon' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','64');
    svg.setAttribute('height','64');
    svg.innerHTML = '<defs><linearGradient id="bggrad" x1="0" x2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#ff3b6b"/></linearGradient></defs>'+
      '<path fill="url(#bggrad)" d="M12 2C7.3 2 3.4 5.2 2.2 9.6c-.3 1 .5 2 1.6 2.1 0 0 2.6.3 5 1.9 1.9 1.3 4.2 1.3 6.1 0 2.4-1.6 5-1.9 5-1.9 1.1-.1 1.9-1.1 1.6-2.1C20.6 5.2 16.7 2 12 2z"/>';
    iconWrap.appendChild(svg);

    const titleEl = el('div', { class: 'bb-title' }, title || 'Access denied');
    const msgEl = el('div', { class: 'bb-msg' }, msg || 'Your IP is blacklisted');

    card.appendChild(iconWrap);
    card.appendChild(titleEl);
    card.appendChild(msgEl);
    wrap.appendChild(card);

    overlayEl = wrap;
    return overlayEl;
  }

  function showBlock(message, title){
    if(overlayEl && overlayEl.parentNode) return;
    const o = createOverlay(title, message);
    document.body.appendChild(o);
    try{ document.documentElement.classList.add('bb-no-scroll'); }catch(e){}
    // remove pointer events on body content
    try{
      document.body.style.pointerEvents = 'none';
      // allow overlay itself to receive no pointer-blocking inside it is intentional so set pointer-events auto for overlay
      o.style.pointerEvents = 'auto';
    }catch(e){}
  }

  function hideBlock(){
    if(!overlayEl) return;
    if(overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    try{ document.documentElement.classList.remove('bb-no-scroll'); }catch(e){}
    try{ document.body.style.pointerEvents = ''; }catch(e){}
    overlayEl = null;
  }

  // fetch public IP with timeout
  function fetchWithTimeout(url, timeout){
    return new Promise(function(resolve, reject){
      const timer = setTimeout(function(){
        reject(new Error('timeout'));
      }, timeout);
      fetch(url, { cache: 'no-store', credentials: 'omit' }).then(function(resp){
        clearTimeout(timer);
        resolve(resp);
      }).catch(function(err){
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function getPublicIP(){
    return new Promise(function(resolve){
      fetchWithTimeout(IP_API, FETCH_TIMEOUT).then(function(r){
        if(!r.ok) { resolve(null); return; }
        r.json().then(function(j){
          resolve(j && j.ip ? String(j.ip).trim() : null);
        }).catch(function(){ resolve(null); });
      }).catch(function(){
        resolve(null);
      });
    });
  }

  // main check flow
  function runCheck(){
    getPublicIP().then(function(ip){
      if(!ip){
        // couldn't determine public ip do nothing
        return;
      }
      if(isBlockedIp(ip)){
        showBlock(MSG_TEXT, TITLE_TEXT);
      } else {
        hideBlock();
      }
    });
  }

  // run on load then periodically (optional)
  function start(){
    runCheck();
    // re-check occasionally in case IP changes (eg VPN toggled client side)
    setInterval(runCheck, 5 * 60 * 1000); // every 5 minutes
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
