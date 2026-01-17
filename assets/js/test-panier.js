// assets/js/test-panier.js - TEST ISOLe
import { theme } from './core/theme.js';

class TestCart {
    constructor() {
        this.createTestUI();
        this.setupEvents();
    }
    
    createTestUI() {
        // Icone panier
        const cartIcon = `
            <div class="cart-icon-test" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${theme.gold.light};
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 9999;
                font-size: 1.2rem;
            ">
                🛒 Test
            </div>
        `;
        
        // Panneau panier
        const cartPanel = `
            <div class="cart-panel-test" style="
                position: fixed;
                top: 0;
                right: 0;
                width: 300px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 16px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.35s ease;
                z-index: 10000;
                display: flex;
                flex-direction: column;
            ">
                <div style="padding: 20px; border-bottom: 1px solid ${theme.border}; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: ${theme.brown.dark};">
                        🛒 Panier Test
                    </h3>
                    <button class="close-cart-test" style="
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
                
                <div style="flex: 1; padding: 20px;">
                    <p>Test de fermeture du panneau</p>
                    <p>1. Cliquez sur × en haut</p>
                    <p>2. Cliquez en dehors du panneau</p>
                    <p>3. Cliquez sur l'icône 🛒 pour rouvrir</p>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', cartIcon);
        document.body.insertAdjacentHTML('beforeend', cartPanel);
    }
    
    setupEvents() {
        const panel = document.querySelector('.cart-panel-test');
        const closeBtn = panel.querySelector('.close-cart-test');
        const cartIcon = document.querySelector('.cart-icon-test');
        
        // Ouvrir avec l'icone
        cartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.style.transform = 'translateX(0)';
        });
        
        // Fermer avec le bouton ×
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.style.transform = 'translateX(100%)';
            console.log('Fermeture par bouton ×');
        });
        
        // Fermer en cliquant en dehors
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.style.transform = 'translateX(100%)';
                console.log('Fermeture par clic extérieur');
            }
        });
        
        // Fermer avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.style.transform === 'translateX(0px)') {
                panel.style.transform = 'translateX(100%)';
                console.log('Fermeture par ESC');
            }
        });
        
        console.log('✅ Test panier initialisé');
        console.log('Cliquez sur 🛒 Test pour ouvrir');
    }
}

// Demarrer le test
new TestCart();
