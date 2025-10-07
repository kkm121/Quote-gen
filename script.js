const f = document.getElementById('f')   // get button
const q = document.getElementById('q')   // quote
const a = document.getElementById('a')   // author
const p = document.getElementById('p')   // status text
const c = document.getElementById('c')   // copy btn
const hs = document.getElementById('hs') // history list
const cl = document.getElementById('cl') // clear history
const d = document.getElementById('d')   // dark toggle
const bd = document.getElementById('bd') // body

const k = 'qh'   // history key
const kd = 'dm'  // dark key

let h = []       // history array
let rt = null    // reveal timer
let ab = null    // abort controller for fetch

// load history + dark
try{
  const s = localStorage.getItem(k)
  if(s) h = JSON.parse(s)
}catch(e){ /* localStorage maybe blocked - meh */ }

try{
  const sd = localStorage.getItem(kd)
  if(sd === '1'){ bd.classList.add('dm'); d.setAttribute('aria-pressed','true') }
}catch(e){}

// render history
function sh(){
  hs.innerHTML = ''
  if(!h || h.length === 0){
    const li = document.createElement('li'); li.textContent = 'No history yet.'; hs.appendChild(li); return
  }
  h.slice().reverse().forEach(function(it){
    const li = document.createElement('li')
    const txt = it.c.length > 120 ? it.c.slice(0,120) + '...' : it.c
    li.textContent = txt
    const sm = document.createElement('small'); sm.textContent = '— ' + it.a
    li.appendChild(sm)
    hs.appendChild(li)
  })
}

// save history
function sv(it){
  h.push(it)
  if(h.length > 12) h = h.slice(h.length - 12)
  try{ localStorage.setItem(k, JSON.stringify(h)) }catch(e){}
  sh()
}

// show author first
function showSetup(auth){
  a.textContent = '— ' + (auth || 'Unknown')
  q.textContent = ''
}

// reveal quote text
function rev(txt){
  q.textContent = '"' + (txt || 'No quote') + '"'
}

// UI helpers without spinner
function setLoading(on){
  f.disabled = on  // disable/enable get button so user knows
  if(on){
    p.textContent = 'Loading...'
  } else {
    // clear the 'Loading...' tiny bit later so user sees it briefly
    setTimeout(()=>{ if(p.textContent === 'Loading...') p.textContent = '' }, 700)
  }
}

// fetch quote
async function gq(){
  if(rt){ clearTimeout(rt); rt = null }
  if(ab){ ab.abort(); ab = null }
  setLoading(true)

  try{
    ab = new AbortController()
    const res = await fetch('https://api.quotable.io/random', { signal: ab.signal })
    if(!res.ok) throw new Error('bad resp')
    const jd = await res.json()
    const cont = jd.content || ''
    const auth = jd.author || 'Unknown'
    showSetup(auth)
    rt = setTimeout(function(){ rev(cont); rt = null }, 900)
    sv({ c: cont, a: auth })
    setLoading(false)
    p.textContent = ''
  } catch(e){
    if(e.name === 'AbortError'){ p.textContent = 'Request cancelled.' }
    else p.textContent = 'Error fetching quote. Try again.'
    a.textContent = ''
    q.textContent = ''
    setLoading(false)
  } finally {
    ab = null
  }
}

// copy to clipboard
async function cp(){
  const txt = (q.textContent ? q.textContent + ' ' : '') + (a.textContent ? a.textContent : '')
  if(!txt.trim()){ p.textContent = 'Nothing to copy.'; return }
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(txt)
      p.textContent = 'Copied to clipboard.'
    } else {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); ta.remove()
      p.textContent = 'Copied (fallback).'
    }
  } catch(e){
    p.textContent = 'Copy failed.'
  }
}

// clear history
function ch(){
  h = []
  try{ localStorage.removeItem(k) }catch(e){}
  sh()
  p.textContent = 'History cleared.'
}

// toggle dark
function td(){
  const on = bd.classList.toggle('dm')
  d.setAttribute('aria-pressed', on ? 'true' : 'false')
  try{ localStorage.setItem(kd, on ? '1' : '0') }catch(e){}
}

// events
f.addEventListener('click', gq)
c.addEventListener('click', cp)
cl.addEventListener('click', ch)
d.addEventListener('click', td)

// initial render
sh()