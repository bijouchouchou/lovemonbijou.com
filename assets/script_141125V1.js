/* assets/script.js — Love Mon Bijou
   Intégration complète :
   - parsing CSV (headers confirmés)
   - affichage produit + modale complète (taille select)
   - gestion panier (taille, fabrication)
   - affichage panier + page cart.html
   - frontend hooks pour Stripe / PayPal / Alma (Netlify functions)
   - UTF-8
*/

(function () {
  'use strict';

  // ---------- CONFIG ----------
  const CONFIG = {
    csvUrl: './data/products.csv',
    cloudinaryBase: 'https://res.cloudinary.com/dcak9pjrt/image/upload/',
    placeholder: 'assets/placeholder.png',
    selectors: ['#product-list', '.grid', '#grid', '#products-container']
  };

  // ---------- STATE ----------
  const state = {
    products: [],
    cart: new Map() // key -> { product, qty }
  };

  // ---------- HELPERS ----------
  const safeText = s => (s == null ? '' : String(s));
  function createEl(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    }
    return el;
  }

  function getGrid() {
    for (const s of CONFIG.selectors) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    const main = document.querySelector('main') || document.body;
    const fallback = createEl('main', { id: 'product-list', class: 'grid products-grid' });
    main.appendChild(fallback);
    return fallback;
  }

  // ---------- IMAGES ----------
  function getCloudinaryUrl(imagePath) {
    if (!imagePath) return CONFIG.placeholder;
    if (imagePath.includes('res.cloudinary.com') || imagePath.startsWith('http')) return imagePath;
    const clean = imagePath.replace(/^\/+/, '');
    return CONFIG.cloudinaryBase + clean;
  }

  function getProductImageUrl(product) {
    if (!product) return CONFIG.placeholder;
    const keys = Object.keys(product || {});
    for (const k of keys) {
      if (k.toLowerCase().includes('image') && product[k]) return getCloudinaryUrl(product[k]);
    }
    if (product.image && product.image.trim()) return getCloudinaryUrl(product.image.trim());
    if (product.REFERENCE && product.REFERENCE.trim()) return CONFIG.cloudinaryBase + encodeURIComponent(product.REFERENCE.trim()) + '.jpg';
    return CONFIG.placeholder;
  }

  // ---------- CSV ----------
  async function loadCSV(url) {
    const csvUrl = url || CONFIG.csvUrl;
    try {
      const r = await fetch(csvUrl);
      if (!r.ok) throw new Error('CSV fetch failed: ' + r.status);
      const text = await r.text();
      return parseCSV(text);
    } catch (err) {
      console.error('loadCSV error', err);
      return [];
    }
  }

  function parseCSV(text) {
    const lines = text.replace(/\r/g, '\n').split(/\n+/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const headerLine = lines[0];
    const delimiter = (headerLine.indexOf(';') !== -1 && headerLine.split(';').length > headerLine.split(',').length) ? ';' : ',';
    const headers = splitCSVLine(headerLine, delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => splitCSVLine(line, delimiter));
    return rows.map(cols => {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = cols[i] ? cols[i].trim().replace(/^"|"$/g, '') : '';
      }
      return obj;
    });
  }

  function splitCSVLine(line, delimiter) {
    const out = []; let cur = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue; }
        inQuotes = !inQuotes; continue;
      }
      if (!inQuotes && ch === delimiter) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  // ---------- UI Loading ----------
  function showLoading(grid) { hideLoading(); const p = createEl('p', { id: 'loading-msg', style: { textAlign: 'center', fontSize: '1.05em' } }, '⏳ Chargement des produits...'); grid.appendChild(p); }
  function hideLoading() { const p = document.getElementById('loading-msg'); if (p) p.remove(); }

  // ---------- PRICE helper ----------
  function getProductPriceValue(product) {
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

  // ---------- PRODUCT CARD ----------
  function createProductCard(product) {
    const ref = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || '');
    const title = safeText(product['TITRE'] || product['TITLE'] || product['title'] || product['NOM'] || product['nom'] || ref);
    const priceValue = getProductPriceValue(product);
    const desc = safeText(product['description'] || product['DESCRIPTION'] || product['DESC'] || '');
    const card = createEl('article', { class: 'product-card', 'data-ref': ref });

    const img = createEl('img', { class: 'product-image', alt: title || ref, loading: 'lazy' });
    img.src = getProductImageUrl(product);
    img.addEventListener('error', () => { img.src = CONFIG.placeholder; });

    const meta = createEl('div', { class: 'meta' });
    const h = createEl('h3', {}, title);
    const priceEl = createEl('div', { class: 'price' }, priceValue ? `${priceValue.toFixed(2)} €` : '');
    const pdesc = createEl('p', {}, desc);

    const actions = createEl('div', { class: 'product-actions' });
    const fabricationBtn = createEl('button', { class: 'fabrication-btn', type: 'button' }, 'Fabrication');
    fabricationBtn.addEventListener('click', (e) => { e.stopPropagation(); openFabricationModal(product); });

    const addBtn = createEl('button', { class: 'add-to-cart', type: 'button' }, 'Ajouter');
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(ref || title, product); });

    const viewBtn = createEl('button', { class: 'view-product', type: 'button' }, 'Voir');
    viewBtn.addEventListener('click', (e) => { e.stopPropagation(); openProductModal(product); });

    actions.appendChild(fabricationBtn);
    actions.appendChild(addBtn);
    actions.appendChild(viewBtn);

    meta.appendChild(h);
    meta.appendChild(priceEl);
    meta.appendChild(pdesc);
    meta.appendChild(actions);

    card.appendChild(img);
    card.appendChild(meta);

    return card;
  }

  // ---------- PRODUCT MODAL (complete with sizes) ----------
  function openProductModal(product) {
    const overlayId = 'product-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = createEl('div', { id: overlayId, class: 'modal-overlay' });
      document.body.appendChild(overlay);
    } else overlay.innerHTML = '';

    const modal = createEl('div', { id: 'product-modal', class: 'modal-content' });
    const closeBtn = createEl('button', { class: 'modal-close', type: 'button', ariaLabel: 'Fermer' }, '×');
    closeBtn.addEventListener('click', () => overlay.remove());

    const grid = createEl('div', { class: 'modal-grid' });

    // left images
    const left = createEl('div', { class: 'modal-images' });
    const mainImg = createEl('img', { class: 'main-img', src: getProductImageUrl(product), alt: safeText(product['TITRE'] || product['REFERENCE']) });
    left.appendChild(mainImg);
    const thumbsWrap = createEl('div', { class: 'thumbs' });
    const imageFields = Object.keys(product).filter(k => k.toLowerCase().includes('image'));
    if (imageFields.length) {
      for (const f of imageFields) {
        const u = getCloudinaryUrl(product[f]);
        if (!u) continue;
        const t = createEl('img', { src: u, class: 'thumb-img' });
        t.addEventListener('click', () => { mainImg.src = u; });
        thumbsWrap.appendChild(t);
      }
    }
    left.appendChild(thumbsWrap);

    // right info
    const right = createEl('div', { class: 'modal-info' });
    const title = createEl('h2', {}, safeText(product['TITRE'] || product['TITLE'] || product['REFERENCE']));
    const price = createEl('div', { class: 'price' }, getProductPriceValue(product) ? `${getProductPriceValue(product).toFixed(2)} €` : '');
    const desc = createEl('div', { class: 'desc-area' }, safeText(product['description'] || product['DESCRIPTION'] || ''));

    // extra info list
    const infoList = createEl('ul', { class: 'product-extra-info' });
    infoList.innerHTML = `
      <li><strong>Référence :</strong> ${safeText(product['REFERENCE'] || '')}</li>
      <li><strong>Couleur :</strong> ${safeText(product['couleur'] || product['COULEUR'] || '')}</li>
      <li><strong>Poids or :</strong> ${safeText(product['POIDS OR'] || '')}</li>
      <li><strong>Type de pierres :</strong> ${safeText(product['type de pierres'] || product['type de pierres'] || product['type de pierres'] || product['type de pierres'] || product['type de pierres'] || product['type de pierres'] || safeText(product['type de pierres'] || product['TYPE DE PIERRES'] || product['type de pierres'] || product['type_de_pierres'] || ''))}</li>
      <li><strong>Poids pierre :</strong> ${safeText(product['Poids pierre'] || '')}</li>
      <li><strong>Stock total :</strong> ${safeText(product['stock'] || product['STOCK'] || '')}</li>
    `;

    // ----- Taille selector -----
    const sizeGroup = createEl('div', { class: 'size-selector-group' });
    sizeGroup.appendChild(createEl('label', {}, 'Choisir une taille'));
    const sizeSelect = createEl('select', { id: 'product-size-select' });

    const taillesRaw = safeText(product['tailles disponibles'] || product['tailles'] || '');
    const qtysRaw = safeText(product['quantité par taille'] || product['quantite par taille'] || product['quantite_par_taille'] || '');

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

    // add to cart button (uses selected size)
    const addCartBtn = createEl('button', { class: 'fab-btn-modal', type: 'button' }, 'Ajouter au panier');
    addCartBtn.addEventListener('click', () => {
      const selectedSize = document.getElementById('product-size-select')?.value || '';
      if (tailles.length && !selectedSize) { alert('Veuillez choisir une taille.'); return; }
      const ref = safeText(product['REFERENCE'] || product['Ref'] || product['ref'] || product['reference'] || product['TITRE']);
      const key = ref + (selectedSize ? `|size:${selectedSize}` : `|item`);
      const productCopy = Object.assign({}, product);
      if (selectedSize) productCopy.__size = selectedSize;
      addToCart(key, productCopy);
      overlay.remove();
      updateCartUI();
    });

    // fabrication button
    const fabBtn = createEl('button', { class: 'fabrication-btn', type: 'button' }, 'Fabrication');
    fabBtn.addEventListener('click', (e) => { e.stopPropagation(); openFabricationModal(product); });

    // assemble
    right.appendChild(title);
    right.appendChild(price);
    right.appendChild(desc);
    right.appendChild(infoList);
    right.appendChild(sizeGroup);
    right.appendChild(addCartBtn);
    right.appendChild(fabBtn);

    grid.appendChild(left);
    grid.appendChild(right);

    modal.appendChild(closeBtn);
    modal.appendChild(grid);
    overlay.appendChild(modal);
  }

  // ---------- Fabrication modal (kept same) ----------
  function openFabricationModal(product) {
    const overlayId = 'fabrication-modal-overlay';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = createEl('div', { id: overlayId, class: 'modal-overlay' });
      document.body.appendChild(overlay);
    } else overlay.innerHTML = '';

    const modal = createEl('div', { id: 'custom-order-modal', class: 'custom-modal-content' });
    const close = createEl('button', { id: 'close-custom-modal', type: 'button' }, '×');
    close.addEventListener('click', () => overlay.remove());

    const title = createEl('h2', {}, `Fabrication — ${safeText(product['TITRE'] || product['REFERENCE'] || '')}`);

    const form = createEl('div', { id: 'custom-order-form' });
    const groupText = createEl('div', { class: 'custom-form-group' });
    groupText.appendChild(createEl('label', {}, 'Texte personnalisé (gravure)'));
    const textInput = createEl('input', { type: 'text', id: 'fab-text', placeholder: 'Ex : A. & M.' });
    groupText.appendChild(textInput);

    const groupMat = createEl('div', { class: 'custom-form-group' });
    groupMat.appendChild(createEl('label', {}, 'Matériau'));
    const matSelect = createEl('select', { id: 'fab-material' },
      createEl('option', { value: '' }, '— Choisir —'),
      createEl('option', { value: 'or' }, 'Or'),
      createEl('option', { value: 'argent' }, 'Argent'),
      createEl('option', { value: 'plaquor' }, 'Plaqué or')
    );
    groupMat.appendChild(matSelect);

    const groupDelay = createEl('div', { class: 'custom-form-group' });
    groupDelay.appendChild(createEl('label', {}, 'Délai (jours)'));
    const delayInput = createEl('input', { type: 'number', id: 'fab-delay', min: '0', value: '7' });
    groupDelay.appendChild(delayInput);

    const addFabBtn = createEl('button', { class: 'custom-submit-btn', type: 'button' }, 'Ajouter au panier (Fabrication)');
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
      if (cartIcon) {
        cartIcon.classList.add('cart-animate');
        setTimeout(() => cartIcon.classList.remove('cart-animate'), 800);
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

  // ---------- CART ----------
  function addToCart(key, product) {
    if (!key) {
      console.warn('addToCart called without key');
      return;
    }
    const existing = state.cart.get(key);
    if (existing) existing.qty += 1;
    else state.cart.set(key, { product, qty: 1 });
    updateCartUI();
  }

  function removeFromCart(key) { state.cart.delete(key); updateCartUI(); }
  function setQty(key, qty) {
    const entry = state.cart.get(key); if (!entry) return;
    entry.qty = Math.max(0, parseInt(qty, 10) || 0);
    if (entry.qty === 0) state.cart.delete(key);
    updateCartUI();
  }

  function updateCartUI() {
    const countEl = document.querySelector('.cart-count, #cartCount');
    let totalQty = 0; let subtotal = 0;
    for (const [k, v] of state.cart.entries()) {
      totalQty += v.qty;
      const p = getProductPriceValue(v.product);
      subtotal += p * v.qty;
    }
    if (countEl) { countEl.textContent = totalQty; countEl.style.display = totalQty > 0 ? 'flex' : 'none'; }

    const panel = document.getElementById('cart-panel'); if (!panel) return;
    const itemsEl = panel.querySelector('.cart-items') || panel.querySelector('.cart-items-list'); if (!itemsEl) return;
    itemsEl.innerHTML = '';

    for (const [key, entry] of state.cart.entries()) {
      const item = createEl('div', { class: 'cart-item' });
      const imgWrap = createEl('div', { class: 'cart-item-img' });
      const img = createEl('img', { src: getProductImageUrl(entry.product), alt: entry.product['TITRE'] || key });
      imgWrap.appendChild(img);

      const info = createEl('div', { class: 'cart-item-details' });
      const titleText = (entry.product.__fabrication ? 'Fabrication: ' : '') + (entry.product.TITRE || entry.product['title'] || key) + (entry.product.__size ? ` — Taille ${entry.product.__size}` : '');
      const title = createEl('h4', {}, safeText(titleText));
      const details = createEl('div', { class: 'cart-item-size' }, entry.product.__fabrication ? 'Fabrication' : '');
      const priceNum = getProductPriceValue(entry.product);
      const price = createEl('div', { class: 'cart-item-price' }, `${priceNum.toFixed(2)} €`);
      const subtotalEl = createEl('div', { class: 'cart-item-subtotal' }, `x${entry.qty} = ${(priceNum * entry.qty).toFixed(2)} €`);

      const qtyWrap = createEl('div', { class: 'cart-item-qty' });
      const minus = createEl('button', { class: 'cart-item-minus' }, '-');
      const qspan = createEl('span', {}, String(entry.qty));
      const plus = createEl('button', { class: 'cart-item-plus' }, '+');
      minus.addEventListener('click', () => setQty(key, Math.max(0, entry.qty - 1)));
      plus.addEventListener('click', () => setQty(key, entry.qty + 1));
      qtyWrap.append(minus, qspan, plus);

      const remove = createEl('button', { class: 'cart-item-remove', title: 'Supprimer' }, '×');
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

    // totals
    const shipping = (subtotal >= 100 ? 0 : (subtotal === 0 ? 0 : 5));
    const subtotalEl = panel.querySelector('.cart-subtotal .value') || panel.querySelector('.cart-subtotal');
    if (subtotalEl) {
      if (panel.querySelector('.cart-subtotal .value')) panel.querySelector('.cart-subtotal .value').textContent = `${subtotal.toFixed(2)} €`;
      else { const container = panel.querySelector('.cart-subtotal'); if (container) container.textContent = `Sous-total: ${subtotal.toFixed(2)} €`; }
    }
    const shippingEl = panel.querySelector('.cart-shipping .value') || panel.querySelector('.cart-shipping');
    if (shippingEl) {
      if (panel.querySelector('.cart-shipping .value')) panel.querySelector('.cart-shipping .value').textContent = `${shipping.toFixed(2)} €`;
      else { const container = panel.querySelector('.cart-shipping'); if (container) container.textContent = `Frais de port: ${shipping.toFixed(2)} €`; }
    }
    const totalEl = panel.querySelector('.cart-total') || panel.querySelector('.cart-total strong');
    if (totalEl) {
      const total = subtotal + shipping;
      if (panel.querySelector('.cart-total')) panel.querySelector('.cart-total').textContent = `Total: ${total.toFixed(2)} €`;
      else if (panel.querySelector('.cart-total strong')) panel.querySelector('.cart-total strong').textContent = `${total.toFixed(2)} €`;
    }

    const cartCountLegacy = document.getElementById('cartCount');
    if (cartCountLegacy) cartCountLegacy.textContent = totalQty;
  }

  // ---------- PAYMENT HELPERS (front) ----------
  function buildCartSummary() {
    const items = [];
    for (const [key, entry] of state.cart.entries()) {
      items.push({
        key,
        title: entry.product['TITRE'] || entry.product['title'] || key,
        qty: entry.qty,
        price: getProductPriceValue(entry.product),
        ref: entry.product['REFERENCE'] || key,
        size: entry.product.__size || null,
        fabrication: !!entry.product.__fabrication
      });
    }
    return { items };
  }

  // Stripe: calls Netlify function create-checkout-session
  async function initiateStripeCheckout(cartSummary) {
    try {
      const resp = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartSummary.items })
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.id && window.Stripe && window.STRIPE_PUBLISHABLE_KEY) {
        const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: data.id });
        return;
      }
      alert('Erreur lors de la création de la session Stripe.');
      console.error('Stripe response', data);
    } catch (err) {
      console.error('initiateStripeCheckout', err);
      alert('Erreur Stripe. Voir console.');
    }
  }

  // PayPal: calls Netlify function create-paypal-order and redirects to approvalUrl
  async function initiatePayPalCheckout(cartSummary) {
    try {
      const resp = await fetch('/.netlify/functions/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartSummary.items })
      });
      const data = await resp.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }
      alert('Erreur lors de la création de la commande PayPal.');
      console.error('PayPal response', data);
    } catch (err) {
      console.error('initiatePayPalCheckout', err);
      alert('Erreur PayPal. Voir console.');
    }
  }

  // Alma: calls Netlify function create-alma-payment and redirects to returned url
  async function initiateAlmaPayment(cartSummary) {
    try {
      const resp = await fetch('/.netlify/functions/create-alma-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartSummary.items })
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert('Erreur lors de la création de la commande Alma.');
      console.error('Alma response', data);
    } catch (err) {
      console.error('initiateAlmaPayment', err);
      alert('Erreur Alma. Voir console.');
    }
  }

  // ---------- Hook checkout buttons in cart panel ----------
  function wireCheckoutButtons() {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    const checkoutBtn = panel.querySelector('.cart-checkout-btn') || panel.querySelector('.checkout-btn') || panel.querySelector('.cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async () => {
        const summary = buildCartSummary();
        // simple chooser modal
        const method = prompt('Mode de paiement : "stripe", "paypal", "alma"', 'stripe');
        if (!method) return;
        try {
          if (method.toLowerCase() === 'stripe') await initiateStripeCheckout(summary);
          else if (method.toLowerCase() === 'paypal') await initiatePayPalCheckout(summary);
          else if (method.toLowerCase() === 'alma') await initiateAlmaPayment(summary);
          else alert('Méthode inconnue');
        } catch (e) {
          console.error('Checkout error', e);
          alert('Erreur lors du paiement');
        }
      });
    }

    const emailBtn = panel.querySelector('.cart-email-btn') || panel.querySelector('.cart-checkout-email');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const emailInput = panel.querySelector('.cart-email-input input');
        const email = emailInput ? emailInput.value.trim() : '';
        if (!email || !email.includes('@')) { alert('Veuillez entrer une adresse e-mail valide.'); return; }
        console.log('Email checkout for', email, buildCartSummary());
        alert('Simulation d\'envoi par e-mail.');
      });
    }

    const clearBtn = panel.querySelector('.cart-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => { state.cart.clear(); updateCartUI(); });
  }

  // ---------- Render products ----------
  async function renderProducts(products) {
    const grid = getGrid();
    grid.innerHTML = '';
    if (!products || products.length === 0) {
      grid.appendChild(createEl('p', { style: { textAlign: 'center' } }, 'Aucun produit trouvé.'));
      return;
    }
    for (const p of products) {
      const card = createProductCard(p);
      grid.appendChild(card);
    }
  }

  // ---------- Filters (unchanged) ----------
  function initFilters(products) {
    const typeSel = document.getElementById('typeFilter');
    const titleSel = document.getElementById('titleFilter');
    const colorSel = document.getElementById('colorFilter');
    const stockSel = document.getElementById('stockFilter');
    const fabSel = document.getElementById('fabFilter');

    function fill(select, values) {
      if (!select) return;
      select.length = 1;
      const sorted = Array.from(new Set(values)).filter(Boolean).sort();
      for (const v of sorted) select.appendChild(createEl('option', { value: v }, v));
    }

    fill(typeSel, products.map(p => p['type de bijoux'] || p['TYPE'] || p['type']));
    fill(titleSel, products.map(p => p['TITRE'] || p['TITLE'] || p['title']));
    fill(colorSel, products.map(p => p['couleur'] || p['COULEUR'] || p['color']));
    fill(stockSel, products.map(p => p['stock'] || p['STOCK']));
    fill(fabSel, products.map(p => p['fabrication_possible'] || p['FAB'] || p['FABRICATION']));

    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', () => applyFilters(products));
    [typeSel, titleSel, colorSel, stockSel, fabSel].forEach(s => { if (s) s.addEventListener('change', () => applyFilters(products)); });
  }

  function applyFilters(products) {
    const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const type = document.getElementById('typeFilter')?.value || '';
    const title = document.getElementById('titleFilter')?.value || '';
    const color = document.getElementById('colorFilter')?.value || '';
    const stock = document.getElementById('stockFilter')?.value || '';
    const fab = document.getElementById('fabFilter')?.value || '';

    const filtered = products.filter(p => {
      const txt = JSON.stringify(p).toLowerCase();
      if (search && !txt.includes(search)) return false;
      if (type && ((p['type de bijoux'] || p['TYPE'] || p['type'] || '') !== type)) return false;
      if (title && ((p['TITRE'] || p['TITLE'] || p['title'] || '') !== title)) return false;
      if (color && ((p['couleur'] || p['COULEUR'] || p['color'] || '') !== color)) return false;
      if (stock && ((p['stock'] || p['STOCK'] || '') !== stock)) return false;
      if (fab && ((p['fabrication_possible'] || p['FAB'] || p['fabrication'] || '') !== fab)) return false;
      return true;
    });

    renderProducts(filtered);
  }

  // ---------- PAGE PANIER ----------
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cart-content")) renderCartPage();
  });

  function renderCartPage() {
    const box = document.getElementById("cart-content");
    const totalBox = document.getElementById("total-box");
    if (!box || !totalBox) return;
    box.innerHTML = ""; let subtotal = 0;
    for (const [key, entry] of state.cart.entries()) {
      const p = getProductPriceValue(entry.product);
      const line = p * entry.qty; subtotal += line;
      const div = createEl("div", { class: "cart-line" });
      div.innerHTML = `<strong>${entry.product.TITRE || key}</strong><br>${entry.qty} × ${p.toFixed(2)} €<br><em>Sous-total : ${line.toFixed(2)} €</em><hr>`;
      box.appendChild(div);
    }
    totalBox.innerHTML = `🔢 <strong>Total TTC : ${subtotal.toFixed(2)} €</strong>`;
    setupStripeButton(subtotal);
    setupPayPalButton(subtotal);
    setupAlmaButton(subtotal);
  }

  // ---------- FRONT BUTTONS for cart page ----------
  function setupStripeButton(total) {
    const el = document.getElementById('stripe-pay');
    if (!el) return;
    el.onclick = async () => {
      const summary = buildCartSummary();
      await initiateStripeCheckout(summary);
    };
  }

  function setupPayPalButton(total) {
    const el = document.getElementById('paypal-button-container');
    if (!el || !window.paypal) return;
    el.innerHTML = ''; // let paypal render
    // render PayPal button if SDK loaded
    if (window.paypal && typeof window.paypal.Buttons === 'function') {
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return fetch('/.netlify/functions/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildCartSummary())
          }).then(r => r.json()).then(d => d.orderID || d.id || d.approvalUrl || '');
        },
        onApprove: (data) => { window.location.href = '/success.html'; }
      }).render('#paypal-button-container');
    }
  }

  function setupAlmaButton(total) {
    const el = document.getElementById('alma-container');
    if (!el) return;
    el.innerHTML = '';
    const btn = createEl('button', { class: 'pay' }, 'Paiement 3× (Alma)');
    btn.addEventListener('click', async () => {
      const summary = buildCartSummary();
      await initiateAlmaPayment(summary);
    });
    el.appendChild(btn);
  }

  // ---------- INIT ----------
  async function init() {
    const grid = getGrid(); showLoading(grid);
    if (Array.isArray(window.allProducts) && window.allProducts.length > 0) state.products = window.allProducts;
    else state.products = await loadCSV(CONFIG.csvUrl).catch(() => []);
    hideLoading();
    initFilters(state.products);
    renderProducts(state.products);
    updateCartUI();
    wireCheckoutButtons();

    const cartIcon = document.querySelector('.cart-icon') || document.getElementById('cartIcon');
    const cartPanel = document.getElementById('cart-panel');
    if (cartIcon && cartPanel) {
      cartIcon.addEventListener('click', () => cartPanel.classList.toggle('open'));
      cartPanel.querySelector('.close-cart')?.addEventListener('click', () => cartPanel.classList.remove('open'));
    }
    const customBtn = document.getElementById('custom-order-btn');
    if (customBtn) customBtn.addEventListener('click', () => openCustomOrderModal());
  }

  // ---------- expose & autostart ----------
  window.LMJ = window.LMJ || {};
  window.LMJ.state = state;
  window.LMJ.reload = async function() { await init(); };
  window.getProductImageUrl = getProductImageUrl;
  window.loadCSVData = async function(u) { const p = await loadCSV(u); state.products = p; renderProducts(p); return p; };
  window.displayProducts = function(products) { renderProducts(products || state.products); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
