// assets/js/filters/productsCounter.js
/**
 * COMPTEUR PRODUITS UNIQUE
 * - Séparé du panier
 * - Piloté par EventsBus
 * - Aucun effet sur les modales
 */

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { ensureSingleElement } from "../core/domGuards.js";

class ProductsCounter {
  constructor() {
    this.el = null;
    this.total = 0;
    this.filtered = 0;
    this.initialized = false;
  }

  /* ===============================
     INIT
  =============================== */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.el = ensureSingleElement({
      selector: "#products-counter-global",
      tag: "div",
      id: "products-counter-global",
      className: "products-counter",
      parent: document.body,
      createIfMissing: true
    });

    this.applyBaseStyle();
    this.bindEvents();

    console.log("📦 ProductsCounter initialisé");
  }

  /* ===============================
     STYLE (SAFE)
  =============================== */
  applyBaseStyle() {
    Object.assign(this.el.style, {
      position: "fixed",
      bottom: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      padding: "8px 14px",
      borderRadius: "18px",
      fontSize: "13px",
      fontWeight: "500",
      zIndex: "9000",            // inférieur aux modales
      pointerEvents: "none",     // NE BLOQUE RIEN
      display: "none",
      transition: "opacity 0.2s ease"
    });
  }

  /* ===============================
     EVENTS
  =============================== */
  bindEvents() {
    // Produits chargés
    eventsBus.on(
      EVENTS.PRODUCTS_LOADED,
      (data) => {
        if (!data?.total) return;
        this.total = data.total;
        this.filtered = data.total;
        this.render();
      },
      "productsCounter"
    );

    // Produits filtrés
    eventsBus.on(
      EVENTS.PRODUCTS_FILTERED,
      (data) => {
        if (!data) return;
        this.filtered = data.filtered ?? this.filtered;
        this.total = data.total ?? this.total;
        this.render();
      },
      "productsCounter"
    );

    // Reset filtres
    eventsBus.on(
      EVENTS.FILTERS_RESET,
      () => {
        this.filtered = this.total;
        this.render();
      },
      "productsCounter"
    );
  }

  /* ===============================
     RENDER
  =============================== */
  render() {
    if (!this.el) return;

    if (!this.total || this.total === 0) {
      this.el.style.display = "none";
      return;
    }

    if (this.filtered === this.total) {
      this.el.textContent = `${this.total} bijoux`;
    } else {
      this.el.textContent = `${this.filtered} sur ${this.total} bijoux`;
    }

    this.el.style.display = "block";
    this.el.style.opacity = "1";

    console.log(
      `[ProductsCounter] ${this.filtered}/${this.total}`
    );
  }

  /* ===============================
     CLEANUP (sécurité)
  =============================== */
  hide() {
    if (this.el) this.el.style.display = "none";
  }
}

/* ===============================
   SINGLETON
=============================== */
export const productsCounter = new ProductsCounter();

/* ===============================
   AUTO INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  productsCounter.init();
});
