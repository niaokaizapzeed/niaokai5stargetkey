(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let activeCat = 'all', categories = [];

  function ytId(u){if(!u)return '';const m=String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);return m?m[1]:/^[A-Za-z0-9_-]{11}$/.test(u)?u:'';}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function safeUrl(u){const s=String(u||'').trim();return /^https?:\/\//i.test(s)?s:'';}

  // ---- site / branding ----
  async function loadSite(){
    try{
      const d=(await(await fetch('/api/site')).json());
      if(!d.site)return;
      const s=d.site;
      $('nav-name').textContent=s.name||'';
      $('badge-name').textContent=s.name||'';
      $('hero-title').textContent='ยินดีต้อนรับสู่ '+(s.name||'');
      $('f-name').textContent=s.name||'';
      document.title=s.name||'CHECKEN5STAR';
      if(s.description)$('hero-desc').textContent=s.description;
      if(safeUrl(s.logoUrl)){
        const mk=i=>{const l=$(i);l.textContent='';l.classList&&l.classList.remove('fallback');const im=document.createElement('img');im.src=s.logoUrl;im.alt='logo';l.appendChild(im);};
        mk('nav-logo');
        const fw=$('footer-logo-wrap');fw.innerHTML=`<img class="footer-logo" src="${esc(s.logoUrl)}" alt="">`;
      }
      if(s.description) $('f-desc').textContent=s.description;
      renderBanner(s.banner);
      renderShortcuts(s.shortcuts);
      renderSocials(s.socialLinks);
      injectHomeAds(s.homeAds);
      categories=d.categories||[];
    }catch{}
    renderCats();
  }

  function renderBanner(b){
    const w=$('banner-wrap');if(!w)return;w.innerHTML='';
    const img=safeUrl(b&&b.imageUrl);if(!img){w.closest('.banner-stats').style.gridTemplateColumns='1fr 260px';return;}
    const link=safeUrl(b&&b.linkUrl);
    if(link) w.innerHTML=`<a class="banner-frame" href="${esc(link)}" target="_blank" rel="noopener"><img src="${esc(img)}" alt="banner"></a>`;
    else w.innerHTML=`<div class="banner-frame"><img src="${esc(img)}" alt="banner"></div>`;
  }

  function renderShortcuts(sc){
    const w=$('shortcuts-wrap');if(!w||!Array.isArray(sc))return;
    const valid=sc.filter(s=>safeUrl(s.imageUrl));
    if(!valid.length){w.innerHTML='';return;}
    w.innerHTML=`<div class="shortcuts-grid">${valid.map(s=>{
      const link=safeUrl(s.linkUrl);
      return link
        ?`<a class="shortcut-item" href="${esc(link)}" target="_blank" rel="noopener"><img src="${esc(s.imageUrl)}" alt="${esc(s.label||'')}" loading="lazy"></a>`
        :`<div class="shortcut-item"><img src="${esc(s.imageUrl)}" alt="${esc(s.label||'')}" loading="lazy"></div>`;
    }).join('')}</div>`;
  }

  const SOCIAL_ICONS={
    discord:'<svg viewBox="0 0 640 512" fill="currentColor" width="16" height="16"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836Z"/></svg>',
    youtube:'<svg viewBox="0 0 576 512" fill="currentColor" width="16" height="16"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305z"/></svg>',
    facebook:'<svg viewBox="0 0 320 512" fill="currentColor" width="16" height="16"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
    tiktok:'<svg viewBox="0 0 448 512" fill="currentColor" width="16" height="16"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/></svg>'
  };
  function renderSocials(sl){
    const w=$('f-socials');if(!w||!sl)return;w.innerHTML='';
    for(const[k,v]of Object.entries(sl)){if(!safeUrl(v))continue;
      w.innerHTML+=`<a class="social-btn" href="${esc(v)}" target="_blank" rel="noopener">${SOCIAL_ICONS[k]||''}<span>${esc(k)}</span></a>`;
    }
  }

  function injectHomeAds(ads){
    if(!ads)return;
    const add=src=>{if(!safeUrl(src))return;const s=document.createElement('script');s.src=src;document.head.appendChild(s);};
    add(ads.socialBar);add(ads.popunder);
    if(safeUrl(ads.nativeSrc)){const slot=$('home-ad-slot');
      const s=document.createElement('script');s.async=true;s.setAttribute('data-cfasync','false');s.src=ads.nativeSrc;slot.appendChild(s);
      if(ads.nativeContainer){const d=document.createElement('div');d.id='container-'+ads.nativeContainer;slot.appendChild(d);}
    }
  }

  // ---- stats ----
  async function loadStats(){
    try{const d=(await(await fetch('/api/stats')).json());
      $('s-products').textContent=d.products!=null?d.products.toLocaleString():'—';
      $('s-stock').textContent=d.stock!=null?d.stock.toLocaleString():'—';
      $('s-cats').textContent=d.categories!=null?d.categories:'—';
      $('s-claimed').textContent=d.claimed!=null?d.claimed.toLocaleString():'—';
    }catch{}
  }

  // ---- categories ----
  function renderCats(){
    const w=$('cats');if(!w)return;w.innerHTML='';
    [{id:'all',name:'ทั้งหมด'},...categories].forEach(c=>{
      const b=document.createElement('button');b.className='cat-btn'+(c.id===activeCat?' active':'');
      b.textContent=c.name;b.onclick=()=>{activeCat=c.id;renderCats();loadProducts();};w.appendChild(b);
    });
  }

  // ---- products ----
  async function loadProducts(){
    const g=$('grid');g.innerHTML='<p class="empty-msg">กำลังโหลด…</p>';
    let list=[];
    try{list=(await(await fetch('/api/products?category='+encodeURIComponent(activeCat))).json()).products||[];}catch{}
    if(!list.length){g.innerHTML='<p class="empty-msg">ยังไม่มีสินค้าในหมวดนี้</p>';return;}
    g.innerHTML='';list.forEach(p=>g.appendChild(card(p)));
  }

  function card(p){
    const out=!(p.remaining>0);
    const catName=(categories.find(c=>c.id===p.category)||{}).name||'';
    const yt=ytId(p.youtube);const img=safeUrl(p.imageUrl);
    let thumb='';
    if(img)thumb=`<div class="thumb"><img src="${esc(img)}" alt="" loading="lazy"></div>`;
    else if(yt)thumb=`<div class="thumb"><img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" loading="lazy"></div>`;
    else thumb=`<div class="thumb"></div>`;
    const el=document.createElement('div');el.className='card';
    el.innerHTML=thumb+`<div class="body">
      ${catName?`<span class="cat-tag">${esc(catName)}</span>`:''}
      <h3>${esc(p.title)}</h3>
      <div class="desc">${esc(p.description||'')}</div>
      <div class="stock-row"><span class="stock-dot${out?' out':''}"></span>${out?'คีย์หมดสต็อก':'คงเหลือ '+p.remaining}</div>
      <button class="getkey">Get Key →</button></div>`;
    el.querySelector('.getkey').onclick=()=>{location.href='/'+p.slug;};
    return el;
  }

  loadSite().then(()=>{loadProducts();});
})();
