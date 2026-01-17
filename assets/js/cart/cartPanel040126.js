// ============================================
// cartPanel.js — EV1 FINAL
// UI PANIER (pilotée UNIQUEMENT par EventsBus)
// ============================================

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { normalizeCartItem } from "../core/utils.js";

console.log("🛒 cartPanel.js EV1 chargé");

/* ======================================================
   STATE UI (LOCAL, IMMUTABLE)
====================================================== */
let panel = null;
let lastState = null;

/* ======================================================
   CREATE PANEL (ONCE)
====================================================== */
function createPanel() {
  if (panel) return;

  panel = document.createElement("div");
  panel.className = "cart-panel";
  panel.innerHTML = `
    <div class="cart-panel-header">
      <strong>Mon panier</strong>
      <button class="cart-close-btn" aria-label="Fermer">×</button>
    </div>

    <div class="cart-items"></div>

    <div class="cart-footer">
      <div class="cart-summary">
        <div><span>Sous-total</span><span id="cart-subtotal">0,00 €</span></div>
        <div><span>Livraison</span><span id="cart-shipping">—</span></div>
        <div id="cart-discount-line" style="display:none;">
          <span>Remise</span><span id="cart-discount"></span>
        </div>
        <div class="total">
          <strong>Total</strong><strong id="cart-total">0,00 €</strong>
        </div>
      </div>

      <div class="cart-email">
        <label>Email de confirmation</label>
        <input id="cart-email-input" type="email" placeholder="votre@email.com"/>
        <div id="cart-email-error" class="cart-email-error"></div>
      </div>

      <button id="cart-continue">Continuer mes achats</button>
      <button id="cart-checkout" style="display:none;">Commander</button>
    </div>
  `;

  document.body.appendChild(panel);

  bindUIEvents();
}

/* ======================================================
   UI EVENTS (LOCAL UNIQUEMENT)
====================================================== */
function bindUIEvents() {
  panel.querySelector(".cart-close-btn").addEventListener("click", closeCart);
  panel.querySelector("#cart-continue").addEventListener("click", closeCart);

  panel.addEventListener("click", (e) => {
    e.stopPropagation();

    const qtyBtn = e.target.closest("[data-action]");
    const removeBtn = e.target.closest(".cart-remove");

    if (qtyBtn) {
      const { key, action } = qtyBtn.dataset;
      const item = lastState?.items.find(i => i.key === key);
      if (!item) return;

      const nextQty =
        action === "increase" ? item.quantity + 1 :
        action === "decrease" ? item.quantity - 1 :
        item.quantity;

      if (nextQty >= 1) {
        eventsBus.emit(
          EVENTS.CART_QUANTITY_CHANGE,
          { key, quantity: nextQty },
          "cartPanel"
        );
      }
    }

    if (removeBtn) {
      const { key } = removeBtn.dataset;
      if (!key) return;

      eventsBus.emit(
        EVENTS.CART_ITEM_REMOVE,
        { key },
        "cartPanel"
      );
    }
  });

  panel.querySelector("#cart-email-input").addEventListener("blur", (e) => {
    const email = e.target.value.trim();
    if (!email) return;

    eventsBus.emit(
      EVENTS.CUSTOMER_EMAIL_UPDATE,
      { email },
      "cartPanel"
    );
  });

  panel.querySelector("#cart-checkout").addEventListener("click", () => {
    if (!lastState?.hasValidEmail) {
      showEmailError("Email requis pour commander");
      return;
    }

    eventsBus.emit(
      EVENTS.CHECKOUT_STARTED,
      lastState,
      "cartPanel"
    );

    closeCart();
  });
}

/* ======================================================
   OPEN / CLOSE
====================================================== */
function openCart() {
  createPanel();
  panel.classList.add("open");
  document.body.style.overflow = "hidden";

  if (lastState) render(lastState);
}

function closeCart() {
  if (!panel) return;
  panel.classList.remove("open");
  document.body.style.overflow = "";
}

/* ======================================================
   RENDER
====================================================== */
function render(state) {
  if (!panel || !state) return;
  lastState = state;

  const itemsEl = panel.querySelector(".cart-items");
  const subtotalEl = panel.querySelector("#cart-subtotal");
  const shippingEl = panel.querySelector("#cart-shipping");
  const discountLine = panel.querySelector("#cart-discount-line");
  const discountEl = panel.querySelector("#cart-discount");
  const totalEl = panel.querySelector("#cart-total");
  const checkoutBtn = panel.querySelector("#cart-checkout");

  if (!state.items.length) {
    itemsEl.innerHTML = `<p class="empty">Votre panier est vide</p>`;
    checkoutBtn.style.display = "none";
    return;
  }

  const items = state.items.map(normalizeCartItem);

  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item">
      <strong>${item.title}</strong>
      <div class="qty">
        <button data-action="decrease" data-key="${item.key}">−</button>
        <span>${item.quantity}</span>
        <button data-action="increase" data-key="${item.key}">+</button>
      </div>
      <span>${item.lineTotal.toFixed(2)} €</span>
      <button class="cart-remove" data-key="${item.key}">×</button>
    </div>
  `).join("");

  subtotalEl.textContent = `${state.subtotal.toFixed(2)} €`;
  shippingEl.textContent =
    state.shipping > 0 ? `${state.shipping.toFixed(2)} €` : "Offerte";

  if (state.discount > 0) {
    discountLine.style.display = "flex";
    discountEl.textContent = `− ${state.discount.toFixed(2)} €`;
  } else {
    discountLine.style.display = "none";
  }

  totalEl.textContent = `${state.total.toFixed(2)} €`;

  checkoutBtn.style.display =
    state.hasValidEmail && state.count > 0 ? "block" : "none";
}

/* ======================================================
   EMAIL ERROR
====================================================== */
function showEmailError(message) {
  const el = panel.querySelector("#cart-email-error");
  if (!el) return;
  el.textContent = message;
}

/* ======================================================
   EVENTS BUS → UI
====================================================== */
eventsBus.on(
  EVENTS.CART_UPDATED,
  (state) => {
    if (panel?.classList.contains("open")) {
      render(state);
    } else {
      lastState = state;
    }
  },
  "cartPanel"
);

/* ======================================================
   EXPORTS
====================================================== */
export { openCart, closeCart };
