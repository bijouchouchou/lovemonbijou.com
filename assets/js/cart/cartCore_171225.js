// assets/js/cart/cartCore.js - EV1 stable
import { theme } from '../core/theme.js';

// ---------------------------
// DiscountValidator
// ---------------------------
class DiscountValidator {
    constructor() {
        this.validCodes = {
            'LOVE10': {
                type: 'percent',
                value: 10,
                minOrder: 50,
                expires: null,
                description: '10% de reduction des 50€'
            },
            'BIJOU20': {
                type: 'percent',
                value: 20,
                minOrder: 100,
                expires: null,
                description: '20% de reduction des 100€'
            },
            'LIVRAISON': {
                type: 'amount',
                value: 5,
                minOrder: null,
                expires: null,
                description: '5€ de reduction'
            },
            'NOEL2024': {
                type: 'percent',
                value: 15,
                minOrder: 80,
                expires: '2024-12-31',
                description: '15% de reduction special Noel'
            }
        };
    }

    validateCode(code, subtotal = 0) {
        code = code.trim().toUpperCase();

        if (!this.validCodes[code]) {
            return { valid: false, message: 'Code promo invalide', code: code };
        }

        const promo = this.validCodes[code];
        const now = new Date();

        if (promo.expires) {
            const expireDate = new Date(promo.expires);
            if (now > expireDate) {
                return { valid: false, message: 'Ce code promo a expire', code: code };
            }
        }

        if (promo.minOrder && subtotal < promo.minOrder) {
            return {
                valid: false,
                message: `Minimum ${promo.minOrder}€ d'achat requis`,
                code: code,
                requiredAmount: promo.minOrder
            };
            }
        
        let discountAmount = 0;
        if (promo.type === 'percent') {
            discountAmount = subtotal * (promo.value / 100);
        } else if (promo.type === 'amount') {
            discountAmount = Math.min(promo.value, subtotal);
        }

        return {
            valid: true,
            message: `Code "${code}" applique ! ${promo.description}`,
            code: code,
            type: promo.type,
            value: promo.value,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            description: promo.description
        };
    }
}

// ---------------------------
// CartCore
// ---------------------------
export class CartCore {
    constructor() {
        this.items = this.loadFromLocalStorage();
        this.discountCode = '';
        this.discountAmount = 0;
        this.discountValidator = new DiscountValidator();
        this.isUpdating = false;
        this.init();
    }

    init() {
        // EV1: expose global instance
        window.cartCoreInstance = this;
        this.updateCartCount();
        this.setupCartEvents();
        console.log('Cart initialized:', this.items.length, 'items');
    }

    // === GESTION DES ARTICLES ===

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                image: product.image,
                category: product.category,
                material: product.material,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        this.saveToLocalStorage();
        this.updateCartCount();
        this.showAddNotification(product, quantity);
        this.dispatchCartUpdated();

        return this.items.find(item => item.id === product.id);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToLocalStorage();
        this.updateCartCount();
        this.dispatchCartUpdated();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToLocalStorage();
                this.dispatchCartUpdated();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.discountCode = '';
        this.discountAmount = 0;
        this.saveToLocalStorage();
        this.updateCartCount();
        document.dispatchEvent(new CustomEvent('cartCleared'));
        console.log('Panier vide');
    }

    // === CALCULS ===

    getSubtotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getShipping() {
        const subtotal = this.getSubtotal();
        return subtotal >= 100 ? 0 : subtotal === 0 ? 0 : 5;
    }

    getDiscount() {
        return this.discountAmount;
    }

    getTotal() {
        const subtotal = this.getSubtotal();
        const shipping = this.getShipping();
        const discount = this.getDiscount();
        return Math.max(0, subtotal + shipping - discount);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    getItems() {
        return [...this.items];
    }

    // === CODES PROMO ===

    applyDiscountCode(code) {
        code = code.trim().toUpperCase();
        console.log('Application code promo:', code);

        const subtotal = this.getSubtotal();
        const validation = this.discountValidator.validateCode(code, subtotal);

        if (validation.valid) {
            this.discountAmount = validation.discountAmount;
            this.discountCode = code;
            this.saveToLocalStorage();
            this.dispatchCartUpdated();

            return {
                success: true,
                message: validation.message,
                amount: this.discountAmount,
                code: code,
                type: validation.type,
                value: validation.value
            };
        } else {
            this.discountCode = '';
            this.discountAmount = 0;
            this.saveToLocalStorage();
            this.dispatchCartUpdated();

            return {
                success: false,
                message: validation.message,
                amount: 0,
                code: code
            };
        }
    }

    removeDiscount() {
        this.discountCode = '';
        this.discountAmount = 0;
        this.saveToLocalStorage();
        this.dispatchCartUpdated();
    }

    // === LOCAL STORAGE ===

    saveToLocalStorage() {
        const cartData = {
            items: this.items,
            discountCode: this.discountCode,
            discountAmount: this.discountAmount,
            lastUpdated: new Date().toISOString()
        };

        try {
            localStorage.setItem('loveMonBijou_cart', JSON.stringify(cartData));
        } catch (error) {
            console.error('Erreur sauvegarde panier:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('loveMonBijou_cart');
            if (saved) {
                const data = JSON.parse(saved);
                this.items = data.items || [];
                this.discountCode = data.discountCode || '';
                this.discountAmount = data.discountAmount || 0;
                return this.items;
            }
        } catch (error) {
            console.error('Erreur chargement panier:', error);
        }
        return [];
    }

    // === UI COUNT ===

    updateCartCount() {
        const countElements = document.querySelectorAll('.cart-count');
        const count = this.getItemCount();

        countElements.forEach(el => {
            el.textContent = count;
            el.style.background = count > 0 ? theme.gold.medium : theme.gold.light;
            el.style.color = 'white';

            if (count > 0) {
                el.classList.add('cart-animate');
                setTimeout(() => {
                    el.classList.remove('cart-animate');
                }, 350);
            }
        });
    }

    updateCartSummary(panel = null) {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const subtotal = this.getSubtotal();
            const shipping = this.getShipping();
            const discount = this.getDiscount();
            const total = this.getTotal();

            if (panel) {
                const subtotalContainer = panel.querySelector('.cart-subtotal .value');
                if (subtotalContainer) {
                    subtotalContainer.textContent = `${subtotal.toFixed(2)} €`;
                }

                const shippingEl = panel.querySelector('.cart-shipping .value');
                if (shippingEl) {
                    shippingEl.textContent = `${shipping.toFixed(2)} €`;
                }

                const discountEl = panel.querySelector('.cart-discount');
                if (discountEl) {
                    if (discount > 0) {
                        discountEl.style.display = 'flex';
                        const el = discountEl.querySelector('.value');
                        if (el) el.textContent = `-${discount.toFixed(2)} €`;
                    } else {
                        discountEl.style.display = 'none';
                    }
                }

                const totalEl = panel.querySelector('.cart-total strong');
                if (totalEl) {
                    totalEl.textContent = `${total.toFixed(2)} €`;
                }
            }

            this.updateCartCount();

        } finally {
            this.isUpdating = false;
        }
    }

    // === NOTIFICATION AJOUT ===

    showAddNotification(product, quantity = 1) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border-left: 4px solid ${theme.gold.medium};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px ${theme.shadow.medium};
            z-index: 10001;
            min-width: 280px;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        notification.innerHTML = `
            <div style="width: 40px; height: 40px; background: ${theme.cream.medium}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${theme.gold.dark}; font-size: 1.2rem; font-weight: bold;">
                ✓
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: ${theme.brown.dark}; margin-bottom: 4px;">
                    Ajoute au panier
                </div>
                <div style="color: ${theme.brown.light}; font-size: 0.9rem; margin-bottom: 4px;">
                    ${product.name}
                </div>
                <div style="color: ${theme.gold.medium}; font-size: 0.85rem; font-weight: 600;">
                    ${quantity} × ${product.price ? product.price + '€' : '0€'}
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        if (!document.querySelector('#cart-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'cart-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // === EVENTS GLOBALS ===

  setupCartEvents() {

    /* =========================================
       1. OUVERTURE AUTOMATIQUE APRÈS AJOUT PRODUIT
       ========================================= */
    document.addEventListener('productAddedToCart', (e) => {
        if (!e?.detail?.product) return;

        this.addItem(e.detail.product, 1);

        // Ouvre le panier après un léger délai (UX)
        setTimeout(() => {
            this.openCartPanel();
        }, 300);
    });


    /* =========================================
       2. CLIC DIRECT SUR L’ICÔNE PANIER
       (PAS de listener global document)
       ========================================= */
    const cartIcon = document.querySelector('.cart-icon');

    if (!cartIcon) {
        console.warn('[Cart] .cart-icon introuvable');
        return;
    }

    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCartPanel();
    });
}

    // === CHECKOUT PAYLOAD ===

    buildCheckoutPayload() {
        const items = this.items.map(item => ({
            id: item.id,
            title: item.name,
            qty: item.quantity,
            price: item.price,
            ref: item.id,
            image: item.image
        }));

        return {
            items,
            subtotal: this.getSubtotal(),
            shipping: this.getShipping(),
            discount: this.getDiscount(),
            total: this.getTotal(),
            discountCode: this.discountCode
        };
    }

    b64EncodeUnicode(obj) {
        const s = JSON.stringify(obj);
        return btoa(unescape(encodeURIComponent(s)));
    }

    // === PANNEAU LATERAL ===

    toggleCartPanel() {
        let panel = document.querySelector('.cart-panel');
        if (!panel) {
            panel = this.createCartPanel();
        }

        panel.classList.toggle('open');

        if (panel.classList.contains('open')) {
            this.renderCartItems(panel);
            this.updateCartSummary(panel);
            this.setupPanelEvents(panel);
        }
    }

    createCartPanel() {
        const panelHTML = `
            <div class="cart-panel" style="
                position: fixed;
                top: 0;
                right: 0;
                width: 340px;
                max-width: 90%;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 16px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.35s ease;
                z-index: 9999;
                display: flex;
                flex-direction: column;
            ">
                <div style="padding: 20px; border-bottom: 1px solid ${theme.border}; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: ${theme.brown.dark}; font-size: 1.2rem; font-weight: 700;">
                        🛒 Mon Panier
                    </h3>
                    <button class="close-cart" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: ${theme.brown.light};
                        padding: 5px;
                    ">
                        ×
                    </button>
                </div>

                <div class="cart-items" style="flex: 1; overflow-y: auto; padding: 20px;">
                    <!-- Items here -->
                </div>

                <div class="cart-summary" style="padding: 20px; border-top: 1px solid ${theme.border}; background: ${theme.cream.light};">
                    <div class="cart-subtotal" style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span>Sous-total</span>
                        <span class="value">0.00 €</span>
                    </div>
                    <div class="cart-shipping" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${theme.border};">
                        <span>Frais de port</span>
                        <span class="value">0.00 €</span>
                    </div>
                    <div class="cart-discount" style="display: none; justify-content: space-between; padding: 8px 0; color: ${theme.states.success}; font-weight: 600;">
                        <span>Reduction</span>
                        <span class="value">0.00 €</span>
                    </div>
                    <div class="cart-total" style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 1.1rem; font-weight: 700; border-top: 2px solid ${theme.gold.medium}; margin-top: 8px;">
                        <span>Total</span>
                        <strong>0.00 €</strong>
                    </div>

                    <div id="discountForm" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed ${theme.border};">
                        <div style="display: flex; gap: 5px;">
                            <input type="text" placeholder="Code promo" style="
                                flex: 1;
                                padding: 10px 15px;
                                border: 1px solid ${theme.gold.light};
                                border-radius: 8px 0 0 8px;
                                outline: none;
                                font-size: 0.9rem;
                            ">
                            <button type="button" id="applyDiscountBtn" style="
                                background: ${theme.gold.medium};
                                color: white;
                                border: none;
                                border-radius: 0 8px 8px 0;
                                padding: 10px 20px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 0.9rem;
                            ">
                                Appliquer
                            </button>
                        </div>
                        <div class="discount-message" style="
                            margin-top: 8px;
                            font-size: 0.85rem;
                            min-height: 20px;
                        "></div>
                    </div>
                </div>

                <div class="checkout-buttons" style="padding: 20px; background: white; border-top: 1px solid ${theme.border};">
                    <button class="checkout-btn stripe" style="
                        width: 100%;
                        padding: 12px;
                        background: #222;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">
                        Payer avec Stripe
                    </button>
                    <button class="checkout-btn paypal" style="
                        width: 100%;
                        padding: 12px;
                        background: #ffc439;
                        color: #222;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">
                        Payer avec PayPal
                    </button>
                    <button class="checkout-btn alma" style="
                        width: 100%;
                        padding: 12px;
                        background: #6c4aff;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Payer avec Alma
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        const panel = document.querySelector('.cart-panel');
        this.setupPanelEvents(panel);
        return panel;
    }

    setupPanelEvents(panel) {
        if (!panel) return;

        const closeBtn = panel.querySelector('.close-cart');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                panel.classList.remove('open');
                console.log('Panier ferme par bouton x');
            });
        }

        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.classList.remove('open');
                console.log('Panier ferme par clic exterieur');
            }
        });

        const applyBtn = panel.querySelector('#applyDiscountBtn');
        const discountInput = panel.querySelector('#discountForm input');
        const messageEl = panel.querySelector('.discount-message');

        if (applyBtn && discountInput) {
            const applyDiscount = () => {
                const code = discountInput.value.trim();
                if (!code) {
                    if (messageEl) {
                        messageEl.textContent = 'Veuillez entrer un code promo';
                        messageEl.style.color = theme.states.error;
                    }
                    return;
                }

                const result = this.applyDiscountCode(code);

                if (messageEl) {
                    messageEl.textContent = result.message;
                    messageEl.style.color = result.success ? theme.states.success : theme.states.error;

                    setTimeout(() => {
                        messageEl.textContent = '';
                    }, 5000);
                }

                if (result.success) {
                    discountInput.value = '';
                    this.updateCartSummary(panel);

                    applyBtn.textContent = '✓ Applique';
                    applyBtn.style.background = theme.states.success;

                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Retirer';
                    removeBtn.style.cssText = `
                        background: ${theme.states.error};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 10px 12px;
                        margin-left: 5px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.85rem;
                    `;

                    removeBtn.addEventListener('click', () => {
                        this.removeDiscount();
                        discountInput.value = '';
                        applyBtn.textContent = 'Appliquer';
                        applyBtn.style.background = theme.gold.medium;
                        if (messageEl) {
                            messageEl.textContent = 'Code promo retire';
                            messageEl.style.color = theme.states.success;
                            setTimeout(() => {
                                messageEl.textContent = '';
                            }, 3000);
                        }
                        removeBtn.remove();
                        this.updateCartSummary(panel);
                    });

                    const formDiv = panel.querySelector('#discountForm div');
                    if (formDiv) {
                        const oldRemoveBtn = formDiv.querySelector('button[style*="background: rgb(220, 53, 69)"]');
                        if (oldRemoveBtn) oldRemoveBtn.remove();

                        formDiv.appendChild(removeBtn);
                    }
                }
            };

            applyBtn.addEventListener('click', applyDiscount);
            discountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyDiscount();
            });
        }
    }

    renderCartItems(panel) {
        const itemsContainer = panel.querySelector('.cart-items');
        if (!itemsContainer) return;

        if (this.items.length === 0) {
            itemsContainer.innerHTML = `
                <div style="text-align: center; color: ${theme.brown.light}; padding: 40px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;">🛒</div>
                    <p style="font-size: 1.1rem; margin-bottom: 10px;">Votre panier est vide</p>
                    <p style="font-size: 0.9rem;">Ajoutez des bijoux pour commencer vos achats</p>
                </div>
            `;
            return;
        }

        itemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.id}" style="
                display: flex;
                gap: 15px;
                padding: 15px 0;
                border-bottom: 1px solid ${theme.border};
            ">
                <div style="width: 60px; height: 60px; background: ${theme.cream.medium}; border-radius: 8px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\'color: ${theme.gold.light}; font-size: 1.5rem;\'>💎</div>';" />` :
                    `<div style="color: ${theme.gold.light}; font-size: 1.5rem;">💎</div>`}
                </div>

                <div style="flex: 1;">
                    <div style="font-weight: 600; color: ${theme.brown.dark}; margin-bottom: 5px; font-size: 0.95rem;">
                        ${item.name}
                    </div>
                    <div style="color: ${theme.brown.light}; font-size: 0.85rem; margin-bottom: 8px;">
                        ${item.material || ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="decrease-qty" style="
                                width: 25px;
                                height: 25px;
                                background: ${theme.cream.medium};
                                border: 1px solid ${theme.border};
                                border-radius: 4px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">−</button>
                            <span style="font-weight: 600; color: ${theme.brown.dark}; min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="increase-qty" style="
                                width: 25px;
                                height: 25px;
                                background: ${theme.cream.medium};
                                border: 1px solid ${theme.border};
                                border-radius: 4px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">+</button>
                        </div>
                        <div style="font-weight: 700; color: ${theme.gold.medium};">
                            ${(item.price * item.quantity).toFixed(2)} €
                        </div>
                    </div>
                </div>

                <button class="remove-item" style="
                    background: none;
                    border: none;
                    color: ${theme.brown.light};
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0 5px;
                    align-self: flex-start;
                " title="Supprimer">
                    ×
                </button>
            </div>
        `).join('');

        this.attachCartItemEvents(itemsContainer, panel);
    }

    attachCartItemEvents(container, panel) {
        container.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.cart-item');
                const itemId = itemElement.dataset.id;
                const item = this.items.find(i => i.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, item.quantity + 1);
                    this.renderCartItems(panel);
                    this.updateCartSummary(panel);
                }
            });
        });

        container.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.cart-item');
                const itemId = itemElement.dataset.id;
                const item = this.items.find(i => i.id === itemId);
                if (item && item.quantity > 1) {
                    this.updateQuantity(itemId, item.quantity - 1);
                    this.renderCartItems(panel);
                    this.updateCartSummary(panel);
                }
            });
        });

        container.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.cart-item');
                const itemId = itemElement.dataset.id;
                if (confirm('Supprimer cet article du panier ?')) {
                    this.removeItem(itemId);
                    this.renderCartItems(panel);
                    this.updateCartSummary(panel);
                }
            });
        });
    }
}

// ---------------------------
// EV1 init function for main.js
// ---------------------------
export function initCart() {
    if (!window.cartCoreInstance) {
        window.cartCoreInstance = new CartCore();
    }
    return window.cartCoreInstance;
}

// ---------------------------
// EV1 global cart bridge
// ---------------------------
if (!window.addToCart) {
    window.addToCart = function (key, product) {
        if (!window.cartCoreInstance) {
            console.error('CartCore instance not ready');
            return;
        }

        const item = {
            id: key,
            name: product.title || product.name || product.reference,
            price: product.price || 0,
            image: product.image || '',
            material: product.metal_color || '',
            quantity: 1
        };

        window.cartCoreInstance.addItem(item, 1);
    };
}

if (!window.updateCartUI) {
    window.updateCartUI = function () {
        if (!window.cartCoreInstance) return;
        const panel = document.querySelector('.cart-panel');
        if (panel) {
            window.cartCoreInstance.renderCartItems(panel);
            window.cartCoreInstance.updateCartSummary(panel);
        }
    };
}

console.log('cartCore EV1 loaded');