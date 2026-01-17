// assets/js/cart/cartCore-adapted.js - VERSION SIMPLIFIÉE
import { theme } from '../core/theme.js';

// Version simplifiée pour démarrer
export class CartCoreAdapted {
    constructor() {
        console.log('CartCoreAdapted initialisé - version simplifiée');
        this.items = [];
        this.init();
    }

    init() {
        console.log('Panier adapté prêt');
        this.updateCartCount();
    }

    updateCartCount() {
        const count = this.items.length;
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.style.background = count > 0 ? theme.gold.medium : theme.gold.light;
        }
    }

    toggleCartPanel() {
        const panel = document.querySelector('.cart-panel');
        if (panel) {
            panel.classList.toggle('open');
            console.log('Panier ' + (panel.classList.contains('open') ? 'ouvert' : 'fermé'));
        }
    }

    applyDiscountCode(code) {
        console.log('Code promo testé:', code);
        return {
            success: code === 'LOVE10',
            message: code === 'LOVE10' ? 'Code appliqué!' : 'Code invalide',
            amount: code === 'LOVE10' ? 10 : 0
        };
    }
}
