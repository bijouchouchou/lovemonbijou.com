// ============================================
// MAIN.JS — EV1 STABLE / EVENT-DRIVEN
// Orchestration globale uniquement
// ============================================


import { eventsBus, EVENTS } from "./core/eventsBus.js";
import { initFiltersUI, applyFilters } from "./filters/filters.js";
import { openCart } from "./cart/cartPanel.js";
import { PromoSlider } from "./core/promoSlider.js";

console.log("🚀 Love Mon Bijou — démarrage application");

// ============================================
// PANIER — UI UNIQUEMENT (PAS DE MÉTIER)
// ============================================
function initCartUI() {
  const cartIcon = document.querySelector(".cart-icon");
  if (!cartIcon || cartIcon.dataset.bound) return;

  cartIcon.dataset.bound = "true";

  // Ouverture volontaire du panier
  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCart();
  });

  // Badge panier (source unique : EventsBus)
  eventsBus.on(
    EVENTS.CART_COUNT_UPDATED,
    ({ count }) => {
      cartIcon.classList.toggle("has-items", count > 0);

      const badge = cartIcon.querySelector(".cart-count");
      if (badge) {
        badge.textContent = count > 0 ? count : "";
        badge.style.display = count > 0 ? "inline-block" : "none";
      }
    },
    "main.js"
  );
}

// ============================================
// INITIALISATION APPLICATION
// ============================================
async function initApp() {
  const container = document.getElementById("products-container");

  if (!container) {
    console.error("❌ products-container introuvable");
    return;
  }

  // État de chargement
  container.innerHTML = `
    <div style="text-align:center; padding:40px; color:#666;">
      Chargement des bijoux…
    </div>
  `;

  try {
    // -------------------------------------
    // PROMO SLIDER (indépendant)
    // -------------------------------------
    new PromoSlider();

    // -------------------------------------
    // CART CORE (source de vérité)
    // -------------------------------------
    const { initCart } = await import("./cart/cartCore.js");
    initCart();

    // -------------------------------------
    // CART UI
    // -------------------------------------
    initCartUI();

    // -------------------------------------
    // CHECKOUT (lazy load)
    // -------------------------------------
    await import("./cart/cartCheckout.js");

    // -------------------------------------
    // PRODUITS — CSV
    // -------------------------------------
    const csvModule = await import("./products/csvLoader.js");
    const loadProducts =
      csvModule.loadProductsCSV || csvModule.default;

    if (typeof loadProducts !== "function") {
      throw new Error("CSV loader introuvable");
    }

    const products = await loadProducts();
    window.ALL_PRODUCTS = products; // debug uniquement

    console.log(`📦 ${products.length} produits chargés`);

    // -------------------------------------
    // DISPLAY PRODUITS
    // -------------------------------------
    const displayModule = await import("./products/display.js");
    const displayProducts = displayModule.displayProducts;

    if (typeof displayProducts !== "function") {
      throw new Error("displayProducts introuvable");
    }

    displayProducts(products, container);

    // -------------------------------------
    // FILTRES
    // -------------------------------------
    initFiltersUI(products);

    document.addEventListener("filters:change", () => {
      const filtered = applyFilters(products);
      displayProducts(filtered, container);

      eventsBus.emit(
  EVENTS.FILTERS_CHANGED,
  {
    filteredCount: filtered.length,
    totalCount: products.length
  },
  "main.js"
);


    // -------------------------------------
    // MODALES (produit / fabrication)
    // -------------------------------------
    const modalsModule = await import("./modals/modals.js");
    modalsModule.initModals?.(products);

    console.log("✅ Application prête et stable");

  } catch (error) {
    console.error("🔥 ERREUR CRITIQUE :", error);

    container.innerHTML = `
      <div style="color:red; padding:30px; text-align:center;">
        <h3>Erreur de chargement</h3>
        <p>${error.message || error}</p>
        <button onclick="location.reload()">Recharger</button>
      </div>
    `;
  }
}

// ============================================
// DOM READY
// ============================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
