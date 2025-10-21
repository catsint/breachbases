(function(window, document){
  'use strict'

  const CONFIG = {
    log: true,
    block: true,
    rightclick: true,
    disableConsoleFlood: true,
    delay: 100,
    text: "\nhttps://catchus.live"
  }

  const el = (tag, props = {}, children = [])=>{
    const node = document.createElement(tag)
    Object.entries(props).forEach(([k, v])=>{
      if(k === 'class') node.className = v
      else if(k === 'style') Object.assign(node.style, v)
      else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v)
      else node.setAttribute(k, v)
    })
    ;(Array.isArray(children) ? children : [children]).forEach(c=>{
      if(c == null) return
      if(typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)))
      else node.appendChild(c)
    })
    return node
  }

  const qs = s => document.querySelector(s)

  const styleText = `
  .ncp-root { position: fixed; right: 20px; bottom: 20px; width: 360px; max-width: calc(100% - 40px); z-index: 999999; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
  .ncp-card { background: linear-gradient(180deg, #141414 0%, #1b1b1b 100%); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); color: #e6e6e6; padding: 16px; backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.03); }
  .ncp-header { display:flex; align-items:center; gap:12px; }
  .ncp-logo { width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#2b2b2b,#3a3a3a); border-radius:8px; }
  .ncp-title { font-weight:600; font-size:14px; letter-spacing:0.2px; }
  .ncp-sub { font-size:12px; color:#9aa0a6; margin-top:4px; }
  .ncp-row { display:flex; align-items:center; justify-content:space-between; margin-top:12px; gap:12px; }
  .ncp-toggle { display:inline-flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
  .ncp-switch { width:44px; height:24px; background: rgba(255,255,255,0.06); border-radius:999px; padding:3px; display:inline-flex; align-items:center; transition:all .18s; }
  .ncp-knob { width:18px; height:18px; background:#111; border-radius:50%; box-shadow:0 1px 2px rgba(0,0,0,0.6); transition:all .18s; transform: translateX(0); }
  .ncp-switch.on { background: linear-gradient(90deg,#23d18b,#5ce3b8); }
  .ncp-switch.on .ncp-knob { transform: translateX(20px); background: #fff; }
  .ncp-btn { margin-left:8px; padding:8px 12px; background:transparent; border:1px solid rgba(255,255,255,0.04); color:#e6e6e6; border-radius:10px; cursor:pointer; font-size:13px; transition:all .14s; }
  .ncp-btn:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.5); }
  .ncp-small { font-size:12px; color:#9aa0a6; }
  .ncp-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:14px; }
  .ncp-status { font-size:12px; color:#9aa0a6; }
  .ncp-overlay { position:fixed; inset:0; background:linear-gradient(180deg, rgba(2,2,2,0.6), rgba(0,0,0,0.85)); display:flex; align-items:center; justify-content:center; z-index:999998; opacity:0; pointer-events:none; transition:opacity .18s; }
  .ncp-overlay.show { opacity:1; pointer-events:auto; }
  .ncp-overlay .panel { background: #0f0f10; padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.03); max-width:640px; text-align:center; color:#e6e6e6; box-shadow:0 20px 60px rgba(0,0,0,0.7); }
  .ncp-overlay h2 { margin:0 0 8px 0; font-size:20px; }
  .ncp-overlay p { margin:0 0 12px 0; color:#99a0a6; font-size:14px; }
  .ncp-small-muted { font-size:11px; color:#7f8488; }
  `
  const styleEl = el('style', {}, styleText)
  document.head.appendChild(styleEl)

  let state = {
    log: CONFIG.log,
    block: CONFIG.block,
    rightclick: CONFIG.rightclick,
    disableConsoleFlood: CONFIG.disableConsoleFlood,
    delay: CONFIG.delay,
    overlayVisible: false
  }

  function createUI(){
    const root = el('div', { class: 'ncp-root', id: 'ncp-root' })
    const card = el('div', { class: 'ncp-card' })

    const header = el('div', { class: 'ncp-header' }, [
      el('div', { class: 'ncp-logo' }, [
        (function(){
          const svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
          svg.setAttribute('width','24')
          svg.setAttribute('height','24')
          svg.setAttribute('viewBox','0 0 24 24')
          const path = document.createElementNS('http://www.w3.org/2000/svg','path')
          path.setAttribute('d','M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7zM4 13h7v7H4z')
          path.setAttribute('fill','#d1d5db')
          svg.appendChild(path)
          return svg
        })()
      ]),
      el('div', {}, [
        el('div', { class: 'ncp-title' }, 'NoConsole Protect'),
        el('div', { class: 'ncp-sub' }, 'React style controls local logs no external calls')
      ])
    ])

    card.appendChild(header)

    function toggleRow(label, stateKey, desc){
      const row = el('div', { class: 'ncp-row' })
      const left = el('div', {}, [
        el('div', { class: 'ncp-toggle', role: 'button', tabindex: 0, onClick: ()=> toggleState(stateKey) }, [
          el('div', { class: `ncp-switch ${state[stateKey] ? 'on' : ''}`, 'aria-pressed': !!state[stateKey] }, [
            el('div', { class: 'ncp-knob' })
          ]),
          el('div', {}, label)
        ]),
        el('div', { class: 'ncp-small muted', style: { marginTop: '6px', color: '#9aa0a6' } }, desc || '')
      ])
      const right = el('div', {}, [
        el('button', { class: 'ncp-btn', onClick: ()=> toggleState(stateKey) }, state[stateKey] ? 'ON' : 'OFF')
      ])
      row.appendChild(left)
      row.appendChild(right)
      return row
    }

    card.appendChild(toggleRow('Log to console only', 'log', 'Logs stay local only'))
    card.appendChild(toggleRow('Block developer shortcuts', 'block', 'Prevent common keys that open dev tools'))
    card.appendChild(toggleRow('Disable right click', 'rightclick', 'Turn off context menu'))
    card.appendChild(toggleRow('Console clear loop', 'disableConsoleFlood', 'Periodically clear the console'))

    const delayRow = el('div', { class: 'ncp-row' }, [
      el('div', {}, [
        el('div', { class: 'ncp-small' }, 'Console clear interval in ms'),
        el('div', { class: 'ncp-small-muted' }, 'Lower number clears more often')
      ]),
      el('div', {}, [
        el('input', {
          type: 'number',
          value: state.delay,
          style: { width: '90px', padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: '#e6e6e6' },
          onInput: (e)=> {
            const v = Number(e.target.value) || 0
            state.delay = Math.max(10, Math.min(10000, v))
            restartConsoleFlood()
          }
        })
      ])
    ])
    card.appendChild(delayRow)

    const footer = el('div', { class: 'ncp-footer' }, [
      el('div', { class: 'ncp-status' }, `Status ${state.overlayVisible ? 'Alert shown' : 'Idle'}`),
      el('div', {}, [
        el('button', { class: 'ncp-btn', onClick: ()=> showOverlay('Manual check', 'You opened the control panel manually') }, 'Show alert')
      ])
    ])
    card.appendChild(footer)

    card.appendChild(el('div', { class: 'ncp-small', style: { marginTop: '10px', color: '#9aa0a6' } }, CONFIG.text))

    root.appendChild(card)
    document.body.appendChild(root)

    const overlay = el('div', { class: 'ncp-overlay', id: 'ncp-overlay' }, el('div', { class: 'panel' }, [
      el('h2', {}, 'Developer Tools Detected'),
      el('p', {}, 'An attempt to inspect the page was detected Interaction may be blocked depending on settings'),
      el('div', {}, [
        el('button', { class: 'ncp-btn', onClick: hideOverlay }, 'Close'),
        el('button', { class: 'ncp-btn', onClick: ()=> { hideOverlay(); console.clear() } }, 'Close and clear console')
      ]),
      el('div', { style: { marginTop: '10px', fontSize: '12px', color: '#9aa0a6' } }, 'This script does not send data externally')
    ]))
    document.body.appendChild(overlay)

    function renderStatus(){
      const s = document.querySelector('.ncp-footer .ncp-status')
      if(s) s.textContent = `Status ${state.overlayVisible ? 'Alert shown' : 'Idle'}`
      document.querySelectorAll('.ncp-switch').forEach((sw, index)=>{
        const keys = ['log','block','rightclick','disableConsoleFlood']
        const key = keys[index]
        if(!key) return
        if(state[key]) sw.classList.add('on') else sw.classList.remove('on')
      })
      document.querySelectorAll('.ncp-btn').forEach(btn=>{
        const parent = btn.closest('.ncp-row')
        if(!parent) return
        const label = parent.querySelector('.ncp-toggle > div:nth-child(2)')
        if(!label) return
        const text = label.textContent || ''
        const map = { 'Log to console only': 'log', 'Block developer shortcuts': 'block', 'Disable right click': 'rightclick', 'Console clear loop': 'disableConsoleFlood' }
        const key = map[text.trim()]
        if(key) btn.textContent = state[key] ? 'ON' : 'OFF'
      })
    }

    return { root, overlay, renderStatus }
  }

  const ui = createUI()

  function toggleState(k){
    state[k] = !state[k]
    if(k === 'disableConsoleFlood') restartConsoleFlood()
    document.querySelectorAll('.ncp-switch').forEach((sw, index)=>{
      const keys = ['log','block','rightclick','disableConsoleFlood']
      const key = keys[index]
      if(!key) return
      if(state[key]) sw.classList.add('on') else sw.classList.remove('on')
    })
    document.querySelectorAll('.ncp-btn').forEach(btn=>{
      const parent = btn.closest('.ncp-row')
      if(!parent) return
      const label = parent.querySelector('.ncp-toggle > div:nth-child(2)')
      if(!label) return
      const text = label.textContent || ''
      const map = { 'Log to console only': 'log', 'Block developer shortcuts': 'block', 'Disable right click': 'rightclick', 'Console clear loop': 'disableConsoleFlood' }
      const key = map[text.trim()]
      if(key) btn.textContent = state[key] ? 'ON' : 'OFF'
    })
    ui.renderStatus()
  }

  ;(function initSwitches(){
    const switches = document.querySelectorAll('.ncp-switch')
    const keys = ['log','block','rightclick','disableConsoleFlood']
    switches.forEach((sw, i)=>{
      const k = keys[i]
      if(state[k]) sw.classList.add('on') else sw.classList.remove('on')
    })
    document.querySelectorAll('.ncp-btn').forEach(btn=>{
      const parent = btn.closest('.ncp-row')
      if(!parent) return
      const label = parent.querySelector('.ncp-toggle > div:nth-child(2)')
      if(!label) return
      const text = label.textContent || ''
      const map = { 'Log to console only': 'log', 'Block developer shortcuts': 'block', 'Disable right click': 'rightclick', 'Console clear loop': 'disableConsoleFlood' }
      const key = map[text.trim()]
      if(key) btn.textContent = state[key] ? 'ON' : 'OFF'
    })
  })()

  function showOverlay(reason, details){
    state.overlayVisible = true
    const ov = document.getElementById('ncp-overlay')
    if(!ov) return
    ov.classList.add('show')
    if(state.log) console.error('[NoConsoleProtect] ALERT', reason || 'unknown', details || '')
    ui.renderStatus()
  }

  function hideOverlay(){
    state.overlayVisible = false
    const ov = document.getElementById('ncp-overlay')
    if(!ov) return
    ov.classList.remove('show')
    ui.renderStatus()
  }

  function onKeyDown(e){
    try{
      const code = e.keyCode
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      const report = (desc, evName)=>{
        if(state.block) e.preventDefault()
        if(state.log) console.error('[no-console.js]', evName, desc)
      }

      if(code === 123) report('User pressed F12', 'F12 developer tools')
      if(ctrl && code === 83) report('User pressed Ctrl S', 'Ctrl S save page source')
      if(ctrl && shift && (code === 73 || code === 74)) {
        const ev = code === 73 ? 'Ctrl Shift I open elements' : 'Ctrl Shift J open console'
        report('User pressed ' + ev, ev)
      }
      if(ctrl && code === 85) report('User pressed Ctrl U', 'Ctrl U view source')
      if(ctrl && shift && e.key === 'K') report('User pressed Ctrl Shift K', 'Firefox console')
      if(ctrl && shift && e.key === 'C') report('User pressed Ctrl Shift C', 'Firefox elements')
    }catch(err){}
  }

  function onContext(e){
    if(state.rightclick){
      e.preventDefault()
      if(state.log) console.error('[no-console.js] Right Click - Context Menu')
      showOverlay('Context menu blocked', 'Right click was attempted')
      return
    }
    if(state.log) console.warn('[no-console.js] Right click allowed')
  }

  window.addEventListener('keydown', onKeyDown, { passive: false })
  window.addEventListener('contextmenu', onContext, { passive: false })

  let floodInterval = null

  function restartConsoleFlood(){
    if(floodInterval) clearInterval(floodInterval)
    if(state.disableConsoleFlood){
      floodInterval = setInterval(()=>{
        try{
          console.clear()
          console.log('%c', 'background: linear-gradient(90deg,#2b2b2b,#4a4a4a); color: #e6e6e6;')
          if(state.log) console.log('console cleared by NoConsoleProtect')
        }catch(e){}
      }, state.delay)
    }
  }

  restartConsoleFlood()

  const detectorTimer = (function(){
    let lastWidth = window.outerWidth
    let lastHeight = window.outerHeight
    return setInterval(()=>{
      try{
        const width = window.outerWidth
        const height = window.outerHeight
        if(Math.abs(width - lastWidth) > 100 || Math.abs(height - lastHeight) > 100){
          if(state.log) console.warn('[no-console.js] possible devtools resize detected')
          showOverlay('Devtools resize detected', 'Window outer size changed significantly')
        }
        lastWidth = width
        lastHeight = height
      }catch(e){}
    }, 1000)
  })()

  const toplevel = {
    showOverlay,
    hideOverlay,
    toggleState,
    getState: ()=> Object.assign({}, state)
  }

  window.NoConsoleProtect = toplevel
})(window, document)
