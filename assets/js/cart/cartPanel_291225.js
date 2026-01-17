// assets/js/cart/cartPanel.js
console.log("🟢 cartPanel.js chargé");
import { normalizeCartItem } from "../core/utils.js";

/* ======================================================
   STATE
====================================================== */
let panel = null;
let lastState = null;

/* ======================================================
   CREATE PANEL
====================================================== */
function createPanel() {
  panel = document.createElement("div");
  panel.className = "cart-panel";
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 360px;
    max-width: 90%;
    height: 100vh;
    background: #fff;
    box-shadow: -4px 0 16px rgba(0,0,0,.2);
    transform: translateX(100%);
    transition: transform .3s ease;
    z-index: 10000;
    display: flex;
    flex-direction: column;
  `;

  panel.innerHTML = `
    <div style="padding:16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
      <strong>🛒 Mon panier</strong>
      <button id="cart-close" style="border:none;background:none;font-size:20px;cursor:pointer;">×</button>
    </div>

    <div id="cart-items" style="flex:1; overflow-y:auto; padding:16px;"></div>

    <div id="cart-footer" style="padding:16px; border-top:1px solid #eee;">
      <div id="cart-total" style="font-weight:700;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  panel.querySelector("#cart-close").addEventListener("click", closeCart);
}

/* ======================================================
   OPEN / CLOSE
====================================================== */
function openCart() {
  if (!panel) createPanel();

  panel.style.transform = "translateX(0)";

  // 🔥 rendu immédiat si état déjà connu
  if (lastState) {
    render(lastState);
  }
}

function closeCart() {
  if (panel) {
    panel.style.transform = "translateX(100%)";
  }
}

/* ======================================================
   RENDER
====================================================== */
function render(state) {
  if (!panel || !state) return;

  const itemsEl = panel.querySelector("#cart-items");
  const totalEl = panel.querySelector("#cart-total");

  if (!state.items || state.items.length === 0) {
    itemsEl.innerHTML = `<p style="color:#777">Votre panier est vide</p>`;
    totalEl.textContent = "";
    return;
  }

  // 🔥 NORMALISATION ICI (POINT CLÉ)
  const items = state.items
    .map(normalizeCartItem)
    .filter(Boolean);

  itemsEl.innerHTML = items.map(item => `
    <div style="margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
      <div style="font-weight:600">${item.title}</div>

      <div style="font-size:0.85em; color:#666; margin-top:2px;">
        Taille : <strong>${item.size}</strong>
        ${item.colorLabel ? `• ${item.colorLabel}` : ""}
        ${item.metalLabel ? `• ${item.metalLabel}` : ""}
      </div>

      <div style="font-size:0.9em; color:#555; margin-top:4px;">
        ${item.quantity} × ${item.unitPrice} €
        = <strong>${item.lineTotal.toFixed(2)} €</strong>
      </div>
    </div>
  `).join("");

  totalEl.textContent = `Total : ${state.total.toFixed(2)} €`;
}

/* ======================================================
   EVENTS
====================================================== */

// 🔗 écoute du moteur panier
document.addEventListener("cartUpdated", e => {
  console.log("🧺 cartUpdated reçu", e.detail);
  lastState = e.detail;
  render(e.detail);
});

// 🔗 clic sur l’icône panier
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.querySelector(".cart-icon");
  console.log("🛒 cart-icon trouvée ?", icon);

  if (icon) {
    icon.addEventListener("click", openCart);
  }
});
