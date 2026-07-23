(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const RING_C = 2 * Math.PI * 52;
  const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean)[0] || '');
  const state = { total: 4, cooldown: 15, busy: false, started: false };

  async function api(path, body) {
    const r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    let d = {}; try { d = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data: d };
  }
  const getJSON = async (p) => { try { const r = await fetch(p, { credentials: 'same-origin' }); return { ok: r.ok, status: r.status, data: await r.json() }; } catch { return { ok: false, status: 0, data: {} }; } };
  const show = (id) => $(id).classList.remove('hidden');
  const hide = (id) => $(id).classList.add('hidden');

  async function isAdBlock() {
    let b = false;
    const bait = document.createElement('div');
    bait.className = 'ad ads adsbox ad-banner adsbygoogle banner_ad';
    bait.style.cssText = 'position:absolute!important;left:-9999px;height:12px;width:12px';
    document.body.appendChild(bait); await new Promise((r) => setTimeout(r, 120));
    const cs = getComputedStyle(bait);
    if (bait.offsetHeight === 0 || bait.offsetParent === null || cs.display === 'none') b = true;
    bait.remove();
    if (typeof window.__adProbe === 'undefined') b = true;
    try { await fetch('/advertisement.js?_=' + Date.now(), { cache: 'no-store' }); } catch { b = true; }
    return b;
  }

  function injectAds(ads) {
    if (!ads) return;
    const add = (src) => { if (!src) return; const s = document.createElement('script'); s.src = src; document.head.appendChild(s); };
    add(ads.socialBar); add(ads.popunder);
    if (ads.nativeSrc) {
      const slot = $('ad-slot');
      const s = document.createElement('script'); s.async = true; s.setAttribute('data-cfasync', 'false'); s.src = ads.nativeSrc; slot.appendChild(s);
      if (ads.nativeContainer) { const d = document.createElement('div'); d.id = 'container-' + ads.nativeContainer; slot.appendChild(d); }
    }
  }

  function buildTumblers(current) {
    const w = $('tumblers'); w.innerHTML = '';
    for (let i = 1; i <= state.total; i++) { const t = document.createElement('div'); t.className = 'tumbler' + (i <= current ? ' done' : (i === current + 1 ? ' active' : '')); w.appendChild(t); }
  }
  function showError(m) { const e = $('cp-error'); e.textContent = m; show('cp-error'); }
  function runCountdown(sec, done) {
    const fg = $('ring-fg'), num = $('ring-num');
    fg.style.transition = 'none'; fg.style.strokeDasharray = RING_C; fg.style.strokeDashoffset = RING_C;
    void fg.getBoundingClientRect(); fg.style.transition = `stroke-dashoffset ${sec}s linear`; fg.style.strokeDashoffset = '0';
    let left = sec; num.textContent = left; $('verify').disabled = true;
    const iv = setInterval(() => { left--; num.textContent = Math.max(0, left); if (left <= 0) { clearInterval(iv); $('ring-num').textContent = '✓'; $('verify').disabled = false; done && done(); } }, 1000);
  }

  function renderCheckpoint(current) {
    hide('gate'); show('app'); hide('key-card'); show('cp-card');
    const n = current + 1;
    buildTumblers(current);
    $('cp-num').textContent = n; $('cp-total').textContent = state.total;
    document.querySelectorAll('.cpi').forEach((e) => (e.textContent = n));
    $('cp-title').textContent = n === 1 ? 'เริ่มด่านแรก' : 'ด่านที่ ' + n;
    hide('verify-wrap'); hide('cp-error');
    const go = $('go'); go.disabled = false; show('go');
    go.onclick = startCheckpoint;
    $('verify').onclick = verifyCheckpoint;
  }

  async function startCheckpoint() {
    if (state.busy) return; state.busy = true; $('go').disabled = true;
    const { ok, data } = await api('/api/checkpoint/start');
    if (!ok) { if (data.error === 'no_session') return location.reload(); state.busy = false; $('go').disabled = false; showError(errText(data.error)); return; }
    state.cooldown = data.cooldown != null ? data.cooldown : 15;
    if (data.adLink) window.open(data.adLink, '_blank', 'noopener');
    hide('go'); show('verify-wrap'); hide('cp-error'); state.busy = false;
    if (state.cooldown <= 0) { $('ring-num').textContent = '✓'; $('verify').disabled = false; } else runCountdown(state.cooldown);
  }

  async function verifyCheckpoint() {
    if (state.busy) return; state.busy = true; $('verify').disabled = true;
    const { ok, data } = await api('/api/checkpoint/verify');
    state.busy = false;
    if (!ok) {
      if (data.error === 'too_fast') { showError('เร็วเกินไป รออีก ' + data.wait + ' วินาที'); runCountdown(data.wait || 3); return; }
      if (data.error === 'no_session') return location.reload();
      showError(errText(data.error)); $('verify').disabled = false; return;
    }
    if (data.done) { hide('cp-card'); await claim(); }
    else location.reload();   // full reload -> ads refire on the next checkpoint
  }

  async function claim() {
    const { ok, data } = await api('/api/key/claim');
    if (ok && data.key) showKey(data.key);
    else if (data.error === 'no_session') location.reload();
    else if (data.error === 'out_of_stock') { show('cp-card'); $('cp-title').textContent = 'คีย์หมดสต็อก'; showError('ตอนนี้คีย์หมดแล้ว กรุณากลับมาใหม่'); hide('go'); hide('verify-wrap'); }
    else { show('cp-card'); showError(errText(data.error)); }
  }
  function showKey(key) {
    hide('cp-card'); buildTumblers(state.total); $('key-value').textContent = key; show('key-card');
    $('copy').onclick = () => {
      const done = () => { show('copied'); setTimeout(() => hide('copied'), 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(key).then(done).catch(() => {});
      else done();
    };
  }

  function errText(c) {
    return ({ no_session: 'เซสชันหมดอายุ กำลังเริ่มใหม่…', already_complete: 'ทำครบแล้ว', no_pending: 'ยังไม่ได้เริ่มด่านนี้',
      out_of_order: 'ลำดับผิด', mismatch: 'เซสชันไม่ตรง', too_many_requests: 'ทำถี่เกินไป รอสักครู่',
      turnstile_failed: 'ยืนยันไม่ผ่าน รีเฟรชหน้า', not_complete: 'ยังไม่ครบ', server_error: 'ผิดพลาดที่เซิร์ฟเวอร์' }[c]) || 'เกิดข้อผิดพลาด';
  }

  // ---- session start (turnstile) ----
  async function startFlow() {
    let cfg = { turnstile: { enabled: false } };
    const c = await getJSON('/api/config'); if (c.ok) cfg = c.data;
    if (cfg.turnstile && cfg.turnstile.enabled && cfg.turnstile.siteKey) renderTurnstile(cfg.turnstile.siteKey);
    else doStart(null);
  }
  function renderTurnstile(siteKey) {
    $('gate-spinner').classList.add('hidden'); $('gate-text').textContent = 'ยืนยันว่าคุณไม่ใช่บอท';
    const box = $('turnstile-box'); box.classList.remove('hidden');
    const run = () => { if (!window.turnstile) return doStart(null);
      try { window.turnstile.render(box, { sitekey: siteKey, callback: (t) => doStart(t), 'error-callback': () => { $('gate-text').textContent = 'ยืนยันไม่สำเร็จ รีเฟรชหน้า'; } }); } catch { doStart(null); } };
    if (window.turnstile) run();
    else { const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true; s.onload = run; s.onerror = () => doStart(null); document.head.appendChild(s); }
  }
  async function doStart(token) {
    if (state.started) return; state.started = true;
    const hp = $('hp-website'); const body = { slug, website: hp ? hp.value : '' };
    if (token) body.turnstileToken = token;
    const { ok, data } = await api('/api/session/start', body);
    if (!ok) { state.started = false; hide('gate'); if (data.error === 'not_found') return show('notfound'); show('blocked'); $('blocked').querySelector('h2').textContent = 'เริ่มไม่สำเร็จ'; $('blocked').querySelector('p').textContent = errText(data.error); return; }
    location.reload();   // reload -> now has session -> shows checkpoint1 + ads
  }

  // ---- boot ----
  async function boot() {
    if (!slug) { hide('gate'); show('notfound'); return; }
    const info = await getJSON('/api/product/' + encodeURIComponent(slug));
    if (!info.ok) { hide('gate'); show('notfound'); return; }
    state.total = info.data.checkpoints || 4;
    $('prod-name').textContent = (info.data.product && info.data.product.title) || '';
    document.title = 'Get Key — ' + ((info.data.product && info.data.product.title) || '');

    // site name/logo in header
    getJSON('/api/site').then((s) => { if (s.ok && s.data.site) { $('site-name').textContent = s.data.site.name; if (s.data.site.logoUrl) { const l = $('logo'); l.classList.remove('fallback'); l.textContent = ''; const im = document.createElement('img'); im.src = s.data.site.logoUrl; im.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover'; l.appendChild(im); } } });

    if (await isAdBlock()) { hide('gate'); show('blocked'); return; }
    injectAds(info.data.ads);

    const pr = await getJSON('/api/progress');
    if (!(pr.ok && pr.data && typeof pr.data.current === 'number' && pr.data.slug === slug)) { startFlow(); return; }
    const cur = pr.data.current;
    if (cur >= state.total) {
      if (pr.data.claimed && pr.data.claimed.key) { hide('gate'); show('app'); showKey(pr.data.claimed.key); }
      else { hide('gate'); show('app'); hide('cp-card'); await claim(); }
    } else renderCheckpoint(cur);
  }

  $('retry').addEventListener('click', () => location.reload());
  window.addEventListener('DOMContentLoaded', boot);
})();
