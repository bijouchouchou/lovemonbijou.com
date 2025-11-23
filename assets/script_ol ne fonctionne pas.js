/* ======================================================
   script.js - Love Mon Bijou (version propre)
   - Parse CSV depuis /data/products.csv (parser robuste)
   - Normalise les champs (insensible à la casse)
   - Affiche grille produits (vignette / ref / prix)
   - Modale produit : description sous la photo, carats, poids or, tailles
   - Panier localStorage + panneau latéral
   - Placeholder Stripe / PayPal / Alma
   ====================================================== */

/* =======================
   CONFIG
   ======================= */
const CSV_URL = "/data/products.csv"; // chemin exact vers ton CSV
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
const CART_KEY = "cart_v1";

let allProducts = [];
let filteredProducts = [];

/* =======================
   UTILITAIRES
   ======================= */

// échappement HTML
const escapeHtml = (s) => {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// parse d'une ligne CSV (gère champs entre guillemets et doubles quotes)
const parseCSVLine = (line) => {
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
};

/* =======================
   NORMALISATION DES LIGNES EN OBJET PRODUIT
   ======================= */

const parseProductRow = (rawObj) => {
  // rawObj: object header -> value where header are from CSV line (case-sensitive as in CSV)
  // on crée un lookup tolerant insensible à la casse
  const lowered = {};
  Object.keys(rawObj).forEach(k => lowered[k.toLowerCase().trim()] = rawObj[k]);

  const get = (keys, fallback = "") => {
    if (!Array.isArray(keys)) keys = [keys];
    for (const k of keys) {
      const kk = k.toLowerCase().trim();
      if (lowered[kk] !== undefined && lowered[kk] !== null && String(lowered[kk]).trim() !== "") {
        return String(lowered[kk]).trim();
      }
    }
    return fallback;
  };

  const rawPriceStr = get(["price €","price_euros","price","prix","price€"], "0");
  const cleanPrice = rawPriceStr.replace(/[^\d,.\-]/g, "").replace(",", ".");
  const prix = parseFloat(cleanPrice) || 0;

  const imageField = get(["image","images","photo"], "");
  const images = imageField ? imageField.split(/[,;|]+/).map(s=>s.trim()).filter(Boolean) : [];

  const product = {
    reference: get(["reference","ref","REFERENCE"]) || "",
    type: get(["type de bijoux","type","category"]) || "",
    titre: get(["titre","title"]) || "",             // contient le carat si c'est numérique (ex: "9" ou "18")
    or: get(["poids or","poids_or","poids"]) || "",   // poids en g
    description: get(["description","desc"]) || "",
    image: imageField || "",
    images: images.length ? images : [],             // tableau d'images
    couleur: get(["couleur","color"]) || "",
    pierres: get(["type de pierres","pierres"]) || "",
    poidsPierre: get(["poids pierre","poids_pierre"]) || "",
    tailles: get(["tailles disponibles","tailles_disponibles","tailles","size","sizes"]) || "",
    qteTaille: get(["quantité par taille","quantite_par_taille","quantite par taille","quantitÃ©_ par_ taille"]) || "",
    prix: prix,
    stock: get(["stock","stock global"]) || "",
    fabrication: get(["fabrication_possible","fabrication possible","fabrication"]) || ""
  };

  // fallback image via Cloudinary si aucune image donnée
  if (!product.image && product.reference) {
    product.image = `${CLOUDINARY_BASE}${encodeURIComponent(product.reference)}.png`;
    if (product.images.length === 0) product.images = [product.image];
  } else if (product.image && product.images.length === 0) {
    product.images = [product.image];
  }

  return product;
};

/* =======================
   CHARGER ET PARSER LE CSV
   ======================= */

const loadProducts = async () => {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("Impossible de charger le CSV (" + res.status + ")");
    const text = await res.text();
    // normaliser les sauts de ligne et supprimer BOM éventuel
    const clean = text.replace(/\uFEFF/g, "").trim();
    if (!clean) { allProducts = []; filteredProducts = []; displayProductGrid(filteredProducts); return; }
    const lines = clean.split(/\r?\n/);
    if (lines.length < 2) { allProducts = []; filteredProducts = []; displayProductGrid(filteredProducts); return; }

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).filter(l => l.trim() !== "");

    const objs = rows.map(line => {
      const cols = parseCSVLine(line);
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = cols[i] !== undefined ? cols[i] : "";
      }
      return obj;
    });

    allProducts = objs.map(parseProductRow);
    filteredProducts = allProducts.slice();
    // afficher
    displayProductGrid(filteredProducts);
    // (optionnel) populate filters
    try { populateFilters(); } catch(e){ /* silent */ }
  } catch (err) {
    console.error("Erreur loadProducts:", err);
    const container = document.querySelector("#product-list");
    if (container) container.innerHTML = `<p>Erreur: ${escapeHtml(err.message)}</p>`;
  }
};

/* =======================
   AFFICHAGE GRILLE PRODUITS
   ======================= */

const displayProductGrid = (products) => {
  const container = document.querySelector("#product-list");
  if (!container) return;
  if (!products || products.length === 0) {
    container.innerHTML = "<p>Aucun bijou trouvé 🕊️</p>";
    return;
  }

  container.innerHTML = products.map(p => {
    const thumb = (p.images && p.images[0]) ? p.images[0] : p.image || `${CLOUDINARY_BASE}${encodeURIComponent(p.reference)}.png`;
    const priceLabel = p.prix && p.prix > 0 ? p.prix.toFixed(2) + " €" : "—";
    const imagesJson = escapeHtml(JSON.stringify(p.images || [thumb]));
    // titre affiché : si titre est numérique -> on montre type + titre carats, sinon titre textuel
    const titreRaw = (p.titre || "").toString().trim();
    const isTitreNumeric = /^\d+(\.\d+)?$/.test(titreRaw);
    const labelTitle = isTitreNumeric ? `${p.type || "Bijou"} ${titreRaw} carats` : (p.titre || p.type || "Bijou");

    return `
      <article class="product-card" data-ref="${escapeHtml(p.reference)}">
        <div class="thumb-wrap" role="button" tabindex="0" data-ref="${escapeHtml(p.reference)}" data-images='${imagesJson}'>
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(labelTitle)}" loading="lazy" />
        </div>
        <div class="meta">
          <p class="title">${escapeHtml(labelTitle)}</p>
          <p class="ref"><strong>Ref :</strong> ${escapeHtml(p.reference || "—")}</p>
          <p class="price">${priceLabel}</p>
        </div>
      </article>
    `;
  }).join("");

  // handlers
  container.querySelectorAll(".thumb-wrap").forEach(el => {
    el.addEventListener("click", () => {
      const ref = el.dataset.ref;
      const images = JSON.parse(el.dataset.images || "[]");
      showProductDetailsModal(ref, images);
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault(); el.click();
      }
    });
  });
};

/* =======================
   TAILLES / QTES (HTML)
   ======================= */

const buildSizeAvailabilityHtml = (product) => {
  if (!product.tailles) return "<p>-</p>";
  const taillesArr = product.tailles.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  const qtesArr = (product.qteTaille || "").split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  if (taillesArr.length === 0) return "<p>-</p>";
  return `<div class="tailles-stock">` + taillesArr.map((t,i) => {
    const q = Number(qtesArr[i]) || 0;
    const qLabel = `Stock : ${q}`;
    const btnLabel = q > 0 ? "Ajouter au panier" : "Commander (sur-mesure)";
    const btnClass = q > 0 ? "buy-btn available" : "buy-btn surmesure";
    return `<div class="taille-item">
              <div><strong>${escapeHtml(t)}</strong> <span class="qte"> — ${escapeHtml(qLabel)}</span></div>
              <div>
                <button class="${btnClass}"
                  data-ref="${escapeHtml(product.reference)}"
                  data-taille="${escapeHtml(t)}"
                  data-titre="${escapeHtml(product.titre)}"
                  data-prix="${escapeHtml(product.prix || 0)}"
                  data-qte="${q}"
                >${btnLabel}</button>
              </div>
            </div>`;
  }).join("") + `</div>`;
};

/* =======================
   MODALE PRODUIT (DETAILS)
   ======================= */

const showProductDetailsModal = (ref, images = []) => {
  const product = allProducts.find(p => p.reference === ref);
  if (!product) return;

  // logique carat / titre
  const titreRaw = (product.titre || "").toString().trim();
  const isTitreNumeric = /^\d+(\.\d+)?$/.test(titreRaw);
  const caratFromTitre = isTitreNumeric ? titreRaw : "";
  const modalTitle = !isTitreNumeric ? (product.titre || product.type || product.reference || "Bijou") : (product.type || product.reference || "Bijou");
  const poidsOr = (product.or || "").toString().trim();

  const imgs = (images.length ? images : (product.images && product.images.length ? product.images : [product.image]));

  // construire la modale
  const modal = document.createElement("div");
  modal.id = "product-modal";
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Détails produit">
      <button class="modal-close" aria-label="Fermer">✕</button>
      <div class="modal-grid">
        <div class="modal-images">
          <div class="image-view">
            <button class="img-prev" aria-label="Image précédente">&#10094;</button>
            <img class="main-img" src="${escapeHtml(imgs[0] || product.image)}" alt="${escapeHtml(modalTitle)}" />
            <button class="img-next" aria-label="Image suivante">&#10095;</button>
          </div>
          <div class="thumbs">
            ${imgs.map((img, idx) => `<img class="mini-thumb ${idx===0? "active":""}" data-idx="${idx}" src="${escapeHtml(img)}" loading="lazy" />`).join("")}
          </div>

          ${product.description ? `
            <div class="desc-area below-img">
              <h4>Détails</h4>
              <p class="desc">${escapeHtml(product.description)}</p>
            </div>` : ""}

        </div>

        <div class="modal-info">
          <h2>${escapeHtml(modalTitle)}${caratFromTitre ? ` — ${escapeHtml(caratFromTitre)} carats` : ""}</h2>
          ${poidsOr ? `<p><strong>Poids or :</strong> ${escapeHtml(poidsOr)} g</p>` : ""}
          ${product.couleur ? `<p><strong>Couleur :</strong> ${escapeHtml(product.couleur)}</p>` : ""}
          <p class="ref"><strong>Ref :</strong> ${escapeHtml(product.reference)}</p>
          <p class="price">${product.prix && product.prix > 0 ? product.prix.toFixed(2) + " €" : "—"}</p>

          <div class="sizes-area">
            <h4>Tailles et disponibilités</h4>
            ${buildSizeAvailabilityHtml(product)}
          </div>

          ${product.fabrication && product.fabrication.toString().toLowerCase() === "oui" ? `
            <div style="margin-top:12px;">
              <button class="fab-btn-modal" data-ref="${escapeHtml(product.reference)}" data-titre="${escapeHtml(product.titre)}">Fabrication</button>
            </div>` : ""}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // fermeture
  modal.querySelector(".modal-backdrop").addEventListener("click", () => modal.remove());
  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());

  // gestion galerie
  const mainImg = modal.querySelector(".main-img");
  const thumbs = Array.from(modal.querySelectorAll(".mini-thumb"));
  let currentIndex = 0;
  const updateImage = (idx) => {
    if (!imgs.length) return;
    currentIndex = idx;
    mainImg.src = imgs[idx];
    thumbs.forEach(t => t.classList.toggle("active", Number(t.dataset.idx) === idx));
  };
  thumbs.forEach(t => t.addEventListener("click", () => updateImage(Number(t.dataset.idx))));
  const prevBtn = modal.querySelector(".img-prev");
  const nextBtn = modal.querySelector(".img-next");
  if (prevBtn) prevBtn.addEventListener("click", () => updateImage((currentIndex - 1 + imgs.length) % imgs.length));
  if (nextBtn) nextBtn.addEventListener("click", () => updateImage((currentIndex + 1) % imgs.length));

  // boutons tailles inside modal (add to cart / fabrication)
  modal.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const qte = Number(el.dataset.qte || 0);
      const ref = el.dataset.ref;
      const taille = el.dataset.taille;
      const titre = el.dataset.titre;
      const prix = Number((el.dataset.prix || "0").toString().replace(",", "."));
      if (qte > 0) {
        addToCart({ reference: ref, titre, taille, prix, qty: 1 });
        showTempMessage("✅ Article ajouté au panier", 1800);
      } else {
        openFabricationPage(ref, titre, taille);
      }
    });
  });

  // bouton fabrication modal
  modal.querySelectorAll(".fab-btn-modal").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      openFabricationPage(el.dataset.ref, el.dataset.titre || "");
    });
  });
};

/* =======================
   PANIER (localStorage)
   ======================= */

const getCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch(e){ return []; }
};

const saveCart = (cart) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  catch(e){ console.error("Erreur saveCart", e); }
};

const addToCart = (item) => {
  const cart = getCart();
  const idx = cart.findIndex(ci => ci.reference === item.reference && ci.taille === item.taille);
  if (idx >= 0) cart[idx].qty += item.qty;
  else cart.push(item);
  saveCart(cart);
  displayCartContent();
};

/* =======================
   AFFICHAGE PANIER
   ======================= */

const displayCartContent = () => {
  const cartPanel = document.getElementById("cart-panel");
  const cartItems = document.getElementById("cart-items");
  if (!cartPanel || !cartItems) return;
  const cart = getCart();
  if (cart.length === 0) { cartItems.innerHTML = "<p>Votre panier est vide 🕊️</p>"; return; }
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-line">
      <div><strong>${escapeHtml(item.titre)}</strong> <small>(Ref: ${escapeHtml(item.reference)})</small></div>
      <div>Taille : ${escapeHtml(item.taille || "-")}</div>
      <div>Quantité : ${item.qty}</div>
      <div>Prix : ${(item.prix * item.qty).toFixed(2)} €</div>
    </div>
  `).join("") + `<div style="padding:12px;"><strong>Total : ${cart.reduce((s,i)=>s + i.prix * i.qty, 0).toFixed(2)} €</strong></div>`;
};

/* =======================
   ACTION FABRICATION
   ======================= */

const openFabricationPage = (ref, titre, taille) => {
  const url = `fabrication.html?ref=${encodeURIComponent(ref||"")}&titre=${encodeURIComponent(titre||"")}&taille=${encodeURIComponent(taille||"")}`;
  window.location.href = url;
};

/* =======================
   PLACEHOLDERS PAIEMENT (Stripe / PayPal / Alma)
   ======================= */

const createStripeCheckoutSession = async (cart) => {
  console.warn("Stripe placeholder: implémenter endpoint /create-checkout-session côté serveur.");
  return Promise.reject(new Error("Stripe non configuré"));
};

const startPayPalCheckout = async (cart) => {
  console.warn("PayPal placeholder: implémenter.");
  return Promise.reject(new Error("PayPal non configuré"));
};

const startAlmaCheckout = async (cart) => {
  console.warn("Alma placeholder: implémenter.");
  return Promise.reject(new Error("Alma non configuré"));
};

/* =======================
   PETITS UTILITAIRES UI
   ======================= */

const showTempMessage = (text, ms = 2000) => {
  const id = "temp-msg";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    Object.assign(el.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      background: "#fffbe6",
      border: "1px solid #f0d8a6",
      padding: "8px 12px",
      borderRadius: "10px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      zIndex: 99999
    });
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.opacity = "1";
  setTimeout(()=>{ el.style.opacity = "0"; setTimeout(()=> el.remove(), 400); }, ms);
};

/* =======================
   FILTRES (SQUELETTE) - pour futur champ evenement
   ======================= */

const populateFilters = () => {
  // Ex : remplir selects si tu les ajoutes (type, couleur, evenement...)
  // actuellement squeletté.
};

const uniqueValues = (arr) => [...new Set(arr.filter(Boolean))].sort();

/* =======================
   ÉCOUTEURS & INITIALISATION
   ======================= */

const initEventListeners = () => {
  // panier
  const cartToggle = document.getElementById("cart-toggle");
  const cartPanel = document.getElementById("cart-panel");
  const cartClose = document.getElementById("cart-close");
  if (cartToggle && cartPanel) {
    cartToggle.addEventListener("click", () => {
      cartPanel.classList.add("open");
      displayCartContent();
    });
  }
  if (cartClose && cartPanel) cartClose.addEventListener("click", () => cartPanel.classList.remove("open"));

  // checkout
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const cart = getCart();
      if (!cart || cart.length === 0) { showTempMessage("Votre panier est vide 🕊️", 1800); return; }
      try {
        const sessionUrl = await createStripeCheckoutSession(cart);
        if (sessionUrl) window.location.href = sessionUrl;
      } catch (err) {
        showTempMessage("Erreur paiement : " + err.message, 3000);
        console.error(err);
      }
    });
  }

  // buy buttons globaux (si présents)
  document.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const q = Number(el.dataset.qte || 0);
      const ref = el.dataset.ref;
      const taille = el.dataset.taille;
      const titre = el.dataset.titre;
      const prix = Number((el.dataset.prix || "0").toString().replace(",", "."));
      if (q > 0) addToCart({ reference: ref, titre, taille, prix, qty: 1 });
      else openFabricationPage(ref, titre, taille);
    });
  });

  // theme toggle (si tu ajoutes #themeToggle)
  const tbtn = document.getElementById("themeToggle");
  if (tbtn) {
    tbtn.addEventListener("click", ()=>{
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode") ? "1" : "0");
    });
    if (localStorage.getItem("dark-mode")==="1") document.body.classList.add("dark-mode");
  }
};

/* =======================
   AUTO INIT
   ======================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  initEventListeners();
});
