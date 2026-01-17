// ============================================
// MAIN.JS — EV1 STABLE (PROPRE)
// ============================================

import { applyFilters, initFiltersUI } from "./filters/filters.js";
import { PromoSlider } from "./core/promoSlider.js";
import { openCart } from "./cart/cartPanel.js";   // UI: ouverture explicite

console.log("Start Love Mon Bijou");

// ============================================
// GESTION DU PANIER (UI)
// ============================================
function initCartUI() {
  const cartIcon = document.querySelector(".cart-icon");
  if (!cartIcon) return;

  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCart();
  });

  // Indicateur visuel (optionnel)
  document.addEventListener("cartUpdated", (e) => {
    const count = e.detail?.count || 0;
    cartIcon.classList.toggle("has-items", count > 0);
  });
}

async function initApp() {
  console.log("DOM ready - Init");

  const container = document.getElementById("products-container");
  const counterEl = document.getElementById("products-count");

  if (!container) {
    console.error("products-container not found");
    return;
  }

  // Loading state
  container.innerHTML = `
    <div style="text-align:center; padding:40px; color:#666;">
      Chargement des bijoux…
    </div>
  `;

  try {
    // -------------------------------------
    // PROMO SLIDER (safe, indépendant)
    // -------------------------------------
    new PromoSlider();

    // -------------------------------------
    // CART - CORE (source de vérité)
    // -------------------------------------
    const cartCore = await import("./cart/cartCore.js");
    cartCore.initCart?.();

    // -------------------------------------
    // CART - UI (ouverture sur intention)
    // -------------------------------------
    initCartUI();

    // -------------------------------------
    // CHECKOUT (lazy)
    // -------------------------------------
    await import("./cart/cartCheckout.js");

    // -------------------------------------
    // CSV
    // -------------------------------------
    const csvModule = await import("./products/csvLoader.js");
    const loadFn = csvModule.loadProductsCSV || csvModule.default;

    if (typeof loadFn !== "function") {
      throw new Error("CSV loader not found");
    }

    const products = await loadFn();
    window.ALL_PRODUCTS = products;

    console.log("Products loaded:", products.length);

    // -------------------------------------
    // DISPLAY
    // -------------------------------------
    const displayModule = await import("./products/display.js");
    const displayProducts = displayModule.displayProducts;

    if (typeof displayProducts !== "function") {
      throw new Error("displayProducts not found");
    }

    displayProducts(products, container);

    if (counterEl) {
      counterEl.textContent = `${products.length} bijoux trouvés`;
    }

    // -------------------------------------
    // FILTERS
    // -------------------------------------
    initFiltersUI(products);

    document.addEventListener("filters:change", () => {
      const filtered = applyFilters(products);
      displayProducts(filtered, container);

      if (counterEl) {
        counterEl.textContent = `${filtered.length} bijoux trouvés`;
      }
    });

    // -------------------------------------
    // MODALS
    // -------------------------------------
    const modalsModule = await import("./modals/modals.js");
    modalsModule.initModals?.(products);

    console.log("App ready ✅");
  } catch (err) {
    console.error("CRITICAL ERROR:", err);

    container.innerHTML = `
      <div style="color:red; padding:20px; text-align:center;">
        <h3>Erreur de chargement</h3>
        <pre>${err?.message || err}</pre>
        <button onclick="location.reload()">Recharger</button>
      </div>
    `;
  }
}

// DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}