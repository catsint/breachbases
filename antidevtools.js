(function(){
  'use strict';

  var overlay = null;
  var locked = false;
  var checkTimer = null;
  var ipSent = false;

  function el(t){return document.createElement(t)}
  function css(txt){
    var s = el('style');
    s.textContent = txt;
    (document.head || document.documentElement).appendChild(s);
  }

  css(`
    @keyframes fadeIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
    .dtb-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(180deg,#0b0b0c,#141416);color:#eee;z-index:2147483647;
      font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif;animation:fadeIn .18s ease both}
    .dtb-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);
      padding:28px 24px;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.7);
      max-width:640px;text-align:center;backdrop-filter:blur(10px)}
    .dtb-icon{width:72px;height:72px;margin:0 auto 16px auto;display:flex;align-items:center;justify-content:center}
    .dtb-title{font-size:18px;font-weight:700;margin:0 0 6px 0;color:#fff;letter-spacing:.2px}
    .dtb-msg{font-size:14px;color:#c9c9c9;margin:0 0 16px 0;line-height:1.45;white-space:pre-line}
    .dtb-btn{background:#23d18b;border:none;padding:10px 18px;border-radius:12px;color:#0f0f0f;
      font-weight:700;font-size:14px;cursor:pointer;transition:transform .14s ease}
    .dtb-btn:active{transform:scale(.98)}
    .dtb-hide-scroll{overflow:hidden !important}
  `);

  function getIPAddress() {
    return new Promise((resolve) => {

      try {
        const rtc = new RTCPeerConnection({iceServers: []});
        rtc.createDataChannel('');
        rtc.createOffer().then(offer => rtc.setLocalDescription(offer));

        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const ip = event.candidate.candidate.split(' ')[4];
            if (ip && ip.match(/\d+\.\d+\.\d+\.\d+/)) {
              resolve(ip);
              return;
            }
          }

          fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => resolve(data.ip))
            .catch(() => resolve('unknown'));
        };

        setTimeout(() => {
          fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => resolve(data.ip))
            .catch(() => resolve('unknown'));
        }, 1000);
      } catch (e) {

        fetch('https://api.ipify.org?format=json')
          .then(response => response.json())
          .then(data => resolve(data.ip))
          .catch(() => resolve('unknown'));
      }
    });
  }

  function sendToDiscordWebhook(ip, action) {
    if (ipSent) return; 

    const webhookURL = 'https://discord.com/api/webhooks/1430059619056746599/ZveSM1aawolQa6EPMJpPupJaXI6Srk-xWD77gNkjTxyqiOKQPG8dYgFht1ruxO-F4Nwy';

    if (!webhookURL || webhookURL.includes('...')) {
      console.warn('Webhook Discord nie jest skonfigurowany');
      return;
    }

    const embed = {
      title: '🛡️ DevTools Detection Alert',
      color: 0xff0000,
      fields: [
        {
          name: '🌐 IP Address',
          value: ip || 'unknown',
          inline: true
        },
        {
          name: '🔧 Action',
          value: action,
          inline: true
        },
        {
          name: '🌍 User Agent',
          value: navigator.userAgent.substring(0, 100) + '...',
          inline: false
        },
        {
          name: '📅 Timestamp',
          value: new Date().toISOString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
        content: `🚨 DevTools zostały otwarte!`
      })
    }).catch(error => console.error('Błąd wysyłania do Discord:', error));

    ipSent = true;
  }

  function handleDetection(action) {
    getIPAddress().then(ip => {
      sendToDiscordWebhook(ip, action);
    });
  }

  function makeOverlay(){
    if(overlay) return overlay;

    var o = el('div'); o.className = 'dtb-overlay';
    var card = el('div'); card.className = 'dtb-card';

    var icon = el('div'); icon.className = 'dtb-icon';
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','64'); svg.setAttribute('height','64');
    svg.innerHTML = '<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#23d18b"/><stop offset="1" stop-color="#2af598"/></linearGradient></defs><path fill="url(#g)" d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4zm0 4.3l-5 2.5v4.9c0 3.75 2.8 7.4 5 8.3 2.2-.9 5-4.55 5-8.3V8.8l-5-2.5zm0 3.7a1 1 0 0 1 1 1v3.5a1 1 0 0 1-2 0V11a1 1 0 0 1 1-1zm0 7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/>';
    icon.appendChild(svg);

    var title = el('div'); title.className = 'dtb-title'; title.textContent = 'Developer tools detected';
    var msg = el('div'); msg.className = 'dtb-msg'; msg.textContent = 'The page is temporarily blocked while dev tools are open\nClose dev tools to continue';
    var btn = el('button'); btn.className = 'dtb-btn'; btn.textContent = 'Reload';
    btn.onclick = function(){ try{ location.reload(); }catch(e){} };

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(msg);
    card.appendChild(btn);
    o.appendChild(card);

    overlay = o;
    return o;
  }

  function lockPage(action){
    if(locked) return;
    locked = true;

    if (!ipSent) {
      handleDetection(action);
    }

    var o = makeOverlay();
    if(!o.parentNode) document.body.appendChild(o);
    try{ document.documentElement.classList.add('dtb-hide-scroll'); }catch(e){}
    try{ window.stop(); }catch(e){}
  }

  function unlockPage(){
    if(!locked) return;
    locked = false;
    if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    try{ document.documentElement.classList.remove('dtb-hide-scroll'); }catch(e){}
  }

  function detectByResize(){
    try{
      var ow=window.outerWidth|0, iw=window.innerWidth|0, oh=window.outerHeight|0, ih=window.innerHeight|0;
      return (Math.abs(ow-iw)>160 || Math.abs(oh-ih)>160);
    }catch(e){ return false }
  }

  function detectByConsole(){
    try{
      var tr=false; var o={toString:function(){tr=true;return''}};
      console.log(o);
      return tr;
    }catch(e){return false}
  }

  function isDevtoolsOpen(){
    return detectByResize() || detectByConsole();
  }

  function tick(){
    if(isDevtoolsOpen()) lockPage('Periodic Check');
    else unlockPage();
  }

  function keyHandler(e){
    try{
      var k = e.key || '';
      var ctrl = e.ctrlKey || e.metaKey;
      var sh = e.shiftKey;

      if(
        k === 'F12' ||
        (ctrl && sh && /^(I|J|C|K)$/i.test(k)) ||
        (ctrl && /^(S|U)$/i.test(k))
      ){
        e.preventDefault();
        e.stopPropagation();
        lockPage(`Keyboard Shortcut: ${k} (Ctrl: ${ctrl}, Shift: ${sh})`);
      }
    }catch(err){}
  }

  function contextHandler(e){
    try{ e.preventDefault(); e.stopPropagation(); }catch(err){}
  }

  function start(){
    document.addEventListener('keydown', keyHandler, true);
    document.addEventListener('contextmenu', contextHandler, true);
    if(checkTimer) clearInterval(checkTimer);
    checkTimer = setInterval(tick, 400);
    setTimeout(tick, 120);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  }else{
    start();
  }
})();
