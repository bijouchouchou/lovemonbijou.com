import { theme } from '../core/theme.js';

export class CartCheckout {
    constructor(cartCore) {
        this.cart = cartCore;
        this.config = {
            netlifyFnPrefix: '/.netlify/functions',
            successUrl: '/success.html',
            cancelUrl: '/cart.html'
        };
        this.init();
    }

    // ==========================
    // INIT
    // ==========================
    init() {
        this.setupCheckoutButtons();
        this.setupDiscountForm();
    }

    // ==========================
    // DISCOUNT FORM
    // ==========================
    setupDiscountForm() {
        const discountForm = document.getElementById('discountForm');
        if (!discountForm) return;

        const input = discountForm.querySelector("input[type='text']");
        const applyBtn = discountForm.querySelector("#applyDiscountBtn");
        const messageEl = discountForm.querySelector(".discount-message");

        if (!input || !applyBtn) return;

        // Style
        input.style.border = `1px solid ${theme.gold.light}`;
        input.style.borderRadius = "8px 0 0 8px";
        input.style.padding = "10px 15px";

        applyBtn.style.background = theme.gold.medium;
        applyBtn.style.color = "white";
        applyBtn.style.border = "none";

        // Apply
        const applyDiscount = () => {
            const code = input.value.trim();
            if (!code) {
                this.showDiscountMessage({ success: false, message: "Veuillez entrer un code promo" });
                return;
            }

            const result = this.cart.applyDiscountCode(code);
            this.showDiscountMessage(result);

            if (result.success) {
                input.value = "";
                const panel = document.querySelector(".cart-panel");
                if (panel) this.cart.updateCartSummary(panel);
            }
        };

        applyBtn.addEventListener("click", applyDiscount);
        input.addEventListener("keypress", e => {
            if (e.key === "Enter") applyDiscount();
        });
    }

    // ==========================
    // SHOW MESSAGE
    // ==========================
    showDiscountMessage(result) {
        let messageEl = document.querySelector(".discount-message");
        if (!messageEl) return;

        messageEl.textContent = result.message;
        messageEl.style.color = result.success ? theme.states.success : theme.states.error;
        messageEl.style.opacity = "1";

        setTimeout(() => {
            messageEl.style.opacity = "0";
        }, 3000);
    }

    // ==========================
    // CHECKOUT BUTTONS
    // ==========================
    setupCheckoutButtons() {
        const stripeBtn = document.querySelector('.checkout-btn.stripe');
        const paypalBtn = document.querySelector('.checkout-btn.paypal');
        const almaBtn = document.querySelector('.checkout-btn.alma');

        if (stripeBtn) stripeBtn.addEventListener('click', () => this.launchCheckout('stripe'));
        if (paypalBtn) paypalBtn.addEventListener('click', () => this.launchCheckout('paypal'));
        if (almaBtn) almaBtn.addEventListener('click', () => this.launchCheckout('alma'));
    }

    // ==========================
    // LAUNCH CHECKOUT
    // ==========================
    async launchCheckout(method = "stripe") {
        if (this.cart.getItemCount() === 0) {
            this.showAlert("Votre panier est vide.", "error");
            return;
        }

        const payload = this.cart.buildCheckoutPayload();
        const token = this.cart.b64EncodeUnicode(payload);

        let endpoint =
            method === "stripe"
                ? `${this.config.netlifyFnPrefix}/create-checkout-session`
                : method === "paypal"
                ? `${this.config.netlifyFnPrefix}/create-paypal-payment`
                : `${this.config.netlifyFnPrefix}/create-alma-payment`;

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: payload,
                    success_url: `${this.config.successUrl}?token=${token}`,
                    cancel_url: this.config.cancelUrl
                })
            });

            const data = await res.json();
            if (!data.url) {
                this.showAlert("Erreur checkout : aucune URL", "error");
                return;
            }

            window.location.href = data.url;

        } catch (err) {
            console.error("Checkout error:", err);
            this.showAlert("Erreur connexion.", "error");
        }
    }

    // ==========================
    // ALERT
    // ==========================
    showAlert(message, type = "info") {
        const alert = document.createElement("div");
        alert.textContent = message;

        alert.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 8px;
            background: ${ type === "error" ? theme.states.error : theme.states.success };
            color: white;
            font-weight: 600;
            z-index: 10002;
        `;

        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 2500);
    }
}

console.log("cartCheckout.js loaded");
