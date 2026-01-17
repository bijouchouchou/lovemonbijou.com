// ============================================
// DISPLAY.JS — EV1 PROPRE (SANS COMPTEUR)
// ============================================

import CONFIG from "../core/config.js";
import { eventsBus, EVENTS } from "../core/eventsBus.js";

window.__productStore = new Map();

/* ============================
   UTILS
============================ */
function escapeHtml(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatPrice(price) {
  const num = Number(price) || 0;
  return num.toFixed(2).replace(".", ",") + " €";
}

/* ============================
   CARD
============================ */
function createProductCard(product) {
  const ref = product.reference || product.id;
  if (!ref) return document.createElement("div");

  window.__productStore.set(ref, product);

  const imageUrl = product.image || CONFIG.getCloudinaryUrl(ref);
  const titrage = product.carat ? `Or ${product.carat}k` : "Or";
  const typeBijou = product.type || "";
  const pierre = product.stone_type || "Sans pierre";

  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.ref = ref;

  card.innerHTML = `
    <div class="product-img-wrapper">
      <img src="${imageUrl}"
           class="product-img"
           alt="${escapeHtml(titrage)}"
           onerror="this.src='${CONFIG.placeholder}'">
    </div>

    <div class="product-info">
      <h3 class="product-title">${escapeHtml(titrage)}</h3>

      <div class="product-subtitle">${escapeHtml(typeBijou)}</div>
      <div class="product-stone">${escapeHtml(pierre)}</div>

      <div class="product-price">
        ${formatPrice(product.price)}
      </div>

      <div class="product-actions">
        <button class="view-btn" data-ref="${ref}">
          Détails
        </button>
        <button class="add-btn" data-ref="${ref}">
          Ajouter
        </button>
      </div>
    </div>
  `;

  return card;
}

/* ============================
   DISPLAY
============================ */
export function displayProducts(products, container) {
  if (!container) {
    console.error("❌ Conteneur produits manquant");
    return;
  }

  container.innerHTML = "";
  container.className = "products-grid mobile-grid";

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="no-products-message mobile-empty">
        <p>Aucun bijou disponible</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach(p => fragment.appendChild(createProductCard(p)));
  container.appendChild(fragment);

  console.log(`📦 ${products.length} produits affichés`);
}

/* ============================
   EVENTS UI → EVENTSBUS
============================ */
document.addEventListener("click", (e) => {
  const viewBtn = e.target.closest(".view-btn");
  const addBtn = e.target.closest(".add-btn");

  // ---- DÉTAILS PRODUIT
  if (viewBtn) {
    const ref = viewBtn.dataset.ref;
    const product = window.__productStore.get(ref);

    if (product) {
      eventsBus.emit(
        EVENTS.PRODUCT_VIEWED,
        { product },
        "display.js"
      );
    }
    return;
  }

  // ---- AJOUT PANIER
  if (addBtn) {
    const ref = addBtn.dataset.ref;
    const product = window.__productStore.get(ref);

    if (product) {
      eventsBus.emit(
        EVENTS.PRODUCT_ADD_TO_CART,
        { product, quantity: 1 },
        "display.js"
      );
    }
  }
});

console.log("✅ display.js chargé (sans compteur)");
