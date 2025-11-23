/* assets/script.js — Love Mon Bijou (CSV mode) — with simple "événement" filter
   - UTF-8
   - Reads ./data/products.csv
   - Cloudinary images
   - Product modal (sizes + qty per size)
   - Fabrication modal
   - Cart panel
   - Checkout stubs
   - Simple event filter
*/

(function(){
  'use strict';

  // ---------- CONFIG ----------
  const CONFIG = {
    csvUrl: './data/products.csv',
    cloudinaryBase: 'https://res.cloudinary.com/dcak9pjrt/image/upload/',
    placeholder: 'assets/placeholder.png',
    successUrl: `${window.location.origin}/success.html`,
    cancelUrl: `${window.location.origin}/cancel.html`,
    netlifyFnPrefix: '/.netlify/functions'
  };

  // ---------- STATE ----------
  const state = {
    products: [],
    cart: new Map(),
    filters: {
      event: ''
    }
  };

  // ---------- HELPERS ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
  const safeText = v => (v == null ? '' : String(v));

  function createEl(tag, attrs = {}, ...children){
    const el = document.createElement(tag);
    for(const k in attrs){
      const v = attrs[k];
      if(k === 'class') el.className = v;
      else if(k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if(k === 'html') el.innerHTML = v;
      else if(k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for(const c of children){
      if(c == null) continue;
      if(typeof c === 'string') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    }
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
    const keys = Object.keys(product || {});
    for(const k of keys){
      if(k.toLowerCase().includes('image') && product[k]) return getCloudinaryUrl(product[k]);
    }
    if(product.image && product.image.trim()) return getCloudinaryUrl(product.image.trim());
    if(product.REFERENCE && product.REFERENCE.trim())
      return CONFIG.cloudinaryBase + encodeURIComponent(product.REFERENCE.trim()) + '.jpg';
    return CONFIG.placeholder;
  }

  // ---------- Price parsing ----------
  function getProductPriceValue(product){
    const priceRaw = safeText(
      product['PRIX'] ||
      product['price €'] ||
      product['price_euros'] ||
      product['PRICE'] ||
      product['price'] || ''
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
    const delimiter = (headerLine.indexOf(';') !== -1 &&
                       headerLine.split(';').length > headerLine.split(',').length)
                     ? ';' : ',';
    const headers = splitCSVLine(headerLine, delimiter)
                      .map(h => h.trim().replace(/^"|"$/g,''));
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
    const out = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"'){
        if(inQuotes && line[i+1] === '"'){
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if(!inQuotes && ch === delimiter){
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  // ---------- GRID FINDER ----------
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

  // ---------- EXTRACT EVENTS FROM PRODUCT ----------
  function getProductEvents(product){
    const raw = safeText(product['événement'] || product['evenement'] || product['event'] || '');
    if(!raw) return [];
    return raw
      .split(/[,;]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  // ---------- PRODUCT CARD ----------
  function createProductCard(product){
    const ref   = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || '');
    const title = safeText(product['TITRE'] || product['TITLE'] || product['title'] || ref);
    const priceVal = getProductPriceValue(product);
    const desc  = safeText(product['description'] || product['DESCRIPTION'] || '');

    const card = createEl('article', {
      class: 'product-card',
      'data-ref': ref
    });

    const img = createEl('img', {
      class: 'product-image',
      alt: title || ref,
      loading: 'lazy',
      src: getProductImageUrl(product)
    });
    img.addEventListener('error', () => { img.src = CONFIG.placeholder; });

    const meta = createEl('div', { class: 'meta' });
    meta.appendChild(createEl('h3', {}, title));
    meta.appendChild(createEl('div', { class: 'price' }, priceVal ? `${priceVal.toFixed(2)} €` : ''));
    meta.appendChild(createEl('p', {}, desc));

    // Boutons
    const actions = createEl('div', { class: 'product-actions' });

    const fabricationBtn = createEl('button', { class: 'fabrication-btn', type:'button' }, 'Fabrication');
    fabricationBtn.addEventListener('click', e => {
      e.stopPropagation();
      openFabricationModal(product);
    });

    const addBtn = createEl('button', { class: 'add-to-cart', type:'button' }, 'Ajouter');
    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(ref, product);
    });

    const viewBtn = createEl('button', { class: 'view-product', type:'button' }, 'Voir');
    viewBtn.addEventListener('click', e => {
      e.stopPropagation();
      openProductModal(product);
    });

    actions.appendChild(fabricationBtn);
    actions.appendChild(addBtn);
    actions.appendChild(viewBtn);

    meta.appendChild(actions);
    card.appendChild(img);
    card.appendChild(meta);

    // stock des événements dans data-attribute
    const events = getProductEvents(product);
    if(events.length){
      card.setAttribute('data-events', events.join(','));
    }

    return card;
  }
  // ---------- PRODUCT MODAL ----------
  function openProductModal(product){
    const overlayId = 'product-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if(!overlay){
      overlay = createEl('div', { id: overlayId, class: 'modal-overlay' });
      document.body.appendChild(overlay);
    } else {
      overlay.innerHTML = '';
    }

    const modal = createEl('div', { id: 'product-modal', class: 'modal-content' });

    const closeBtn = createEl('button', {
      class: 'modal-close',
      type:'button',
      'aria-label': 'Fermer'
    }, '×');
    closeBtn.addEventListener('click', () => overlay.remove());

    const grid = createEl('div', { class: 'modal-grid' });

    // ----- LEFT (IMAGES) -----
    const left = createEl('div', { class: 'modal-images' });

    const mainImg = createEl('img', {
      class: 'main-img',
      src: getProductImageUrl(product),
      alt: safeText(product['TITRE'] || product['REFERENCE'])
    });
    left.appendChild(mainImg);

    // thumbnails
    const thumbsWrap = createEl('div', { class: 'thumbs' });
    const imageFields = Object.keys(product).filter(k =>
      k.toLowerCase().includes('image')
    );

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

    // ----- RIGHT (INFO) -----
    const right = createEl('div', { class: 'modal-info' });

    right.appendChild(createEl('h2', {},
      safeText(product['TITRE'] || product['TITLE'] || product['REFERENCE'])
    ));

    right.appendChild(createEl('div', { class: 'price' },
      getProductPriceValue(product)
        ? `${getProductPriceValue(product).toFixed(2)} €`
        : ''
    ));

    right.appendChild(createEl('div', { class: 'desc-area' },
      safeText(product['DESCRIPTION'] || product['description'] || '')
    ));

    // Détails supplémentaires
    const infoList = createEl('ul', { class: 'product-extra-info' });
    infoList.innerHTML = `
      <li><strong>Référence :</strong> ${safeText(product['REFERENCE']||'')}</li>
      <li><strong>Couleur :</strong> ${safeText(product['COULEUR']||product['couleur']||'')}</li>
      <li><strong>Poids or :</strong> ${safeText(product['POIDS OR']||product['POIDS']||'')}</li>
      <li><strong>Type de pierres :</strong> ${safeText(
        product['type de pierres'] ||
        product['TYPE DE PIERRES'] ||
        product['type_de_pierres'] ||
        product['pierres'] ||
        ''
      )}</li>
      <li><strong>Poids pierre :</strong> ${safeText(product['Poids pierre']||product['POIDS PIERRE']||'')}</li>
      <li><strong>Stock total :</strong> ${safeText(product['stock']||product['STOCK']||'')}</li>
    `;
    right.appendChild(infoList);

    // ---------- SELECTEUR DE TAILLES ----------
    const sizeGroup = createEl('div', { class: 'size-selector-group' });
    sizeGroup.appendChild(createEl('label', {}, 'Choisir une taille'));

    const sizeSelect = createEl('select', { id: 'product-size-select' });

    const taillesRaw = safeText(
      product['tailles disponibles'] ||
      product['tailles'] ||
      ''
    );

    const qtysRaw = safeText(
      product['quantité par taille'] ||
      product['quantite par taille'] ||
      product['quantite_par_taille'] ||
      ''
    );

    const tailles = taillesRaw ? taillesRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const qtys = qtysRaw ? qtysRaw.split(',').map(q => q.trim()).filter(Boolean) : [];

    sizeSelect.appendChild(createEl('option', { value: '' }, '— Choisir —'));

    if (tailles.length) {
      for (let i = 0; i < tailles.length; i++) {
        const t = tailles[i];
        const q = qtys[i] || '';
        const label = q ? `${t} (stock ${q})` : t;
        sizeSelect.appendChild(createEl('option', { value: t, 'data-stock': q }, label));
      }
    } else {
      sizeSelect.appendChild(createEl('option', { value: '' }, 'Aucune taille'));
    }

    sizeGroup.appendChild(sizeSelect);

    // ---------- BOUTON AJOUTER AU PANIER ----------
    const addCartBtn = createEl('button', { class: 'fab-btn-modal', type: 'button' }, 'Ajouter au panier');

    addCartBtn.addEventListener('click', () => {
      const selectedSize = document.getElementById('product-size-select')?.value || '';
      if (tailles.length && !selectedSize) {
        alert('Veuillez choisir une taille.');
        return;
      }

      const ref = safeText(
        product['REFERENCE'] ||
        product['Ref'] ||
        product['ref'] ||
        product['reference'] ||
        product['TITRE'] ||
        ''
      );

      const key = ref + (selectedSize ? `|size:${selectedSize}` : `|item`);

      const productCopy = Object.assign({}, product);
      if (selectedSize) productCopy.__size = selectedSize;

      addToCart(key, productCopy);
      overlay.remove();
      updateCartUI();
    });

    // ---------- BOUTON FABRICATION ----------
    const fabBtn = createEl('button', { class: 'fabrication-btn', type: 'button' }, 'Fabrication');
    fabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openFabricationModal(product);
    });

    right.appendChild(sizeGroup);
    right.appendChild(addCartBtn);
    right.appendChild(fabBtn);

    grid.appendChild(left);
    grid.appendChild(right);

    modal.appendChild(closeBtn);
    modal.appendChild(grid);
    overlay.appendChild(modal);
  }

  // -----------------------------------------------------------
  // ------------------- FABRICATION MODAL ----------------------
  // -----------------------------------------------------------
  function openFabricationModal(product){
    const overlayId = 'fabrication-modal-overlay';
    let overlay = document.getElementById(overlayId);

    if(!overlay){
      overlay = createEl('div', { id: overlayId, class:'modal-overlay' });
      document.body.appendChild(overlay);
    } else {
      overlay.innerHTML = '';
    }

    const modal = createEl('div', { id:'custom-order-modal', class:'custom-modal-content' });

    const close = createEl('button', { id:'close-custom-modal' }, '×');
    close.addEventListener('click', () => overlay.remove());

    const title = createEl('h2', {}, `Fabrication — ${safeText(product['TITRE'] || product['REFERENCE'] || '')}`);

    // ------- FORM FABRICATION -------
    const form = createEl('div', { id:'custom-order-form' });

    // Texte perso
    const groupText = createEl('div', { class:'custom-form-group' });
    groupText.appendChild(createEl('label', {}, 'Texte personnalisé (gravure)'));
    const textInput = createEl('input', { type:'text', id:'fab-text', placeholder:'Ex : A. & M.' });
    groupText.appendChild(textInput);

    // Matériau
    const groupMat = createEl('div', { class:'custom-form-group' });
    groupMat.appendChild(createEl('label', {}, 'Matériau'));
    const matSelect = createEl('select', { id:'fab-material' },
      createEl('option', { value:'' }, '— Choisir —'),
      createEl('option', { value:'or' }, 'Or'),
      createEl('option', { value:'argent' }, 'Argent'),
      createEl('option', { value:'plaquor' }, 'Plaqué or')
    );
    groupMat.appendChild(matSelect);

    // Délai
    const groupDelay = createEl('div', { class:'custom-form-group' });
    groupDelay.appendChild(createEl('label', {}, 'Délai (jours)'));
    const delayInput = createEl('input', { type:'number', id:'fab-delay', min:'0', value:'7' });
    groupDelay.appendChild(delayInput);

    // Bouton ajouter fabrication
    const addFabBtn = createEl('button', { class:'custom-submit-btn', type:'button' }, 'Ajouter au panier (Fabrication)');

    addFabBtn.addEventListener('click', () => {
      const options = {
        text: document.getElementById('fab-text')?.value || '',
        material: document.getElementById('fab-material')?.value || '',
        delayDays: parseInt(document.getElementById('fab-delay')?.value || '0', 10)
      };

      const refBase = safeText(
        product['REFERENCE'] ||
        product['Ref'] ||
        product['ref'] ||
        product['reference'] ||
        ''
      );

      const variantKey =
        refBase + (options.text ? `|fab:${options.text}` : `|fab:${Date.now()}`);

      const prodCopy = Object.assign({}, product);
      prodCopy.__fabrication = true;
      prodCopy.__fabricationOptions = options;

      addToCart(variantKey, prodCopy);

      overlay.remove();
      updateCartUI();

      const cartIcon = document.querySelector('.cart-icon, #cartIcon');
      if(cartIcon){
        cartIcon.classList.add('cart-animate');
        setTimeout(()=>cartIcon.classList.remove('cart-animate'), 800);
      }
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
  // -----------------------------------------------------------
  // -----------------------   PANIER   -------------------------
  // -----------------------------------------------------------

  function addToCart(key, product){
    if(!key){
      console.warn('addToCart without key');
      return;
    }
    const existing = state.cart.get(key);
    if(existing){
      existing.qty += 1;
    } else {
      state.cart.set(key, { product, qty: 1 });
    }
    updateCartUI();
  }

  function removeFromCart(key){
    state.cart.delete(key);
    updateCartUI();
  }

  function setQty(key, qty){
    const entry = state.cart.get(key);
    if(!entry) return;

    entry.qty = Math.max(0, parseInt(qty,10) || 0);

    if(entry.qty === 0){
      state.cart.delete(key);
    }

    updateCartUI();
  }

  // ---------- UPDATE CART ----------
  function updateCartUI(){
    const countEl = document.querySelector('.cart-count, #cartCount');

    let totalQty = 0;
    let subtotal = 0;

    for(const [k,v] of state.cart.entries()){
      totalQty += v.qty;
      subtotal += getProductPriceValue(v.product) * v.qty;
    }

    if(countEl){
      countEl.textContent = totalQty;
      countEl.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    const panel = document.getElementById('cart-panel');
    if(!panel) return;

    const itemsEl = panel.querySelector('.cart-items') || panel.querySelector('.cart-items-list');
    if(!itemsEl) return;
    itemsEl.innerHTML = '';

    // ----- ITEMS -----
    for(const [key, entry] of state.cart.entries()){
      const item = createEl('div', { class:'cart-item' });

      const imgWrap = createEl('div', { class:'cart-item-img' });
      const img = createEl('img', { src: getProductImageUrl(entry.product) });
      imgWrap.appendChild(img);

      const info = createEl('div', { class:'cart-item-details' });

      const titleText =
        (entry.product.__fabrication ? 'Fabrication: ' : '') +
        (entry.product['TITRE'] || entry.product['title'] || key) +
        (entry.product.__size ? ` — Taille ${entry.product.__size}` : '');

      const title = createEl('h4', {}, safeText(titleText));

      const details = createEl('div', { class:'cart-item-size' },
        entry.product.__fabrication ? 'Fabrication' : ''
      );

      const priceNum = getProductPriceValue(entry.product);

      const price = createEl('div', { class:'cart-item-price' }, `${priceNum.toFixed(2)} €`);
      const subtotalEl = createEl('div', { class:'cart-item-subtotal' },
        `x${entry.qty} = ${(priceNum * entry.qty).toFixed(2)} €`
      );

      const qtyWrap = createEl('div', { class:'cart-item-qty' });
      const minus = createEl('button', { class:'cart-item-minus' }, '-');
      const qspan = createEl('span', {}, String(entry.qty));
      const plus = createEl('button', { class:'cart-item-plus' }, '+');

      minus.addEventListener('click', () => setQty(key, entry.qty - 1));
      plus.addEventListener('click', () => setQty(key, entry.qty + 1));

      qtyWrap.append(minus, qspan, plus);

      const remove = createEl('button', { class:'cart-item-remove' }, '×');
      remove.addEventListener('click', () => removeFromCart(key));

      info.appendChild(title);
      info.appendChild(details);
      info.appendChild(price);
      info.appendChild(subtotalEl);

      item.appendChild(imgWrap);
      item.appendChild(info);
      item.appendChild(qtyWrap);
      item.appendChild(remove);
      itemsEl.appendChild(item);
    }

    // ----- TOTALS -----
    const shipping = subtotal >= 100 ? 0 : subtotal === 0 ? 0 : 5;

    const subtotalContainer = panel.querySelector('.cart-subtotal');
    if(subtotalContainer){
      const el = subtotalContainer.querySelector('.value');
      if(el) el.textContent = `${subtotal.toFixed(2)} €`;
      else subtotalContainer.textContent = `Sous-total : ${subtotal.toFixed(2)} €`;
    }

    const shippingEl = panel.querySelector('.cart-shipping');
    if(shippingEl){
      const el = shippingEl.querySelector('.value');
      if(el) el.textContent = `${shipping.toFixed(2)} €`;
      else shippingEl.textContent = `Frais de port : ${shipping.toFixed(2)} €`;
    }

    const totalEl = panel.querySelector('.cart-total');
    if(totalEl){
      const totalValue = subtotal + shipping;
      const el = totalEl.querySelector('strong');
      if(el) el.textContent = `${totalValue.toFixed(2)} €`;
      else totalEl.textContent = `Total : ${totalValue.toFixed(2)} €`;
    }

    const cartCountLegacy = document.getElementById('cartCount');
    if(cartCountLegacy) cartCountLegacy.textContent = totalQty;
  }

  // -----------------------------------------------------------
  // ---------------------- BLOC CHECKOUT ----------------------
  // -----------------------------------------------------------

  // Encode un objet JSON en Base64 UTF-8
  function b64EncodeUnicode(obj) {
    const s = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(s)));
  }

  // --- Construire la structure panier (pour Stripe / success) ---
  function buildCheckoutPayload() {
    const items = [];

    for (const [key, entry] of state.cart.entries()) {
      items.push({
        key,
        title: entry.product['TITRE'] || entry.product['title'] || key,
        qty: entry.qty,
        price: getProductPriceValue(entry.product),
        ref: entry.product['REFERENCE'] || '',
        size: entry.product.__size || null,
        fabrication: !!entry.product.__fabrication,
        fabricationOptions: entry.product.__fabricationOptions || null,
        image: getProductImageUrl(entry.product)
      });
    }

    return { items };
  }

  // ------------------ CHECKOUT STRIPE -------------------------
  async function launchStripeCheckout() {
    const payload = buildCheckoutPayload();

    // Encode to pass to success.html
    const token = b64EncodeUnicode(payload);

    try {
      const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: payload,
          success_url: `${CONFIG.successUrl}?token=${token}`,
          cancel_url: CONFIG.cancelUrl
        })
      });

      const data = await res.json();

      if (!data.url) {
        alert("Erreur Stripe (pas d'URL retournée).");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Erreur lors de la connexion à Stripe.");
    }
  }

  // ------------------ CHECKOUT PAYPAL (stub) ------------------
  async function launchPayPalCheckout() {
    const payload = buildCheckoutPayload();
    const token = b64EncodeUnicode(payload);

    try {
      const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-paypal-payment`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          cart: payload,
          success_url: `${CONFIG.successUrl}?token=${token}`,
          cancel_url: CONFIG.cancelUrl
        })
      });

      const data = await res.json();

      if (!data.url) {
        alert("Erreur PayPal : pas d'URL.");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.error("PayPal error:", err);
      alert("Erreur PayPal.");
    }
  }

  // ---------------------- CHECKOUT ALMA (stub) ----------------
  async function launchAlmaCheckout() {
    const payload = buildCheckoutPayload();
    const token = b64EncodeUnicode(payload);

    try {
      const res = await fetch(`${CONFIG.netlifyFnPrefix}/create-alma-payment`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          cart: payload,
          success_url: `${CONFIG.successUrl}?token=${token}`,
          cancel_url: CONFIG.cancelUrl
        })
      });

      const data = await res.json();

      if (!data.url) {
        alert("Erreur Alma : pas d'URL.");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.error("Alma error:", err);
      alert("Erreur Alma.");
    }
  }

  // -------------------- BOUTON CHECKOUT ------------------------
  function launchCheckout(method = "stripe") {
    if (state.cart.size === 0) {
      alert("Votre panier est vide.");
      return;
    }

    if (method === "stripe") {
      return launchStripeCheckout();
    }
    if (method === "paypal") {
      return launchPayPalCheckout();
    }
    if (method === "alma") {
      return launchAlmaCheckout();
    }

    console.warn("Méthode checkout inconnue :", method);
  }
  // -----------------------------------------------------------
  // ----------------- AFFICHAGE PRODUITS + FILTRES ------------
  // -----------------------------------------------------------

  function displayProducts(list){
    const grid = getGrid();
    grid.innerHTML = '';
    list.forEach(p => {
      grid.appendChild(createProductCard(p));
    });
  }

  function applyFilters(){
    let list = [...state.products];

    // ---- filtre ÉVÉNEMENT ----
    const ev = (state.filters.event || '').trim().toLowerCase();
    if(ev){
      list = list.filter(p =>
        getProductEvents(p).some(e => e.toLowerCase() === ev)
      );
    }

    displayProducts(list);
  }

  function initEventFilterUI(){
    const select = document.getElementById('eventFilter');
    if(!select) return;

    const setEv = new Set();
    state.products.forEach(p => {
      getProductEvents(p).forEach(e => setEv.add(e));
    });

    select.innerHTML = '';
    select.appendChild(createEl('option', { value:'' }, 'Tous les événements'));

    Array.from(setEv).sort().forEach(ev => {
      select.appendChild(createEl('option', { value: ev }, ev));
    });

    select.addEventListener('change', e => {
      state.filters.event = e.target.value || '';
      applyFilters();
    });
  }

  // -----------------------------------------------------------
  // --------------------- INIT GLOBALE -------------------------
  // -----------------------------------------------------------

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // 1) Charger les produits depuis le CSV
      const products = await loadCSV(CONFIG.csvUrl);
      state.products = products;

      // 2) Afficher tous les produits
      applyFilters();

      // 3) Initialiser le filtre événement
      initEventFilterUI();

    } catch (e) {
      console.error('Erreur chargement produits:', e);
    }

    // 4) Mise à jour visuelle du panier
    updateCartUI();

    // 5) Boutons de checkout
    const btnStripe = document.getElementById("btn-checkout-stripe");
    const btnPayPal = document.getElementById("btn-checkout-paypal");
    const btnAlma   = document.getElementById("btn-checkout-alma");

    if (btnStripe) btnStripe.addEventListener("click", () => launchCheckout("stripe"));
    if (btnPayPal) btnPayPal.addEventListener("click", () => launchCheckout("paypal"));
    if (btnAlma)   btnAlma.addEventListener("click",   () => launchCheckout("alma"));

    // 6) Ouverture / fermeture du panneau panier (en cohérence avec index.html)
    const openCartBtn  = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartPanel    = document.getElementById('cart-panel');

    if (openCartBtn && cartPanel) {
      openCartBtn.addEventListener('click', () => {
        cartPanel.classList.add('open');
      });
    }
    if (closeCartBtn && cartPanel) {
      closeCartBtn.addEventListener('click', () => {
        cartPanel.classList.remove('open');
      });
    }
  });

})();  // fin IIFE
