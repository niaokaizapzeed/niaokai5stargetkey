(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let activeCat = 'all';
  let categories = [];

  function ytId(url) {
    if (!url) return '';
    const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(url) ? url : '');
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  async function loadSite() {
    try {
      const r = await fetch('/api/site'); const d = await r.json();
      if (d.site) {
        $('site-name').textContent = d.site.name || 'CHECKEN5STAR';
        document.title = d.site.name || 'CHECKEN5STAR';
        $('hero-title').textContent = 'ยินดีต้อนรับสู่ ' + (d.site.name || '');
        if (d.site.logoUrl) {
          const l = $('logo'); l.classList.remove('fallback'); l.textContent = '';
          const img = document.createElement('img'); img.src = d.site.logoUrl; img.alt = 'logo';
          img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover';
          l.appendChild(img);
        }
      }
      categories = d.categories || [];
    } catch {}
    renderChips();
  }

  function renderChips() {
    const wrap = $('cats'); wrap.innerHTML = '';
    const all = [{ id: 'all', name: 'ทั้งหมด' }, ...categories];
    all.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'chip' + (c.id === activeCat ? ' active' : '');
      b.textContent = c.name;
      b.onclick = () => { activeCat = c.id; renderChips(); loadProducts(); };
      wrap.appendChild(b);
    });
  }

  async function loadProducts() {
    const grid = $('grid'); grid.innerHTML = '<p class="empty">กำลังโหลด…</p>';
    let list = [];
    try { const r = await fetch('/api/products?category=' + encodeURIComponent(activeCat)); list = (await r.json()).products || []; } catch {}
    if (!list.length) { grid.innerHTML = '<p class="empty">ยังไม่มีสินค้าในหมวดนี้</p>'; return; }
    grid.innerHTML = '';
    list.forEach((p) => grid.appendChild(card(p)));
  }

  function card(p) {
    const id = ytId(p.youtube);
    const out = !(p.remaining > 0);
    const catName = (categories.find((c) => c.id === p.category) || {}).name || '';
    const el = document.createElement('div');
    el.className = 'card';
    const thumb = id
      ? `<a class="thumb" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">
           <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"/></a>`
      : `<div class="thumb"></div>`;
    el.innerHTML =
      thumb +
      `<div class="body">
         ${catName ? `<span class="cat">${esc(catName)}</span>` : ''}
         <h3>${esc(p.title)}</h3>
         <div class="desc">${esc(p.description || '')}</div>
         <div class="meta ${out ? 'out' : ''}">${out ? 'คีย์หมดสต็อก' : 'คีย์คงเหลือ ' + p.remaining}</div>
         <button class="getkey ${out ? 'disabled' : ''}" ${out ? 'disabled' : ''}>Get Key →</button>
       </div>`;
    if (!out) el.querySelector('.getkey').onclick = () => { location.href = '/' + p.slug; };
    return el;
  }

  loadSite().then(loadProducts);
})();
