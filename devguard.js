/*!
  antidevtools.js
  lightweight friendly warning with animated icon
  put <script src="/static/js/antidevtools.js" nomodule></script> in head
*/
(function(){'use strict';
var s=[
'Dev tools detected\n\nPlease close dev tools and refresh to return to the homepage',
'blocker-root','display:block;position:fixed;inset:0;background:linear-gradient(180deg,#06060a, #0f0f13);color:#ffd6e1;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif;text-align:center;',
'card','max-width:720px;background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));padding:28px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.6);backdrop-filter: blur(6px);',
'title','font-size:22px;margin:0 0 10px 0;color:#fff;font-weight:600;',
'msg','white-space:pre-line;font-size:15px;line-height:1.4;color:#ffd6e1;margin:0;',
'btn','margin-top:18px;display:inline-flex;align-items:center;gap:10px;background:#ff3b6b;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:600;cursor:pointer;font-size:15px;',
'spin','@keyframes adt-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.adt-icon{width:64px;height:64px;display:inline-block;flex:0 0 64px}.adt-svg{width:64px;height:64px;animation:adt-spin 3s linear infinite}',
'noSelect','html,body{user-select:none;-webkit-user-select:none;-moz-user-select:none;}',
'refresh','Refresh page 🔄',
'detectThreshold','160',
'checkInterval','700'
],P=function(i){return s[i];},warnShown=!1;

function q(e){try{return document.createElement(e);}catch(t){return null}}
function injectCss(t){try{var e=q('style');if(!e)return; e.appendChild(document.createTextNode(t));(document.head||document.documentElement).appendChild(e)}catch(t){}}

function buildUI(){
  if(warnShown) return;
  warnShown=!0;
  try{console.clear()}catch(e){}
  injectCss(P(7));
  var root=q('div'); if(!root) return;
  root.id=P(1);
  root.setAttribute('style',P(2));
  var card=q('div'); card.setAttribute('style',P(3));
  // icon + content wrapper
  var wrap=q('div'); wrap.setAttribute('style','display:flex;gap:18px;align-items:center;justify-content:center;flex-direction:row');
  // icon
  var iconWrap=q('div'); iconWrap.setAttribute('style','display:flex;align-items:center;justify-content:center;flex:0 0 auto');
  iconWrap.className='adt-icon';
  var svgNS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('viewBox','0 0 24 24'); svg.className='adt-svg';
  svg.innerHTML = '<defs><linearGradient id=\"g1\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#ff6b95\"/><stop offset=\"1\" stop-color=\"#ff2d5e\"/></linearGradient></defs><path fill=\"url(#g1)\" d=\"M12 2c-4.97 0-9 3.58-9 9 0 5.43 4.82 9.91 9 11 4.18-1.09 9-5.57 9-11 0-5.42-4.03-9-9-9zm0 13.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z\"/>';
  iconWrap.appendChild(svg);
  // text block
  var txtWrap=q('div'); txtWrap.setAttribute('style','display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px');
  var t=q('h2'); t.setAttribute('style',P(5)); t.textContent='⚠️ Warning';
  var p=q('p'); p.setAttribute('style',P(6)); p.textContent=P(0);
  var btn=q('button'); btn.setAttribute('style',P(8)); btn.id='adt-refresh-btn'; btn.textContent=P(10);
  btn.onclick=function(){ try{ location.reload(); }catch(e){} };
  txtWrap.appendChild(t); txtWrap.appendChild(p); txtWrap.appendChild(btn);
  wrap.appendChild(iconWrap); wrap.appendChild(txtWrap);
  card.appendChild(wrap); root.appendChild(card);
  (document.body||document.documentElement).appendChild(root);
}

function show(){ buildUI(); }

function detectByResize(){
  try{
    var ow=window.outerWidth|0, iw=window.innerWidth|0, oh=window.outerHeight|0, ih=window.innerHeight|0;
    if(Math.abs(ow-iw)> (P(11)|0) || Math.abs(oh-ih)> (P(11)|0)) return !0;
  }catch(e){}
  return !1;
}

// console getter trick
function detectByConsole(){
  try{
    var d=!1; var o={ toString:function(){ d=!0; return ''; } }; console.log(o);
    return d;
  }catch(e){}
  return !1;
}

function detectOnce(){
  if(warnShown) return;
  if(detectByResize()||detectByConsole()) show();
}

(function init(){
  try{
    injectCss('body{margin:0}'); // small safety
    document.addEventListener('keydown',function(e){
      try{
        var k=e.key||'';
        if(k==='F12' || (e.ctrlKey&&e.shiftKey&&/^[ijck]$/i.test(k)) || (e.ctrlKey&&/^[us]$/i.test(k))){
          e.preventDefault(); e.stopPropagation(); show();
        }
      }catch(ex){}
    },true);
    document.addEventListener('contextmenu',function(e){ try{ e.preventDefault(); e.stopPropagation(); }catch(z){} },true);
    injectCss('.adt-svg{opacity:.98}'); // tiny style
    // run checks periodically
    setInterval(detectOnce, (P(12)|0));
    // run one immediate check
    setTimeout(detectOnce,100);
    // expose lightweight control for debugging if needed
    try{ window.__adt={showUI:show}; }catch(e){}
  }catch(e){}  
})();

})();
