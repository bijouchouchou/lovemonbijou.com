// assets/js/cart/cartCore.js
console.log("🔥 cartCore.js EXECUTÉ");

import { theme } from "../core/theme.js";

/* ======================================================
   DISCOUNT VALIDATOR
====================================================== */
class DiscountValidator {
  constructor() {
    this.validCodes = {
      LOVE10: { type: "percent", value: 10, minOrder: 50 },
      BIJOU20: { type: "percent", value: 20, minOrder: 100 },
      LIVRAISON: { type: "amount", value: 5, minOrder: null },
    };
  }

  validateCode(code, subtotal) {
    const normalized = (code || "").trim().toUpperCase();
    const promo = this.validCodes[normalized];

    if (!promo) {
      return { valid: false, message: "Code promo invalide" };
    }

    if (promo.minOrder && subtotal < promo.minOrder) {
      return {
        valid: false,
        message: `Minimum ${promo.minOrder} € requis`,
      };
    }

    const discountAmount =
      promo.type === "percent"
        ? subtotal * (promo.value / 100)
        : promo.value;

    return {
      valid: true,
      discountAmount: Number(discountAmount.toFixed(2)),
      message: `Code ${normalized} appliqué`,
    };
  }
}

/* ======================================================
   CART CORE (SOURCE DE VÉRITÉ COMPLÈTE)
====================================================== */
export class CartCore {
  constructor(initialState = null) {
    const stored = initialState || this.loadFromLocalStorage();

    this.items = stored.items || [];
    this.discountCode = stored.discountCode || "";
    this.discountAmount = stored.discountAmount || 0;
    this.customerEmail = stored.customerEmail || "";
    this.createdAt = stored.createdAt || new Date().toISOString();
    this.lastUpdated = stored.lastUpdated || new Date().toISOString();

    this.validator = new DiscountValidator();

    console.log("[Cart] CartCore prêt - Email:", this.customerEmail || "non défini");
  }

  /* ============================
     VALIDATION D'EMAIL
  ============================ */

  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (!trimmed) return false;
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(trimmed);
  }

  /* ============================
     GESTION DU CLIENT
  ============================ */

  setCustomerEmail(email) {
    const trimmed = (email || "").trim();
    
    // Si vide, on autorise (pour clear)
    if (trimmed === "") {
      this.customerEmail = "";
      this.commit();
      return { success: true, message: "Email effacé" };
    }
    
    // Validation
    if (!CartCore.isValidEmail(trimmed)) {
      return { 
        success: false, 
        message: "Format d'email invalide" 
      };
    }
    
    this.customerEmail = trimmed;
    this.commit();
    
    return { 
      success: true, 
      message: "Email enregistré",
      email: trimmed
    };
  }

  getCustomerEmail() {
    return this.customerEmail || "";
  }

  hasValidEmail() {
    return CartCore.isValidEmail(this.customerEmail);
  }

  clearCustomerData() {
    this.customerEmail = "";
    this.commit();
    return { success: true, message: "Données client effacées" };
  }

  /* ============================
     ITEMS (IMMUTABLE)
  ============================ */

  addItem(product, quantity = 1) {
    if (!product || !product.id) return;

    const size = product.size || "unique";
    const key = `${product.id}__${size}`;
    const qty = Math.max(1, Number(quantity) || 1);

    const index = this.items.findIndex(i => i.key === key);

    if (index !== -1) {
      this.items = this.items.map((item, i) =>
        i === index
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    } else {
      this.items = [
        ...this.items,
        {
          key,
          id: String(product.id),
          name: product.titleLabel || product.name || product.reference || "",
          price: Number(product.price) || 0,
          image: product.image || "",
          quantity: qty,

          // données métier
          size,
          color: product.colorLabel || "",
          metal: product.metalLabel || "",
          stone: product.stone_type || "",
          fabrication: !!product.fabrication_possible,

          addedAt: new Date().toISOString(),
        },
      ];
    }

    this.commit();
  }

  updateQuantity(key, qty) {
    const quantity = Number(qty);
    if (!key || quantity < 1) return;

    const index = this.items.findIndex(i => i.key === key);
    if (index === -1) return;

    this.items = this.items.map((item, i) =>
      i === index ? { ...item, quantity } : item
    );

    this.commit();
  }

  removeItem(key) {
    this.items = this.items.filter(i => i.key !== key);
    this.commit();
  }

  clearCart() {
    this.items = [];
    this.discountCode = "";
    this.discountAmount = 0;
    this.commit();
  }

  /* ============================
     CALCULS (CENTRALISÉS)
  ============================ */

  getSubtotal() {
    return Number(this.items.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2));
  }

  getShipping() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    if (subtotal > 500) return 0;
    if (subtotal >= 120) return 7.9;
    return 9.9;
  }

  getDiscount() {
    return this.discountAmount || 0;
  }

  getTotal() {
    return Math.max(
      0,
      this.getSubtotal() - this.getDiscount() + this.getShipping()
    );
  }

  getItemCount() {
    return this.items.reduce((c, i) => c + i.quantity, 0);
  }

  getItems() {
    return [...this.items];
  }

  /* ============================
     PROMOS
  ============================ */

  applyDiscountCode(code) {
    const result = this.validator.validateCode(code, this.getSubtotal());

    if (result.valid) {
      this.discountCode = code;
      this.discountAmount = result.discountAmount;
    } else {
      this.discountCode = "";
      this.discountAmount = 0;
    }

    this.commit();
    return result;
  }

  removeDiscount() {
    this.discountCode = "";
    this.discountAmount = 0;
    this.commit();
  }

  /* ============================
     PERSISTENCE
  ============================ */

  commit() {
    this.lastUpdated = new Date().toISOString();
    this.saveToLocalStorage();
    this.dispatchCartUpdated();
    this.updateCartCount();
  }

  saveToLocalStorage() {
    try {
      const cartData = {
        version: 2, // Version incrémentée pour inclure l'email
        items: this.items,
        discountCode: this.discountCode,
        discountAmount: this.discountAmount,
        customerEmail: this.customerEmail,
        createdAt: this.createdAt,
        lastUpdated: this.lastUpdated
      };
      
      localStorage.setItem("loveMonBijou_cart", JSON.stringify(cartData));
      
      // Sauvegarde spécifique pour l'email (pour compatibilité)
      if (this.customerEmail) {
        localStorage.setItem("loveMonBijou_customer_email", this.customerEmail);
      }
    } catch (e) {
      console.error("[Cart] Erreur sauvegarde localStorage", e);
    }
  }

  loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem("loveMonBijou_cart");
      
      // Migration depuis la version 1
      if (!raw) {
        return this.migrateFromV1();
      }
      
      const data = JSON.parse(raw) || {};
      
      // Migration si nécessaire
      if (data.version === 1) {
        return this.migrateFromV1(data);
      }
      
      return data;
    } catch (e) {
      console.error("[Cart] Erreur chargement localStorage", e);
      return this.migrateFromV1();
    }
  }

  migrateFromV1(v1Data = null) {
    console.log("[Cart] Migration depuis la version 1");
    
    let items = [];
    let discountCode = "";
    let discountAmount = 0;
    
    if (v1Data) {
      items = v1Data.items || [];
      discountCode = v1Data.discountCode || "";
      discountAmount = v1Data.discountAmount || 0;
    }
    
    // Récupérer l'email depuis l'ancien stockage
    const oldEmail = localStorage.getItem("loveMonBijou_customer_email") || 
                    localStorage.getItem("cartEmail") || "";
    
    return {
      version: 2,
      items,
      discountCode,
      discountAmount,
      customerEmail: oldEmail,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /* ============================
     UI SIGNAL
  ============================ */

  updateCartCount() {
    const count = this.getItemCount();
    document.querySelectorAll(".cart-count").forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-block" : "none";
    });
  }

  dispatchCartUpdated() {
    document.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: this.getFullState()
      })
    );
  }

  getFullState() {
    return {
      items: this.getItems(),
      subtotal: this.getSubtotal(),
      shipping: this.getShipping(),
      discount: this.getDiscount(),
      total: this.getTotal(),
      count: this.getItemCount(),
      customerEmail: this.getCustomerEmail(),
      hasValidEmail: this.hasValidEmail(),
      discountCode: this.discountCode,
      lastUpdated: this.lastUpdated
    };
  }

  /* ============================
     EXPORT POUR CHECKOUT / API
  ============================ */

  exportForCheckout() {
    if (!this.hasValidEmail()) {
      throw new Error("Email client requis pour le checkout");
    }
    
    return {
      // Données panier
      items: this.items.map(i => ({
        id: i.id,
        size: i.size,
        qty: i.quantity,
        price: i.price,
        name: i.name
      })),
      
      // Données calculées
      subtotal: this.getSubtotal(),
      shipping: this.getShipping(),
      discount: this.getDiscount(),
      total: this.getTotal(),
      
      // Données promotion
      discountCode: this.discountCode || null,
      
      // Données client
      customerEmail: this.customerEmail,
      
      // Métadonnées
      cartId: btoa(JSON.stringify({
        createdAt: this.createdAt,
        itemsCount: this.items.length
      })).slice(0, 32),
      
      timestamp: this.lastUpdated
    };
  }

  /* ============================
     UTILITAIRES
  ============================ */

  isEmpty() {
    return this.items.length === 0;
  }

  getSummary() {
    return {
      itemCount: this.getItemCount(),
      subtotal: this.getSubtotal(),
      total: this.getTotal(),
      hasEmail: this.hasValidEmail(),
      isReadyForCheckout: !this.isEmpty() && this.hasValidEmail()
    };
  }

  // Pour le debug
  logState() {
    console.group("[Cart] État actuel");
    console.log("Items:", this.items);
    console.log("Email:", this.customerEmail);
    console.log("Sous-total:", this.getSubtotal());
    console.log("Total:", this.getTotal());
    console.log("Prêt pour checkout:", this.getSummary().isReadyForCheckout);
    console.groupEnd();
  }
}

/* ======================================================
   SINGLETON + EVENT WIRING
====================================================== */
let cartInstance = null;

export function initCart() {
  if (!cartInstance) {
    cartInstance = new CartCore();
    window.cartCoreInstance = cartInstance; // debug / UI
    cartInstance.commit();
    console.log("[Cart] Instance initialisée avec email:", cartInstance.getCustomerEmail());
  }
  return cartInstance;
}

/* ======================================================
   GLOBAL EVENTS (UI → CORE)
====================================================== */

// Événement pour mettre à jour l'email
document.addEventListener("cart:emailUpdated", e => {
  if (!cartInstance || !e?.detail?.email) return;
  
  const result = cartInstance.setCustomerEmail(e.detail.email);
  
  if (!result.success) {
    console.warn("[Cart] Email invalide:", e.detail.email);
    // Optionnel: émettre un événement d'erreur
    document.dispatchEvent(new CustomEvent("cart:emailError", {
      detail: { message: result.message, email: e.detail.email }
    }));
  }
});

// Événement pour vider les données client
document.addEventListener("cart:clearCustomerData", () => {
  if (!cartInstance) return;
  cartInstance.clearCustomerData();
});

// Gestion des produits ajoutés
document.addEventListener("productAddedToCart", e => {
  if (!cartInstance) initCart();
  if (!e?.detail) return;
  cartInstance.addItem(e.detail.product, e.detail.quantity);
});

// Gestion des changements de quantité
document.addEventListener("cart:quantityChanged", e => {
  if (!cartInstance || !e?.detail) return;

  const { key, action } = e.detail;
  const item = cartInstance.getItems().find(i => i.key === key);
  if (!item) return;

  const nextQty =
    action === "increase" ? item.quantity + 1 :
    action === "decrease" ? item.quantity - 1 :
    item.quantity;

  if (nextQty >= 1) {
    cartInstance.updateQuantity(key, nextQty);
  }
});

// Gestion des suppressions
document.addEventListener("cart:itemRemoved", e => {
  if (!cartInstance || !e?.detail?.key) return;
  cartInstance.removeItem(e.detail.key);
});

// Événement pour récupérer l'état complet
document.addEventListener("cart:getState", () => {
  if (!cartInstance) return;
  document.dispatchEvent(new CustomEvent("cart:stateResponse", {
    detail: cartInstance.getFullState()
  }));
});

console.log("[Cart] cartCore V2 avec email support prêt");