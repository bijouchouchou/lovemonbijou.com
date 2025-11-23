/* assets/script.js — Love Mon Bijou (CSV mode)
   UTF-8
   Stocke les fonctions essentielles: CSV loader, Cloudinary helpers, product modal, cart, filters, checkout stubs.
*/

(function(){
  'use strict';

  // ---------- CONFIG ----------
  const CONFIG = {
    csvUrl: './data/products.csv', // fichier CSV dans assets/data ou data/
    cloudinaryBase: 'https://res.cloudinary.com/dcak9pjrt/image/upload/',
    placeholder: 'assets/placeholder.png',
    netlifyFnPrefix: '/.netlify/functions',
    successUrl: `${window.location.origin}/success.html`,
    cancelUrl: `${window.location.origin}/cancel.html`
  };

  // ---------- STATE ----------
  const state = {
    products: [],
    cart: new Map() // key -> { product, qty }
  };

  // ---------- HELPERS ----------
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
  const safeText = v => (v == null ? '' : String(v));
  function createEl(tag, attrs={}, ...children){
    const el = document.createElement(tag);
    for(const k of Object.keys(attrs||{})){
      const v = attrs[k];
      if(k === 'class') el.className = v;
      else if(k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if(k === 'html') el.innerHTML = v;
      else if(k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for(const c of children){ if(c==null) continue; if(typeof c === 'string') el.appendChild(document.createTextNode(c)); else el.appendChild(c); }
    return el;
  }

  // ---------- IMAGES ----------
  function getCloudinaryUrl(imagePath){
    if(!imagePath) return CONFIG.placeholder;
    if(imagePath.includes('res.cloudinary.com') || imagePath.startsWith('http')) return imagePath;
    const clean = imagePath.replace(/^\/+/, '').trim();
    if(!clean) return CONFIG.placeholder;
    return CONFIG.cloudinaryBase + clean;
  }

  function getProductImageUrl(product){
    if(!product) return CONFIG.placeholder;
    const keys = Object.keys(product||{});
    for(const k of keys){
      if(k.toLowerCase().includes('image') && product[k]) return getCloudinaryUrl(product[k]);
    }
    if(product.image && product.image.trim()) return getCloudinaryUrl(product.image.trim());
    if(product.REFERENCE && product.REFERENCE.trim()) return CONFIG.cloudinaryBase + encodeURIComponent(product.REFERENCE.trim()) + '.jpg';
    return CONFIG.placeholder;
  }

  // ---------- PRICE parse ----------
  function getProductPriceValue(product){
    const priceRaw = safeText(
      product['PRIX'] ||
      product['price €'] ||
      product['price_euros'] ||
      product['PRICE'] ||
      product['price'] ||
      ''
    ).replace(/[^\d,.\s-]/g, '');
    const normalized = priceRaw.replace(',', '.').trim();
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  // ---------- CSV loader ----------
  async function loadCSV(url){
    try{
      const r = await fetch(url);
      if(!r.ok) throw new Error('CSV fetch failed ' + r.status);
      const text = await r.text();
      return parseCSV(text);
    }catch(e){
      console.error('loadCSV', e);
      return [];
    }
  }

  function parseCSV(text){
    // normalize newlines, remove BOM
    text = text.replace(/^\uFEFF/, '');
    const lines = text.replace(/\r/g,'\n').split(/\n+/).filter(l => l.trim());
    if(lines.length === 0) return [];
    const headerLine = lines[0];
    const delimiter = (headerLine.indexOf(';') !== -1 && headerLine.split(';').length > headerLine.split(',').length) ? ';' : ',';
    const headers = splitCSVLine(headerLine, delimiter).map(h => h.trim().replace(/^"|"$/g,''));
    const rows = lines.slice(1).map(l => splitCSVLine(l, delimiter));
    return rows.map(cols => {
      const obj = {};
      for(let i=0;i<headers.length;i++){
        obj[headers[i]] = cols[i] ? cols[i].trim().replace(/^"|"$/g,'') : '';
      }
      return obj;
    });
  }

  function splitCSVLine(line, delimiter){
    const out = []; let cur = ''; let inQuotes = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"'){
        if(inQuotes && line[i+1] === '"'){ cur += '"'; i++; continue; }
        inQuotes = !inQuotes; continue;
      }
      if(!inQuotes && ch === delimiter){ out.push(cur); cur=''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  // ---------- UI / Grid ----------
  function getGrid(){
    const selectors = ['#product-list', '.grid', '#grid', '#products-container'];
    for(const s of selectors){ const e = document.querySelector(s); if(e) return e; }
    const main = document.querySelector('main') || document.body;
    const fallback = createEl('main', { id: 'product-list', class: 'grid products-grid' });
    main.appendChild(fallback);
    return fallback;
  }

  function showLoading(grid){
    hideLoading();
    const p = createEl('p', { id:'loading-msg', style:{ textAlign:'center', fontSize:'1.05em' } }, '⏳ Chargement des produits...');
    grid.appendChild(p);
  }
  function hideLoading(){ const p = document.getElementById('loading-msg'); if(p) p.remove(); }

  function createProductCard(product){
    const ref = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || '');
    const title = safeText(product['TITRE'] || product['TITLE'] || product['title'] || ref);
    const priceVal = getProductPriceValue(product);
    const priceText = priceVal ? `${priceVal.toFixed(2)} €` : '';
    const desc = safeText(product['description'] || product['DESCRIPTION'] || '');

    const card = createEl('article', { class:'product-card', 'data-ref': ref });
    const img = createEl('img', { class:'product-image', alt: title || ref, loading:'lazy', src:getProductImageUrl(product) });
    img.addEventListener('error', ()=> { img.src = CONFIG.placeholder; });

    const meta = createEl('div',{ class:'meta' });
    meta.appendChild(createEl('h3', {}, title));
    meta.appendChild(createEl('div',{ class:'price' }, priceText));
    meta.appendChild(createEl('p', {}, desc));

    const actions = createEl('div',{ class:'product-actions' });
    const fabricationBtn = createEl('button',{ class:'fabrication-btn', type:'button' }, 'Fabrication');
    fabricationBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openFabricationModal(product); });

    const addBtn = createEl('button',{ class:'add-to-cart', type:'button' }, 'Ajouter');
    addBtn.addEventListener('click', (e)=>{ e.stopPropagation(); addToCart(ref, product); });

    const viewBtn = createEl('button',{ class:'view-product', type:'button' }, 'Voir');
    viewBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openProductModal(product); });

    actions.appendChild(fabricationBtn); actions.appendChild(addBtn); actions.appendChild(viewBtn);
    meta.appendChild(actions);

    card.appendChild(img); card.appendChild(meta);
    return card;
  }

  // ---------- Product modal (sizes, thumbs, details) ----------
  function openProductModal(product){
    const overlayId = 'product-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if(!overlay){ overlay = createEl('div',{ id: overlayId, class:'modal-overlay' }); document.body.appendChild(overlay); }
    else overlay.innerHTML = '';

    const modal = createEl('div',{ id:'product-modal', class:'modal-content' });
    const closeBtn = createEl('button',{ class:'modal-close', type:'button', 'aria-label':'Fermer' }, '×');
    closeBtn.addEventListener('click', ()=> overlay.remove());

    const grid = createEl('div',{ class:'modal-grid', style:{ display:'flex', gap:'16px' } });

    // left (images)
    const left = createEl('div',{ class:'modal-images', style:{ flex:'1' } });
    const mainImg = createEl('img',{ class:'main-img', src:getProductImageUrl(product), alt:safeText(product['TITRE'] || product['REFERENCE']), style:{ width:'100%', borderRadius:'8px' } });
    left.appendChild(mainImg);

    const thumbsWrap = createEl('div',{ class:'thumbs', style:{ display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap' }});
    const imageFields = Object.keys(product).filter(k=>k.toLowerCase().includes('image'));
    if(imageFields.length){
      for(const f of imageFields){
        const u = getCloudinaryUrl(product[f]);
        if(!u) continue;
        const t = createEl('img',{ src:u, class:'thumb-img', style:{ width:'60px', height:'60px', objectFit:'cover', borderRadius:'6px', cursor:'pointer' }});
        t.addEventListener('click', ()=> mainImg.src = u);
        thumbsWrap.appendChild(t);
      }
    }
    left.appendChild(thumbsWrap);

    // right (info)
    const right = createEl('div',{ class:'modal-info', style:{ flex:'1', minWidth:'260px' }});
    right.appendChild(createEl('h2', {}, safeText(product['TITRE'] || product['TITLE'] || product['REFERENCE'])));
    right.appendChild(createEl('div',{ class:'price' }, getProductPriceValue(product) ? `${getProductPriceValue(product).toFixed(2)} €` : '')));
    right.appendChild(createEl('div',{ class:'desc-area' }, safeText(product['DESCRIPTION'] || product['description'] || '')));

    const infoList = createEl('ul',{ class:'product-extra-info' });
    infoList.innerHTML = `
      <li><strong>Référence :</strong> ${safeText(product['REFERENCE']||'')}</li>
      <li><strong>Couleur :</strong> ${safeText(product['COULEUR']||product['couleur']||'')}</li>
      <li><strong>Poids or :</strong> ${safeText(product['POIDS OR']||product['POIDS']||'')}</li>
      <li><strong>Type de pierres :</strong> ${safeText(product['type de pierres']||product['TYPE DE PIERRES']||product['type_de_pierres']||product['type']||'')}</li>
      <li><strong>Poids pierre :</strong> ${safeText(product['Poids pierre']||product['POIDS PIERRE']||'')}</li>
      <li><strong>Stock total :</strong> ${safeText(product['stock']||product['STOCK']||'')}</li>
      <li><strong>Évènement :</strong> ${safeText(product['evenement']||'')}</li>
    `;
    right.appendChild(infoList);

    // Taille selector
    const sizeGroup = createEl('div',{ class:'size-selector-group', style:{ marginTop:'12px' }});
    sizeGroup.appendChild(createEl('label', {}, 'Choisir une taille'));
    const sizeSelect = createEl('select', { id:'product-size-select' });
    const taillesRaw = safeText(product['tailles disponibles'] || product['tailles'] || '');
    const qtysRaw = safeText(product['quantité par taille'] || product['quantite par taille'] || product['quantite_par_taille'] || '');
    const tailles = taillesRaw ? taillesRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const qtys = qtysRaw ? qtysRaw.split(',').map(q=>q.trim()).filter(Boolean) : [];
    sizeSelect.appendChild(createEl('option',{ value:'' }, '— Choisir —'));
    if(tailles.length){
      for(let i=0;i<tailles.length;i++){
        const t = tailles[i];
        const q = qtys[i] || '';
        const label = q ? `${t} (stock ${q})` : t;
        sizeSelect.appendChild(createEl('option',{ value:t, 'data-stock': q }, label));
      }
    } else {
      sizeSelect.appendChild(createEl('option',{ value:'' }, 'Aucune taille'));
    }
    sizeGroup.appendChild(sizeSelect);
    right.appendChild(sizeGroup);

    // add to cart (size-aware)
    const addCartBtn = createEl('button',{ class:'fab-btn-modal btn btn-primary', type:'button', style:{ marginTop:'12px' } }, 'Ajouter au panier');
    addCartBtn.addEventListener('click', ()=>{
      const selectedSize = document.getElementById('product-size-select')?.value || '';
      if(tailles.length && !selectedSize){ alert('Veuillez choisir une taille.'); return; }
      const ref = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || product['TITRE'] || '');
      const key = ref + (selectedSize ? `|size:${selectedSize}` : `|item`);
      const productCopy = Object.assign({}, product);
      if(selectedSize) productCopy.__size = selectedSize;
      addToCart(key, productCopy);
      overlay.remove();
      updateCartUI();
    });

    const fabBtn = createEl('button',{ class:'fabrication-btn btn', type:'button', style:{ marginLeft:'8px', marginTop:'12px' } }, 'Fabrication');
    fabBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openFabricationModal(product); });

    right.appendChild(addCartBtn);
    right.appendChild(fabBtn);

    grid.appendChild(left); grid.appendChild(right);
    modal.appendChild(closeBtn); modal.appendChild(grid);
    overlay.appendChild(modal);
  }

  // ---------- Fabrication modal ----------
  function openFabricationModal(product){
    const overlayId = 'fabrication-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if(!overlay){ overlay = createEl('div',{ id: overlayId, class:'modal-overlay' }); document.body.appendChild(overlay); }
    else overlay.innerHTML = '';
    const modal = createEl('div',{ id:'custom-order-modal', class:'custom-modal-content' });
    const close = createEl('button',{ id:'close-custom-modal' }, '×');
    close.addEventListener('click', ()=> overlay.remove());
    const title = createEl('h2', {}, `Fabrication — ${safeText(product['TITRE']||product['REFERENCE']||'')}`);
    const form = createEl('div',{ id:'custom-order-form' });
    const groupText = createEl('div',{ class:'custom-form-group' });
    groupText.appendChild(createEl('label', {}, 'Texte personnalisé (gravure)'));
    const textInput = createEl('input',{ type:'text', id:'fab-text', placeholder:'Ex : A. & M.' });
    groupText.appendChild(textInput);
    const groupMat = createEl('div',{ class:'custom-form-group' });
    groupMat.appendChild(createEl('label', {}, 'Matériau'));
    const matSelect = createEl('select',{ id:'fab-material' },
      createEl('option',{ value:'' }, '— Choisir —'),
      createEl('option',{ value:'or' }, 'Or'),
      createEl('option',{ value:'argent' }, 'Argent'),
      createEl('option',{ value:'plaquor' }, 'Plaqué or')
    );
    groupMat.appendChild(matSelect);
    const groupDelay = createEl('div',{ class:'custom-form-group' });
    groupDelay.appendChild(createEl('label', {}, 'Délai (jours)'));
    const delayInput = createEl('input',{ type:'number', id:'fab-delay', min:'0', value:'7' });
    groupDelay.appendChild(delayInput);
    const addFabBtn = createEl('button',{ class:'custom-submit-btn btn btn-primary', type:'button', style:{ marginTop:'12px' } }, 'Ajouter au panier (Fabrication)');
    addFabBtn.addEventListener('click', ()=>{
      const options = { text: document.getElementById('fab-text')?.value || '', material: document.getElementById('fab-material')?.value || '', delayDays: parseInt(document.getElementById('fab-delay')?.value || '0',10) };
      const refBase = safeText(product['REFERENCE']||product['Ref']||product['ref']||product['reference']||'');
      const variantKey = refBase + (options.text ? `|fab:${options.text}` : `|fab:${Date.now()}`);
      const prodCopy = Object.assign({}, product);
      prodCopy.__fabrication = true;
      prodCopy.__fabricationOptions = options;
      addToCart(variantKey, prodCopy);
      overlay.remove();
      updateCartUI();
      const cartIcon = document.querySelector('.cart-icon, #cartIcon');
      if(cartIcon){ cartIcon.classList.add('cart-animate'); setTimeout(()=>cartIcon.classList.remove('cart-animate'),800); }
    });

    form.appendChild(groupText); form.appendChild(groupMat); form.appendChild(groupDelay); form.appendChild(addFabBtn);
    modal.appendChild(close); modal.appendChild(title); modal.appendChild(form);
    overlay.appendChild(modal);
  }

  // ---------- CART ----------
  function addToCart(key, product){
    if(!key){ console.warn('addToCart called without key'); return; }
    const existing = state.cart.get(key);
    if(existing) existing.qty += 1;
    else state.cart.set(key, { product, qty: 1 });
    updateCartUI();
  }

  function removeFromCart(key){ state.cart.delete(key); updateCartUI(); }
  function setQty(key, qty){ const entry = state.cart.get(key); if(!entry) return; entry.qty = Math.max(0, parseInt(qty,10)||0); if(entry.qty===0) state.cart.delete(key); updateCartUI(); }

  function updateCartUI(){
    const countEl = document.querySelector('.cart-count, #cartCount');
    let totalQty = 0;
    let subtotal = 0;
    for(const [k,v] of state.cart.entries()){
      totalQty += v.qty;
      subtotal += getProductPriceValue(v.product) * v.qty;
    }
    if(countEl){ countEl.textContent = totalQty; countEl.style.display = totalQty>0 ? 'flex' : 'none'; }

    const panel = document.getElementById('cart-panel');
    if(!panel) return;
    panel.style.display = 'block'; // ensure visible
    const itemsEl = panel.querySelector('.cart-items') || panel.querySelector('.cart-items-list');
    if(!itemsEl) return;
    itemsEl.innerHTML = '';

    for(const [key,entry] of state.cart.entries()){
      const item = createEl('div',{ class:'cart-item', style:{ display:'flex', gap:'8px', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f3eadd' }});
      const imgWrap = createEl('div',{ class:'cart-item-img' });
      const img = createEl('img',{ src:getProductImageUrl(entry.product), alt:entry.product['TITRE']||key, style:{ width:'64px', height:'64px', objectFit:'cover', borderRadius:'8px' }});
      imgWrap.appendChild(img);
      const info = createEl('div',{ class:'cart-item-details', style:{ flex:'1' }});
      const titleText = (entry.product.__fabrication ? 'Fabrication: ' : '') + (entry.product['TITRE'] || entry.product['title'] || key) + (entry.product.__size ? ` — Taille ${entry.product.__size}` : '');
      const title = createEl('h4', {}, safeText(titleText));
      const details = createEl('div',{ class:'cart-item-size' }, entry.product.__fabrication ? 'Fabrication' : '');
      const priceNum = getProductPriceValue(entry.product);
      const price = createEl('div',{ class:'cart-item-price' }, `${priceNum.toFixed(2)} €`);
      const subtotalEl = createEl('div',{ class:'cart-item-subtotal' }, `x${entry.qty} = ${(priceNum * entry.qty).toFixed(2)} €`);
      info.appendChild(title); info.appendChild(details); info.appendChild(price); info.appendChild(subtotalEl);

      const qtyWrap = createEl('div',{ class:'cart-item-qty', style:{ display:'flex', gap:'6px', alignItems:'center' }});
      const minus = createEl('button',{ class:'cart-item-minus' }, '-');
      const qspan = createEl('span', {}, String(entry.qty));
      const plus = createEl('button',{ class:'cart-item-plus' }, '+');
      minus.addEventListener('click', ()=> setQty(key, Math.max(0, entry.qty-1)));
      plus.addEventListener('click', ()=> setQty(key, entry.qty+1));
      qtyWrap.append(minus, qspan, plus);

      const remove = createEl('button',{ class:'cart-item-remove', title:'Supprimer' }, '×');
      remove.addEventListener('click', ()=> removeFromCart(key));

      item.appendChild(imgWrap); item.appendChild(info); item.appendChild(qtyWrap); item.appendChild(remove);
      itemsEl.appendChild(item);
    }

    // totals
    const shipping = subtotal >= 100 ? 0 : (subtotal === 0 ? 0 : 5);
    const subtotalContainer = panel.querySelector('.cart-subtotal') || panel.querySelector('.cart-subtotal .value');
    if(subtotalContainer){
      if(panel.querySelector('.cart-subtotal .value')) panel.querySelector('.cart-subtotal .value').textContent = `${subtotal.toFixed(2)} €`;
      else { const c = panel.querySelector('.cart-subtotal'); if(c) c.textContent = `Sous-total: ${subtotal.toFixed(2)} €`; }
    }
    const shippingEl = panel.querySelector('.cart-shipping') || panel.querySelector('.cart-shipping .value');
    if(shippingEl){
      if(panel.querySelector('.cart-shipping .value')) panel.querySelector('.cart-shipping .value').textContent = `${shipping.toFixed(2)} €`;
      else { const c = panel.querySelector('.cart-shipping'); if(c) c.textContent = `Frais de port: ${shipping.toFixed(2)} €`; }
    }
    const totalEl = panel.querySelector('.cart-total') || panel.querySelector('.cart-total strong');
    if(totalEl){
      const total = subtotal + shipping;
      if(panel.querySelector('.cart-total')) panel.querySelector('.cart-total').textContent = `Total: ${total.toFixed(2)} €`;
      else if(panel.querySelector('.cart-total strong')) panel.querySelector('.cart-total strong').textContent = `${total.toFixed(2)} €`;
    }

    // wire checkout buttons (recreate if necessary)
    wireCheckoutButtons();
  }

  // ---------- Build summary ----------
  function buildCartSummary(){
    const items = [];
    for(const [key,entry] of state.cart.entries()){
      items.push({
        key,
        title: entry.product['TITRE'] || entry.product['title'] || key,
        qty: entry.qty,
        price: getProductPriceValue(entry.product),
        fabrication: !!entry.product.__fabrication,
        fabricationOptions: entry.product.__fabricationOptions || null,
        size: entry.product.__size || null,
        image: getProductImageUrl(entry.product),
        product: entry.product
      });
    }
    return { items };
  }

  // ---------- Checkout stubs ----------
  async function initiateStripeCheckout(cartSummary){
    console.log('Stripe checkout requested', cartSummary);
    // Demo: save the order to localStorage to display on success page (simulate server flow)
    const fakeOrder = { orderId: `STRP-${Date.now()}`, items: cartSummary.items, email: '' };
    localStorage.setItem('lastOrder', JSON.stringify(fakeOrder));
    // redirect to success (in real integration, server returns session id; then redirect)
    window.location.href = CONFIG.successUrl;
  }

  async function initiatePayPalCheckout(cartSummary){
    console.log('PayPal checkout requested', cartSummary);
    const fakeOrder = { orderId: `PAYP-${Date.now()}`, items: cartSummary.items, email: '' };
    localStorage.setItem('lastOrder', JSON.stringify(fakeOrder));
    window.location.href = CONFIG.successUrl;
  }

  async function initiateAlmaPayment(cartSummary){
    console.log('Alma checkout requested', cartSummary);
    const fakeOrder = { orderId: `ALMA-${Date.now()}`, items: cartSummary.items, email: '' };
    localStorage.setItem('lastOrder', JSON.stringify(fakeOrder));
    window.location.href = CONFIG.successUrl;
  }

  // ---------- Wire checkout buttons ----------
  function wireCheckoutButtons(){
    const panel = document.getElementById('cart-panel');
    if(!panel) return;
    const checkoutBtn = panel.querySelector('.cart-checkout-btn') || panel.querySelector('.checkout-btn') || panel.querySelector('.cart-checkout');
    if(checkoutBtn){
      // remove previous listeners by cloning
      const newBtn = checkoutBtn.cloneNode(true);
      checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
      newBtn.addEventListener('click', async ()=>{
        const summary = buildCartSummary();
        // here we prompt the method for demo; you can replace with direct button group UI
        const method = prompt('Mode de paiement : "stripe", "paypal", "alma"', 'stripe');
        if(!method) return;
        try{
          if(method.toLowerCase() === 'stripe') await initiateStripeCheckout(summary);
          else if(method.toLowerCase() === 'paypal') await initiatePayPalCheckout(summary);
          else if(method.toLowerCase() === 'alma') await initiateAlmaPayment(summary);
          else alert('Méthode inconnue');
        }catch(e){
          console.error('Checkout error', e);
          alert('Erreur lors du paiement');
        }
      });
    }

    const clearBtn = panel.querySelector('.cart-clear');
    if(clearBtn){
      const newC = clearBtn.cloneNode(true);
      clearBtn.parentNode.replaceChild(newC, clearBtn);
      newC.addEventListener('click', ()=> { state.cart.clear(); updateCartUI(); });
    }
  }

  // ---------- Render products & filters ----------
  async function renderProducts(products){
    const grid = getGrid();
    grid.innerHTML = '';
    if(!products || products.length === 0){
      grid.appendChild(createEl('p', { style:{ textAlign:'center' } }, 'Aucun produit trouvé.'));
      return;
    }
    for(const p of products){
      const card = createProductCard(p);
      grid.appendChild(card);
    }
  }

  function initFilters(products){
    const typeSel = document.getElementById('typeFilter');
    const colorSel = document.getElementById('colorFilter');
    const eventSel = document.getElementById('eventFilter');
    const fabSel = document.getElementById('fabFilter');
    function fill(select, values){
      if(!select) return;
      select.length = 1;
      const sorted = Array.from(new Set(values)).filter(Boolean).sort();
      for(const v of sorted) select.appendChild(createEl('option',{ value:v }, v));
    }
    fill(typeSel, products.map(p => p['type de bijoux'] || p['type de bijoux'.toUpperCase()] || p['type'] || p['TYPE'] || ''));
    fill(colorSel, products.map(p => p['COULEUR'] || p['couleur'] || p['color']));
    fill(eventSel, products.map(p => p['evenement'] || p['Evenement'] || ''));
    fill(fabSel, products.map(p => p['fabrication_possible'] || p['fabrication'] || p['FABRICATION'] || ''));

    const search = document.getElementById('searchInput');
    if(search) search.addEventListener('input', ()=> applyFilters(products));
    [typeSel,colorSel,eventSel,fabSel].forEach(s => { if(s) s.addEventListener('change', ()=> applyFilters(products)); });
  }

  function applyFilters(products){
    const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const type = document.getElementById('typeFilter')?.value || '';
    const color = document.getElementById('colorFilter')?.value || '';
    const eventVal = document.getElementById('eventFilter')?.value || '';
    const fab = document.getElementById('fabFilter')?.value || '';

    const filtered = products.filter(p=>{
      const txt = JSON.stringify(p || {}).toLowerCase();
      if(search && !txt.includes(search)) return false;
      if(type && ((p['type de bijoux'] || p['TYPE'] || p['type'] || '') !== type)) return false;
      if(color && ((p['COULEUR'] || p['couleur'] || '') !== color)) return false;
      if(eventVal && ((p['evenement'] || '') !== eventVal)) return false;
      if(fab && ((p['fabrication_possible'] || p['fabrication'] || '') !== fab)) return false;
      return true;
    });

    renderProducts(filtered);
  }

  // ---------- Render cart page (if page contains cart-content) ----------
  function renderCartPage(){
    const box = document.getElementById('cart-content');
    const totalBox = document.getElementById('total-box') || document.getElementById('totalBox');
    if(!box) return;
    box.innerHTML = '';
    let subtotal = 0;
    for(const [key, entry] of state.cart.entries()){
      const p = getProductPriceValue(entry.product);
      const line = p * entry.qty;
      subtotal += line;
      const div = createEl('div',{ class:'cart-line', style:{ marginBottom:'12px' } });
      div.innerHTML = `<strong>${entry.product.TITRE || key}</strong><br>${entry.qty} × ${p.toFixed(2)} €<br><em>Sous-total : ${line.toFixed(2)} €</em><hr>`;
      box.appendChild(div);
    }
    if(totalBox) totalBox.innerHTML = `🔢 <strong>Total TTC : ${subtotal.toFixed(2)} €</strong>`;
    // attach quick checkout stubs on cart page
    setupQuickCheckoutButtons(subtotal);
  }

  function setupQuickCheckoutButtons(subtotal){
    // example: you may place buttons with ids stripeBtn, paypalBtn, almaBtn in cart page
    const stripeBtn = document.getElementById('stripeBtn');
    const paypalBtn = document.getElementById('paypalBtn');
    const almaBtn = document.getElementById('almaBtn');
    const summary = buildCartSummary();
    if(stripeBtn){ stripeBtn.onclick = ()=> initiateStripeCheckout(summary); }
    if(paypalBtn){ paypalBtn.onclick = ()=> initiatePayPalCheckout(summary); }
    if(almaBtn){ almaBtn.onclick = ()=> initiateAlmaPayment(summary); }
  }

  // ---------- INIT ----------
  async function init(){
    const grid = getGrid();
    showLoading(grid);

    // try to load CSV
    const products = await loadCSV(CONFIG.csvUrl).catch(()=>[]);
    state.products = products;
    hideLoading();

    initFilters(state.products);
    renderProducts(state.products);
    updateCartUI();

    // render cart page if exists
    if(document.getElementById('cart-content')) renderCartPage();

    // wire cart icon
    const cartIcon = document.querySelector('.cart-icon') || document.getElementById('cartIcon');
    const cartPanel = document.getElementById('cart-panel');
    if(cartIcon && cartPanel){
      cartIcon.addEventListener('click', ()=> { cartPanel.style.display = cartPanel.style.display === 'block' ? 'none' : 'block'; });
      cartPanel.querySelector('.close-cart')?.addEventListener('click', ()=> cartPanel.style.display = 'none');
    }

    // expose for debugging
    window.LMJ = window.LMJ || {};
    window.LMJ.state = state;
    window.LMJ.reload = async function(u){ if(u) CONFIG.csvUrl = u; const p = await loadCSV(CONFIG.csvUrl); state.products = p; initFilters(p); renderProducts(p); return p; };
    window.getProductImageUrl = getProductImageUrl;
  }

  // auto-run
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
