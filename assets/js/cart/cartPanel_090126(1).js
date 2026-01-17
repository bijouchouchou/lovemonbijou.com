// ============================================
// cartPanel.js - VERSION SIMPLE ET COMPLÈTE
// Logique seulement, CSS minimal
// ============================================

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { normalizeCartItem } from "../core/utils.js";

console.log("🛒 cartPanel.js simple chargé");

let panel = null;
let lastState = null;

function createPanel() {
  if (panel) return;

  panel = document.createElement("div");
  panel.className = "cart-panel";
  panel.innerHTML = `
    <button class="close-cart">×</button>
    
    <div class="cart-items"></div>
    
    <div class="cart-summary">
      <div><span>Sous-total</span><span id="cart-subtotal">0,00 €</span></div>
      <div><span>Livraison</span><span id="cart-shipping">—</span></div>
      <div id="cart-discount-line" style="display:none;">
        <span>Remise</span><span id="cart-discount"></span>
      </div>
      <div class="total"><strong>Total</strong><strong id="cart-total">0,00 €</strong></div>
    </div>
    
    <button id="cart-continue">Continuer mes achats</button>
    
    <div class="checkout-buttons">
      <button id="cart-checkout-stripe" class="checkout-btn">Payer par carte</button>
      <button id="cart-checkout-paypal" class="checkout-btn">Payer avec PayPal</button>
      <button id="cart-checkout-alma" class="checkout-btn">Payer en 3x avec Alma</button>
    </div>
  `;

  document.body.appendChild(panel);
  bindUIEvents();
}

function bindUIEvents() {
  // Fermeture
  panel.querySelector(".close-cart").addEventListener("click", closeCart);
  panel.querySelector("#cart-continue").addEventListener("click", closeCart);

  // Gestion panier
  panel.addEventListener("click", (e) => {
    // Quantité
    const qtyBtn = e.target.closest(".qty-btn");
    if (qtyBtn && lastState) {
      const { key, action } = qtyBtn.dataset;
      const item = lastState.items.find(i => i.key === key);
      if (item) {
        const nextQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
        if (nextQty >= 1) {
          eventsBus.emit(EVENTS.CART_QUANTITY_CHANGE, { key, quantity: nextQty }, "cartPanel");
        }
      }
      return;
    }

    // Suppression
    const removeBtn = e.target.closest(".cart-remove");
    if (removeBtn && lastState) {
      const { key } = removeBtn.dataset;
      if (key) eventsBus.emit(EVENTS.CART_ITEM_REMOVE, { key }, "cartPanel");
      return;
    }
  });

  // Paiements
  panel.querySelector("#cart-checkout-stripe").addEventListener("click", () => {
    if (!lastState?.count) return;
    startPayment("stripe");
  });

  panel.querySelector("#cart-checkout-paypal").addEventListener("click", () => {
    if (!lastState?.count) return;
    startPayment("paypal");
  });

  panel.querySelector("#cart-checkout-alma").addEventListener("click", () => {
    if (!lastState?.count) return;
    if (lastState.total < 100) {
      alert("Paiement 3x disponible à partir de 100€");
      return;
    }
    startPayment("alma");
  });
}

function startPayment(method) {
  console.log(`💳 Début paiement ${method}`);
  
  // Préparer commande
  const orderData = {
    items: lastState.items,
    total: lastState.total,
    subtotal: lastState.subtotal,
    shipping: lastState.shipping,
    discount: lastState.discount,
    orderId: `CMD-${Date.now()}`,
    paymentMethod: method
  };
  
  // Sauvegarder pour après-paiement
  localStorage.setItem('pending_order', JSON.stringify(orderData));
  
  // Simuler redirection (à remplacer par vos URLs)
  console.log("Redirection vers:", method);
  // window.location.href = `/checkout/${method}?amount=${lastState.total}&order=${orderData.orderId}`;
  
  // Pour test: message
  alert(`[TEST] Redirection vers ${method}\nEmail demandé après paiement`);
  closeCart();
}

function openCart() {
  createPanel();
  panel.classList.add("open");
  if (lastState) render(lastState);
}

function closeCart() {
  if (panel) panel.classList.remove("open");
}

function render(state) {
  if (!panel || !state) return;
  lastState = state;

  const itemsEl = panel.querySelector(".cart-items");
  const subtotalEl = panel.querySelector("#cart-subtotal");
  const shippingEl = panel.querySelector("#cart-shipping");
  const discountLine = panel.querySelector("#cart-discount-line");
  const discountEl = panel.querySelector("#cart-discount");
  const totalEl = panel.querySelector("#cart-total");
  const stripeBtn = panel.querySelector("#cart-checkout-stripe");
  const paypalBtn = panel.querySelector("#cart-checkout-paypal");
  const almaBtn = panel.querySelector("#cart-checkout-alma");

  // Panier vide
  if (!state.items.length) {
    itemsEl.innerHTML = `<p class="empty">Votre panier est vide</p>`;
    [stripeBtn, paypalBtn, almaBtn].forEach(b => b && (b.style.display = "none"));
    return;
  }

  // Items du panier
  const items = state.items.map(normalizeCartItem);
  
  itemsEl.innerHTML = items.map(item => {
    // Construire les détails avec ESPACES
    let detailsHTML = '';
    
    if (item.size && item.size !== "unique") {
      detailsHTML += `<span>Taille : ${item.size}</span> `;
    }
    if (item.colorLabel) {
      detailsHTML += `<span>• ${item.colorLabel}</span> `;
    }
    if (item.metalLabel) {
      detailsHTML += `<span>• ${item.metalLabel}</span>`;
    }
    
    return `
      <div class="cart-item">
        ${item.image ? `
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.title}" 
                 style="width:60px;height:60px;object-fit:cover;border-radius:6px;">
          </div>
        ` : ''}
        
        <div class="cart-item-content">
          <div class="cart-item-header">
            <strong>${item.title}</strong>
            <button class="cart-remove" data-key="${item.key}">×</button>
          </div>
          
          ${detailsHTML ? `<div class="cart-item-details">${detailsHTML}</div>` : ''}
          
          <div class="cart-item-price">
            Quantité : ${item.quantity} × ${item.unitPrice.toFixed(2)} € = 
            <strong>${item.lineTotal.toFixed(2)} €</strong>
          </div>
          
          <div class="cart-item-actions">
            <button class="qty-btn" data-action="decrease" data-key="${item.key}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-action="increase" data-key="${item.key}">+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Totaux (avec espaces corrigés dans votre CSS existant)
  subtotalEl.textContent = `${state.subtotal.toFixed(2)} €`;
  shippingEl.textContent = state.shipping === 0 ? "Offerte" : `${state.shipping.toFixed(2)} €`;
  
  if (state.discount > 0) {
    discountLine.style.display = "flex";
    discountEl.textContent = `− ${state.discount.toFixed(2)} €`;
  } else {
    discountLine.style.display = "none";
  }

  totalEl.textContent = `${state.total.toFixed(2)} €`;

  // Boutons paiement
  const hasItems = state.count > 0;
  
  if (stripeBtn) stripeBtn.style.display = hasItems ? "block" : "none";
  if (paypalBtn) paypalBtn.style.display = hasItems ? "block" : "none";
  if (almaBtn) {
    const showAlma = hasItems && state.total >= 100;
    almaBtn.style.display = showAlma ? "block" : "none";
  }
}
// Écouter mises à jour panier
eventsBus.on(EVENTS.CART_UPDATED, (state) => {
  if (panel?.classList.contains("open")) {
    render(state);
  } else {
    lastState = state;
  }
}, "cartPanel");

export { openCart, closeCart };