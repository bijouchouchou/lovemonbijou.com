// assets/js/fix-cart-enhanced.js - Version amelioree avec encodage fix
console.log("🛒 Panier amélioré - correction encodage...");

function fixCartEnhanced() {
    const panel = document.querySelector('.cart-panel');
    if (!panel) {
        console.error("Panneau panier non trouvé !");
        return;
    }
    
    console.log("Amélioration du panier...");
    
    // 1. Forcer les styles
    panel.style.cssText = `
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
        font-family: Arial, sans-serif;
    `;
    
    // 2. S'assurer que le contenu est en UTF-8
    fixCartContentEncoding(panel);
    
    // 3. Configurer boutons
    setupCartButtons(panel);
    
    // 4. Ajouter message panier vide
    showEmptyCartMessage(panel);
    
    console.log("✅ Panier amélioré ! Encodage corrigé.");
}

function fixCartContentEncoding(panel) {
    // Remplacer les "â‚¬" par "€" si necessaire
    const elements = panel.querySelectorAll('.cart-summary span, .cart-summary strong, .value');
    elements.forEach(el => {
        if (el.textContent.includes('â‚¬')) {
            el.textContent = el.textContent.replace(/â‚¬/g, '€');
        }
    });
    
    // Forcer l'affichage correct des €
    const style = document.createElement('style');
    style.textContent = `
        .cart-panel, .cart-summary, .cart-items {
            font-family: Arial, "Segoe UI", sans-serif !important;
        }
        .cart-summary .value:after {
            content: " €";
        }
    `;
    panel.appendChild(style);
}

function setupCartButtons(panel) {
    // Bouton fermer
    const closeBtn = panel.querySelector('#closeCartBtn');
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.preventDefault();
            panel.style.transform = 'translateX(100%)';
            panel.classList.remove('open');
        };
    }
    
    // Icone panier
    const cartIcon = document.getElementById('openCartBtn');
    if (cartIcon) {
        cartIcon.onclick = function(e) {
            e.preventDefault();
            toggleCart(panel);
        };
    }
    
    // Fermer en cliquant en dehors
    panel.onclick = function(e) {
        if (e.target === panel) {
            panel.style.transform = 'translateX(100%)';
            panel.classList.remove('open');
        }
    };
    
    // Fermer avec ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            panel.style.transform = 'translateX(100%)';
            panel.classList.remove('open');
        }
    });
}

function toggleCart(panel) {
    if (panel.classList.contains('open')) {
        panel.style.transform = 'translateX(100%)';
        panel.classList.remove('open');
    } else {
        panel.style.transform = 'translateX(0)';
        panel.classList.add('open');
        console.log("Panier ouvert");
    }
}

function showEmptyCartMessage(panel) {
    const itemsContainer = panel.querySelector('.cart-items');
    if (!itemsContainer) return;
    
    // Verifier si deja un message
    if (!itemsContainer.querySelector('.cart-empty')) {
        itemsContainer.innerHTML = `
            <div class="cart-empty" style="
                text-align: center;
                padding: 40px 20px;
                color: #5a4634;
            ">
                <div class="cart-empty-icon" style="
                    font-size: 3rem;
                    margin-bottom: 20px;
                    opacity: 0.5;
                ">🛒</div>
                <p style="font-size: 1.1rem; margin-bottom: 10px;">
                    Votre panier est vide
                </p>
                <p style="font-size: 0.9rem; color: #8a7565;">
                    Ajoutez des bijoux pour commencer vos achats
                </p>
            </div>
        `;
    }
}

// Execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixCartEnhanced);
} else {
    fixCartEnhanced();
}

// Commandes pour tester
window.openCart = function() {
    const panel = document.querySelector('.cart-panel');
    if (panel) {
        panel.style.transform = 'translateX(0)';
        panel.classList.add('open');
        showEmptyCartMessage(panel);
    }
};

window.testEuro = function() {
    const elements = document.querySelectorAll('.value, [class*="total"], [class*="price"]');
    elements.forEach(el => {
        console.log(el.textContent);
        if (el.textContent.includes('â‚¬')) {
            el.textContent = el.textContent.replace('â‚¬', '€');
        }
    });
};

console.log("💡 Commandes:");
console.log("window.openCart() - Ouvrir panier");
console.log("window.testEuro() - Corriger les €");
