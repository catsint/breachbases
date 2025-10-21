<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NoConsole Protect</title>
</head>
<body style="background:#0f0f10; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
  <h1>Hello World</h1>

  <script>
    (function(window, document){
      'use strict'

      const CONFIG = { log:true, block:true, rightclick:true, disableConsoleFlood:true, delay:100, text:"\\nhttps://catchus.live" }

      const el=(tag,props={},children=[])=>{
        const node=document.createElement(tag)
        Object.entries(props).forEach(([k,v])=>{
          if(k==='class')node.className=v
          else if(k==='style')Object.assign(node.style,v)
          else if(k.startsWith('on')&&typeof v==='function')node.addEventListener(k.slice(2).toLowerCase(),v)
          else node.setAttribute(k,v)
        })
        ;(Array.isArray(children)?children:[children]).forEach(c=>{
          if(c==null)return
          if(typeof c==='string'||typeof c==='number')node.appendChild(document.createTextNode(String(c)))
          else node.appendChild(c)
        })
        return node
      }

      const style=el('style',{},`
      .ncp-root{position:fixed;right:20px;bottom:20px;width:320px;z-index:999999;font-family:Inter,system-ui,sans-serif}
      .ncp-card{background:linear-gradient(180deg,#141414 0%,#1b1b1b 100%);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.6);color:#e6e6e6;padding:16px}
      .ncp-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
      .ncp-switch{width:40px;height:22px;border-radius:999px;background:rgba(255,255,255,.1);padding:3px;display:flex;align-items:center;transition:.2s}
      .ncp-knob{width:16px;height:16px;border-radius:50%;background:#111;transition:.2s;transform:translateX(0)}
      .ncp-switch.on{background:linear-gradient(90deg,#23d18b,#5ce3b8)}
      .ncp-switch.on .ncp-knob{transform:translateX(18px);background:#fff}
      .ncp-btn{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#e6e6e6;cursor:pointer;font-size:13px}
      .ncp-footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:12px;color:#9aa0a6}
      .ncp-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);color:#fff;z-index:99999;opacity:0;pointer-events:none;transition:.2s}
      .ncp-overlay.show{opacity:1;pointer-events:auto}
      .ncp-panel{background:#111;padding:20px;border-radius:12px;text-align:center;max-width:400px}
      `)
      document.head.appendChild(style)

      const state={ log:true, block:true, rightclick:true, disableConsoleFlood:true, delay:100 }

      const root=el('div',{class:'ncp-root'},[
        el('div',{class:'ncp-card'},[
          el('h3',{},'NoConsole Protect'),
          row('Log to console','log'),
          row('Block shortcuts','block'),
          row('Disable right click','rightclick'),
          row('Clear console loop','disableConsoleFlood'),
          el('div',{class:'ncp-footer'},[
            el('span',{},'Status: Idle'),
            el('button',{class:'ncp-btn',onClick:()=>showOverlay()},'Show Alert')
          ])
        ])
      ])
      document.body.appendChild(root)

      const overlay=el('div',{class:'ncp-overlay',id:'ncp-overlay'},
        el('div',{class:'ncp-panel'},[
          el('h2',{},'Developer tools detected'),
          el('p',{},'Interaction blocked'),
          el('button',{class:'ncp-btn',onClick:()=>hideOverlay()},'Close')
        ])
      )
      document.body.appendChild(overlay)

      function row(label,key){
        return el('div',{class:'ncp-row'},[
          el('div',{},label),
          el('div',{class:`ncp-switch ${state[key]?'on':''}`,onClick:()=>toggle(key)},el('div',{class:'ncp-knob'}))
        ])
      }

      function toggle(k){
        state[k]=!state[k]
        const keys=['log','block','rightclick','disableConsoleFlood']
        document.querySelectorAll('.ncp-switch').forEach((sw,i)=>{
          const key=keys[i]
          if(state[key])sw.classList.add('on');else sw.classList.remove('on')
        })
      }

      function showOverlay(){
        document.getElementById('ncp-overlay').classList.add('show')
      }
      function hideOverlay(){
        document.getElementById('ncp-overlay').classList.remove('show')
      }

      window.addEventListener('keydown',e=>{
        const c=e.keyCode,ctrl=e.ctrlKey||e.metaKey,sh=e.shiftKey
        if(c===123||ctrl&&c===83||ctrl&&sh&&(c===73||c===74||e.key==='K'||e.key==='C')||ctrl&&c===85){
          if(state.block)e.preventDefault()
          if(state.log)console.warn('Blocked developer shortcut')
          showOverlay()
        }
      },{passive:false})

      window.addEventListener('contextmenu',e=>{
        if(state.rightclick){e.preventDefault();if(state.log)console.warn('Right click blocked');showOverlay()}
      },{passive:false})

      let loop
      function startLoop(){
        if(loop)clearInterval(loop)
        if(state.disableConsoleFlood)loop=setInterval(()=>{console.clear();console.log('console cleared')},state.delay)
      }
      startLoop()
    })(window,document)
  </script>
</body>
</html>
