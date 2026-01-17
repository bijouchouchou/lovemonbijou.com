// assets/js/cart/cartCounter.js
/**
 * COMPTEUR PANIER UNIQUE
 * - Un seul compteur dans tout le site
 * - Aucune manipulation directe ailleurs
 * - Piloté par EventsBus
 */

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { ensureSingleElement } from "../core/domGuards.js";

class CartCounter {
  constructor() {
    this.counterEl = null;
    this.currentCount = 0;
    this.initialized = false;
  }

  /* ===============================
     INIT
  =============================== */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.counterEl = ensureSingleElement({
      selector: ".cart-count",
      tag: "span",
      className: "cart-count",
      parent: document.body,
      createIfMissing: false // on ne crée PAS le badge ici
    });

    if (!this.counterEl) {
      console.warn("[CartCounter] Aucun élément .cart-count trouvé");
    }

    this.bindEvents();

    console.log("🧮 CartCounter initialisé");
  }

  /* ===============================
     EVENTS
  =============================== */
  bindEvents() {
    // Mise à jour globale du panier
    eventsBus.on(
      EVENTS.CART_UPDATED,
      (state) => {
        if (!state || typeof state.count !== "number") return;
        this.update(state.count);
      },
      "cartCounter"
    );

    // Cas spécifique (sécurité)
    eventsBus.on(
      EVENTS.CART_COUNT_UPDATED,
      (data) => {
        if (!data || typeof data.count !== "number") return;
        this.update(data.count);
      },
      "cartCounter"
    );

    // Panier vidé
    eventsBus.on(
      EVENTS.CART_CLEARED,
      () => {
        this.update(0);
      },
      "cartCounter"
    );
  }

  /* ===============================
     UPDATE UI
  =============================== */
  update(count) {
    if (count === this.currentCount) return;

    this.currentCount = count;

    if (!this.counterEl) return;

    if (count > 0) {
      this.counterEl.textContent = count;
      this.counterEl.style.display = "inline-block";
    } else {
      this.counterEl.textContent = "";
      this.counterEl.style.display = "none";
    }

    console.log(`[CartCounter] compteur mis à jour → ${count}`);
  }
}

/* ===============================
   SINGLETON
=============================== */
export const cartCounter = new CartCounter();

/* ===============================
   AUTO INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  cartCounter.init();
});
