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
  function safeUrl(u){ const s=String(u||'').trim(); return /^https?:\/\//i.test(s) ? s : ''; }

  function injectHomeAds(ads) {
    if (!ads) return;
    const add = (src) => { if (!safeUrl(src)) return; const s=document.createElement('script'); s.src=src; document.head.appendChild(s); };
    add(ads.socialBar); add(ads.popunder);
    if (safeUrl(ads.nativeSrc)) {
      const slot=$('home-ad-slot');
      const s=document.createElement('script'); s.async=true; s.setAttribute('data-cfasync','false'); s.src=ads.nativeSrc; slot.appendChild(s);
      if (ads.nativeContainer) { const d=document.createElement('div'); d.id='container-'+ads.nativeContainer; slot.appendChild(d); }
    }
  }

  function renderBanner(banner) {
    const wrap=$('banner-wrap'); wrap.innerHTML='';
    const img = safeUrl(banner && banner.imageUrl); if (!img) return;
    const link = safeUrl(banner && banner.linkUrl);
    if (link) {
      const a=document.createElement('a'); a.href=link; a.target='_blank'; a.rel='noopener';
      a.innerHTML = `<img src="${esc(img)}" alt="banner" loading="lazy"/>`;
      wrap.appendChild(a);
    } else {
      const d=document.createElement('div'); d.className='frame';
      d.innerHTML = `<img src="${esc(img)}" alt="banner" loading="lazy"/>`;
      wrap.appendChild(d);
    }
  }

  async function loadSite() {
    try {
      const r = await fetch('/api/site'); const d = await r.json();
      if (d.site) {
        $('site-name').textContent = d.site.name || 'CHECKEN5STAR';
        document.title = d.site.name || 'CHECKEN5STAR';
        $('hero-title').textContent = 'ยินดีต้อนรับสู่ ' + (d.site.name || '');
        const l=$('logo');
        if (safeUrl(d.site.logoUrl)) { l.classList.remove('fallback'); l.textContent=''; const im=document.createElement('img'); im.src=d.site.logoUrl; im.alt='logo'; l.appendChild(im); }
        renderBanner(d.site.banner);
        injectHomeAds(d.site.homeAds);
      }
      categories = d.categories || [];
    } catch {}
    renderChips();
  }

  function renderChips() {
    const wrap=$('cats'); wrap.innerHTML='';
    const all = [{ id: 'all', name: 'ทั้งหมด' }, ...categories];
    all.forEach((c) => {
      const b=document.createElement('button');
      b.className='chip'+(c.id===activeCat?' active':'');
      b.textContent=c.name;
      b.onclick=()=>{ activeCat=c.id; renderChips(); loadProducts(); };
      wrap.appendChild(b);
    });
  }

  async function loadProducts() {
    const grid=$('grid'); grid.innerHTML='<p class="empty">กำลังโหลด…</p>';
    let list=[];
    try { const r=await fetch('/api/products?category='+encodeURIComponent(activeCat)); list=(await r.json()).products||[]; } catch {}
    if (!list.length) { grid.innerHTML='<p class="empty">ยังไม่มีสินค้าในหมวดนี้</p>'; return; }
    grid.innerHTML=''; list.forEach((p)=>grid.appendChild(card(p)));
  }

  function card(p) {
    const out = !(p.remaining > 0);
    const catName=(categories.find((c)=>c.id===p.category)||{}).name||'';
    const yt=ytId(p.youtube);
    const img=safeUrl(p.imageUrl);
    // priority: uploaded/linked image > youtube thumbnail > empty box
    let thumb='';
    if (img) thumb=`<div class="thumb"><img src="${esc(img)}" alt="" loading="lazy"/></div>`;
    else if (yt) thumb=`<a class="thumb" href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" loading="lazy"/></a>`;
    else thumb=`<div class="thumb"></div>`;
    const el=document.createElement('div'); el.className='card';
    el.innerHTML = thumb + `<div class="body">
      ${catName?`<span class="cat">${esc(catName)}</span>`:''}
      <h3>${esc(p.title)}</h3>
      <div class="desc">${esc(p.description||'')}</div>
      <div class="meta ${out?'out':''}">${out?'คีย์หมดสต็อก':'คีย์คงเหลือ '+p.remaining}</div>
      <button class="getkey ${out?'disabled':''}" ${out?'disabled':''}>Get Key →</button></div>`;
    if (!out) el.querySelector('.getkey').onclick=()=>{ location.href='/'+p.slug; };
    return el;
  }

  loadSite().then(loadProducts);
})();
