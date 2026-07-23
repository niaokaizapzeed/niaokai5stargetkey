(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let store = null;
  let keyCounts = {};

  async function api(method, path, body) {
    const r = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data: d };
  }
  function toast(msg, err) { const t = $('toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : ''); setTimeout(() => (t.className = 'toast'), 2200); }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function slugify(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

  // ---- auth ----
  async function checkAuth() {
    const me = await api('GET', '/api/admin/me');
    if (me.ok) { showPanel(); } else { $('login').classList.remove('hidden'); }
  }
  $('login-btn').onclick = async () => {
    const r = await api('POST', '/api/admin/login', { user: $('u').value, pass: $('p').value });
    if (r.ok) { $('login').classList.add('hidden'); showPanel(); }
    else { const e = $('login-err'); e.textContent = r.data.error === 'admin_disabled' ? 'ยังไม่ได้ตั้ง ADMIN_PASS ใน env' : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'; e.classList.remove('hidden'); }
  };
  $('p').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('login-btn').click(); });
  $('logout').onclick = async () => { await api('POST', '/api/admin/logout'); location.reload(); };

  // ---- load panel ----
  async function showPanel() {
    $('login').classList.add('hidden'); $('panel').classList.remove('hidden'); $('logout').classList.remove('hidden');
    const r = await api('GET', '/api/admin/store');
    if (!r.ok) { toast('โหลดข้อมูลไม่ได้', true); return; }
    store = r.data.store; keyCounts = r.data.keys || {};
    $('site-name').value = store.site.name || '';
    $('site-logo').value = store.site.logoUrl || '';
    const b = store.site.banner || {}; $('banner-img').value = b.imageUrl || ''; $('banner-link').value = b.linkUrl || '';
    const ha = store.site.homeAds || {};
    $('ha-social').value = ha.socialBar || ''; $('ha-pop').value = ha.popunder || '';
    $('ha-native').value = ha.nativeSrc || ''; $('ha-nativec').value = ha.nativeContainer || '';
    renderCats(); renderProds();
  }

  async function saveStore(msg) {
    const r = await api('PUT', '/api/admin/store', { store });
    if (r.ok) { toast(msg || 'บันทึกแล้ว'); const s = await api('GET', '/api/admin/store'); if (s.ok) { store = s.data.store; keyCounts = s.data.keys || {}; } renderCats(); renderProds(); }
    else toast('บันทึกไม่ได้: ' + (r.data.detail || r.data.error || ''), true);
  }

  // ---- site ----
  $('save-site').onclick = () => {
    store.site.name = $('site-name').value.trim() || 'CHECKEN5STAR';
    store.site.logoUrl = $('site-logo').value.trim();
    store.site.banner = { imageUrl: $('banner-img').value.trim(), linkUrl: $('banner-link').value.trim() };
    store.site.homeAds = {
      socialBar: $('ha-social').value.trim(), popunder: $('ha-pop').value.trim(),
      nativeSrc: $('ha-native').value.trim(), nativeContainer: $('ha-nativec').value.trim(),
    };
    saveStore('บันทึกตั้งค่าเว็บแล้ว');
  };

  // ---- categories ----
  function renderCats() {
    const w = $('cat-list'); w.innerHTML = '';
    store.categories.forEach((c, i) => {
      const row = document.createElement('div'); row.className = 'prow';
      row.innerHTML = `<input value="${esc(c.name)}" style="flex:1"/><span class="pill">${esc(c.id)}</span><button class="ab ab-ghost ab-sm">ลบ</button>`;
      row.querySelector('input').onchange = (e) => { store.categories[i].name = e.target.value; };
      row.querySelector('button').onclick = () => { if (confirm('ลบหมวดหมู่ "' + c.name + '"?')) { store.categories.splice(i, 1); saveStore('ลบหมวดหมู่แล้ว'); } };
      w.appendChild(row);
    });
  }
  $('add-cat').onclick = () => {
    const name = $('new-cat').value.trim(); if (!name) return;
    store.categories.push({ id: 'c_' + Math.random().toString(36).slice(2, 8), name });
    $('new-cat').value = ''; saveStore('เพิ่มหมวดหมู่แล้ว');
  };
  // save category name edits when clicking anywhere else — add a small save button
  $('cat-list').addEventListener('focusout', () => { /* names captured on change; persist on demand */ });

  // ---- products ----
  function catName(id) { const c = store.categories.find((x) => x.id === id); return c ? c.name : '—'; }
  function renderProds() {
    const w = $('prod-list'); w.innerHTML = '';
    if (!store.products.length) { w.innerHTML = '<p class="muted">ยังไม่มีสินค้า</p>'; return; }
    store.products.forEach((p) => {
      const row = document.createElement('div'); row.className = 'prow';
      row.innerHTML = `<div class="pi"><div class="pt">${esc(p.title)}</div>
        <div class="ps">/${esc(p.slug)} · ${esc(catName(p.category))} · คีย์ ${keyCounts[p.id] || 0}</div></div>
        <button class="ab ab-ghost ab-sm b-keys">คีย์</button>
        <button class="ab ab-ghost ab-sm b-edit">แก้ไข</button>
        <button class="ab ab-ghost ab-sm b-del">ลบ</button>`;
      row.querySelector('.b-keys').onclick = () => openKeys(p);
      row.querySelector('.b-edit').onclick = () => openProd(p);
      row.querySelector('.b-del').onclick = () => { if (confirm('ลบสินค้า "' + p.title + '"?')) { store.products = store.products.filter((x) => x.id !== p.id); saveStore('ลบสินค้าแล้ว'); } };
      w.appendChild(row);
    });
  }

  function fillCatSelect() { const sel = $('pm-cat'); sel.innerHTML = ''; store.categories.forEach((c) => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); }); }
  function openProd(p) {
    fillCatSelect();
    $('pm-title').textContent = p ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า';
    $('pm-id').value = p ? p.id : '';
    $('pm-name').value = p ? p.title : '';
    $('pm-slug').value = p ? p.slug : '';
    $('pm-yt').value = p ? (p.youtube || '') : '';
    $('pm-img').value = p ? (p.imageUrl || '') : '';
    $('pm-desc').value = p ? (p.description || '') : '';
    $('pm-cat').value = p ? p.category : (store.categories[0] && store.categories[0].id) || '';
    $('pm-cp').value = p ? (p.checkpoints || 4) : 4;
    $('pm-cd').value = p ? (p.cooldown != null ? p.cooldown : 15) : 15;
    const a = (p && p.ads) || {};
    $('pm-ad-direct').value = a.directLink || ''; $('pm-ad-social').value = a.socialBar || '';
    $('pm-ad-pop').value = a.popunder || ''; $('pm-ad-native').value = a.nativeSrc || ''; $('pm-ad-nativec').value = a.nativeContainer || '';
    $('prod-modal').classList.add('show');
  }
  $('pm-cancel').onclick = () => $('prod-modal').classList.remove('show');
  $('pm-name').addEventListener('blur', () => { if (!$('pm-slug').value.trim() && $('pm-name').value.trim()) $('pm-slug').value = slugify($('pm-name').value); });
  $('pm-save').onclick = () => {
    const slug = slugify($('pm-slug').value);
    if (!$('pm-name').value.trim()) return toast('ใส่ชื่อสินค้า', true);
    if (!slug) return toast('ใส่ slug (a-z 0-9 -)', true);
    const data = {
      title: $('pm-name').value.trim(), slug, youtube: $('pm-yt').value.trim(),
      imageUrl: $('pm-img').value.trim(),
      description: $('pm-desc').value, category: $('pm-cat').value,
      checkpoints: parseInt($('pm-cp').value, 10) || 4, cooldown: parseInt($('pm-cd').value, 10) || 0,
      ads: { directLink: $('pm-ad-direct').value.trim(), socialBar: $('pm-ad-social').value.trim(), popunder: $('pm-ad-pop').value.trim(), nativeSrc: $('pm-ad-native').value.trim(), nativeContainer: $('pm-ad-nativec').value.trim() },
    };
    const id = $('pm-id').value;
    if (id) { const p = store.products.find((x) => x.id === id); Object.assign(p, data); }
    else store.products.push({ id: '', createdAt: Date.now(), ...data });
    $('prod-modal').classList.remove('show');
    saveStore('บันทึกสินค้าแล้ว');
  };

  // ---- keys ----
  async function openKeys(p) {
    $('km-id').value = p.id; $('km-title').textContent = p.title;
    const r = await api('GET', '/api/admin/keys/' + p.id);
    $('km-keys').value = r.ok ? r.data.keys : '';
    $('km-count').textContent = r.ok ? r.data.count : 0;
    $('keys-modal').classList.add('show');
  }
  $('km-cancel').onclick = () => $('keys-modal').classList.remove('show');
  $('km-save').onclick = async () => {
    const id = $('km-id').value;
    const r = await api('PUT', '/api/admin/keys/' + id, { keys: $('km-keys').value });
    if (r.ok) { $('km-count').textContent = r.data.count; keyCounts[id] = r.data.count; renderProds(); toast('บันทึกคีย์แล้ว (' + r.data.count + ')'); $('keys-modal').classList.remove('show'); }
    else toast('บันทึกคีย์ไม่ได้', true);
  };
  $('add-prod').onclick = () => openProd(null);

  checkAuth();
})();
