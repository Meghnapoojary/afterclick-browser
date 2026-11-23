const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const APP_ID = 'com.afterclick.desktop';
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

let PORT = null;
let BASE_URL = null;
let mainWindow;
let demoServer;
let browserBounds = { x: 0, y: 150, width: 900, height: 600 };
let activeTabId = null;
let tabCounter = 0;
let taskSequence = 0;
const tabs = new Map();
const providerTabs = new Map();
const taskContracts = new Map();
const taskBookingAttempts = new Map();
const actionJournal = [];
const bookings = [];
const payments = [];
const receipts = [];
const searchSessions = new Map();

const PROVIDERS = [
  {
    id: 'northstar', name: 'Northstar Clinic', shortName: 'Northstar', area: 'Indiranagar', price: 450,
    rating: 4.8, slot: '4:30 PM', minutes: 270, available: true, tag: 'Best balance',
    description: 'General physician consultation · 20 min'
  },
  {
    id: 'carewell', name: 'Carewell Health', shortName: 'Carewell', area: 'Koramangala', price: 399,
    rating: 4.6, slot: '5:15 PM', minutes: 315, available: true, tag: 'Lowest price',
    description: 'General physician consultation · 20 min'
  },
  {
    id: 'medipoint', name: 'MediPoint Centre', shortName: 'MediPoint', area: 'Domlur', price: 480,
    rating: 4.9, slot: '5:45 PM', minutes: 345, available: true, tag: 'Highest rated',
    description: 'General physician consultation · 30 min'
  }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function homePage() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFTERCLICK — New tab</title>
  <style>
  *{box-sizing:border-box}html,body{height:100%;margin:0}body{position:relative;overflow:hidden;display:grid;place-items:center;background:radial-gradient(ellipse at 18% 18%,rgba(207,190,255,.42),transparent 40%),radial-gradient(ellipse at 80% 88%,rgba(255,207,187,.35),transparent 42%),#fbf9ff;color:#2e2942;font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.start{position:relative;z-index:1;width:min(820px,calc(100% - 48px));margin-top:-2vh;text-align:center}.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid #e8e0fa;border-radius:999px;background:rgba(255,255,255,.8);color:#7b65c8;font-size:10px;font-weight:800;letter-spacing:.14em}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#78cbb6;box-shadow:0 0 0 4px #e8f7f1}.wordmark{margin-top:20px;font-size:clamp(44px,6.5vw,68px);font-weight:820;letter-spacing:-.075em;line-height:1;color:#302944}.wordmark span{color:#8c74e8}.tagline{margin:15px auto 32px;color:#89839a;font-size:15px}.command{height:68px;display:flex;align-items:center;gap:13px;padding:0 10px 0 22px;border:1px solid #e5def4;border-radius:21px;background:#fff;box-shadow:0 17px 48px rgba(84,66,130,.12);transition:.18s}.command:focus-within{border-color:#a28de9;box-shadow:0 0 0 4px rgba(154,132,235,.12),0 17px 48px rgba(84,66,130,.12)}.command-icon{color:#8b76d8;font-size:24px}.command input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#302944;font:15px Inter,system-ui}.command input::placeholder{color:#aaa4b6}.command button{height:48px;min-width:52px;padding:0 17px;border:0;border-radius:14px;background:linear-gradient(135deg,#9e89ee,#8069dc);color:#fff;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 7px 17px rgba(131,107,222,.2)}.command button:hover{filter:brightness(1.04);transform:translateY(-1px)}.hint{margin:15px auto 0;color:#a09aac;font-size:11px}.quick-prompts{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:24px}.quick-prompts button{border:1px solid #e9e3f5;border-radius:999px;background:rgba(255,255,255,.82);color:#777088;padding:9px 14px;font-size:11px;cursor:pointer;transition:.18s}.quick-prompts button:hover{border-color:#c2b3f2;color:#7059c4;background:#fff}.mascot-star-decor{position:fixed;z-index:0;right:clamp(18px,6vw,92px);bottom:25px;width:min(118px,12vw);height:auto;pointer-events:none;filter:drop-shadow(0 12px 18px rgba(83,67,126,.15));opacity:.98;animation:starFloat 4.5s ease-in-out infinite}@keyframes starFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}.foot{position:fixed;bottom:23px;left:0;right:0;text-align:center;color:#b0aabd;font-size:9px;letter-spacing:.13em;text-transform:uppercase}.foot b{color:#8a74d9;font-weight:700}@media(max-width:760px){.mascot-star-decor{width:82px;right:10px;bottom:8px;opacity:.75}.start{margin-top:-6vh}.tagline{font-size:13px}}@media(max-width:560px){.command{height:58px}.command button{min-width:44px;padding:0 12px}.tagline{font-size:12px}.quick-prompts{gap:6px}.quick-prompts button{font-size:10px;padding:8px 10px}}
  </style></head><body><main class="start"><div class="eyebrow"><i></i> YOUR BROWSER, WITH A LITTLE EXTRA MAGIC</div><div class="wordmark">AFTER<span>CLICK</span></div><p class="tagline">Search the web, understand what matters, and get things done.</p>
  <form class="command" id="command-form"><span class="command-icon">⌕</span><input id="command-input" type="text" autocomplete="off" placeholder="Search anything or tell AFTERCLICK what you need…" aria-label="Search or ask AFTERCLICK" required><button type="submit" aria-label="Submit command">↗</button></form>
  <p class="hint">One command bar for web search, page understanding and guided tasks</p>
  <div class="quick-prompts"><button type="button" data-query="Best cafés in Bengaluru for studying">Find a cosy café</button><button type="button" data-query="Compare budget laptops for coding students">Compare products</button><button type="button" data-query="Find an appointment tomorrow between 4 PM and 6 PM, under ₹500">Book an appointment</button></div>
</main><img class="mascot-star-decor" src="/assets/mascot-star.png" alt="A little AFTERCLICK guide" />
  <div class="foot">A browser that turns intentions into <b>verified outcomes</b></div>
  <script>
    const input=document.getElementById('command-input');
    function send(value){if(!value)return;if(window.afterclickHome&&window.afterclickHome.submitCommand){window.afterclickHome.submitCommand(value);input.value='';}else{input.placeholder='Start page bridge unavailable. Use the browser bar above.';}}
    document.getElementById('command-form').addEventListener('submit',e=>{e.preventDefault();send(input.value.trim());});
    document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>send(button.dataset.query)));
  </script></body></html>`;
}

function decodeSearchHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ').trim();
}

function getHtmlAttribute(tag, attribute) {
  const match = String(tag).match(new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] || match[2] || match[3] || '') : '';
}

function cleanSearchUrl(raw) {
  try {
    let candidate = String(raw || '').trim();
    if (candidate.startsWith('//')) candidate = `https:${candidate}`;
    const parsed = new URL(candidate, 'https://duckduckgo.com');
    if (parsed.hostname.includes('duckduckgo.com') && parsed.pathname === '/l/') {
      const target = parsed.searchParams.get('uddg');
      if (target) candidate = target;
    }
    const finalUrl = new URL(candidate);
    if (!['http:', 'https:'].includes(finalUrl.protocol)) return null;
    return finalUrl.toString();
  } catch { return null; }
}

function parseDuckDuckGoResults(html) {
  const results = [];
  const anchors = [...String(html).matchAll(/<a\b[^>]*class=["'][^"']*\bresult__a\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)];
  const snippets = [...String(html).matchAll(/<(?:a|div)\b[^>]*class=["'][^"']*\bresult__snippet\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div)>/gi)];
  for (let index = 0; index < anchors.length; index += 1) {
    const full = anchors[index][0];
    const opening = full.match(/^<a\b[^>]*>/i)?.[0] || '';
    const href = cleanSearchUrl(getHtmlAttribute(opening, 'href'));
    const title = decodeSearchHtml(full.slice(opening.length).replace(/<\/a>$/i, ''));
    if (!href || !title) continue;
    let domain = '';
    try { domain = new URL(href).hostname.replace(/^www\./, ''); } catch {}
    results.push({ title, url: href, domain, snippet: decodeSearchHtml(snippets[index]?.[1] || '') });
    if (results.length >= 8) break;
  }
  return results;
}
async function runWebSearch(query) {
  const cleanQuery = String(query || '').trim().slice(0, 240);
  if (!cleanQuery) throw new Error('Enter something to search for.');
  const fallbackUrl = `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`;
  let results = [];
  let error = null;
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: { 'user-agent': 'Mozilla/5.0 AFTERCLICK/0.6 desktop browser', 'accept-language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Search provider returned HTTP ${response.status}.`);
    const html = await response.text();
    results = parseDuckDuckGoResults(html);
    if (!results.length) throw new Error('The search provider returned no structured results.');
  } catch (searchError) {
    error = searchError instanceof Error ? searchError.message : 'Search provider unavailable.';
  }
  const id = crypto.randomUUID();
  const entry = { id, query: cleanQuery, results, provider: 'DuckDuckGo', fallbackUrl, error, searchedAt: new Date().toISOString() };
  searchSessions.set(id, entry);
  while (searchSessions.size > 24) searchSessions.delete(searchSessions.keys().next().value);
  return { ...entry, pageUrl: `${BASE_URL}/search/${id}` };
}

function searchResultsPage(entry) {
  const query = escapeHtml(entry.query);
  const cards = entry.results.map((result, index) => `
    <a class="result-card" href="${escapeHtml(result.url)}">
      <div class="result-meta"><span class="result-index">${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(result.domain)}</span><span class="result-open">Open page ↗</span></div>
      <h2>${escapeHtml(result.title)}</h2><p>${escapeHtml(result.snippet || 'Open this page to explore the source.')}</p>
    </a>`).join('');
  const noResults = `<div class="empty-search"><div class="empty-search-icon">⌕</div><h2>We couldn't load structured results just now.</h2><p>${escapeHtml(entry.error || 'The search provider did not return any results.')}</p><a class="fallback-link" href="${escapeHtml(entry.fallbackUrl)}">Open full web results ↗</a></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${query} — AFTERCLICK Search</title>
  <style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 94% 8%,#f6e9ff 0,transparent 32%),#fbf9ff;color:#302944;font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.page{max-width:920px;margin:0 auto;padding:34px 42px 65px}.top{display:flex;justify-content:space-between;align-items:center;padding-bottom:23px;border-bottom:1px solid #ece7f5}.brand{font-weight:850;letter-spacing:-.045em;font-size:17px}.brand span{color:#8c74e8}.source-chip{border:1px solid #e7def8;background:#fff;border-radius:999px;padding:7px 11px;color:#7c68bf;font-size:10px;font-weight:700;letter-spacing:.08em}.kicker{margin-top:34px;color:#8e79d7;font-weight:800;font-size:10px;letter-spacing:.16em}.heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.heading h1{max-width:690px;margin:10px 0 7px;font-size:clamp(27px,4vw,40px);line-height:1.09;letter-spacing:-.055em}.heading h1 em{font-style:normal;color:#8a72df}.count{color:#918a9f;font-size:11px}.results{display:grid;gap:12px;margin-top:25px}.result-card{display:block;padding:17px 19px;border:1px solid #ece6f6;border-radius:16px;background:rgba(255,255,255,.88);color:inherit;text-decoration:none;box-shadow:0 5px 16px rgba(68,53,111,.035);transition:.18s}.result-card:hover{border-color:#cbbcf4;transform:translateY(-2px);box-shadow:0 10px 25px rgba(93,71,156,.09)}.result-meta{display:flex;align-items:center;gap:9px;color:#8d879b;font-size:10px}.result-index{width:22px;height:22px;display:grid;place-items:center;border-radius:8px;background:#f1edff;color:#826bd5;font-weight:800}.result-open{margin-left:auto;color:#8c74e8;font-weight:700}.result-card h2{margin:9px 0 4px;color:#4b3d91;font-size:17px;line-height:1.25;letter-spacing:-.02em}.result-card p{margin:0;color:#777187;font-size:12px;line-height:1.6}.empty-search{margin-top:28px;padding:28px;border:1px dashed #d9d0ef;border-radius:18px;text-align:center;background:#fff}.empty-search-icon{margin:auto;width:45px;height:45px;display:grid;place-items:center;border-radius:15px;background:#f1ecff;color:#8a72df;font-size:28px}.empty-search h2{margin:12px 0 5px;font-size:18px}.empty-search p{color:#898398;font-size:12px}.fallback-link{display:inline-flex;padding:10px 14px;border-radius:11px;background:#8c74e8;color:#fff;text-decoration:none;font-weight:700;font-size:11px}.mascot{display:block;width:min(230px,38vw);height:auto;margin:34px 0 0 auto;opacity:.95}.foot{margin-top:20px;padding-top:17px;border-top:1px solid #eee8f5;color:#aaa3b6;font-size:9px;letter-spacing:.13em;text-transform:uppercase}.foot b{color:#8d77dd}@media(max-width:620px){.page{padding:24px 18px}.heading{display:block}.mascot{width:170px;margin-top:22px}}
  </style></head><body><main class="page"><div class="top"><div class="brand">AFTER<span>CLICK</span></div><div class="source-chip">WEB SEARCH · ${escapeHtml(entry.provider)}</div></div><div class="kicker">A LITTLE CLARITY FROM THE WEB</div><div class="heading"><div><h1>Search results for <em>“${query}”</em></h1><div class="count">${entry.results.length ? `${entry.results.length} pages found` : 'Search is temporarily unavailable'} · ${new Date(entry.searchedAt).toLocaleString('en-IN')}</div></div></div><section class="results">${cards || noResults}</section><img class="mascot" src="/assets/mascot-explorer.png" alt="AFTERCLICK search guide"/><div class="foot">Search the web. Understand what matters. <b>Know what happened.</b></div></main></body></html>`;
}
function siteCss() {
  return `:root{color-scheme:light;--bg:#fbf9ff;--panel:#fff;--line:#e9e3f3;--text:#302944;--muted:#857e96;--violet:#8b74e4;--mint:#78cbb6;--gold:#dca875}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 84% 0%,#f4eaff 0%,transparent 45%),#fbf9ff;color:var(--text);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.home-wrap{max-width:950px;margin:0 auto;padding:58px 46px}.eyebrow{color:var(--violet);font-size:11px;letter-spacing:.18em;font-weight:800;display:flex;gap:9px;align-items:center}.pulse{width:7px;height:7px;border-radius:50%;background:var(--mint);box-shadow:0 0 16px var(--mint)}h1{font-size:clamp(48px,7vw,82px);line-height:.98;letter-spacing:-.065em;margin:46px 0 20px;font-weight:750}h1 em{font-style:normal;color:var(--violet)}.lede{max-width:540px;color:var(--muted);font-size:17px}.home-search{display:flex;align-items:center;gap:12px;max-width:650px;height:62px;margin-top:32px;padding:0 10px 0 18px;border:1px solid #e5def4;border-radius:15px;background:#fff;box-shadow:0 12px 34px rgba(77,58,128,.1)}.home-search:focus-within{border-color:var(--violet)}.search-mark{font-size:27px;color:var(--violet);line-height:1}.home-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:var(--text);font:15px Inter,system-ui}.home-search input::placeholder{color:#aaa4b6}.home-search button{border:0;border-radius:10px;padding:12px 16px;background:var(--violet);color:#fff;font-weight:800;cursor:pointer}.home-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:30px}.home-card{min-height:155px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;text-decoration:none;color:var(--text);display:flex;flex-direction:column;justify-content:space-between;transition:.2s;box-shadow:0 8px 25px rgba(77,58,128,.04)}.home-card:hover{border-color:#c7b8f3;transform:translateY(-3px)}.card-index{font-size:11px;color:var(--violet);letter-spacing:.13em}.home-card b{font-size:18px}.home-card small{color:var(--muted)}.home-foot{display:flex;justify-content:space-between;margin-top:72px;padding-top:20px;border-top:1px solid var(--line);font-size:10px;letter-spacing:.15em;color:#a49daf}.provider-wrap{max-width:780px;padding:42px;margin:0 auto}.provider-head{display:flex;align-items:center;justify-content:space-between;color:var(--violet);font-size:11px;letter-spacing:.16em;font-weight:800}.provider-brand{font-size:36px;letter-spacing:-.04em;margin:30px 0 4px;color:#302944}.provider-sub{color:var(--muted);margin:0 0 32px}.slot-card{background:#fff;border:1px solid var(--line);padding:24px;border-radius:18px;display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;box-shadow:0 12px 35px rgba(77,58,128,.06)}.slot-label{font-size:11px;letter-spacing:.13em;color:var(--muted);text-transform:uppercase}.slot-price{font-size:36px;font-weight:700;letter-spacing:-.05em;color:#302944}.slot-time{font-size:19px;color:#7c66d1;font-weight:700}.slot-details{color:var(--muted);margin-top:6px}.book-btn{border:0;border-radius:11px;padding:14px 19px;background:linear-gradient(135deg,#a08cf0,#816bdb);color:#fff;font-weight:800;cursor:pointer}.book-btn:disabled{opacity:.5;cursor:not-allowed}.notice{margin-top:18px;display:none;border:1px solid #c5e8dc;background:#effaf6;color:#286b57;padding:14px 16px;border-radius:12px}.notice.show{display:block}.notice.warning{border-color:#f0d9b6;background:#fff7e9;color:#906528}.notice.info{border-color:#d7cdf4;background:#f5f1ff;color:#6853b4}.notice.danger{border-color:#f1c5cc;background:#fff0f2;color:#a43c51}.book-btn.booked{background:#4eaa91;color:#fff}.provider-meta{display:flex;gap:20px;margin:24px 0;color:var(--muted);font-size:13px}.provider-foot{margin-top:54px;border-top:1px solid var(--line);padding-top:16px;color:#a39bad;font-size:10px;letter-spacing:.14em}.ledger-wrap{max-width:900px;margin:0 auto;padding:40px}.ledger-table{width:100%;border-collapse:collapse;margin-top:26px;background:#fff;border-radius:14px;overflow:hidden}.ledger-table th,.ledger-table td{text-align:left;padding:14px;border-bottom:1px solid var(--line)}.ledger-table th{font-size:11px;color:var(--muted);letter-spacing:.1em}.empty{color:var(--muted);padding:24px 0}`;
}
function providerPage(provider) {
  const data = JSON.stringify(provider).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(provider.name)} — Appointments</title><style>${siteCss()}</style></head><body>
  <main class="provider-wrap" data-provider-id="${provider.id}"><div class="provider-head"><span>AFTERCLICK TEST NETWORK</span><span>VERIFIED PROVIDER PROFILE</span></div><h1 class="provider-brand">${escapeHtml(provider.name)}</h1><p class="provider-sub">${escapeHtml(provider.description)}</p>
  <div class="slot-card"><div><div class="slot-label">Available appointment · Tomorrow</div><div class="slot-time">${provider.slot}</div><div class="slot-details">${escapeHtml(provider.area)} · ★ ${provider.rating} · ${escapeHtml(provider.description)}</div></div><div style="text-align:right"><div class="slot-label">Consultation fee</div><div class="slot-price">₹${provider.price}</div><button class="book-btn" id="book-button" onclick="window.AFTERCLICK_SELECT_PROVIDER()">Select in AFTERCLICK&nbsp; →</button></div></div>
  <div class="notice" id="notice" role="status"></div><div class="provider-meta"><span>● Slot available</span><span>● Demo provider data</span><span>● Secure booking simulation</span></div><div class="provider-foot">THIS IS A CONTROLLED LOCAL TEST WEBSITE · NO REAL APPOINTMENT WILL BE CREATED</div></main>
  <script>
    window.AFTERCLICK_PROVIDER = ${data};
    window.__AFTERCLICK_TASK_ID = null;
    const button = document.getElementById('book-button');
    const notice = document.getElementById('notice');
    function showOutcome(message, tone) { notice.textContent = message; notice.className = 'notice show ' + (tone || 'success'); }
    window.AFTERCLICK_SELECT_PROVIDER = function() {
      showOutcome('No booking has been submitted. Choose this provider in the right-hand comparison panel, then continue to demo checkout so the action is recorded and independently verified.', 'info');
    };
    window.AFTERCLICK_SHOW_VERIFIED = function(booking) {
      showOutcome('DEMO APPOINTMENT RECORD VERIFIED · ' + booking.customerName + ' · ' + booking.appointmentDate + ' at ' + booking.slot + ' · ' + booking.reference + '. Demo payment: ' + booking.paymentStatus + '. No real payment was collected.', 'success');
      button.disabled = true; button.classList.add('booked'); button.textContent = '✓ Verified appointment';
    };
    window.AFTERCLICK_BOOK = async function(taskId, paymentInfo) {
      window.__AFTERCLICK_TASK_ID = taskId;
      button.disabled = true; button.textContent = 'Authorizing demo payment…';
      let authorization = null;
      try {
        const paymentResponse = await fetch('/api/payment/authorize', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taskId,providerId:window.AFTERCLICK_PROVIDER.id,amount:window.AFTERCLICK_PROVIDER.price,customerName:paymentInfo.customerName,method:paymentInfo.method})});
        const paymentResult = await paymentResponse.json();
        if (!paymentResponse.ok || !paymentResult.authorization) throw new Error(paymentResult.error || 'Demo payment authorization failed.');
        authorization = paymentResult.authorization;
        showOutcome('Demo payment authorized. No real money has been charged. Sending the appointment request…', 'info');
        button.textContent = 'Confirming appointment…';
        const response = await fetch('/api/book', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taskId,providerId:window.AFTERCLICK_PROVIDER.id,paymentAuthorizationId:authorization.id})});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The provider could not complete the booking.');
        if (result.booking) window.AFTERCLICK_SHOW_VERIFIED(result.booking);
        else { showOutcome(result.message || 'Booking request accepted. AFTERCLICK is checking the final outcome.', 'info'); button.textContent = 'Checking confirmation…'; }
        return {received:true,result,authorization};
      } catch (error) {
        showOutcome('The response was interrupted. AFTERCLICK is checking the independent booking history before deciding what happened. Do not submit again.', 'warning');
        button.textContent = 'Verifying booking…';
        try {
          const historyResponse = await fetch('/api/ledger?taskId=' + encodeURIComponent(taskId), {cache:'no-store'});
          const history = await historyResponse.json();
          if (!historyResponse.ok || history.authoritative !== true || !Array.isArray(history.bookings)) throw new Error('History source unavailable or inconclusive');
          const matches = history.bookings.filter(record => record.taskId === taskId);
          if (matches.length === 1) {
            window.AFTERCLICK_SHOW_VERIFIED(matches[0]);
            return {received:false,error:String(error),uncertain:false,reconciled:'BOOKED',booking:matches[0],authorization};
          }
          if (matches.length > 1) {
            showOutcome('DUPLICATE ALERT · ' + matches.length + ' matching records were found. Do not submit again; review the booking history.', 'danger');
            button.textContent = 'Review duplicates';
            return {received:false,error:String(error),uncertain:true,reconciled:'DUPLICATE_DETECTED',matches,authorization};
          }
          showOutcome('NOT BOOKED · The authoritative booking history has no matching record. The demo payment authorization will be voided before any new attempt.', 'warning');
          button.textContent = 'No booking found';
          return {received:false,error:String(error),uncertain:false,reconciled:'NOT_BOOKED',authorization};
        } catch (historyError) {
          showOutcome('OUTCOME UNCERTAIN · Booking history could not be checked. The task remains on hold. Do not submit again.', 'warning');
          button.textContent = 'History unavailable';
          return {received:false,error:String(error),historyError:String(historyError),uncertain:true,reconciled:'UNCERTAIN',authorization};
        }
      }
    };
  </script></body></html>`;
}

function ledgerPage() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking Ledger</title><style>${siteCss()}</style></head><body><main class="ledger-wrap"><div class="provider-head"><span>AFTERCLICK / INDEPENDENT VERIFIER</span><span>READ-ONLY LEDGER</span></div><h1 style="font-size:44px;margin:28px 0 8px">Booking history</h1><p class="provider-sub">This ledger is queried independently after an uncertain browser response.</p><div id="ledger" class="empty">Loading records…</div><div class="provider-foot">LOCAL DEMO LEDGER · THE SOURCE OF TRUTH FOR RECONCILIATION</div></main><script>async function refresh(){const data=await fetch('/api/ledger').then(r=>r.json());const root=document.getElementById('ledger');if(!data.bookings.length){root.className='empty';root.textContent='No bookings recorded yet.';return;}root.className='';root.innerHTML='<table class="ledger-table"><thead><tr><th>REFERENCE</th><th>BOOKED UNDER</th><th>PROVIDER</th><th>SLOT</th><th>PAYMENT</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>'+data.bookings.map(b=>'<tr><td>'+b.reference+'</td><td>'+b.customerName+'</td><td>'+b.providerName+'</td><td>'+b.slot+'</td><td>'+b.paymentMethod+'</td><td>₹'+b.price+'</td><td style="color:#7ce3c2">'+b.status+'</td></tr>').join('')+'</tbody></table>';}refresh();setInterval(refresh,2000);</script></body></html>`;
}

function startDemoServer() {
  demoServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, BASE_URL);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
    // Reject cross-origin writes from arbitrary websites opened in the browser.
    const requestOrigin = req.headers.origin;
    if (req.method === 'POST' && requestOrigin && requestOrigin !== BASE_URL) {
      return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      const assetName = url.pathname.slice('/assets/'.length);
      const allowedAssets = new Set(['mascot-bot.png', 'mascot-star.png', 'mascot-explorer.png']);
      if (!allowedAssets.has(assetName)) return res.writeHead(404).end();
      const assetPath = path.join(__dirname, 'assets', assetName);
      try {
        const image = fs.readFileSync(assetPath);
        res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' });
        return res.end(image);
      } catch { return res.writeHead(404).end(); }
    }
    if (req.method === 'GET' && url.pathname.startsWith('/search/')) {
      const id = url.pathname.split('/').pop();
      const entry = searchSessions.get(id);
      if (!entry) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); return res.end('<h1>Search session expired</h1><p>Start a fresh search from AFTERCLICK.</p>'); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(searchResultsPage(entry));
    }
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(homePage());
    }
    if (req.method === 'GET' && url.pathname === '/demo/ledger') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(ledgerPage());
    }
    if (req.method === 'GET' && url.pathname.startsWith('/demo/provider/')) {
      const id = url.pathname.split('/').pop();
      const provider = PROVIDERS.find((item) => item.id === id);
      if (!provider) return sendJson(res, 404, { error: 'Provider not found' });
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(providerPage(provider));
    }
    if (req.method === 'GET' && url.pathname === '/api/providers') return sendJson(res, 200, { providers: PROVIDERS });
    if (req.method === 'GET' && url.pathname === '/api/ledger') {
      const taskId = url.searchParams.get('taskId');
      const filtered = taskId ? bookings.filter((booking) => booking.taskId === taskId) : bookings;
      return sendJson(res, 200, { bookings: filtered, total: filtered.length, checkedAt: new Date().toISOString(), authoritative: true, source: 'AFTERCLICK_LOCAL_BOOKING_LEDGER' });
    }
    if (req.method === 'POST' && url.pathname === '/api/payment/authorize') {
      let body;
      try { body = await readBody(req); } catch (error) { return sendJson(res, 400, { error: 'Invalid payment authorization request.' }); }
      const provider = PROVIDERS.find((item) => item.id === body.providerId);
      const customerName = String(body.customerName || '').trim().slice(0, 100);
      const method = String(body.method || '');
      if (!provider || !body.taskId || !customerName || !['DEMO_UPI', 'DEMO_CARD'].includes(method)) {
        return sendJson(res, 400, { error: 'A valid task, provider, appointment name and demo payment method are required.' });
      }
      if (Number(body.amount) !== provider.price) return sendJson(res, 400, { error: 'The payment amount does not match the provider fee.' });
      if (bookings.some((item) => item.taskId === body.taskId)) return sendJson(res, 409, { error: 'A booking already exists for this task. No new payment was authorized.' });
      const authorization = {
        id: `AUTH-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        reference: `PAY-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        taskId: String(body.taskId), providerId: provider.id, providerName: provider.name,
        customerName, amount: provider.price, method, status: 'AUTHORIZED_DEMO',
        createdAt: new Date().toISOString(), demo: true
      };
      payments.push(authorization);
      actionJournal.push({ at: new Date().toISOString(), type: 'DEMO_PAYMENT_AUTHORIZED', taskId: authorization.taskId, reference: authorization.reference, detail: `${authorization.method} · ${authorization.amount}` });
      return sendJson(res, 201, { ok: true, authorization, notice: 'Demo authorization only. No real money was charged.' });
    }
    if (req.method === 'POST' && url.pathname === '/api/book') {
      let body;
      try { body = await readBody(req); } catch (error) { return sendJson(res, 400, { error: 'Invalid request body' }); }
      const provider = PROVIDERS.find((item) => item.id === body.providerId);
      if (!provider) return sendJson(res, 404, { error: 'Unknown provider' });
      const authorization = payments.find((item) => item.id === body.paymentAuthorizationId && item.taskId === body.taskId && item.providerId === provider.id && item.status === 'AUTHORIZED_DEMO');
      if (!authorization) return sendJson(res, 402, { error: 'A valid demo payment authorization is required before booking.' });
      const existing = bookings.find((booking) => booking.taskId === body.taskId);
      if (existing) return sendJson(res, 200, { ok: true, duplicatePrevented: true, booking: existing, message: 'Existing booking found. No duplicate was created.' });
      // Controlled no-commit fault: Northstar drops the first request before a booking is written.
      if (provider.id === 'northstar' && !global.__northstarNoCommitInjected) {
        global.__northstarNoCommitInjected = true;
        actionJournal.push({ at: new Date().toISOString(), type: 'BOOKING_REQUEST_DROPPED_BEFORE_COMMIT', taskId: String(body.taskId || 'manual-demo') });
        return res.destroy();
      }
      const createdAt = new Date().toISOString();
      const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const booking = {
        reference: `AC-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        taskId: String(body.taskId || 'manual-demo'), providerId: provider.id, providerName: provider.name,
        customerName: authorization.customerName, appointmentDate, price: provider.price, slot: provider.slot,
        area: provider.area, status: 'CONFIRMED', paymentStatus: 'CAPTURED_DEMO',
        paymentMethod: authorization.method, paymentReference: authorization.reference,
        paymentAuthorizationId: authorization.id, createdAt
      };
      authorization.status = 'CAPTURED_DEMO';
      authorization.capturedAt = createdAt;
      bookings.push(booking);
      actionJournal.push({ at: new Date().toISOString(), type: 'BOOKING_COMMITTED', taskId: booking.taskId, reference: booking.reference });
      // Controlled fault injection: the backend commits the booking, then drops the response.
      if (provider.id === 'carewell' && !global.__carewellDropInjected) {
        global.__carewellDropInjected = true;
        return res.destroy();
      }
      return sendJson(res, 201, { ok: true, booking, message: 'Demo appointment record created.' });
    }
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      bookings.splice(0, bookings.length); payments.splice(0, payments.length); actionJournal.splice(0, actionJournal.length); receipts.splice(0, receipts.length); global.__carewellDropInjected = false; global.__northstarNoCommitInjected = false; global.__failNextLedgerRead = false;
      return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 404, { error: 'Not found' });
  });
  return new Promise((resolve, reject) => {
    demoServer.once('error', reject);
    // Use an OS-assigned free port so stale runs cannot block the app on 4179.
    demoServer.listen(0, '127.0.0.1', () => {
      const address = demoServer.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Could not determine the local demo-server port.'));
      }
      PORT = address.port;
      BASE_URL = `http://127.0.0.1:${PORT}`;
      console.log(`[AFTERCLICK] Local demo server ready at ${BASE_URL}`);
      resolve();
    });
  });
}

function publishTabs() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const tabList = [...tabs.values()].map((tab) => ({
    id: tab.id, title: tab.title || 'New tab', url: tab.url || '', loading: !!tab.loading,
    active: tab.id === activeTabId, canGoBack: tab.view.webContents.canGoBack(), canGoForward: tab.view.webContents.canGoForward()
  }));
  mainWindow.webContents.send('browser:tabs', { tabs: tabList, activeTabId });
}

function publishBrowserEvent(type, data = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('browser:event', { type, ...data });
}

function publishAgentStage(phase, message, taskId) {
  publishBrowserEvent('agent-stage', { phase, message, taskId });
}

function setActiveViewBounds() {
  for (const tab of tabs.values()) tab.view.setVisible(tab.id === activeTabId);
  const active = tabs.get(activeTabId);
  if (active && !active.view.webContents.isDestroyed()) active.view.setBounds(browserBounds);
}

function normaliseUrl(input) {
  const text = String(input || '').trim();
  if (!text) return `${BASE_URL}/`;
  if (/^https?:\/\//i.test(text)) return text;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(text)) return `http://${text}`;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(text)) return `https://${text}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(text)}`;
}

async function createTab(url = `${BASE_URL}/`) {
  const id = `tab-${++tabCounter}`;
  const view = new WebContentsView({ webPreferences: { preload: path.join(__dirname, 'view-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
  mainWindow.contentView.addChildView(view);
  view.setBounds(browserBounds);
  view.setVisible(false);
  const tab = { id, view, title: 'New tab', url, loading: true };
  tabs.set(id, tab);
  view.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/i.test(target)) shell.openExternal(target);
    return { action: 'deny' };
  });
  view.webContents.on('page-title-updated', (_event, title) => { tab.title = title || 'Untitled'; publishTabs(); });
  view.webContents.on('did-start-loading', () => { tab.loading = true; publishTabs(); });
  view.webContents.on('did-stop-loading', () => { tab.loading = false; tab.url = view.webContents.getURL(); publishTabs(); });
  view.webContents.on('did-navigate', (_event, target) => { tab.url = target; publishTabs(); });
  view.webContents.on('did-navigate-in-page', (_event, target) => { tab.url = target; publishTabs(); });
  view.webContents.on('render-process-gone', (_event, details) => publishBrowserEvent('crash', { tabId: id, details }));
  view.webContents.on('destroyed', () => tabs.delete(id));
  await view.webContents.loadURL(normaliseUrl(url)).catch((error) => publishBrowserEvent('navigation-error', { message: error.message }));
  activeTabId = id;
  setActiveViewBounds();
  publishTabs();
  return id;
}

function activateTab(id) {
  if (!tabs.has(id)) return false;
  activeTabId = id;
  setActiveViewBounds();
  publishTabs();
  return true;
}

async function closeTab(id) {
  const tab = tabs.get(id);
  if (!tab) return;
  mainWindow.contentView.removeChildView(tab.view);
  tab.view.webContents.close();
  tabs.delete(id);
  providerTabs.forEach((tabId, providerId) => { if (tabId === id) providerTabs.delete(providerId); });
  if (activeTabId === id) {
    const remaining = [...tabs.keys()];
    if (remaining.length) activateTab(remaining[remaining.length - 1]);
    else await createTab(`${BASE_URL}/`);
  }
  publishTabs();
}

function addJournal(type, detail, taskId) {
  const item = { at: new Date().toISOString(), type, detail, taskId };
  actionJournal.push(item);
  return item;
}

async function runResearch(goal) {
  const taskId = `TASK-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${++taskSequence}`;
  const contract = {
    id: `GC-${taskSequence.toString().padStart(3, '0')}`,
    goal: goal || 'Find and book one appointment tomorrow between 4 PM and 6 PM for under ₹500.',
    preconditions: ['Provider slot is marked available', 'Appointment time falls between 4:00 PM and 6:00 PM', 'Price is below ₹500'],
    postconditions: ['Exactly one confirmed appointment exists for this task', 'Booking reference is present in the independent ledger'],
    constraints: ['Do not create duplicate bookings', 'Ask for approval before booking', 'Verify outcome before retrying']
  };
  taskContracts.set(taskId, contract.id);
  addJournal('GOAL_CONTRACT_CREATED', contract.id, taskId);
  publishBrowserEvent('agent-log', { taskId, message: 'Goal Contract created. Preconditions and no-duplicate constraint locked.' });
  const results = [];
  for (const provider of PROVIDERS) {
    let tabId = providerTabs.get(provider.id);
    if (!tabId || !tabs.has(tabId)) {
      tabId = await createTab(`${BASE_URL}/demo/provider/${provider.id}`);
      providerTabs.set(provider.id, tabId);
    } else {
      await tabs.get(tabId).view.webContents.loadURL(`${BASE_URL}/demo/provider/${provider.id}`);
    }
    const tab = tabs.get(tabId);
    const data = await tab.view.webContents.executeJavaScript('window.AFTERCLICK_PROVIDER || null').catch(() => null);
    if (data) results.push({ ...data, sourceUrl: `${BASE_URL}/demo/provider/${provider.id}`, tabId });
  }
  // Pick the lowest-priced slot satisfying the contract's time and price constraints.
  const eligible = results.filter((provider) => provider.available && provider.minutes >= 240 && provider.minutes <= 360 && provider.price < 500);
  eligible.sort((a, b) => a.price - b.price);
  const recommended = eligible[0] || null;
  addJournal('RESEARCH_COMPLETED', `${results.length} provider pages inspected`, taskId);
  if (recommended) {
    addJournal('CHECKPOINT_SAVED', `Recommended ${recommended.name} at ${recommended.slot}`, taskId);
    activateTab(providerTabs.get(recommended.id));
  }
  return { taskId, contract, providers: results, recommended, journal: actionJournal.filter((item) => item.taskId === taskId) };
}

async function readAuthoritativeLedger(taskId) {
  if (global.__failNextLedgerRead) {
    global.__failNextLedgerRead = false;
    return { state: 'UNAVAILABLE', bookings: [], checkedAt: new Date().toISOString(), reason: 'Simulated temporary booking-history outage.' };
  }
  try {
    const response = await fetch(`${BASE_URL}/api/ledger?taskId=${encodeURIComponent(taskId)}`, { cache: 'no-store' });
    if (!response.ok) return { state: 'UNAVAILABLE', bookings: [], checkedAt: new Date().toISOString(), reason: `Ledger returned HTTP ${response.status}.` };
    const payload = await response.json();
    if (payload.authoritative !== true || !Array.isArray(payload.bookings)) {
      return { state: 'INCONCLUSIVE', bookings: [], checkedAt: payload.checkedAt || new Date().toISOString(), reason: 'The response did not identify a complete authoritative booking history.' };
    }
    return { state: 'AVAILABLE', bookings: payload.bookings.filter((item) => item.taskId === taskId), checkedAt: payload.checkedAt || new Date().toISOString(), source: payload.source || 'Unknown source' };
  } catch (error) {
    return { state: 'UNAVAILABLE', bookings: [], checkedAt: new Date().toISOString(), reason: error.message || 'The booking history could not be reached.' };
  }
}

async function createOutcomeReceipt(taskId, provider, browserResponse, ledger, reason = 'POST_ACTION_CHECK') {
  const matching = ledger.bookings || [];
  let status;
  let explanation;
  let retryAllowed = false;
  let canCheckAgain = false;

  if (ledger.state !== 'AVAILABLE') {
    status = 'UNCERTAIN';
    explanation = ledger.state === 'UNAVAILABLE'
      ? 'The booking history is temporarily unavailable. AFTERCLICK has not submitted the booking again. Check the same task history again when the provider is reachable.'
      : 'The booking history response was incomplete or could not be treated as authoritative. AFTERCLICK has not submitted the booking again. Check again before deciding what to do.';
    canCheckAgain = true;
    addJournal('OUTCOME_UNCERTAIN', ledger.reason || 'The booking history could not be verified; retry remains blocked.', taskId);
  } else if (matching.length === 1) {
    status = 'VERIFIED';
    explanation = browserResponse === 'RECEIVED'
      ? 'The provider returned a response, the demo payment record was captured, and the independent local ledger confirms exactly one demo appointment.'
      : browserResponse === 'NOT_SENT'
        ? 'The independent local ledger already contains one confirmed demo appointment. AFTERCLICK did not send another request.'
        : 'The confirmation response was lost, but the independent local ledger confirms the demo appointment and its payment record. AFTERCLICK did not submit it again.';
    addJournal('OUTCOME_VERIFIED', `History confirms ${matching[0].reference}`, taskId);
  } else if (matching.length > 1) {
    status = 'DUPLICATE_DETECTED';
    explanation = `The independent history contains ${matching.length} records for this task. AFTERCLICK has blocked further submissions. Review the records before taking action.`;
    addJournal('DUPLICATE_DETECTED', `${matching.length} matching records in the booking history`, taskId);
  } else {
    status = 'NOT_BOOKED';
    explanation = 'The authoritative booking history contains no booking for this task. Any pending demo payment authorization was voided. You may review and explicitly approve one new attempt.';
    retryAllowed = true;
    addJournal('OUTCOME_NOT_BOOKED', 'Authoritative booking history returned zero matching records; a new attempt requires fresh user approval.', taskId);
  }

  const taskPayment = payments.filter((item) => item.taskId === taskId && item.providerId === provider.id).slice(-1)[0] || null;
  if (status === 'VERIFIED') {
    const committedAuthorizationId = matching[0].paymentAuthorizationId;
    payments.filter((item) => item.taskId === taskId && item.providerId === provider.id && item.id !== committedAuthorizationId && item.status === 'AUTHORIZED_DEMO').forEach((item) => {
      item.status = 'VOIDED_DEMO';
      item.voidedAt = new Date().toISOString();
      addJournal('UNUSED_DEMO_PAYMENT_VOIDED', `Unused demo authorization ${item.reference} voided after a booking was found.`, taskId);
    });
  }
  if (status === 'NOT_BOOKED') {
    payments.filter((item) => item.taskId === taskId && item.providerId === provider.id && item.status === 'AUTHORIZED_DEMO').forEach((item) => {
      item.status = 'VOIDED_DEMO';
      item.voidedAt = new Date().toISOString();
      addJournal('DEMO_PAYMENT_AUTHORIZATION_VOIDED', `No booking existed; demo authorization ${item.reference} was voided.`, taskId);
    });
  }
  const tabId = providerTabs.get(provider.id);
  const target = tabs.get(tabId)?.view.webContents;
  const screenshot = target && !target.isDestroyed() ? await target.capturePage().catch(() => null) : null;
  const screenshotDataUrl = screenshot ? screenshot.toDataURL() : null;
  const receipt = {
    id: `RCPT-${Date.now().toString().slice(-8)}`, taskId, contractId: taskContracts.get(taskId) || 'GC-UNKNOWN',
    requested: 'Find an appointment tomorrow between 4 PM and 6 PM, under ₹500, and confirm only one booking.',
    provider: provider.name, providerId: provider.id, booking: matching[0] || null, payment: matching[0] ? { reference: matching[0].paymentReference, method: matching[0].paymentMethod, status: matching[0].paymentStatus, amount: matching[0].price, customerName: matching[0].customerName } : taskPayment ? { reference: taskPayment.reference, method: taskPayment.method, status: taskPayment.status, amount: taskPayment.amount, customerName: taskPayment.customerName } : null, status, explanation,
    browserResponse, verifiedCount: matching.length, checkedAt: ledger.checkedAt,
    ledgerState: ledger.state, ledgerSource: ledger.source || null, ledgerReason: ledger.reason || null,
    retryAllowed, canCheckAgain, screenshotDataUrl, recoveryReason: reason,
    actions: actionJournal.filter((item) => item.taskId === taskId)
  };
  receipts.unshift(receipt);
  addJournal('EVIDENCE_RECEIPT_CREATED', receipt.id, taskId);
  receipt.actions = actionJournal.filter((item) => item.taskId === taskId);
  publishBrowserEvent('agent-log', {
    taskId,
    message: status === 'VERIFIED' ? 'Booking verified in independent history. No repeat submission was made.'
      : status === 'NOT_BOOKED' ? 'Authoritative history confirms no booking. A retry is available only with fresh user approval.'
        : status === 'DUPLICATE_DETECTED' ? 'Multiple bookings detected. Further submissions are blocked.'
          : 'Booking history could not be verified. Task is on hold; check history again before any retry.'
  });
  publishTabs();
  return receipt;
}

async function submitApprovedBooking(taskId, providerId, paymentInfo, isRetry = false) {
  const tabId = providerTabs.get(providerId);
  const tab = tabs.get(tabId);
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error('Selected provider is not available. Run research again.');
  if (!tab) throw new Error('Selected provider tab is no longer available. Run research again.');

  activateTab(tabId);
  addJournal(isRetry ? 'RETRY_APPROVAL_GRANTED' : 'HUMAN_APPROVAL_GRANTED', `${isRetry ? 'User explicitly approved a new attempt' : 'User approved booking'} with ${provider.name}`, taskId);
  publishAgentStage('submitting', `Sending the approved booking request to ${provider.name}.`, taskId);
  const target = tab.view.webContents;
  const currentPageProvider = await target.executeJavaScript('window.AFTERCLICK_PROVIDER && window.AFTERCLICK_PROVIDER.id').catch(() => null);
  if (currentPageProvider !== providerId) await target.loadURL(`${BASE_URL}/demo/provider/${providerId}`);
  let browserResponse = 'LOST';
  try {
    const result = await target.executeJavaScript(`window.AFTERCLICK_BOOK(${JSON.stringify(taskId)}, ${JSON.stringify(paymentInfo)})`, true);
    browserResponse = result && result.received ? 'RECEIVED' : 'LOST';
    if (result?.reconciled === 'BOOKED') browserResponse = 'LOST';
  } catch (error) {
    addJournal('BROWSER_EXECUTION_ERROR', error.message || 'The page did not return a result.', taskId);
    browserResponse = 'LOST';
  }
  addJournal(browserResponse === 'RECEIVED' ? 'BROWSER_RESPONSE_RECEIVED' : 'BROWSER_RESPONSE_UNCERTAIN', browserResponse === 'RECEIVED' ? 'Provider page received a response' : 'Confirmation response was lost or unclear; checking independent history', taskId);
  if (browserResponse === 'RECEIVED') {
    publishAgentStage('response-received', `The ${provider.name} page returned a response. AFTERCLICK is checking the provider record independently.`, taskId);
    await new Promise((resolve) => setTimeout(resolve, 420));
  } else {
    publishAgentStage('signal-lost', `Confirmation signal lost after submitting to ${provider.name}. Pausing; no repeat request will be sent.`, taskId);
    // This short, explicit demo pause makes the interruption visible to the evaluator.
    await new Promise((resolve) => setTimeout(resolve, 1150));
  }
  addJournal('INDEPENDENT_VERIFICATION_STARTED', 'Querying authoritative booking history before considering any retry', taskId);
  publishAgentStage('checking-history', 'Checking the independent booking history using the same task ID. This is read-only.', taskId);
  await new Promise((resolve) => setTimeout(resolve, 520));
  const ledger = await readAuthoritativeLedger(taskId);
  return createOutcomeReceipt(taskId, provider, browserResponse, ledger, isRetry ? 'USER_APPROVED_RETRY' : 'INITIAL_SUBMISSION');
}

async function approveAndBook(taskId, providerId, paymentInfo) {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error('Selected provider was not found.');

  const cleanName = String(paymentInfo?.customerName || '').trim();
  if (!cleanName || !['DEMO_UPI', 'DEMO_CARD'].includes(paymentInfo?.method)) throw new Error('Enter the appointment name and choose a demo payment method to continue.');
  // First check history so a repeated click or resumed task cannot blindly submit again.
  publishAgentStage('preflight', 'Checking existing booking history before any new submission.', taskId);
  const preflight = await readAuthoritativeLedger(taskId);
  addJournal('PRE_SUBMISSION_HISTORY_CHECK', `Pre-submission history status: ${preflight.state}`, taskId);
  if (preflight.state !== 'AVAILABLE') {
    return createOutcomeReceipt(taskId, provider, 'NOT_SENT', preflight, 'PRE_SUBMISSION_CHECK');
  }
  if (preflight.bookings.length > 0) {
    return createOutcomeReceipt(taskId, provider, 'NOT_SENT', preflight, 'PRE_SUBMISSION_EXISTING_BOOKING');
  }

  const attempts = taskBookingAttempts.get(taskId) || 0;
  if (attempts > 0) {
    // Same task has already submitted once. Only the explicit retry action may submit again.
    return createOutcomeReceipt(taskId, provider, 'NOT_SENT', preflight, 'REPEAT_APPROVAL_BLOCKED');
  }
  taskBookingAttempts.set(taskId, attempts + 1);
  return submitApprovedBooking(taskId, providerId, { customerName: cleanName, method: paymentInfo.method }, false);
}

async function reconcileBooking(taskId, providerId) {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found for this task.');
  addJournal('MANUAL_RECONCILIATION_REQUESTED', 'User asked AFTERCLICK to check booking history again; no booking request will be sent.', taskId);
  publishAgentStage('checking-history', 'Rechecking the same provider history. No booking request will be sent.', taskId);
  const ledger = await readAuthoritativeLedger(taskId);
  const priorReceipt = receipts.find((item) => item.taskId === taskId);
  return createOutcomeReceipt(taskId, provider, priorReceipt?.browserResponse || 'NOT_SENT', ledger, 'USER_REQUESTED_HISTORY_CHECK');
}

async function simulateHistoryOutage(taskId, providerId) {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found for this task.');
  global.__failNextLedgerRead = true;
  addJournal('TEST_HISTORY_OUTAGE_INJECTED', 'Simulated one temporary history-read failure. No booking request will be sent.', taskId);
  return reconcileBooking(taskId, providerId);
}

async function retryBooking(taskId, providerId, paymentInfo) {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found for this task.');

  const cleanName = String(paymentInfo?.customerName || '').trim();
  if (!cleanName || !['DEMO_UPI', 'DEMO_CARD'].includes(paymentInfo?.method)) throw new Error('Enter the appointment name and choose a demo payment method to continue.');
  // A fresh authoritative zero-result check is mandatory immediately before retry.
  publishAgentStage('preflight', 'Rechecking booking history immediately before the user-approved retry.', taskId);
  addJournal('RETRY_PREFLIGHT_STARTED', 'Checking the same task history again before the user-approved retry.', taskId);
  const preflight = await readAuthoritativeLedger(taskId);
  if (preflight.state !== 'AVAILABLE' || preflight.bookings.length > 0) {
    return createOutcomeReceipt(taskId, provider, 'NOT_SENT', preflight, 'RETRY_PREFLIGHT_BLOCKED');
  }

  taskBookingAttempts.set(taskId, (taskBookingAttempts.get(taskId) || 0) + 1);
  addJournal('RETRY_PREFLIGHT_PASSED', 'Authoritative history still has zero matching records; user-approved retry may proceed.', taskId);
  return submitApprovedBooking(taskId, providerId, { customerName: cleanName, method: paymentInfo.method }, true);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1120, minHeight: 760,
    backgroundColor: '#f8f6fd', title: 'AFTERCLICK',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'app-icon.ico' : 'app-icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.on('resize', () => publishBrowserEvent('window-resize'));
  mainWindow.on('closed', () => { mainWindow = null; });
  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
  mainWindow.webContents.once('did-finish-load', async () => {
    await createTab(`${BASE_URL}/`);
    publishTabs();
  });
}

ipcMain.handle('app:get-demo-url', () => `${BASE_URL}/`);
ipcMain.handle('browser:get-state', () => ({ tabs: [...tabs.values()].map((tab) => ({ id: tab.id, title: tab.title, url: tab.url, loading: tab.loading, active: tab.id === activeTabId, canGoBack: tab.view.webContents.canGoBack(), canGoForward: tab.view.webContents.canGoForward() })), activeTabId }));
ipcMain.handle('browser:open-tab', async (_event, url) => createTab(url || `${BASE_URL}/`));
ipcMain.handle('browser:navigate', async (_event, url) => {
  const tab = tabs.get(activeTabId); if (!tab) return createTab(url);
  const target = normaliseUrl(url); await tab.view.webContents.loadURL(target).catch((error) => publishBrowserEvent('navigation-error', { message: error.message }));
  return true;
});
ipcMain.handle('browser:back', () => { const tab = tabs.get(activeTabId); if (tab && tab.view.webContents.canGoBack()) tab.view.webContents.goBack(); });
ipcMain.handle('browser:forward', () => { const tab = tabs.get(activeTabId); if (tab && tab.view.webContents.canGoForward()) tab.view.webContents.goForward(); });
ipcMain.handle('browser:reload', () => { const tab = tabs.get(activeTabId); if (tab) tab.view.webContents.reload(); });
ipcMain.handle('browser:activate-tab', (_event, id) => activateTab(id));
ipcMain.handle('browser:close-tab', (_event, id) => closeTab(id));
ipcMain.on('browser:set-bounds', (_event, bounds) => {
  if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return;
  browserBounds = { x: Math.max(0, Math.round(bounds.x)), y: Math.max(0, Math.round(bounds.y)), width: Math.max(100, Math.round(bounds.width)), height: Math.max(100, Math.round(bounds.height)) };
  setActiveViewBounds();
});
ipcMain.on('home:command', (event, value) => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 1200) return;
  let senderUrl = '';
  try { senderUrl = new URL(event.sender.getURL()).origin; } catch {}
  if (!BASE_URL || senderUrl !== BASE_URL) return;
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('agent:command', value.trim());
});
ipcMain.handle('agent:run-research', (_event, goal) => runResearch(goal));
ipcMain.handle('agent:web-search', (_event, query) => runWebSearch(query));
ipcMain.handle('agent:approve-booking', (_event, { taskId, providerId, paymentInfo }) => approveAndBook(taskId, providerId, paymentInfo));
ipcMain.handle('agent:reconcile-booking', (_event, { taskId, providerId }) => reconcileBooking(taskId, providerId));
ipcMain.handle('agent:simulate-history-outage', (_event, { taskId, providerId }) => simulateHistoryOutage(taskId, providerId));
ipcMain.handle('agent:retry-booking', (_event, { taskId, providerId, paymentInfo }) => retryBooking(taskId, providerId, paymentInfo));
ipcMain.handle('agent:summarize-page', async () => {
  const tab = tabs.get(activeTabId); if (!tab) return { title: '', summary: 'No active page.' };
  const page = await tab.view.webContents.executeJavaScript(`({title:document.title,url:location.href,text:(document.body?.innerText||'').slice(0,5000)})`).catch(() => null);
  if (!page) return { title: '', summary: 'I could not read the current page.' };
  const lines = page.text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const summary = lines.join(' · ').slice(0, 900) || 'This page does not contain readable text.';
  addJournal('PAGE_SUMMARIZED', page.title, null);
  return { title: page.title, url: page.url, summary };
});
ipcMain.handle('browser:open-ledger', () => createTab(`${BASE_URL}/demo/ledger`));
ipcMain.handle('agent:reset-demo', async () => {
  await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
  taskBookingAttempts.clear();
  global.__carewellDropInjected = false;
  global.__northstarNoCommitInjected = false;
  global.__failNextLedgerRead = false;
  return true;
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  console.error('[AFTERCLICK] Another instance is already running. Close the existing AFTERCLICK window before restarting this version.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      await startDemoServer();
      createWindow();
      app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
    } catch (error) {
      console.error('[AFTERCLICK] Startup failed:', error);
      app.quit();
    }
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => {
    if (demoServer) {
      demoServer.closeAllConnections?.();
      demoServer.close();
    }
  });
}
