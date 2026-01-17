// assets/js/cart/cartCore.js — EV1 FINAL
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
        code = (code || "").trim().toUpperCase();
        const promo = this.validCodes[code];

        if (!promo) {
            return { valid: false, message: "Code promo invalide" };
        }

        if (promo.minOrder && subtotal < promo.minOrder) {
            return {
                valid: false,
                message: `Minimum ${promo.minOrder} € requis`,
            };
        }

        let discountAmount = 0;
        if (promo.type === "percent") {
            discountAmount = subtotal * (promo.value / 100);
        } else {
            discountAmount = promo.value;
        }

        return {
            valid: true,
            discountAmount: Number(discountAmount.toFixed(2)),
            message: `Code ${code} appliqué`,
        };
    }
}

/* ======================================================
   CART CORE
====================================================== */
export class CartCore {
    constructor() {
        this.items = this.loadFromLocalStorage();
        this.discountCode = "";
        this.discountAmount = 0;

        this.validator = new DiscountValidator();
        this.eventsBound = false;

        console.log("[Cart] CartCore prêt");
    }

    /* ============================
       AJOUT ARTICLE (EV1)
    ============================ */
    addItem(product, quantity = 1) {
        if (!product || !product.id) return;

        const size = product.size || "unique";
        const key = `${product.id}__${size}`;
        const qty = Math.max(1, Number(quantity) || 1);

        const existing = this.items.find(i => i.key === key);

        if (existing) {
            existing.quantity += qty;
        } else {
            this.items.push({
                key,
                id: String(product.id),
                name: product.titleLabel || product.name || product.reference,
                price: Number(product.price) || 0,
                image: product.image || "",
                quantity: qty,

                // 🔴 DONNÉES MÉTIER
                size,
                color: product.colorLabel || "",
                metal: product.metalLabel || "",
                stone: product.stone_type || "",
                fabrication: !!product.fabrication_possible,

                addedAt: new Date().toISOString()
            });
        }

        this.saveToLocalStorage();
        this.dispatchCartUpdated();
        this.updateCartCount();
    }

    removeItem(key) {
        this.items = this.items.filter(i => i.key !== key);
        this.saveToLocalStorage();
        this.dispatchCartUpdated();
        this.updateCartCount();
    }

    updateQuantity(key, qty) {
        const item = this.items.find(i => i.key === key);
        if (!item) return;

        if (qty <= 0) {
            this.removeItem(key);
        } else {
            item.quantity = qty;
            this.saveToLocalStorage();
            this.dispatchCartUpdated();
        }
    }

    clearCart() {
        this.items = [];
        this.discountAmount = 0;
        this.discountCode = "";
        this.saveToLocalStorage();
        this.dispatchCartUpdated();
        this.updateCartCount();
    }

    /* ============================
       CALCULS
    ============================ */
    getSubtotal() {
        return this.items.reduce(
            (t, i) => t + i.price * i.quantity,
            0
        );
    }

    getDiscount() {
        return this.discountAmount || 0;
    }

    getShipping() {
        const subtotal = this.getSubtotal();
        if (subtotal === 0) return 0;
        if (subtotal > 500) return 0;
        if (subtotal >= 120) return 7.9;
        return 9.9;
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

        this.saveToLocalStorage();
        this.dispatchCartUpdated();
        return result;
    }

    removeDiscount() {
        this.discountCode = "";
        this.discountAmount = 0;
        this.saveToLocalStorage();
        this.dispatchCartUpdated();
    }

    /* ============================
       STORAGE
    ============================ */
    saveToLocalStorage() {
        localStorage.setItem(
            "loveMonBijou_cart",
            JSON.stringify({
                items: this.items,
                discountCode: this.discountCode,
                discountAmount: this.discountAmount
            })
        );
    }

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem("loveMonBijou_cart");
            if (!raw) return [];
            return JSON.parse(raw).items || [];
        } catch {
            return [];
        }
    }

    /* ============================
       UI
    ============================ */
    updateCartCount() {
        document.querySelectorAll(".cart-count").forEach(el => {
            el.textContent = this.getItemCount();
        });
    }

    dispatchCartUpdated() {
        document.dispatchEvent(
            new CustomEvent("cartUpdated", {
                detail: {
                    items: this.getItems(),
                    subtotal: this.getSubtotal(),
                    shipping: this.getShipping(),
                    discount: this.getDiscount(),
                    total: this.getTotal(),
                }
            })
        );
    }
}

/* ======================================================
   INIT + GLOBAL BRIDGE (EV1)
====================================================== */
let cartInstance = null;

export function initCart() {
    if (!cartInstance) {
        cartInstance = new CartCore();
        cartInstance.updateCartCount();
    }
    return cartInstance;
}

if (!window.addToCart) {
    window.addToCart = function (product, quantity = 1) {
        document.dispatchEvent(
            new CustomEvent("productAddedToCart", {
                detail: { product, quantity }
            })
        );
    };
}

document.addEventListener("productAddedToCart", e => {
    if (!cartInstance) return;
    cartInstance.addItem(e.detail.product, e.detail.quantity);
});

console.log("[Cart] cartCore EV1 FINAL chargé");
