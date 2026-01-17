// assets/js/cart/cartCore.js
// CART CORE — SOURCE DE VÉRITÉ UNIQUE (Event-Driven)

import { eventsBus, EVENTS } from "../core/eventsBus.js";

/* ======================================================
   ERROR MANAGER
====================================================== */
const ErrorManager = {
  emit(code, message, details = {}) {
    eventsBus.emit(
      EVENTS.CART_ERROR,
      {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...details
      },
      "cartCore"
    );
  },

  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }
};

/* ======================================================
   STORAGE UTILS
====================================================== */
const Storage = {
  load() {
    try {
      const raw = localStorage.getItem("loveMonBijou_cart");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  save(data) {
    try {
      localStorage.setItem("loveMonBijou_cart", JSON.stringify(data));
    } catch (e) {
      ErrorManager.emit("STORAGE_ERROR", "Erreur sauvegarde panier", { e });
    }
  },

  clear() {
    localStorage.removeItem("loveMonBijou_cart");
  }
};

/* ======================================================
   PROMOTIONS
====================================================== */
class DiscountValidator {
  constructor() {
    this.codes = {
      LOVE10: { type: "percent", value: 10, min: 50 },
      BIJOU20: { type: "percent", value: 20, min: 100 },
      LIVRAISON: { type: "amount", value: 5 }
    };
  }

  validate(code, subtotal) {
    const promo = this.codes[(code || "").toUpperCase()];
    if (!promo) return null;

    if (promo.min && subtotal < promo.min) return null;

    const amount =
      promo.type === "percent"
        ? subtotal * (promo.value / 100)
        : promo.value;

    return Number(amount.toFixed(2));
  }
}

/* ======================================================
   CART CORE
====================================================== */
export class CartCore {
  constructor() {
    const saved = Storage.load() || {};

    this.items = saved.items || [];
    this.discountCode = saved.discountCode || "";
    this.discountAmount = saved.discountAmount || 0;
    this.customerEmail = saved.customerEmail || "";
    this.createdAt = saved.createdAt || new Date().toISOString();
    this.lastUpdated = saved.lastUpdated || new Date().toISOString();

    this.validator = new DiscountValidator();

    this.bindEvents();
  }

  /* ============================
     EVENT BUS
  ============================ */
  bindEvents() {
    eventsBus.on(
      EVENTS.PRODUCT_ADD_TO_CART,
      d => this.addItem(d.product, d.quantity || 1),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.CART_QUANTITY_CHANGE,
      d => this.updateQuantity(d.key, d.quantity),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.CART_ITEM_REMOVE,
      d => this.removeItem(d.key),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.DISCOUNT_APPLY,
      d => this.applyDiscount(d.code),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.DISCOUNT_REMOVE,
      () => this.removeDiscount(),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.CUSTOMER_EMAIL_UPDATE,
      d => this.setEmail(d.email),
      "cartCore"
    );

    eventsBus.on(
      EVENTS.CART_GET_STATE,
      () =>
        eventsBus.emit(
          EVENTS.CART_STATE_RESPONSE,
          this.getState(),
          "cartCore"
        ),
      "cartCore"
    );
  }

  /* ============================
     ITEMS
  ============================ */
  addItem(product, qty = 1) {
    if (!product?.id) return;

    const size = product.size || "unique";
    const key = `${product.id}__${size}`;
    const quantity = Math.max(1, Number(qty));

    const existing = this.items.find(i => i.key === key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        key,
        id: String(product.id),
        name: product.titleLabel || product.name || "",
        price: Number(product.price) || 0,
        quantity,
        size,
        addedAt: new Date().toISOString()
      });
    }

    this.commit();
    eventsBus.emit(EVENTS.CART_ITEM_ADDED, { key, quantity }, "cartCore");
  }

  updateQuantity(key, quantity) {
    const item = this.items.find(i => i.key === key);
    if (!item || quantity < 1) return;

    item.quantity = quantity;
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
    eventsBus.emit(EVENTS.CART_CLEARED, {}, "cartCore");
  }

  /* ============================
     EMAIL
  ============================ */
  setEmail(email) {
    if (!email) {
      this.customerEmail = "";
      this.commit();
      return;
    }

    if (!ErrorManager.isValidEmail(email)) {
      ErrorManager.emit("EMAIL_INVALID", "Email invalide", { email });
      return;
    }

    this.customerEmail = email.trim();
    this.commit();
  }

  /* ============================
     PROMOS
  ============================ */
  applyDiscount(code) {
    const subtotal = this.getSubtotal();
    const amount = this.validator.validate(code, subtotal);

    if (!amount) {
      this.discountCode = "";
      this.discountAmount = 0;
      return this.commit();
    }

    this.discountCode = code;
    this.discountAmount = amount;
    this.commit();

    eventsBus.emit(
      EVENTS.DISCOUNT_APPLIED,
      { code, amount },
      "cartCore"
    );
  }

  removeDiscount() {
    this.discountCode = "";
    this.discountAmount = 0;
    this.commit();
  }

  /* ============================
     CALCULS
  ============================ */
  getSubtotal() {
    return Number(
      this.items.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)
    );
  }

  getShipping() {
    const s = this.getSubtotal();
    if (s === 0 || s > 500) return 0;
    if (s >= 120) return 7.9;
    return 9.9;
  }

  getTotal() {
    return Math.max(
      0,
      this.getSubtotal() - this.discountAmount + this.getShipping()
    );
  }

  getItemCount() {
    return this.items.reduce((c, i) => c + i.quantity, 0);
  }

  /* ============================
     STATE & PERSISTENCE
  ============================ */
  commit() {
    this.lastUpdated = new Date().toISOString();

    Storage.save({
      version: 2,
      items: this.items,
      discountCode: this.discountCode,
      discountAmount: this.discountAmount,
      customerEmail: this.customerEmail,
      createdAt: this.createdAt,
      lastUpdated: this.lastUpdated
    });

    eventsBus.emit(EVENTS.CART_UPDATED, this.getState(), "cartCore");
    eventsBus.emit(
      EVENTS.CART_COUNT_UPDATED,
      { count: this.getItemCount() },
      "cartCore"
    );
  }

  getState() {
    return {
      items: [...this.items],
      subtotal: this.getSubtotal(),
      shipping: this.getShipping(),
      discount: this.discountAmount,
      total: this.getTotal(),
      count: this.getItemCount(),
      customerEmail: this.customerEmail,
      discountCode: this.discountCode,
      isEmpty: this.items.length === 0,
      lastUpdated: this.lastUpdated
    };
  }
}

/* ======================================================
   SINGLETON
====================================================== */
let instance = null;

export function initCart() {
  if (!instance) {
    instance = new CartCore();
    eventsBus.emit(EVENTS.CART_INITIALIZED, instance.getState(), "cartCore");
  }
  return instance;
}

/* ======================================================
   LEGACY BRIDGE (TEMPORAIRE & MAÎTRISÉ)
====================================================== */
document.addEventListener("productAddedToCart", e => {
  if (!e?.detail) return;

  eventsBus.emit(
    EVENTS.PRODUCT_ADD_TO_CART,
    {
      product: e.detail.product,
      quantity: e.detail.quantity || 1
    },
    "legacy"
  );
});
