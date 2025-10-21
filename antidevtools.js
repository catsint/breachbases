/*!
  antidevtools.js — minimal dark UI
  shows elegant overlay if devtools are opened
*/
(function(){
  'use strict';

  let shown = false;

  function el(t){return document.createElement(t)}
  function css(txt){
    const s=el('style');
    s.textContent=txt;
    document.head.appendChild(s);
  }

  function showWarning(){
    if(shown) return;
    shown = true;
    try{ console.clear(); }catch(e){}

    css(`
      @keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      .adt-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(180deg,#0b0b0c,#141416);color:#eee;z-index:999999;
        font-family:Inter,ui-sans-serif,system-ui;animation:fadeIn .3s ease both}
      .adt-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);
        padding:32px 28px;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.7);
        max-width:640px;text-align:center;backdrop-filter:blur(10px)}
      .adt-icon{width:72px;height:72px;margin:0 auto 18px auto;display:flex;align-items:center;justify-content:center}
      .adt-svg{width:64px;height:64px;animation:spin 14s linear infinite}
      .adt-title{font-size:20px;font-weight:600;margin-bottom:8px;color:#fff}
      .adt-msg{font-size:15px;color:#c9c9c9;margin-bottom:20px;white-space:pre-line;line-height:1.4}
      .adt-btn{background:#23d18b;border:none;padding:10px 20px;border-radius:10px;color:#0f0f0f;
        font-weight:600;font-size:15px;cursor:pointer;transition:all .2s}
      .adt-btn:hover{transform:translateY(-1px);background:#29e69b}
    `);

    const overlay = el('div');
    overlay.className = 'adt-overlay';
    const card = el('div');
    card.className = 'adt-card';

    const iconWrap = el('div');
    iconWrap.className = 'adt-icon';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.className = 'adt-svg';
    svg.innerHTML = `
      <defs>
        <linearGradient id="grad" x1="0" x2="1">
          <stop offset="0" stop-color="#23d18b"/>
          <stop offset="1" stop-color="#2af598"/>
        </linearGradient>
      </defs>
      <path fill="url(#grad)" d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4zm0 4.3l-5 2.5v4.9c0 3.75 2.8 7.4 5 8.3 2.2-.9 5-4.55 5-8.3V8.8l-5-2.5zm0 3.7a1 1 0 0 1 1 1v3.5a1 1 0 0 1-2 0V11a1 1 0 0 1 1-1zm0 7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/>
    `;
    iconWrap.appendChild(svg);

    const title = el('div');
    title.className = 'adt-title';
    title.textContent = 'Warning';

    const msg = el('div');
    msg.className = 'adt-msg';
    msg.textContent = 'Developer tools detected\n\nPlease close dev tools and refresh the page';

    const btn = el('button');
    btn.className = 'adt-btn';
    btn.textContent = 'Refresh page 🔄';
    btn.onclick = ()=>{ location.reload(); };

    card.appendChild(iconWrap);
    card.appendChild(title);
    card.appendChild(msg);
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function detectResize(){
    try{
      const ow=window.outerWidth|0, iw=window.innerWidth|0, oh=window.outerHeight|0, ih=window.innerHeight|0;
      return (Math.abs(ow-iw)>160 || Math.abs(oh-ih)>160);
    }catch(e){return false}
  }

  function detectConsole(){
    try{
      let triggered=false;
      const obj={toString:function(){triggered=true;return''}};
      console.log(obj);
      return triggered;
    }catch(e){return false}
  }

  function check(){
    if(shown) return;
    if(detectResize()||detectConsole()) showWarning();
  }

  function keyBlock(e){
    const k=e.key||'';
    if(k==='F12'||(e.ctrlKey&&e.shiftKey&&/[IJCK]/i.test(k))||(e.ctrlKey&&/[US]/i.test(k))){
      e.preventDefault(); e.stopPropagation();
      showWarning();
    }
  }

  function contextBlock(e){
    e.preventDefault(); e.stopPropagation();
  }

  document.addEventListener('keydown',keyBlock,true);
  document.addEventListener('contextmenu',contextBlock,true);
  setInterval(check,700);
  setTimeout(check,200);
})();
