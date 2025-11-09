(function(){
  const apiBase = '/api/products/';
  const els = {
    grid: document.getElementById('grid'),
    search: document.getElementById('searchInput'),
    category: document.getElementById('categoryFilter'),
    min: document.getElementById('minPrice'),
    max: document.getElementById('maxPrice'),
  location: document.getElementById('locationInput'),
  negotiable: document.getElementById('negotiableOnly'),
    sort: document.getElementById('sortSelect'),
    clear: document.getElementById('clearFilters'),
  prev: document.getElementById('prevPage'),
    next: document.getElementById('nextPage'),
    pageLabel: document.getElementById('pageLabel'),
  pagination: document.getElementById('pagination'),
  pageNumbers: document.getElementById('pageNumbers'),
    newProductBtn: document.getElementById('newProductBtn'),
    newCategoryBtn: document.getElementById('newCategoryBtn'),
    themeToggle: document.getElementById('themeToggle'),
    authZone: document.getElementById('authZone'),
    loginBtn: document.getElementById('loginBtn'),
  registerBtn: document.getElementById('registerBtn'),
  postAdBtn: document.getElementById('postAdBtn'),
    modalRoot: document.getElementById('modalRoot'),
    toasts: document.getElementById('toastContainer'),
    activeFilters: document.getElementById('activeFilters'),
  };
  let page = 1;
  let token = null;
  let viewMode = localStorage.getItem('viewMode') || 'grid';
  const PAGE_SIZE = 10;
  let infinite = localStorage.getItem('infinite') === '1';
  let loadingMore = false;
  
  // --- Accessibility helpers ---
  function attachModalA11y(modal, closeFn, opener){
    if(!modal) return;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    const focusSel = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = ()=> Array.from(modal.querySelectorAll(focusSel)).filter(el=>el.offsetParent!==null || modal.contains(el));
    const first = ()=> focusables()[0];
    const last = ()=> focusables()[focusables().length-1];
    const keyHandler = (e)=>{
      if(e.key==='Escape'){ e.preventDefault(); cleanup(); closeFn(); return; }
      if(e.key==='Tab'){
        const fs = focusables(); if(fs.length===0) return;
        const current = document.activeElement;
        if(e.shiftKey){ if(current===fs[0]){ e.preventDefault(); fs[fs.length-1].focus(); } }
        else { if(current===fs[fs.length-1]){ e.preventDefault(); fs[0].focus(); } }
      }
    };
    const cleanup = ()=>{
      document.removeEventListener('keydown', keyHandler, true);
      if(opener && typeof opener.focus==='function') setTimeout(()=> opener.focus(), 0);
    };
    document.addEventListener('keydown', keyHandler, true);
    setTimeout(()=>{ const f = first(); if(f) f.focus(); }, 0);
    return cleanup;
  }

  function qs(){
    const p = new URLSearchParams();
    if(els.search.value) p.set('search', els.search.value);
    if(els.category.value) p.set('category__id', els.category.value);
    if(els.min.value) p.set('price__gte', els.min.value);
    if(els.max.value) p.set('price__lte', els.max.value);
    if(els.location && els.location.value) p.set('location__icontains', els.location.value);
    if(els.negotiable && els.negotiable.checked) p.set('negotiable', 'true');
    if(els.sort.value) p.set('ordering', els.sort.value);
    p.set('page', page);
    return p.toString();
  }

  async function fetchJSON(url, opts){
    const resp = await fetch(url, opts);
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    return resp.json();
  }

  // toast helper
  function toast(message, type = 'info', timeout = 3500){
    if(!els.toasts) return alert(message);
    const t = document.createElement('div');
    t.className = 'toast ' + (type==='success'?'success': type==='error'?'error':'');
    t.setAttribute('role','status');
    t.innerHTML = `<span>${message}</span><button class="toast-close" aria-label="Dismiss">×</button>`;
    const remove = ()=>{
      t.style.animation = 'toast-out .25s forwards';
      setTimeout(()=> t.remove(), 240);
    };
    t.querySelector('.toast-close').addEventListener('click', remove);
    // limit to 3 toasts
    while(els.toasts.children.length >= 3){ els.toasts.firstElementChild?.remove(); }
    els.toasts.appendChild(t);
    if(timeout>0) setTimeout(remove, timeout);
  }

  async function loadCategories(){
    try {
      const cats = await fetchJSON(apiBase + 'categories/');
      const list = document.getElementById('catList');
      if(list) list.innerHTML = '';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        els.category.appendChild(opt);
        if(list){
          const li = document.createElement('li');
          li.tabIndex = 0;
          li.dataset.id = c.id;
          li.innerHTML = `<span>${c.name}</span><span class="chip">${c.product_count ?? ''}</span>`;
          if(String(els.category.value)===String(c.id)) li.classList.add('active');
          const choose = ()=>{ els.category.value = c.id; page=1; syncHash(); renderActiveFilters(); loadProducts(); document.querySelectorAll('.cat-list li').forEach(x=>x.classList.remove('active')); li.classList.add('active'); };
          li.addEventListener('click', choose);
          li.addEventListener('keydown', (e)=>{ if(e.key==='Enter') choose(); });
          list.appendChild(li);
        }
      });
    } catch(e){ console.warn('cats', e); }
  }

  function setSkeleton(){
    els.grid.classList.add('skeleton');
    els.grid.setAttribute('aria-busy','true');
    els.grid.innerHTML = '';
    for(let i=0;i<8;i++){
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<div class="img-wrap"></div><div class="card-body"><div class="shimmer" style="height:14px;width:60%"></div><div class="shimmer" style="height:10px;width:40%;margin-top:8px"></div></div>';
      els.grid.appendChild(card);
    }
  }

  async function loadProducts(){
    if(page===1) setSkeleton();
    try {
      const data = await fetchJSON(apiBase + '?' + qs());
      renderProducts(data, page>1);
    } catch(e){
      els.grid.classList.remove('skeleton');
      els.grid.innerHTML = '<div class="error">'+e.message+'</div>';
    }
  }

  function renderProducts(data, append=false){
    els.grid.classList.remove('skeleton');
    els.grid.setAttribute('aria-busy','false');
    if(!append) els.grid.innerHTML = '';
    els.grid.classList.toggle('list-view', viewMode==='list');
    if(data.results.length === 0 && !append){
      els.grid.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-light)">No products.</div>';
    } else {
      data.results.forEach(p => {
        const tpl = document.getElementById('cardTemplate');
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector('.card');
        const title = node.querySelector('.card-title');
        const desc = node.querySelector('.card-desc');
        const price = node.querySelector('.price');
        const chip = node.querySelector('.chip.cat');
        const img = node.querySelector('.card-img');
        const time = node.querySelector('.time');
        // extra meta additions
        const meta = node.querySelector('.card-meta');
        if(p.location){
          const loc = document.createElement('span');
          loc.className='loc';
          loc.textContent = p.location;
          meta.appendChild(loc);
        }
        if(p.negotiable){
          const neg = document.createElement('span');
          neg.className='neg';
          neg.textContent='Negotiable';
          meta.appendChild(neg);
        }
        // favorite button (backend when authenticated else local)
        const favBtn = document.createElement('button');
        favBtn.className = 'fav-btn';
        favBtn.type = 'button';
        favBtn.title = 'Save';
        favBtn.innerHTML = '❤';
        const localFavs = new Set(JSON.parse(localStorage.getItem('favs')||'[]'));
        const markActive = ()=> favBtn.classList.add('active');
        const markInactive = ()=> favBtn.classList.remove('active');
        const backendMode = !!token;
        const ensureState = async ()=>{
          if(backendMode){
            // fetch favorites list once per session (cache in memory?) simplified inline
            if(!window.__favcache){
              try { const favsResp = await fetch(apiBase + 'favorites/', { headers: { Authorization: 'Bearer '+token } }); if(favsResp.ok){ window.__favcache = (await favsResp.json()).results?.map(r=>r.product.id) || []; } else { window.__favcache = []; } } catch { window.__favcache = []; }
            }
            if(window.__favcache.includes(p.id)) markActive(); else markInactive();
          } else {
            if(localFavs.has(p.id)) markActive();
          }
        };
        ensureState();
        favBtn.addEventListener('click', async (e)=>{
          e.stopPropagation();
          if(backendMode){
            try {
              if(favBtn.classList.contains('active')){
                // find favorite id first
                const listResp = await fetch(apiBase + 'favorites/', { headers:{ Authorization:'Bearer '+token } });
                if(listResp.ok){ const data = await listResp.json(); const fav = data.results.find(r=>r.product.id===p.id); if(fav){ await fetch(apiBase + 'favorites/'+fav.id+'/', { method:'DELETE', headers:{ Authorization:'Bearer '+token } }); window.__favcache = window.__favcache.filter(x=>x!==p.id); markInactive(); toast('Removed from favorites'); } }
              } else {
                const createResp = await fetch(apiBase + 'favorites/', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ product_id: p.id }) });
                if(createResp.ok){ window.__favcache.push(p.id); markActive(); toast('Saved to favorites','success'); }
              }
            } catch { toast('Favorite action failed','error'); }
          } else {
            if(localFavs.has(p.id)) { localFavs.delete(p.id); markInactive(); toast('Removed from favorites'); }
            else { localFavs.add(p.id); markActive(); toast('Saved to favorites','success'); }
            localStorage.setItem('favs', JSON.stringify(Array.from(localFavs)));
          }
        });
        title.textContent = p.name;
        desc.textContent = p.description || '—';
        price.textContent = '$' + Number(p.price).toFixed(2);
        if(p.category){ chip.textContent = p.category.name; chip.hidden = false; }
        if(p.image_url){
          img.src = p.image_url; img.alt = p.name;
        } else {
          img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\"><rect width=\"100%\" height=\"100%\" fill=\"#e5e7eb\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"#9ca3af\" font-family=\"Arial,Helvetica,sans-serif\" font-size=\"18\">No Image</text></svg>`);
          img.alt='';
        }
        time.textContent = new Date(p.created_at).toLocaleDateString();
        const open = () => openDetail(p.id);
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e)=>{ if(e.key==='Enter') open(); });
        // insert favorite into card header area
        const titleEl = node.querySelector('.card-title');
        const wrap = document.createElement('div');
        wrap.style.display='flex'; wrap.style.justifyContent='space-between'; wrap.style.alignItems='center'; wrap.appendChild(titleEl.cloneNode(true)); wrap.appendChild(favBtn);
        titleEl.replaceWith(wrap);
        els.grid.appendChild(node);
      });
    }
    // pagination
    els.pagination.hidden = infinite;
    els.prev.disabled = !data.previous;
    els.next.disabled = !data.next;
    renderPageNumbers(data.count || 0);
    loadingMore = false;
  }

  function renderPageNumbers(count){
    if(!els.pageNumbers) return;
    const total = Math.max(1, Math.ceil(count / PAGE_SIZE));
    els.pageNumbers.innerHTML = '';
    const start = Math.max(1, page - 2);
    const end = Math.min(total, start + 4);
    for(let i=start;i<=end;i++){
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = String(i);
      if(i===page) btn.setAttribute('aria-current','page');
      btn.addEventListener('click', ()=>{ if(page!==i){ page=i; syncHash(); loadProducts(); } });
      li.appendChild(btn);
      els.pageNumbers.appendChild(li);
    }
    // show first/last if skipped
    if(start > 1){
      const first = document.createElement('li');
      const b = document.createElement('button'); b.textContent='1'; b.addEventListener('click', ()=>{ page=1; syncHash(); loadProducts(); }); first.appendChild(b); els.pageNumbers.insertBefore(first, els.pageNumbers.firstChild);
      if(start > 2){ const dots = document.createElement('li'); dots.textContent='…'; dots.style.color='var(--text-light)'; els.pageNumbers.insertBefore(dots, els.pageNumbers.children[1]); }
    }
    if(end < total){
      if(end < total -1){ const dots = document.createElement('li'); dots.textContent='…'; dots.style.color='var(--text-light)'; els.pageNumbers.appendChild(dots); }
      const last = document.createElement('li'); const b = document.createElement('button'); b.textContent=String(total); b.addEventListener('click', ()=>{ page=total; syncHash(); loadProducts(); }); last.appendChild(b); els.pageNumbers.appendChild(last);
    }
  }

  async function openDetail(id){
    try {
      const p = await fetchJSON(apiBase + id + '/');
      // price history
      let history = [];
      try { const hResp = await fetch(apiBase + id + '/price-history/'); if(hResp.ok){ history = await hResp.json(); } } catch {}
      const histHtml = history.slice(0,5).map(h=>`<li>$${Number(h.price).toFixed(2)} <span style=\"color:var(--text-light);font-size:.7rem\">${new Date(h.recorded_at).toLocaleDateString()}</span></li>`).join('') || '<li style="color:var(--text-light)">No history</li>';
      const ownerHtml = p.owner ? `<div class=\"owner\" style=\"margin-top:.5rem;font-size:.75rem\">Seller: <strong>${p.owner.username}</strong></div>` : '';
      const imgs = (p.images && p.images.length ? p.images : (p.image_url?[{url:p.image_url}]:[]));
      const carousel = imgs.length ? `<div class=\"carousel\">${imgs.map((im,i)=>`<img src=\"${im.url}\" class=\"car-img\" data-index=\"${i}\" style=\"${i===0?'':'display:none'}\" alt=\"${p.name}\">`).join('')}<div class=\"car-controls\"><button class=\"btn\" id=\"carPrev\">Prev</button><button class=\"btn\" id=\"carNext\">Next</button></div></div>` : '';
      const bumpBtn = p.owner ? `<button class=\"btn\" id=\"bumpBtn\">Bump</button>` : '';
      const html = `<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-header\"><h2>${p.name}</h2><button class=\"btn\" id=\"closeModal\" aria-label=\"Close\">×</button></div><div class=\"modal-body\">${carousel}<p>${p.description || 'No description.'}</p><div style=\"font-size:1.25rem;font-weight:600;color:var(--accent-alt)\">$${Number(p.price).toFixed(2)}${p.negotiable?' <span style=\"font-size:.6rem;color:var(--accent);border:1px solid var(--accent);padding:2px 4px;border-radius:6px;vertical-align:middle;\">Negotiable</span>':''}</div><div style=\"font-size:.75rem;color:var(--text-light)\">Stock: ${p.stock_quantity}${p.location? ' • '+p.location : ''}</div>${ownerHtml}<div style=\"margin-top:.75rem\"><h4 style=\"margin:.25rem 0;font-size:.8rem;letter-spacing:.5px;text-transform:uppercase;color:var(--text-light)\">Price history</h4><ul style=\"list-style:none;padding:0;margin:.25rem 0;display:flex;flex-direction:column;gap:.25rem;font-size:.7rem\">${histHtml}</ul></div></div><div class=\"modal-footer\"><button class=\"btn\" id=\"closeModal2\">Close</button>${bumpBtn}</div></div></div>`;
      els.modalRoot.innerHTML = html;
      const close = ()=>{ els.modalRoot.innerHTML=''; };
      Array.from(document.querySelectorAll('#closeModal,#closeModal2')).forEach(b=>b.addEventListener('click', close));
      const modal = els.modalRoot.querySelector('.modal');
      attachModalA11y(modal, close, document.activeElement);
      // carousel logic
      const carImgs = Array.from(document.querySelectorAll('.car-img'));
      if(carImgs.length){
        let idx = 0;
        const show = (i)=>{ carImgs.forEach((im,j)=> im.style.display = j===i?'block':'none'); idx=i; };
        const prev = ()=> show((idx-1+carImgs.length)%carImgs.length);
        const next = ()=> show((idx+1)%carImgs.length);
        const prevBtn = document.getElementById('carPrev'); const nextBtn = document.getElementById('carNext');
        if(prevBtn) prevBtn.addEventListener('click', prev);
        if(nextBtn) nextBtn.addEventListener('click', next);
      }
      // bump
      const bumpBtnEl = document.getElementById('bumpBtn');
      if(bumpBtnEl){
        bumpBtnEl.addEventListener('click', async ()=>{
          if(!token){ toast('Login required','error'); return; }
          try { const r = await fetch(apiBase + id + '/bump/', { method:'POST', headers:{ Authorization:'Bearer '+token } }); if(r.ok){ toast('Listing bumped','success'); close(); loadProducts(); } else { toast('Bump failed','error'); } } catch { toast('Bump error','error'); }
        });
      }
    } catch(e){ toast('Failed to load product details', 'error'); }
  }

  // auth (simple demo)
  function showLogin(){
    const html = `<div class=\"modal-backdrop\"><form class=\"modal\" id=\"loginForm\"><div class=\"modal-header\"><h2>Sign in</h2><button type=\"button\" class=\"btn\" id=\"closeAuth\" aria-label=\"Close\">×</button></div><div class=\"modal-body\"><input class=\"input\" name=\"username\" placeholder=\"Username\" required><input class=\"input\" name=\"password\" type=\"password\" placeholder=\"Password\" required></div><div class=\"modal-footer\"><button class=\"btn primary\">Sign in</button></div></form></div>`;
    els.modalRoot.innerHTML = html;
    const dialog = document.getElementById('loginForm').closest('.modal');
    const close = ()=>{ els.modalRoot.innerHTML=''; };
    attachModalA11y(dialog, close, document.activeElement);
    dialog.querySelector('input[name="username"]').focus();
    document.getElementById('closeAuth').onclick = close;
    document.getElementById('loginForm').onsubmit = async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const resp = await fetch('/api/auth/token/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
        if(!resp.ok) throw new Error('Invalid username or password');
        const data = await resp.json();
        token = data.access; localStorage.setItem('jwt', token);
        els.authZone.innerHTML = `<span style="font-size:.85rem">Logged in</span> <button id="logoutBtn" class="btn">Logout</button>`;
        document.getElementById('logoutBtn').onclick = logout;
        els.newProductBtn.hidden = false;
        if (els.newCategoryBtn) els.newCategoryBtn.hidden = false;
        close();
        toast('Signed in successfully', 'success');
      } catch(err){ toast(err.message || 'Sign in failed', 'error'); }
    };
  }
  function showRegister(){
    const html = `<div class=\"modal-backdrop\"><form class=\"modal\" id=\"registerForm\"><div class=\"modal-header\"><h2>Create account</h2><button type=\"button\" class=\"btn\" id=\"closeReg\" aria-label=\"Close\">×</button></div><div class=\"modal-body\"><input class=\"input\" name=\"username\" placeholder=\"Username\" required><input class=\"input\" name=\"email\" type=\"email\" placeholder=\"Email\"><input class=\"input\" name=\"password\" type=\"password\" placeholder=\"Password (min 8)\" minlength=\"8\" required></div><div class=\"modal-footer\"><button class=\"btn primary\">Register</button></div></form></div>`;
    els.modalRoot.innerHTML = html;
    const dialog = document.getElementById('registerForm').closest('.modal');
    const close = ()=>{ els.modalRoot.innerHTML=''; };
    attachModalA11y(dialog, close, document.activeElement);
    dialog.querySelector('input[name="username"]').focus();
    document.getElementById('closeReg').onclick = close;
    document.getElementById('registerForm').onsubmit = async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const resp = await fetch('/api/accounts/register/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: fd.get('username'), email: fd.get('email'), password: fd.get('password') }) });
        if(!resp.ok) throw new Error('Registration failed');
        const data = await resp.json();
        token = data.access; localStorage.setItem('jwt', token);
        els.authZone.innerHTML = `<span style=\"font-size:.85rem\">Account created</span> <button id=\"logoutBtn\" class=\"btn\">Logout</button>`;
        document.getElementById('logoutBtn').onclick = logout;
        els.newProductBtn.hidden = false;
        if (els.newCategoryBtn) els.newCategoryBtn.hidden = false;
        close();
        toast('Account created and signed in', 'success');
      } catch(err){ toast(err.message || 'Registration failed', 'error'); }
    };
  }
  function logout(){ token=null; localStorage.removeItem('jwt'); els.authZone.innerHTML='<button id="loginBtn" class="btn">Sign in</button> <button id="registerBtn" class="btn">Create account</button>'; document.getElementById('loginBtn').onclick=showLogin; document.getElementById('registerBtn').onclick=showRegister; els.newProductBtn.hidden=true; if (els.newCategoryBtn) els.newCategoryBtn.hidden=true; }

  function restoreAuth(){ const saved = localStorage.getItem('jwt'); if(saved){ token=saved; els.authZone.innerHTML = `<span style="font-size:.85rem">Authenticated</span> <button id="logoutBtn" class="btn">Logout</button>`; document.getElementById('logoutBtn').onclick=logout; els.newProductBtn.hidden=false; if (els.newCategoryBtn) els.newCategoryBtn.hidden=false; } }

  // create product
  function openCreate(){
  const html = `<div class=\"modal-backdrop\"><form class=\"modal\" id=\"createForm\"><div class=\"modal-header\"><h2>Create product</h2><button type=\"button\" class=\"btn\" id=\"closeCreate\" aria-label=\"Close\">×</button></div><div class=\"modal-body\"><input class=\"input\" name=\"name\" placeholder=\"Name\" required><input class=\"input\" name=\"price\" placeholder=\"Price\" type=\"number\" step=\"0.01\" required><input class=\"input\" name=\"stock\" placeholder=\"Stock\" type=\"number\"><input class=\"input\" name=\"location\" placeholder=\"Location (City)\"><label style=\"display:flex;align-items:center;gap:.5rem;font-size:.75rem\"><input type=\"checkbox\" name=\"negotiable\"> Negotiable</label><select class=\"input\" name=\"category_id\" id=\"createCategory\"><option value=\"\">No category</option></select><div style=\"display:flex;gap:.5rem;align-items:center;flex-wrap:wrap\"><input class=\"input\" name=\"image_url\" id=\"imageUrl\" placeholder=\"Primary Image URL\" style=\"flex:1\"><button class=\"btn\" type=\"button\" id=\"addImg\">Add</button></div><div class=\"img-list\" id=\"imgList\"></div><textarea class=\"input\" name=\"description\" placeholder=\"Description\"></textarea></div><div class=\"modal-footer\"><button class=\"btn\" type=\"button\" id=\"closeCreate2\">Cancel</button><button class=\"btn primary\">Save</button></div></form></div>`;
    els.modalRoot.innerHTML = html;
    // populate categories
    fetchJSON(apiBase + 'categories/').then(cats => {
      const select = document.getElementById('createCategory');
      cats.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; select.appendChild(o); });
    }).catch(()=>{});
    const close = ()=> els.modalRoot.innerHTML='';
    document.getElementById('closeCreate').onclick=close;
    document.getElementById('closeCreate2').onclick=close;
    const modal = els.modalRoot.querySelector('.modal');
    attachModalA11y(modal, close, document.activeElement);
    // live image preview
    const urlInput = document.getElementById('imageUrl');
    const imgList = document.getElementById('imgList');
    const addBtn = document.getElementById('addImg');
    const images = [];
    function renderImgs(){
      imgList.innerHTML='';
      images.forEach((u,i)=>{
        const chip = document.createElement('div'); chip.className='img-chip';
        chip.innerHTML = `<img src="${u}" alt=""><button type="button" aria-label="Remove image">×</button>`;
        chip.querySelector('button').addEventListener('click', ()=>{ images.splice(i,1); renderImgs(); });
        imgList.appendChild(chip);
      });
    }
    addBtn.addEventListener('click', ()=>{
      const v = urlInput.value.trim(); if(!v) return; try { new URL(v); } catch { toast('Invalid URL','error'); return; }
      images.push(v); urlInput.value=''; renderImgs();
    });
    urlInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn.click(); } });
    document.getElementById('createForm').onsubmit = async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const name = String(fd.get('name')||'').trim();
        const priceVal = Number(fd.get('price'));
        if(!name){ toast('Name is required','error'); return; }
        if(!(priceVal>0)){ toast('Price must be greater than 0','error'); return; }
  const payload = { name: fd.get('name'), price: Number(fd.get('price')), stock_quantity: Number(fd.get('stock')||0), description: fd.get('description') || undefined, image_url: fd.get('image_url') || undefined, location: fd.get('location') || undefined, negotiable: fd.get('negotiable') ? true : false };
  if(images.length) payload.image_urls = images;
        const cat = fd.get('category_id'); if(cat) payload['category_id'] = Number(cat);
        const resp = await fetch(apiBase, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:'Bearer '+token }:{} ) }, body: JSON.stringify(payload) });
        if(!resp.ok) throw new Error('Save failed '+resp.status);
        close();
        toast('Product created', 'success');
        loadProducts();
      } catch(err){ toast(err.message || 'Save failed', 'error'); }
    };
  }
  function openCreateCategory(){
    const html = `<div class=\"modal-backdrop\"><form class=\"modal\" id=\"categoryForm\"><div class=\"modal-header\"><h2>New category</h2><button type=\"button\" class=\"btn\" id=\"closeCat\">×</button></div><div class=\"modal-body\"><input class=\"input\" name=\"name\" placeholder=\"Category name\" required></div><div class=\"modal-footer\"><button class=\"btn primary\">Save</button></div></form></div>`;
  els.modalRoot.innerHTML = html;
  const close = ()=>{ els.modalRoot.innerHTML=''; };
  document.getElementById('closeCat').onclick = close;
  const modal = els.modalRoot.querySelector('.modal');
  attachModalA11y(modal, close, document.activeElement);
    document.getElementById('categoryForm').onsubmit = async (e)=>{
      e.preventDefault();
      if(!token){ toast('Please sign in to create categories', 'error'); return; }
      const fd = new FormData(e.target);
      try {
        const resp = await fetch(apiBase + 'categories/', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ name: fd.get('name') }) });
        if(!resp.ok) throw new Error('Save failed');
        close();
        els.category.length = 1;
        loadCategories();
        toast('Category created', 'success');
      } catch(err){ toast(err.message || 'Save failed', 'error'); }
    };
  }

  // theme
  function toggleTheme(){ const current = document.documentElement.getAttribute('data-theme')||'dark'; const next = current==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem('theme', next); }
  function restoreTheme(){ const saved = localStorage.getItem('theme'); if(saved) document.documentElement.setAttribute('data-theme', saved); }

  // events
  // debounce helper
  function debounce(fn, wait){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), wait); }; }
  const onFilterInput = debounce(()=>{ page=1; syncHash(); renderActiveFilters(); loadProducts(); }, 300);
  [els.search, els.category, els.min, els.max, els.location].forEach(el => el.addEventListener('input', onFilterInput));
  if(els.negotiable) els.negotiable.addEventListener('change', ()=>{ page=1; syncHash(); renderActiveFilters(); loadProducts(); });
  els.sort.addEventListener('change', ()=>{ page=1; syncHash(); renderActiveFilters(); loadProducts(); });
  els.clear.addEventListener('click', ()=>{ els.search.value=''; els.category.value=''; els.min.value=''; els.max.value=''; els.sort.value='-created_at'; page=1; syncHash(); renderActiveFilters(); loadProducts(); });
  els.prev.addEventListener('click', ()=>{ if(page>1){ page--; loadProducts(); } });
  els.next.addEventListener('click', ()=>{ page++; loadProducts(); });
  els.loginBtn.addEventListener('click', showLogin);
  els.registerBtn.addEventListener('click', showRegister);
  els.newProductBtn.addEventListener('click', openCreate);
  if(els.postAdBtn) els.postAdBtn.addEventListener('click', ()=>{ if(!token){ showLogin(); toast('Sign in to post an ad','info'); } else { openCreate(); } });
  if(document.getElementById('searchBtn')) document.getElementById('searchBtn').addEventListener('click', ()=>{ page=1; syncHash(); renderActiveFilters(); loadProducts(); });
  els.newCategoryBtn.addEventListener('click', openCreateCategory);
  els.themeToggle.addEventListener('click', toggleTheme);
  // view toggle
  const viewBtn = document.getElementById('viewToggle');
  if(viewBtn){ viewBtn.addEventListener('click', ()=>{ viewMode = viewMode==='grid'?'list':'grid'; localStorage.setItem('viewMode', viewMode); viewBtn.textContent = viewMode==='list'?'Grid view':'List view'; loadProducts(); }); viewBtn.textContent = viewMode==='list'?'Grid view':'List view'; }

  // infinite scroll toggle and observer
  const infBtn = document.getElementById('infToggle');
  if(infBtn){
    const setInfText = ()=> infBtn.textContent = infinite ? 'Manual pages' : 'Auto load';
    setInfText();
    infBtn.addEventListener('click', ()=>{ infinite = !infinite; localStorage.setItem('infinite', infinite?'1':'0'); setInfText(); page=1; loadProducts(); });
  }
  const sentinel = document.getElementById('sentinel');
  if(sentinel){
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting && infinite && !loadingMore){
          loadingMore = true; page++; loadProducts();
        }
      });
    }, { rootMargin: '400px' });
    io.observe(sentinel);
  }

  // deep link via hash
  function syncHash(){
    const p = new URLSearchParams();
    if(els.search.value) p.set('q', els.search.value);
    if(els.category.value) p.set('c', els.category.value);
    if(els.min.value) p.set('min', els.min.value);
    if(els.max.value) p.set('max', els.max.value);
    if(els.location && els.location.value) p.set('loc', els.location.value);
    if(els.negotiable && els.negotiable.checked) p.set('neg', '1');
    if(els.sort.value) p.set('s', els.sort.value);
    if(page>1) p.set('p', String(page));
    location.hash = p.toString();
  }
  function restoreFromHash(){
    const h = location.hash.replace(/^#/, '');
    const p = new URLSearchParams(h);
    if(p.has('q')) els.search.value = p.get('q');
    if(p.has('c')) els.category.value = p.get('c');
    if(p.has('min')) els.min.value = p.get('min');
    if(p.has('max')) els.max.value = p.get('max');
    if(p.has('loc') && els.location) els.location.value = p.get('loc')||'';
    if(p.has('neg') && els.negotiable) els.negotiable.checked = p.get('neg')==='1';
    if(p.has('s')) els.sort.value = p.get('s');
    if(p.has('p')) page = Math.max(1, parseInt(p.get('p')||'1',10));
    renderActiveFilters();
  }
  window.addEventListener('hashchange', ()=>{ restoreFromHash(); loadProducts(); });

  // init
  restoreTheme();
  restoreAuth();
  loadCategories();
  restoreFromHash();
  loadProducts();

  // --- Active filter chips ---
  function renderActiveFilters(){
    if(!els.activeFilters) return;
    const chips = [];
    if(els.search.value) chips.push({ key:'q', label:`Search: ${els.search.value}` });
    if(els.category.value){ const opt = els.category.options[els.category.selectedIndex]; chips.push({ key:'c', label:`Category: ${opt ? opt.text : els.category.value}` }); }
    if(els.min.value) chips.push({ key:'min', label:`Min: $${els.min.value}` });
    if(els.max.value) chips.push({ key:'max', label:`Max: $${els.max.value}` });
  if(els.sort.value && els.sort.value!=='-created_at'){ const txt = els.sort.options[els.sort.selectedIndex]?.text || 'Sorted'; chips.push({ key:'s', label: txt }); }
  if(els.location && els.location.value) chips.push({ key:'loc', label:`Location: ${els.location.value}` });
  if(els.negotiable && els.negotiable.checked) chips.push({ key:'neg', label:'Negotiable only' });
    els.activeFilters.innerHTML = '';
    chips.forEach(ch =>{
      const div = document.createElement('div'); div.className='filter-chip'; div.dataset.key = ch.key; div.innerHTML = `<span>${ch.label}</span><button aria-label="Remove filter">×</button>`; els.activeFilters.appendChild(div);
    });
    els.activeFilters.hidden = chips.length===0;
  }
  if(els.activeFilters){ els.activeFilters.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const chip = btn.closest('.filter-chip'); if(!chip) return;
    const key = chip.dataset.key;
    if(key==='q') els.search.value = '';
    if(key==='c') els.category.value = '';
    if(key==='min') els.min.value = '';
    if(key==='max') els.max.value = '';
    if(key==='s') els.sort.value='-created_at';
    if(key==='loc' && els.location) els.location.value='';
    if(key==='neg' && els.negotiable) els.negotiable.checked=false;
    page=1; syncHash(); renderActiveFilters(); loadProducts();
  }); }
})();