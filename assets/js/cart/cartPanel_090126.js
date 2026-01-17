// ============================================
// cartPanel.js — VERSION COMPLÈTE AVEC PAIEMENTS
// Tous les boutons : Stripe, PayPal, Alma + Continuer
// ============================================

import { eventsBus, EVENTS } from "../core/eventsBus.js";
import { normalizeCartItem } from "../core/utils.js";

console.log("🛒 cartPanel.js complet avec paiements chargé");

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
    <button class="close-cart">×</button>
    
    <div class="cart-items"></div>
    
    <div class="cart-summary">
      <div class="cart-subtotal">
        <span>Sous-total</span>
        <span class="value" id="cart-subtotal">0,00 €</span>
      </div>
      <div class="cart-shipping">
        <span>Livraison</span>
        <span class="value" id="cart-shipping">—</span>
      </div>
      <div id="cart-discount-line" style="display:none;">
        <span>Remise</span>
        <span class="value" id="cart-discount">0,00 €</span>
      </div>
      <div class="cart-total">
        <strong>Total</strong>
        <strong id="cart-total">0,00 €</strong>
      </div>
    </div>
    
    <!-- SECTION EMAIL -->
    <div class="cart-email">
      <label for="cart-email-input">Email de confirmation</label>
      <input 
        id="cart-email-input" 
        type="email" 
        placeholder="votre@email.com"
      />
      <div id="cart-email-error" class="cart-email-error"></div>
    </div>
    
    <!-- BOUTON CONTINUER MES ACHATS -->
    <button id="cart-continue" class="cart-continue-btn">
      Continuer mes achats
    </button>
    
    <!-- BOUTONS DE PAIEMENT -->
    <div class="checkout-buttons">
      <button id="cart-checkout-stripe" class="checkout-btn stripe" style="display:none;">
        Payer avec Stripe
      </button>
      <button id="cart-checkout-paypal" class="checkout-btn paypal" style="display:none;">
        Payer avec PayPal
      </button>
      <button id="cart-checkout-alma" class="checkout-btn alma" style="display:none;">
        Payer avec Alma (3x)
      </button>
    </div>
  `;

  document.body.appendChild(panel);
  bindUIEvents();
}

/* ======================================================
   UI EVENTS
====================================================== */
function bindUIEvents() {
  // Fermeture
  panel.querySelector(".close-cart").addEventListener("click", closeCart);
  panel.querySelector("#cart-continue").addEventListener("click", closeCart);

  // Gestion panier
  panel.addEventListener("click", (e) => {
    e.stopPropagation();

    // Boutons quantité
    const qtyBtn = e.target.closest(".qty-btn");
    if (qtyBtn) {
      const { key, action } = qtyBtn.dataset;
      const item = lastState?.items.find(i => i.key === key);
      if (!item) return;

      const nextQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
      
      if (nextQty >= 1) {
        eventsBus.emit(
          EVENTS.CART_QUANTITY_CHANGE,
          { key, quantity: nextQty },
          "cartPanel"
        );
      }
      return;
    }

    // Bouton suppression
    const removeBtn = e.target.closest(".cart-remove");
    if (removeBtn) {
      const { key } = removeBtn.dataset;
      if (!key) return;

      eventsBus.emit(
        EVENTS.CART_ITEM_REMOVE,
        { key },
        "cartPanel"
      );
      return;
    }
  });

  // Gestion email
  const emailInput = panel.querySelector("#cart-email-input");
  emailInput.addEventListener("blur", (e) => {
    const email = e.target.value.trim();
    if (!email) return;

    eventsBus.emit(
      EVENTS.CUSTOMER_EMAIL_UPDATE,
      { email },
      "cartPanel"
    );
  });

  emailInput.addEventListener("input", () => {
    hideEmailError();
  });

  // Boutons de paiement
  panel.querySelector("#cart-checkout-stripe").addEventListener("click", () => {
    proceedToCheckout("stripe");
  });

  panel.querySelector("#cart-checkout-paypal").addEventListener("click", () => {
    proceedToCheckout("paypal");
  });

  panel.querySelector("#cart-checkout-alma").addEventListener("click", () => {
    proceedToCheckout("alma");
  });
}

/* ======================================================
   VALIDATION ET PAIEMENT
====================================================== */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showEmailError(message) {
  const errorEl = panel.querySelector("#cart-email-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

function hideEmailError() {
  const errorEl = panel.querySelector("#cart-email-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
}

function proceedToCheckout(paymentMethod) {
  const emailInput = panel.querySelector("#cart-email-input");
  const email = emailInput.value.trim();
  
  // Validation email
  if (!email) {
    showEmailError("Veuillez saisir votre email");
    emailInput.focus();
    return;
  }
  
  if (!validateEmail(email)) {
    showEmailError("Email invalide");
    emailInput.focus();
    return;
  }

  // Si email non encore validé dans le state
  if (!lastState?.hasValidEmail) {
    eventsBus.emit(
      EVENTS.CUSTOMER_EMAIL_UPDATE,
      { email },
      "cartPanel"
    );
    
    // Petit délai pour la mise à jour
    setTimeout(() => {
      if (lastState?.hasValidEmail) {
        finalizeCheckout(paymentMethod);
      }
    }, 300);
    return;
  }

  finalizeCheckout(paymentMethod);
}

function finalizeCheckout(paymentMethod) {
  console.log(`Paiement via ${paymentMethod} pour:`, lastState?.customerEmail);
  
  // Émet l'événement avec la méthode de paiement
  eventsBus.emit(
    EVENTS.CHECKOUT_STARTED,
    {
      ...lastState,
      paymentMethod: paymentMethod
    },
    "cartPanel"
  );
  
  // Logique spécifique par méthode
  switch(paymentMethod) {
    case 'stripe':
      // Redirection vers Stripe
      window.location.href = `/checkout/stripe?amount=${lastState.total}`;
      break;
      
    case 'paypal':
      // Redirection vers PayPal
      window.location.href = `/checkout/paypal?amount=${lastState.total}`;
      break;
      
    case 'alma':
      // Redirection vers Alma
      window.location.href = `/checkout/alma?amount=${lastState.total}`;
      break;
      
    default:
      closeCart();
  }
}

/* ======================================================
   OPEN / CLOSE
====================================================== */
function openCart() {
  createPanel();
  panel.classList.add("open");
  
  // Pré-remplir email si disponible
  if (lastState?.customerEmail) {
    const emailInput = panel.querySelector("#cart-email-input");
    emailInput.value = lastState.customerEmail;
  }
  
  if (lastState) render(lastState);
}

function closeCart() {
  if (!panel) return;
  panel.classList.remove("open");
}

/* ======================================================
   RENDER - TOUS LES CHAMPS
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
  const stripeBtn = panel.querySelector("#cart-checkout-stripe");
  const paypalBtn = panel.querySelector("#cart-checkout-paypal");
  const almaBtn = panel.querySelector("#cart-checkout-alma");
  const emailInput = panel.querySelector("#cart-email-input");

  // Panier vide
  if (!state.items.length) {
    itemsEl.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#777;">
        <p style="margin-bottom:10px;">Votre panier est vide</p>
        <p style="font-size:0.9em;">Ajoutez des produits pour commencer</p>
      </div>
    `;
    stripeBtn.style.display = "none";
    paypalBtn.style.display = "none";
    almaBtn.style.display = "none";
    return;
  }

  // Items du panier
  const items = state.items.map(normalizeCartItem);

  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-header">
        <strong>${item.title}</strong>
        <button class="cart-remove" data-key="${item.key}">×</button>
      </div>
      
      <!-- DÉTAILS PRODUIT -->
      <div class="cart-item-meta">
        ${item.size && item.size !== "unique" 
          ? `<span>Taille : <strong>${item.size}</strong></span><br>` 
          : ""}
        ${item.colorLabel ? `<span>Couleur : ${item.colorLabel}</span><br>` : ""}
        ${item.metalLabel ? `<span>Métal : ${item.metalLabel}</span><br>` : ""}
        <span>Quantité : ${item.quantity} × ${item.unitPrice.toFixed(2)} €</span>
      </div>
      
      <!-- CONTROLES QUANTITÉ -->
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <button class="qty-btn" data-action="decrease" data-key="${item.key}">−</button>
        <span style="min-width:30px;text-align:center;">${item.quantity}</span>
        <button class="qty-btn" data-action="increase" data-key="${item.key}">+</button>
        <span style="margin-left:auto;font-weight:600;">
          ${item.lineTotal.toFixed(2)} €
        </span>
      </div>
    </div>
  `).join("");

  // Mise à jour des totaux
  subtotalEl.textContent = `${state.subtotal.toFixed(2)} €`;
  
  // Livraison
  if (state.shipping === 0) {
    shippingEl.textContent = "Offerte";
    shippingEl.style.color = "#2e7d32";
  } else if (state.shipping > 0) {
    shippingEl.textContent = `${state.shipping.toFixed(2)} €`;
    shippingEl.style.color = "";
  } else {
    shippingEl.textContent = "—";
  }

  // Remise/promo
  if (state.discount > 0) {
    discountLine.style.display = "flex";
    discountEl.textContent = `− ${state.discount.toFixed(2)} €`;
    discountEl.style.color = "#c62828";
  } else {
    discountLine.style.display = "none";
  }

  // Total
  totalEl.textContent = `${state.total.toFixed(2)} €`;

  // Email
  if (state.customerEmail && emailInput.value === "") {
    emailInput.value = state.customerEmail;
  }

  // Affichage boutons paiement
  const showPaymentButtons = state.hasValidEmail && state.count > 0;
  
  stripeBtn.style.display = showPaymentButtons ? "block" : "none";
  paypalBtn.style.display = showPaymentButtons ? "block" : "none";
  almaBtn.style.display = showPaymentButtons ? "block" : "none";
  
  if (showPaymentButtons) {
    hideEmailError();
  }
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