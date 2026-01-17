// assets/js/cart/cartPanel.js
import { eventsBus, EVENTS } from "../core/eventsBus.js";

/* ======================================================
   STATE (UI uniquement)
====================================================== */
const state = {
  panel: null,
  cartState: null,
  previousFocus: null,
};

/* ======================================================
   DOM CACHE
====================================================== */
let DOM = {};

function cacheDOM() {
  DOM = {
    items: state.panel.querySelector(".cart-items"),
    empty: state.panel.querySelector(".cart-empty"),
    total: state.panel.querySelector(".cart-total-amount"),
    checkout: state.panel.querySelector(".cart-checkout"),
    close: state.panel.querySelector(".cart-close"),
  };
}

/* ======================================================
   PANEL CREATION (UNE SEULE FOIS)
====================================================== */
function createPanel() {
  if (state.panel) return;

  const panel = document.createElement("div");
  panel.className = "cart-panel";
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: -420px;
    width: 400px;
    height: 100vh;
    background: #fff;
    box-shadow: -2px 0 20px rgba(0,0,0,.15);
    transition: right .3s ease;
    z-index: 1000;
    overflow-y: auto;
  `;

  panel.innerHTML = `
    <header style="display:flex;justify-content:space-between;align-items:center;padding:16px">
      <strong>Mon panier</strong>
      <button class="cart-close" aria-label="Fermer">×</button>
    </header>

    <div class="cart-empty" style="padding:32px;text-align:center;color:#666">
      Votre panier est vide
    </div>

    <div class="cart-items" style="padding:0 16px"></div>

    <footer style="padding:16px;border-top:1px solid #eee">
      <div style="margin-bottom:12px;font-weight:bold">
        Total : <span class="cart-total-amount">0,00 €</span>
      </div>
      <button class="cart-checkout" disabled style="width:100%;padding:12px">
        Commander
      </button>
    </footer>
  `;

  document.body.appendChild(panel);
  state.panel = panel;

  cacheDOM();

  DOM.close.addEventListener("click", closeCart);
  DOM.checkout.addEventListener("click", handleCheckout);

  console.log("✅ cartPanel créé");
}

/* ======================================================
   RENDER
====================================================== */
function render(cartState) {
  if (!state.panel) return;

  state.cartState = cartState;

  if (!cartState || cartState.items.length === 0) {
    DOM.empty.style.display = "block";
    DOM.items.innerHTML = "";
    DOM.total.textContent = "0,00 €";
    DOM.checkout.disabled = true;
    return;
  }

  DOM.empty.style.display = "none";
  DOM.items.innerHTML = cartState.items
    .map(
      (i) => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
        <div>
          <div>${i.name}</div>
          <small>${i.quantity} × ${i.price.toFixed(2)} €</small>
        </div>
        <strong>${(i.price * i.quantity).toFixed(2)} €</strong>
      </div>
    `
    )
    .join("");

  DOM.total.textContent = `${cartState.total.toFixed(2)} €`;
  DOM.checkout.disabled = false;
}

/* ======================================================
   OPEN / CLOSE
====================================================== */
function openCart() {
  if (!state.panel) createPanel();

  state.previousFocus = document.activeElement;

  // ouverture visuelle unique via CSS
  state.panel.classList.add("open");

  // demander l’état à la source
  eventsBus.emit(EVENTS.CART_GET_STATE, null, "cartPanel");

  console.log("🛒 Panier ouvert");
}


function closeCart() {
  if (!state.panel) return;

  state.panel.classList.remove("open");

  // restauration du focus
  setTimeout(() => {
    state.previousFocus?.focus?.();
    state.previousFocus = null;
  }, 300);

  console.log("🔒 Panier fermé");
}


/* ======================================================
   CHECKOUT (RECONNECTÉ)
====================================================== */
function handleCheckout() {
  if (!state.cartState || state.cartState.items.length === 0) return;

  eventsBus.emit(
    EVENTS.CART_CHECKOUT_REQUEST,
    { cart: state.cartState },
    "cartPanel"
  );

  closeCart();
}

/* ======================================================
   EVENTS BUS
====================================================== */
eventsBus.on(
  EVENTS.CART_UPDATED,
  (cartState) => {
    if (state.panel && state.panel.style.right === "0px") {
      render(cartState);
    }
  },
  "cartPanel"
);

eventsBus.on(
  EVENTS.CART_STATE_RESPONSE,
  (cartState) => {
    render(cartState);
  },
  "cartPanel"
);

eventsBus.on(
  EVENTS.CART_CLEARED,
  () => {
    render({ items: [], total: 0 });
  },
  "cartPanel"
);

/* ======================================================
   EXPORT
====================================================== */
export { openCart, closeCart };
