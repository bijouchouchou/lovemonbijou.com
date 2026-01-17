// ============================================
// cartPanel.js — UI PANIER STABLE
// Love Mon Bijou
// ============================================

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { normalizeCartItem, formatPrice, escapeHtml } from "../core/utils.js";

/* ======================================================
   CONFIG
====================================================== */
const CONFIG = {
  animationDuration: 250,
  maxQuantity: 5,
};
/* ======================================================
   CREATE PANEL (ONCE)
====================================================== */
// 1️⃣ HTML DU PANIER (DOIT EXISTER)
function generatePanelHTML() {
  return `
    <div class="cart-panel-overlay" data-action="close"></div>
    <div class="cart-panel-container">
      <header class="cart-panel-header">
        <h2>Mon panier</h2>
        <button data-action="close">×</button>
      </header>
      <div id="cart-items-container"></div>
    </div>
  `;
}

// 2️⃣ CRÉATION DU PANIER
function createPanel() {
  if (state.panel) return;

  const panel = document.createElement("div");
  panel.className = "cart-panel";
  panel.innerHTML = generatePanelHTML(); // ✅ maintenant définie

  document.body.appendChild(panel);
  state.panel = panel;

  cacheDOMElements();
  bindUIEvents();
}


/* ======================================================
   STATE (UI UNIQUEMENT)
====================================================== */
class CartPanelState {
  panel = null;
  cartState = null;
  isAnimating = false;
  updateQueue = [];
  previousFocus = null;

  setState(cartState) {
    this.cartState = cartState;
  }

  enqueue(fn) {
    this.updateQueue.push(fn);
    if (!this.isAnimating) this.process();
  }

  process() {
    if (this.isAnimating || !this.cartState) return;
    while (this.updateQueue.length) {
      try {
        this.updateQueue.shift()();
      } catch (e) {
        console.error("❌ CartPanel update error", e);
      }
    }
  }

  resetUIState() {
    this.isAnimating = false;
    this.updateQueue = [];
    document.body.style.cursor = "";
    document.body.style.pointerEvents = "";
  }
}

const state = new CartPanelState();

/* ======================================================
   DOM CACHE
====================================================== */
const DOM = {};

function cacheDOM() {
  DOM.headerCount = document.querySelector("#cart-header-count");
  DOM.itemsCount = document.querySelector("#cart-items-count");
  DOM.itemsContainer = document.querySelector("#cart-items-container");
  DOM.emptyState = document.querySelector("#empty-cart-state");
  DOM.itemsHeader = document.querySelector(".cart-items-header");

  DOM.subtotal = document.querySelector("#cart-subtotal");
  DOM.tax = document.querySelector("#cart-tax");
  DOM.total = document.querySelector("#cart-total");

  DOM.clearBtn = document.querySelector('[data-action="clear-cart"]');
}

/* ======================================================
   PANEL OPEN / CLOSE
====================================================== */
function openCart() {
  // 🔒 GARDE CRITIQUE
  if (!state.panel) {
    createPanel(); // ⬅️ OBLIGATOIRE
  }

  if (!state.panel) {
    console.error("❌ Impossible d’ouvrir le panier : panel non créé");
    return;
  }

  state.previousFocus = document.activeElement;

  state.panel.classList.add("open");
  document.body.style.overflow = "hidden";
  document.body.classList.add("cart-open");

  if (state.cartState) {
    render(state.cartState);
  }

  console.log("✅ Panier ouvert");
}


function closeCart() {
  if (!state.panel) return;

  state.panel.classList.remove("open");
  document.body.style.overflow = "";
  state.resetUIState();

  setTimeout(() => state.previousFocus?.focus(), 50);
}

/* ======================================================
   RENDER
====================================================== */
function render(cartState) {
  if (!state.panel || !cartState) return;

  state.setState(cartState);

  state.enqueue(() => {
    updateCounters(cartState);
    toggleEmpty(cartState);
    renderItems(cartState);
    updateTotals(cartState);
  });

  animate();
}

function updateCounters(cartState) {
  if (DOM.headerCount) DOM.headerCount.textContent = cartState.count;
  if (DOM.itemsCount) DOM.itemsCount.textContent = cartState.count;
}

function toggleEmpty(cartState) {
  const empty = cartState.count === 0;
  if (DOM.emptyState) DOM.emptyState.style.display = empty ? "block" : "none";
  if (DOM.itemsHeader) DOM.itemsHeader.style.display = empty ? "none" : "flex";
  if (DOM.itemsContainer) DOM.itemsContainer.style.display = empty ? "none" : "block";
}

function renderItems(cartState) {
  if (!DOM.itemsContainer) return;

  DOM.itemsContainer.innerHTML = "";
  const frag = document.createDocumentFragment();

  cartState.items.forEach((item, index) => {
    const n = normalizeCartItem(item);
    frag.appendChild(createItem(n, index));
  });

  DOM.itemsContainer.appendChild(frag);
}

function createItem(item, index) {
  const el = document.createElement("article");
  el.className = "cart-item";
  el.dataset.key = item.key;

  el.innerHTML = `
    <div class="cart-item-body">
      <h4 class="cart-item-title">${escapeHtml(item.headerTitle || `Produit ${index + 1}`)}</h4>
      <div class="cart-item-sub">${escapeHtml(item.subtitle || "")}</div>

      <div class="cart-item-controls">
        <button data-action="decrease" data-key="${item.key}">−</button>
        <span>${item.quantity}</span>
        <button data-action="increase" data-key="${item.key}">+</button>
        <button data-action="remove" data-key="${item.key}">×</button>
      </div>

      <div class="cart-item-price">
        ${formatPrice(item.lineTotal)}
      </div>
    </div>
  `;

  return el;
}

function updateTotals(cartState) {
  if (DOM.subtotal) DOM.subtotal.textContent = formatPrice(cartState.subtotal);
  if (DOM.tax) DOM.tax.textContent = formatPrice(cartState.tax || 0);
  if (DOM.total) DOM.total.textContent = formatPrice(cartState.total);
}

/* ======================================================
   ANIMATION (SÛRE)
====================================================== */
function animate() {
  if (state.isAnimating) return;

  state.isAnimating = true;
  state.panel.classList.add("updating");

  setTimeout(() => {
    state.panel.classList.remove("updating");
    state.isAnimating = false;
    state.process();
  }, CONFIG.animationDuration);
}

/* ======================================================
   EVENTS UI
====================================================== */
function bindUIEvents() {
  if (!state.panel) return;

  // DÉLÉGATION → jamais null
  state.panel.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    const key = e.target.dataset.key;
    if (!action) return;

    if (action === "clear-cart") {
      if (!state.cartState?.count) return;
      if (confirm("Vider le panier ?")) {
        eventsBus.emit(EVENTS.CART_CLEAR_REQUEST, {}, "cartPanel");
      }
      return;
    }

    if (!key) return;

    if (action === "remove") {
      eventsBus.emit(EVENTS.CART_ITEM_REMOVED, { key }, "cartPanel");
    }

    if (action === "increase") {
      eventsBus.emit(EVENTS.CART_QUANTITY_CHANGE, { key, delta: +1 }, "cartPanel");
    }

    if (action === "decrease") {
      eventsBus.emit(EVENTS.CART_QUANTITY_CHANGE, { key, delta: -1 }, "cartPanel");
    }
  });
}


/* ======================================================
   EVENTS BUS
====================================================== */
eventsBus.on(
  EVENTS.CART_UPDATED,
  (cartState) => {
    if (state.panel?.classList.contains("open")) render(cartState);
    else state.setState(cartState);
  },
  "cartPanel"
);

eventsBus.on(
  EVENTS.CART_CLEARED,
  () => {
    render({ items: [], count: 0, subtotal: 0, tax: 0, total: 0 });
  },
  "cartPanel"
);

/* ======================================================
   EXPORTS
====================================================== */
export { openCart, closeCart };
