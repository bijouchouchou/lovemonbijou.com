/* assets/script.js — Love Mon Bijou (CSV mode)
   - Lecture ./data/products.csv
   - Images Cloudinary (si champ image vide on tente une image par référence)
   - Modal produit avec tailles + qty par taille
   - Panier, contrôle qty, calculs, envoi vers Netlify functions (Stripe/PayPal/Alma)
   - Dépendances: aucune (vanilla JS)
*/

(function(){
  'use strict';

  // ---------- CONFIG ----------
  const CONFIG = {
    csvUrl: './data/products.csv',
    cloudinaryBase: 'https://res.cloudinary.com/dcak9pjrt/image/upload/',
    placeholder: 'assets/placeholder.png',
    // success / cancel pages (relatifs)
    successUrl: `${window.location.origin}/success.html`,
    cancelUrl: `${window.location.origin}/cancel.html`,
    netlifyFnPrefix: '/.netlify/functions' // endpoint base
  };

  // ---------- STATE ----------
  const state = {
    products: [],
    cart: new Map() // key -> { product, qty }
  };

  // ---------- HELPERS ----------
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx||document).querySelectorAll(s));
  const safeText = v => (v == null ? '' : String(v));

  function createEl(tag, attrs = {}, ...children){
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

  // ---------- Cloudinary / images ----------
  function getCloudinaryUrl(imagePath){
    if(!imagePath) return CONFIG.placeholder;
    if(imagePath.includes('res.cloudinary.com') || imagePath.startsWith('http')) return imagePath;
    const clean = imagePath.replace(/^\/+/, '').trim();
    if(!clean) return CONFIG.placeholder;
    return CONFIG.cloudinaryBase + clean;
  }

  function getProductImageUrl(product){
    if(!product) return CONFIG.placeholder;
    // prefer explicit image fields
    const keys = Object.keys(product || {});
    for(const k of keys){
      if(k.toLowerCase().includes('image') && product[k]) return getCloudinaryUrl(product[k]);
    }
    if(product.image && product.image.trim()) return getCloudinaryUrl(product.image.trim());
    if(product.REFERENCE && product.REFERENCE.trim()) return CONFIG.cloudinaryBase + encodeURIComponent(product.REFERENCE.trim()) + '.jpg';
    return CONFIG.placeholder;
  }

  // ---------- Price parsing ----------
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

  // ---------- UI: product card ----------
  function getGrid(){
    const candidates = ['#product-list', '.grid', '#grid', '#products-container'];
    for(const s of candidates){
      const e = document.querySelector(s);
      if(e) return e;
    }
    const main = document.querySelector('main') || document.body;
    const fallback = createEl('main', { id: 'product-list', class: 'grid products-grid' });
    main.appendChild(fallback);
    return fallback;
  }

  function createProductCard(product){
    const ref = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || '');
    const title = safeText(product['TITRE'] || product['TITLE'] || product['title'] || ref);
    const priceVal = getProductPriceValue(product);
    const priceText = priceVal ? `${priceVal.toFixed(2)} €` : '';
    const desc = safeText(product['description'] || product['DESCRIPTION'] || '');

    const card = createEl('article', { class: 'product-card', 'data-ref': ref });
    const img = createEl('img', { class: 'product-image', alt: title || ref, loading: 'lazy', src: getProductImageUrl(product) });
    img.addEventListener('error', () => { img.src = CONFIG.placeholder; });

    const meta = createEl('div', { class: 'meta' });
    meta.appendChild(createEl('h3', {}, title));
    meta.appendChild(createEl('div', { class: 'price' }, priceText));
    meta.appendChild(createEl('p', {}, desc));

    const actions = createEl('div', { class: 'product-actions' });
    const fabricationBtn = createEl('button', { class: 'fabrication-btn', type:'button' }, 'Fabrication');
    fabricationBtn.addEventListener('click', (e) => { e.stopPropagation(); openFabricationModal(product); });

    const addBtn = createEl('button', { class: 'add-to-cart', type:'button' }, 'Ajouter');
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(ref, product); });

    const viewBtn = createEl('button', { class: 'view-product', type:'button' }, 'Voir');
    viewBtn.addEventListener('click', (e) => { e.stopPropagation(); openProductModal(product); });

    actions.appendChild(fabricationBtn); actions.appendChild(addBtn); actions.appendChild(viewBtn);
    meta.appendChild(actions);

    card.appendChild(img);
    card.appendChild(meta);
    return card;
  }

  // ---------- Product modal with sizes ----------
  function openProductModal(product){
    const overlayId = 'product-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if(!overlay){ overlay = createEl('div', { id: overlayId, class: 'modal-overlay' }); document.body.appendChild(overlay); }
    else overlay.innerHTML = '';

    const modal = createEl('div', { id: 'product-modal', class: 'modal-content' });
    const closeBtn = createEl('button', { class: 'modal-close', type:'button', 'aria-label':'Fermer' }, '×');
    closeBtn.addEventListener('click', () => overlay.remove());

    const grid = createEl('div', { class: 'modal-grid' });
    const left = createEl('div', { class: 'modal-images' });
    const mainImg = createEl('img', { class: 'main-img', src: getProductImageUrl(product), alt: safeText(product['TITRE'] || product['REFERENCE']) });
    left.appendChild(mainImg);

    // thumbnails
    const thumbsWrap = createEl('div', { class: 'thumbs' });
    const imageFields = Object.keys(product).filter(k => k.toLowerCase().includes('image'));
    if(imageFields.length){
      for(const f of imageFields){
        const u = getCloudinaryUrl(product[f]);
        if(!u) continue;
        const t = createEl('img', { src: u, class: 'thumb-img' });
        t.addEventListener('click', () => mainImg.src = u);
        thumbsWrap.appendChild(t);
      }
    }
    left.appendChild(thumbsWrap);

    const right = createEl('div', { class: 'modal-info' });
    right.appendChild(createEl('h2', {}, safeText(product['TITRE'] || product['TITLE'] || product['REFERENCE'])));
    right.appendChild(createEl('div', { class: 'price' }, getProductPriceValue(product) ? `${getProductPriceValue(product).toFixed(2)} €` : ''));
    right.appendChild(createEl('div', { class: 'desc-area' }, safeText(product['DESCRIPTION'] || product['description'] || '')));

    // extra info
    const infoList = createEl('ul', { class: 'product-extra-info' });
    infoList.innerHTML = `
      <li><strong>Référence :</strong> ${safeText(product['REFERENCE']||'')}</li>
      <li><strong>Couleur :</strong> ${safeText(product['COULEUR']||product['couleur']||'')}</li>
      <li><strong>Poids or :</strong> ${safeText(product['POIDS OR']||product['POIDS OR']||product['POIDS']||'')}</li>
      <li><strong>Type de pierres :</strong> ${safeText(product['type de pierres'] || product['type_de_pierres'] || product['TYPE DE PIERRES'] || product['type de pierres'] || product['type'] || '')}</li>
      <li><strong>Poids pierre :</strong> ${safeText(product['Poids pierre']||product['POIDS PIERRE']||'')}</li>
      <li><strong>Stock total :</strong> ${safeText(product['stock']||product['STOCK']||'')}</li>
    `;
    right.appendChild(infoList);

    // Taille selector
    const sizeGroup = createEl('div', { class: 'size-selector-group' });
    sizeGroup.appendChild(createEl('label', {}, 'Choisir une taille'));
    const sizeSelect = createEl('select', { id: 'product-size-select' });
    const taillesRaw = safeText(product['tailles disponibles'] || product['tailles'] || '');
    const qtysRaw = safeText(product['quantité par taille'] || product['quantite par taille'] || product['quantite_par_taille'] || '');
    const tailles = taillesRaw ? taillesRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const qtys = qtysRaw ? qtysRaw.split(',').map(q => q.trim()).filter(Boolean) : [];
    sizeSelect.appendChild(createEl('option',{ value: '' }, '— Choisir —'));
    if(tailles.length){
      for(let i=0;i<tailles.length;i++){
        const t = tailles[i];
        const q = qtys[i] || '';
        const label = q ? `${t} (stock ${q})` : t;
        sizeSelect.appendChild(createEl('option', { value: t, 'data-stock': q }, label));
      }
    } else {
      sizeSelect.appendChild(createEl('option', { value: '' }, 'Aucune taille'));
    }
    sizeGroup.appendChild(sizeSelect);

    // add to cart (size-aware)
    const addCartBtn = createEl('button', { class: 'fab-btn-modal', type:'button' }, 'Ajouter au panier');
    addCartBtn.addEventListener('click', () => {
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

    const fabBtn = createEl('button', { class: 'fabrication-btn', type:'button' }, 'Fabrication');
    fabBtn.addEventListener('click', (e) => { e.stopPropagation(); openFabricationModal(product); });

    right.appendChild(sizeGroup);
    right.appendChild(addCartBtn);
    right.appendChild(fabBtn);

    grid.appendChild(left);
    grid.appendChild(right);
    modal.appendChild(closeBtn);
    modal.appendChild(grid);
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
    close.addEventListener('click', () => overlay.remove());
    const title = createEl('h2', {}, `Fabrication — ${safeText(product['TITRE']||product['REFERENCE']||'')}`);
    const form = createEl('div',{ id:'custom-order-form' });
    const groupText = createEl('div',{ class:'custom-form-group' });
    groupText.appendChild(createEl('label', {}, 'Texte personnalisé (gravure)'));
    const textInput = createEl('input', { type:'text', id:'fab-text', placeholder:'Ex : A. & M.'});
    groupText.appendChild(textInput);
    const groupMat = createEl('div',{ class:'custom-form-group' });
    groupMat.appendChild(createEl('label', {}, 'Matériau'));
    const matSelect = createEl('select', { id:'fab-material' },
      createEl('option', { value:'' }, '— Choisir —'),
      createEl('option', { value:'or' }, 'Or'),
      createEl('option', { value:'argent' }, 'Argent'),
      createEl('option', { value:'plaquor' }, 'Plaqué or')
    );
    groupMat.appendChild(matSelect);
    const groupDelay = createEl('div',{ class:'custom-form-group' });
    groupDelay.appendChild(createEl('label', {}, 'Délai (jours)'));
    const delayInput = createEl('input', { type:'number', id:'fab-delay', min:'0', value:'7' });
    groupDelay.appendChild(delayInput);
    const addFabBtn = createEl('button',{ class:'custom-submit-btn', type:'button' }, 'Ajouter au panier (Fabrication)');
    addFabBtn.addEventListener('click', () => {
      const options = {
        text: document.getElementById('fab-text')?.value || '',
        material: document.getElementById('fab-material')?.value || '',
        delayDays: parseInt(document.getElementById('fab-delay')?.value || '0', 10)
      };
      const refBase = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || '');
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
    form.appendChild(groupText);
    form.appendChild(groupMat);
    form.appendChild(groupDelay);
    form.appendChild(addFabBtn);
    modal.appendChild(close);
    modal.appendChild(title);
    modal.appendChild(form);
    overlay.appendChild(modal);
  }

  // ---------- CART ----------
  function addToCart(key, product){
    if(!key){ console.warn('addToCart without key'); return; }
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
    const itemsEl = panel.querySelector('.cart-items') || panel.querySelector('.cart-items-list');
    if(!itemsEl) return;
    itemsEl.innerHTML = '';

    for(const [key,entry] of state.cart.entries()){
      const item = createEl('div',{ class:'cart-item' });
      const imgWrap = createEl('div',{ class:'cart-item-img' });
      const img = createEl('img', { src: getProductImageUrl(entry.product), alt: entry.product['TITRE']||key });
      imgWrap.appendChild(img);
      const info = createEl('div',{ class:'cart-item-details' });
      const titleText = (entry.product.__fabrication ? 'Fabrication: ' : '') + (entry.product['TITRE'] || entry.product['title'] || key) + (entry.product.__size ? ` — Taille ${entry.product.__size}` : '');
      const title = createEl('h4', {}, safeText(titleText));
      const details = createEl('div',{ class:'cart-item-size' }, entry.product.__fabrication ? 'Fabrication' : '');
      const priceNum = getProductPriceValue(entry.product);
      const price = createEl('div',{ class:'cart-item-price' }, `${priceNum.toFixed(2)} €`);
      const subtotalEl = createEl('div',{ class:'cart-item-subtotal' }, `x${entry.qty} = ${(priceNum * entry.qty).toFixed(2)} €`);
      const qtyWrap = createEl('div',{ class:'cart-item-qty' });
      const minus = createEl('button',{ class:'cart-item-minus' }, '-');
      const qspan = createEl('span', {}, String(entry.qty));
      const plus = createEl('button',{ class:'cart-item-plus' }, '+');
      minus.addEventListener('click', ()=> setQty(key, Math.max(0, entry.qty-1)));
      plus.addEventListener('click', ()=> setQty(key, entry.qty+1));
      qtyWrap.append(minus, qspan, plus);
      const remove = createEl('button',{ class:'cart-item-remove', title:'Supprimer' }, '×');
      remove.addEventListener('click', ()=> removeFromCart(key));
      info.appendChild(title); info.appendChild(details); info.appendChild(price); info.appendChild(subtotalEl);
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
    const cartCountLegacy = document.getElementById('cartCount');
    if(cartCountLegacy) cartCountLegacy.textContent = totalQty;
  }

  // ---------- BUILD CART SUMMARY ----------
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
        size: entry.product.__size || null
      });
    }
    return { items };
  }

  // ---------- Checkout initiators (call Netlify functions) ----------
  async function initiateStripeCheckout(cartSummary){
    // call Netlify function that creates a Stripe Checkout session
    const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cartSummary, successUrl: CONFIG.successUrl + '?session_id={CHECKOUT_SESSION_ID}', cancelUrl: CONFIG.cancelUrl })
    });
    if(!res.ok) throw new Error('create-checkout-session failed');
    const j = await res.json();
    if(j.sessionId){
      // load Stripe.js and redirect
      if(!window.Stripe) {
        const s = document.createElement('script'); s.src = 'https://js.stripe.com/v3/'; document.head.appendChild(s);
        await new Promise(r=>s.onload=r);
      }
      const stripe = Stripe(j.publishableKey || j.publishable_key || j.publishable); // expects publishable key from function
      await stripe.redirectToCheckout({ sessionId: j.sessionId });
    } else {
      throw new Error('No sessionId returned');
    }
  }

  async function initiatePayPalCheckout(cartSummary){
    // call your Netlify function to create PayPal order and return approval url
    const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-paypal-payment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: cartSummary, return_url: CONFIG.successUrl, cancel_url: CONFIG.cancelUrl })
    });
    if(!res.ok) throw new Error('create-paypal-payment failed');
    const j = await res.json();
    if(j.approvalUrl) window.location.href = j.approvalUrl;
    else throw new Error('No approvalUrl returned');
  }

  async function initiateAlmaPayment(cartSummary){
    const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-alma-payment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: cartSummary, return_url: CONFIG.successUrl, cancel_url: CONFIG.cancelUrl })
    });
    if(!res.ok) throw new Error('create-alma-payment failed');
    const j = await res.json();
    if(j.redirectUrl) window.location.href = j.redirectUrl;
    else throw new Error('No redirectUrl returned');
  }

  // ---------- wire checkout buttons in cart panel ----------
  function wireCheckoutButtons(){
    const panel = document.getElementById('cart-panel');
    if(!panel) return;
    const checkoutBtn = panel.querySelector('.cart-checkout-btn') || panel.querySelector('.checkout-btn') || panel.querySelector('.cart-checkout');
    if(checkoutBtn){
      checkoutBtn.addEventListener('click', async () => {
        const summary = buildCartSummary();
        // Use a simple modal/choice — replace with a nicer UI as you want
        const method = prompt('Mode de paiement : "stripe", "paypal", "alma"', 'stripe');
        if(!method) return;
        try{
          if(method.toLowerCase() === 'stripe') await initiateStripeCheckout(summary);
          else if(method.toLowerCase() === 'paypal') await initiatePayPalCheckout(summary);
          else if(method.toLowerCase() === 'alma') await initiateAlmaPayment(summary);
          else alert('Méthode inconnue');
        }catch(e){ console.error(e); alert('Erreur lors du paiement : ' + e.message); }
      });
    }
    const clearBtn = panel.querySelector('.cart-clear');
    if(clearBtn) clearBtn.addEventListener('click', () => { state.cart.clear(); updateCartUI(); });
  }

  // ---------- Render products ----------
  async function renderProducts(products){
    const grid = getGrid();
    grid.innerHTML = '';
    if(!products || products.length === 0){ grid.appendChild(createEl('p', { style: { textAlign:'center' } }, 'Aucun produit trouvé.')); return; }
    for(const p of products){
      grid.appendChild(createProductCard(p));
    }
  }

  // ---------- cart page render (optional separate page) ----------
  function renderCartPage(){
    const box = document.getElementById('cart-content');
    const totalBox = document.getElementById('total-box') || document.getElementById('totalBox');
    if(!box) return;
    box.innerHTML = '';
    let subtotal = 0;
    for(const [key,entry] of state.cart.entries()){
      const p = getProductPriceValue(entry.product);
      const line = p * entry.qty;
      subtotal += line;
      const div = createEl('div', { class: 'cart-line' });
      div.innerHTML = `<strong>${entry.product.TITRE || entry.product.title || key}</strong><br>${entry.qty} × ${p.toFixed(2)} €<br><em>Sous-total : ${line.toFixed(2)} €</em><hr>`;
      box.appendChild(div);
    }
    if(totalBox) totalBox.innerHTML = `🔢 <strong>Total TTC : ${subtotal.toFixed(2)} €</strong>`;
    // Wire buttons if present
    const paypalBtn = document.getElementById('paypal-checkout-btn');
    if(paypalBtn) paypalBtn.addEventListener('click', ()=> initiatePayPalCheckout(buildCartSummary()));
    const stripeBtn = document.getElementById('stripe-checkout-btn');
    if(stripeBtn) stripeBtn.addEventListener('click', ()=> initiateStripeCheckout(buildCartSummary()));
    const almaBtn = document.getElementById('alma-checkout-btn');
    if(almaBtn) almaBtn.addEventListener('click', ()=> initiateAlmaPayment(buildCartSummary()));
  }

  // ---------- INIT ----------
  async function init(){
    // load CSV
    const products = await loadCSV(CONFIG.csvUrl);
    state.products = products;
    renderProducts(products);
    updateCartUI();
    wireCheckoutButtons();

    // wire cart icon if exists
    const cartIcon = document.querySelector('.cart-icon') || document.getElementById('cartIcon');
    const cartPanel = document.getElementById('cart-panel');
    if(cartIcon && cartPanel){
      cartIcon.addEventListener('click', ()=> cartPanel.classList.toggle('open'));
      cartPanel.querySelector('.close-cart')?.addEventListener('click', ()=> cartPanel.classList.remove('open'));
    }

    // if cart page present
    if(document.getElementById('cart-content')) renderCartPage();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for debug
  window.LMJ = window.LMJ || {};
  window.LMJ.state = state;
  window.LMJ.getProductPriceValue = getProductPriceValue;
  window.LMJ.getProductImageUrl = getProductImageUrl;

})();
