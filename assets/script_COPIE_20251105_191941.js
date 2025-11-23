// ======================================
// 💍 Bijoux Project v2.1 – Novembre 2025
// Modale produit + Filtre "evenement" + Panier flottant animé
// Remplace entièrement ton script.js actuel
// ======================================

/* CONFIG */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
// const CART_PAGE = "/assets/cart.html"; // ❌ supprimé car le panier est intégré dans la page

/* STATE */
let allProducts = [];
let filteredProducts = [];

/* ---------------------------
   UTIL: parseCSVLine
   (gère champs entre guillemets et virgules internes)
   --------------------------- */
function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
    else if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result.map(s => s.replace(/^"|"$/g, "").trim());
}

/* ---------------------------
   UTIL: escapeHtml
   --------------------------- */
function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#039;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ---------------------------
   NORMALIZE: robust key lookup (case-insensitive)
   - détecte images supplémentaires
   - prépare 'evenement' pour futur filtre
   --------------------------- */
function normalizeProduct(rawObj) {
  const rawLower = {};
  Object.keys(rawObj || {}).forEach(k => {
    if (k === undefined || k === null) return;
    rawLower[String(k).toLowerCase().trim()] = rawObj[k];
  });

  const get = (keys) => {
    if (!Array.isArray(keys)) keys = [keys];
    for (const k of keys) {
      const key = String(k).toLowerCase();
      if (rawLower[key] !== undefined && rawLower[key] !== null) {
        return String(rawLower[key]).trim();
      }
    }
    return "";
  };

  const rawPriceStr = get(["price_euros", "price €", "price", "prix", "price€"]) || "0";
  const cleanPrice = rawPriceStr.replace(/[^\d,.\-]/g, "").replace(",", ".");
  const prix = parseFloat(cleanPrice) || 0;

  const ref = get(["reference", "référence", "ref"]) || "";
  const imageField = get(["image", "images", "photo", "photos"]) || "";

  const autresImagesRaw = get(["images_supplémentaires", "images_supplementaires", "vues", "photos_supp", "images"]);
  const autresImages = autresImagesRaw ? autresImagesRaw.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean) : [];

  const taillesRaw = get(["tailles disponibles", "tailles_disponibles", "tailles"]);
  const qteTailleRaw = get([
    "quantité par taille",
    "quantité_ par_ taille",
    "quantité_par_taille",
    "quantitÃ©_ par_ taille",
    "quantite_par_taille",
    "quantite par taille",
    "qte_par_taille",
    "qte_taille"
  ]) || "";

  const normalized = {
    reference: ref,
    type: get(["type de bijoux", "type"]),
    description: get("description"),
    image: imageField,
    images: [imageField, ...autresImages].filter(Boolean),
    couleur: get("couleur"),
    titre: get(["titre", "title", "name"]),
    or: get(["poids or", "poids_or", "poids"]),
    pierres: get(["type de pierres", "pierres"]),
    poidsPierre: get(["poids pierre", "poids_pierre"]),
    tailles: taillesRaw,
    qteTaille: qteTailleRaw,
    prix,
    stock: get("stock"),
    fabrication:
      (get(["fabrication_possible", "fabrication possible", "fabrication"]) || "").toUpperCase(),
    evenement: get(["evenement", "évènement", "event"])
  };

  // fallback image construction if absent
  if ((!normalized.image || !normalized.image.trim()) && normalized.reference) {
    normalized.image = `${CLOUDINARY_BASE}${encodeURIComponent(normalized.reference)}.png`;
    if (!normalized.images || normalized.images.length === 0) normalized.images = [normalized.image];
    else if (!normalized.images[0]) normalized.images[0] = normalized.image;
  }

  if (!normalized.images || normalized.images.length === 0) {
    normalized.images = [`https://via.placeholder.com/800x800?text=Pas+d%27image`];
    normalized.image = normalized.images[0];
  }

  return normalized;
}

/* ---------------------------
   RENDER PRODUCTS
   - affiche les cartes produits à partir du tableau `products`
   - clic sur une image → ouvre la modale détaillée
   --------------------------- */
function renderProducts(products) {
  const container = document.querySelector("#product-list");
  if (!container) return;

  // 🧩 Si aucun produit à afficher
  if (!products || products.length === 0) {
    container.innerHTML = "<p>Aucun bijou trouvé 🕊️</p>";
    return;
  }

  // 🖼️ Construction des cartes produits
  container.innerHTML = products
    .map((p) => {
      const imageUrl = p.image
        ? `${CLOUDINARY_BASE}${p.image}`
        : "assets/no-image.png";
      const prixAffiche = p.prix
        ? `${p.prix.toFixed(2)} €`
        : "Prix non disponible";

      return `
        <div class="product-card" data-ref="${escapeHtml(p.reference)}">
          <img src="${imageUrl}" alt="${escapeHtml(p.titre)}" class="product-img" />
          <h3 class="product-title">${escapeHtml(p.titre || "Sans titre")}</h3>
          <p class="product-price">${prixAffiche}</p>
        </div>
      `;
    })
    .join("");

  // 🖱️ Gestion du clic sur chaque carte → ouverture modale
  const cards = container.querySelectorAll(".product-card");
  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      const produit = products[index];
      if (produit) {
        openProductModal(produit);
      } else {
        console.warn("⚠️ Produit introuvable à l’index", index);
      }
    });
  });
}


/* ---------------------------
   ✅ Ouvre la modale produit détaillée
   --------------------------- */
function openProductModal(product) {
  if (!product) return;

  // Si une ancienne modale existe, on la supprime
  const oldModal = document.getElementById("productModal");
  if (oldModal) oldModal.remove();

  // Création de la modale
  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">✖️</button>

      <div class="modal-left">
        <img src="${CLOUDINARY_BASE + product.image}" 
             alt="${escapeHtml(product.titre)}" 
             class="modal-main-img" />

        <div class="modal-thumbs">
          ${product.images
            .map(
              (img) => `
            <img src="${CLOUDINARY_BASE + img}" 
                 alt="Aperçu" 
                 class="thumb-img" />
          `
            )
            .join("")}
        </div>
      </div>

      <div class="modal-right">
        <h2>${escapeHtml(product.titre)}</h2>
        <p class="ref">Réf : ${escapeHtml(product.reference)}</p>
        <p class="desc">${escapeHtml(product.description || "Aucune description")}</p>

        <p class="price">${product.prix.toFixed(2)} €</p>

        ${
          product.tailles
            ? `
          <label for="taille">Taille :</label>
          <select id="taille">
            ${product.tailles
              .split(/[;,/]+/)
              .map((t) => `<option value="${t.trim()}">${t.trim()}</option>`)
              .join("")}
          </select>
        `
            : ""
        }

        <button class="add-to-cart-btn">🛒 Ajouter au panier</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Fermer la modale
  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Miniatures → changent l’image principale
  modal.querySelectorAll(".thumb-img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const mainImg = modal.querySelector(".modal-main-img");
      if (mainImg) mainImg.src = thumb.src;
    });
  });

  // ✅ Bouton "Ajouter au panier"
  const addToCartBtn = modal.querySelector(".add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const selectedSize = modal.querySelector("select#taille")?.value || "";
      addToCart(product, selectedSize);
    });
  }
}


/* ---------------------------
   renderSizesHtml: génère HTML pour tailles + boutons dans la modale
   (enregistre handlers pour .add-to-cart-modal)
   --------------------------- */
function renderSizesHtml(p) {
  if (!p.tailles) return `<p><em>Aucune information de tailles</em></p>`;
  const taillesArr = p.tailles.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  const qtesArr = (p.qteTaille || "").split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  const items = taillesArr.map((t, i) => {
    const q = Number(qtesArr[i]) || 0;
    const btnLabel = q > 0 ? "Ajouter au panier" : "Commander (sur-mesure)";
    const btnClass = q > 0 ? "add-to-cart-modal available" : "add-to-cart-modal surmesure";
    return `<div class="taille-item">
      <div><strong>${escapeHtml(t)}</strong> <span class="qte">(${q})</span></div>
      <div><button class="${btnClass}" data-ref="${escapeHtml(p.reference)}" data-taille="${escapeHtml(t)}" data-titre="${escapeHtml(p.titre)}" data-prix="${escapeHtml(String(p.prix || 0))}" data-qte="${q}">${btnLabel}</button></div>
    </div>`;
  }).join("");
  // register click handlers shortly after insertion
  setTimeout(()=> {
    document.querySelectorAll(".add-to-cart-modal").forEach(btn => {
      btn.removeEventListener("click", handleAddToCartFromModal);
      btn.addEventListener("click", handleAddToCartFromModal);
    });
  }, 30);
  return `<div class="tailles-stock-modal">${items}</div>`;
}

function handleAddToCartFromModal(e) {
  const el = e.currentTarget;
  const ref = el.dataset.ref;
  const taille = el.dataset.taille;
  const titre = el.dataset.titre;
  const prix = Number((el.dataset.prix || "0").toString().replace(",", "."));
  const qte = Number(el.dataset.qte);
  if (qte > 0) {
    addToCart({ reference: ref, titre, taille, prix, qty: 1 });
    // animate cart icon
    animateCartIcon();
  } else {
    openFabricationPage(ref, titre, taille);
  }
}

/* ---------------------------
   CART (localStorage)
   - addToCart (sans notification), save / get / remove
   - animateCartIcon when item added
   --------------------------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart_v1") || "[]");
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function addToCart(item) {
  // item: {reference, titre, taille, prix, qty}
  const cart = getCart();
  const idx = cart.findIndex(ci => ci.reference === item.reference && ci.taille === item.taille);
  if (idx >= 0) cart[idx].qty += item.qty;
  else cart.push(item);
  saveCart(cart);
  // update cart count display immediately
  updateCartIconCount();
  // animate icon
  animateCartIcon();
}

function removeFromCart(reference, taille) {
  let cart = getCart();
  cart = cart.filter(i => !(i.reference === reference && i.taille === taille));
  saveCart(cart);
  updateCartIconCount();
}

function clearCart() {
  localStorage.removeItem("cart_v1");
  updateCartIconCount();
}

/* ---------------------------
   animateCartIcon: rebond + halo doré
   --------------------------- */
function animateCartIcon() {
  const icon = ensureCartIcon();
  if (!icon) return;
  icon.classList.remove("cart-animate");
  // force reflow to restart animation
  void icon.offsetWidth;
  icon.classList.add("cart-animate");
  // remove after animation (animation-duration controlled in CSS)
  setTimeout(()=> icon.classList.remove("cart-animate"), 900);
}

/* ---------------------------
   ensureCartIcon: crée l'icône panier flottante si absente
   - renvoie l'élément
   --------------------------- */
function ensureCartIcon() {
  let icon = document.getElementById("cartIcon");
  if (icon) return icon;

  // Crée l’icône panier flottante
  icon = document.createElement("div");
  icon.id = "cartIcon";
  icon.className = "cart-icon";
  icon.innerHTML = `🛒<div id="cartCount" class="cart-count">0</div>`;
  document.body.appendChild(icon);

  // Petit fallback CSS au cas où le style manque
  ensureCartIconStyles();

  // Initialise le compteur
  updateCartIconCount();

  // Synchronisation entre onglets
  window.addEventListener("storage", updateCartIconCount);

  // ✅ Nouveau comportement : ouvrir / fermer le panneau intégré
  icon.addEventListener("click", () => {
    const panel = document.getElementById("cart-panel");
    if (panel) {
      panel.classList.toggle("open"); // bascule ouverture/fermeture
    } else {
      console.warn("⚠️ Aucun panneau panier (#cart-panel) trouvé dans le DOM.");
    }
    /* ---------------------------
   ensureCartIcon: crée l'icône panier flottante si absente
   - renvoie l'élément
   --------------------------- */
function ensureCartIcon() {
  let icon = document.getElementById("cartIcon");
  if (icon) return icon;

  // Crée l’icône panier flottante
  icon = document.createElement("div");
  icon.id = "cartIcon";
  icon.className = "cart-icon";
  icon.innerHTML = `🛒<div id="cartCount" class="cart-count">0</div>`;
  document.body.appendChild(icon);

  // Petit fallback CSS au cas où le style manque
  ensureCartIconStyles();

  // Initialise le compteur
  updateCartIconCount();

  // Synchronisation entre onglets
  window.addEventListener("storage", updateCartIconCount);

 // ✅ Nouvelle version : ouvre le panneau intégré au lieu de rediriger
icon.addEventListener("click", () => {
  console.log("🛒 Icône panier cliquée !");
  const panel = document.getElementById("cart-panel");
  if (panel) {
    panel.classList.toggle("open");
    console.log("🔄 État du panneau :", panel.classList);
  } else {
    console.warn("⚠️ Aucun panneau panier (#cart-panel) trouvé dans le DOM.");
  }
});


  return icon;
}

  

  // small CSS fallback if user didn't include cart CSS (keeps safe)
  ensureCartIconStyles();

  // initialize count
  updateCartIconCount();

  // listen to storage events to keep in sync across tabs
  window.addEventListener("storage", updateCartIconCount);

  return icon;
}

/* ---------------------------
   updateCartIconCount
   --------------------------- */
function updateCartIconCount() {
  const countEl = document.getElementById("cartCount");
  const cart = getCart();
  const totalQty = cart.reduce((s, i) => s + (i.qty || 0), 0);
  if (countEl) countEl.textContent = totalQty;
}

/* ---------------------------
   openFabricationPage: redirection pré-remplie
   --------------------------- */
function openFabricationPage(ref, titre, taille) {
  const url = `fabrication.html?ref=${encodeURIComponent(ref||"")}&titre=${encodeURIComponent(titre||"")}&taille=${encodeURIComponent(taille||"")}`;
  window.location.href = url;
}

/* ---------------------------
   FILTERS: populateFilters & applyFilters (incl. evenement)
   --------------------------- */
function populateFilters() {
  fillSelect("#typeFilter", uniqueValues(allProducts.map(p => p.type)), "Type");
  fillSelect("#titleFilter", uniqueValues(allProducts.map(p => p.titre)), "Titre");
  fillSelect("#colorFilter", uniqueValues(allProducts.map(p => p.couleur)), "Couleur");
  fillSelect("#stockFilter", uniqueValues(allProducts.map(p => p.stock)), "Stock");
  fillSelect("#fabFilter", uniqueValues(allProducts.map(p => p.fabrication)), "Fabrication");

  // evenement: supporte plusieurs evenements par produit séparés par , or ;
  const allEvents = allProducts.flatMap(p => ((p.evenement || "").split(/[,;]+/).map(s=>s.trim()).filter(Boolean)));
  fillSelect("#eventFilter", uniqueValues(allEvents), "Évènement");

  // attach events
  document.querySelectorAll("#searchInput, #typeFilter, #titleFilter, #colorFilter, #stockFilter, #fabFilter, #eventFilter, #sortSelect")
    .forEach(el => el && el.addEventListener("input", applyFilters));
}

function fillSelect(selector, values, label) {
  const el = document.querySelector(selector);
  if (!el) return;
  const first = el.querySelector("option")?.outerHTML || `<option value="">— ${label} —</option>`;
  el.innerHTML = first + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function uniqueValues(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

function applyFilters() {
  const q = (document.querySelector("#searchInput")?.value || "").toLowerCase().trim();
  const type = document.querySelector("#typeFilter")?.value || "";
  const titreValue = (document.querySelector("#titleFilter")?.value || "").toLowerCase().trim();
  const couleur = document.querySelector("#colorFilter")?.value || "";
  const stock = document.querySelector("#stockFilter")?.value || "";
  const fabrication = document.querySelector("#fabFilter")?.value || "";
  const event = (document.querySelector("#eventFilter")?.value || "").toLowerCase().trim();
  const sort = document.querySelector("#sortSelect")?.value || "";

  let res = allProducts.filter(p => {
    const matchesQ = !q || [p.reference, p.titre, p.type, p.description].join(" ").toLowerCase().includes(q);
    const matchesType = !type || p.type === type;
    const matchesTitre = !titreValue || (p.titre || "").toLowerCase().includes(titreValue);
    const matchesCouleur = !couleur || p.couleur === couleur;
    const matchesStock = !stock || String(p.stock) === stock;
    const matchesFab = !fabrication || p.fabrication === fabrication;
    const matchesEvent = !event || ((p.evenement || "").toLowerCase().includes(event));
    return matchesQ && matchesType && matchesTitre && matchesCouleur && matchesStock && matchesFab && matchesEvent;
  });

  // sorting
  switch (sort) {
    case "price_asc": res.sort((a,b)=>a.prix-b.prix); break;
    case "price_desc": res.sort((a,b)=>b.prix-a.prix); break;
    case "title_asc": res.sort((a,b)=>(a.titre||"").localeCompare(b.titre||"")); break;
    case "stock_desc": res.sort((a,b)=> (Number(b.stock)||0) - (Number(a.stock)||0)); break;
  }

  filteredProducts = res;
  renderProducts(filteredProducts);
}

/* ---------------------------
   LOAD PRODUCTS: fetch CSV, parse, normalize
   --------------------------- */
async function loadProducts() {
  try {
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error("Échec du chargement CSV");
    const text = await resp.text();

    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
    if (lines.length === 0) {
      allProducts = [];
      filteredProducts = [];
      renderProducts([]);
      return;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === "")) continue;
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = cols[j] !== undefined ? cols[j] : "";
      }
      rows.push(obj);
    }

    allProducts = rows.map(r => normalizeProduct(r));
    filteredProducts = [...allProducts];

    populateFilters();
    applyFilters();

    // ensure cart icon exists and is up-to-date
    ensureCartIcon();
    updateCartIconCount();
  } catch (e) {
    console.error("loadProducts error:", e);
  }
}

/* ---------------------------
   Minimal modal CSS injection (if you didn't include full CSS)
   (This is safe fallback; if you already have style.css, it will be overridden)
   --------------------------- */
function ensureModalStyles() {
  if (document.getElementById("product-modal-styles")) return;
  const s = document.createElement("style");
  s.id = "product-modal-styles";
  s.textContent = `
    /* fallback modal styles (safe minimal) */
    #product-modal { position: fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; }
    #product-modal .modal-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.6); }
    #product-modal .modal-content { position:relative; z-index:10001; background:#fff; width:92%; max-width:980px; max-height:90vh; overflow:auto; border-radius:10px; padding:16px; box-shadow:0 12px 40px rgba(0,0,0,0.2); }
    #product-modal .modal-close { position:absolute; right:10px; top:6px; font-size:22px; background:none; border:none; cursor:pointer; }
    .modal-grid { display:flex; gap:16px; flex-wrap:wrap; }
    .modal-images { flex:1 1 320px; min-width:260px; }
    .modal-info { flex:1 1 320px; min-width:260px; }
    .image-view { position:relative; display:flex; align-items:center; justify-content:center; background:#f6f6f6; padding:8px; }
    .image-view img.main-img { max-width:100%; max-height:60vh; cursor:zoom-in; }
    .img-prev, .img-next { position:absolute; top:50%; transform:translateY(-50%); background:transparent; border:none; font-size:28px; cursor:pointer; padding:8px; }
    .img-prev { left:4px; } .img-next { right:4px; }
    .thumbs { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
    .thumbs img.mini-thumb { width:56px; height:56px; object-fit:cover; cursor:pointer; border:1px solid #ddd; padding:2px; }
    .mini-thumb.active { outline:2px solid #333; }
    .tailles-stock-modal .taille-item { display:flex; justify-content:space-between; align-items:center; margin:6px 0; }
    .promo-text { border:1px dashed #ddd; min-height:40px; padding:8px; border-radius:6px; background:#fdfdfd; }
    .product-card { display:inline-block; width:100%; max-width:260px; margin:8px; vertical-align:top; text-align:center; }
    .product-card img { width:100%; height:200px; object-fit:cover; border-radius:6px; }
    /* cart icon fallback */
    .cart-icon { position: fixed; bottom: 20px; right: 20px; background: #d4af37; color: #fff; border-radius:50%; width:58px; height:58px; display:flex; align-items:center; justify-content:center; font-size:1.5em; cursor:pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index:10000; }
    .cart-count { position:absolute; top:6px; right:8px; background:#fff; color:#d4af37; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; }
    /* animation */
    .cart-animate { animation: cartPulse 0.9s ease; }
    @keyframes cartPulse {
      0% { transform: scale(1); box-shadow: 0 4px 12px rgba(212,175,55,0.4); }
      30% { transform: scale(1.15); box-shadow: 0 8px 22px rgba(212,175,55,0.55); }
      60% { transform: scale(1.05); box-shadow: 0 6px 18px rgba(212,175,55,0.4); }
      100% { transform: scale(1); box-shadow: 0 4px 12px rgba(212,175,55,0.25); }
    }
  `;
  document.head.appendChild(s);
}

/* ---------------------------
   ensureCartIconStyles: minimal styles for cart animation hook (if not provided by CSS)
   --------------------------- */
function ensureCartIconStyles() {
  if (document.getElementById("cart-icon-styles")) return;
  const css = document.createElement("style");
  css.id = "cart-icon-styles";
  css.textContent = `
    .cart-icon { position: fixed; bottom: 20px; right: 20px; background: var(--accent-color, #d4af37); color: #fff; border-radius: 50%; width: 58px; height: 58px; display:flex; align-items:center; justify-content:center; font-size:1.5em; cursor:pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.25); z-index:9999; transition: transform 0.25s; }
    .cart-count { position: absolute; top: 6px; right: 8px; background: #fff; color: var(--accent-color, #d4af37); font-size: 0.8em; border-radius: 50%; width: 20px; height: 20px; display:flex; align-items:center; justify-content:center; font-weight: bold; }
    .cart-animate { animation: cartPulse 0.9s ease; }
    @keyframes cartPulse {
      0% { transform: scale(1); box-shadow: 0 4px 12px rgba(212,175,55,0.4); }
      30% { transform: scale(1.14); box-shadow: 0 8px 22px rgba(212,175,55,0.55); }
      60% { transform: scale(1.05); box-shadow: 0 6px 18px rgba(212,175,55,0.4); }
      100% { transform: scale(1); box-shadow: 0 4px 12px rgba(212,175,55,0.25); }
    }
  `;
  document.head.appendChild(css);
}

/* ---------------------------
   SETUP EVENTS & INIT
   --------------------------- */
function setupEvents() {
  // filters: some listeners attached in populateFilters()
  document.querySelectorAll("#searchInput, select, #sortSelect").forEach(el => {
    if (el) el.addEventListener("input", applyFilters);
  });

  // theme toggle
  const tbtn = document.getElementById("themeToggle");
  if (tbtn) tbtn.addEventListener("click", ()=>{
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode") ? "1" : "0");
  });
  if (localStorage.getItem("dark-mode")==="1") document.body.classList.add("dark-mode");

  // ===========================
// ✅ Gestion de l'icône panier (ouvre le panneau intégré)
// ===========================
function ensureCartIcon() {
  const icon = document.getElementById("cart-icon");
  if (!icon) return;

  icon.addEventListener("click", () => {
    const panel = document.getElementById("cart-panel");
    if (panel) {
      panel.classList.add("open"); // Ouvre le panneau intégré
    } else {
      console.warn("⚠️ Aucun panneau panier (#cart-panel) trouvé dans le DOM.");
    }
  });
}


  // delegate: add-to-cart buttons (legacy card-level buy buttons if present)
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;
    // legacy .buy-btn on card (if you re-enable it later)
    if (target.matches && target.matches(".buy-btn")) {
      const ref = target.dataset.ref;
      const taille = target.dataset.taille;
      const titre = target.dataset.titre;
      const prix = Number((target.dataset.prix || "0").toString().replace(",", "."));
      const qte = Number(target.dataset.qte || 0);
      if (qte > 0) addToCart({ reference: ref, titre, taille, prix, qty: 1 });
      else openFabricationPage(ref, titre, taille);
    }
  });
}
// Quand la page est chargée
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  setupEvents();
  initEventListeners(); // ⬅️ On ajoute l'initialisation Stripe ici
  ensureCartIcon(); // ⬅️ On appelle ici
});


// ===========================
// ✅ Fonction pour envoyer le panier à Stripe et rediriger vers le paiement
// ===========================
const checkoutWithStripe = async (cart) => {
  try {
    const res = await fetch("http://localhost:4242/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: cart }),
    });

    const session = await res.json();

    if (session.url) {
      window.location.href = session.url; // redirection vers Stripe
    } else {
      showTempMessage("Erreur de création de session Stripe.", 3000);
    }
  } catch (err) {
    console.error("Erreur Stripe :", err);
    showTempMessage("Une erreur est survenue, veuillez réessayer.", 3000);
  }
};

// ===========================
// ✅ Fonction d’initialisation du bouton « Payer avec Stripe »
// ===========================
const initEventListeners = () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const cart = getCart(); // Récupère le panier depuis localStorage
      if (!cart || cart.length === 0) {
        showTempMessage("Votre panier est vide 🕊️", 2000);
        return;
      }
      checkoutWithStripe(cart);
    });
  }
};
// ===========================
// ✅ Gestion du panneau panier (ouverture / fermeture)
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("cart-toggle"); // bouton pour ouvrir le panier
  const panel = document.getElementById("cart-panel");
  const closeBtn = document.getElementById("cart-close"); // bouton pour fermer le panier

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("open");
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }

  // ===========================
  // ✅ Gestion de l'icône panier (ouvre le panneau intégré)
  // ===========================
  const icon = document.getElementById("cart-icon"); // ✅ assure qu'on vise bien ton icône
  if (icon) {
    icon.addEventListener("click", () => {
      const panel = document.getElementById("cart-panel");
      if (panel) {
        panel.classList.add("open"); // Ouvre le panneau panier
      } else {
        console.warn("⚠️ Aucun panneau panier (#cart-panel) trouvé dans le DOM.");
      }
    });
  }
});
/* ---------------------------
   ✅ addToCart
   - ajoute un produit au panier (localStorage)
   - gère les doublons par référence + taille
   - met à jour l'icône panier
   --------------------------- */
function addToCart(product, selectedSize = "") {
  if (!product) return;

  // Récupère le panier existant
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Vérifie si le produit (même réf + taille) est déjà dans le panier
  const existingIndex = cart.findIndex(
    (item) =>
      item.reference === product.reference &&
      item.taille === selectedSize
  );

  if (existingIndex !== -1) {
    // Déjà présent → incrémente la quantité
    cart[existingIndex].quantite += 1;
  } else {
    // Sinon → ajoute un nouvel objet
    cart.push({
      reference: product.reference,
      titre: product.titre,
      prix: product.prix,
      image: product.image,
      taille: selectedSize,
      quantite: 1,
    });
  }

  // Sauvegarde le panier
  localStorage.setItem("cart", JSON.stringify(cart));

  // Met à jour l’icône
  updateCartIconCount();
  animateCartIcon();

  // Petit message visuel
  showTempMessage("✅ Ajouté au panier !", 1500);
}

/* ---------------------------
   ✅ Fonctions panier complémentaires
   --------------------------- */
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function updateCartIconCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantite, 0);
  const countEl = document.getElementById("cartCount");
  if (countEl) countEl.textContent = count;
}

/* End of file */

