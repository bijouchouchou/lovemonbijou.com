// assets/js/main.js
// Main entry for home page (no accents in comments)

import CONFIG from './core/config.js';
import { initState } from './core/state.js';
import { showNotification } from './core/utils.js';

// Products
import { loadProductsCSV } from './products/csvLoader.js';
import { displayProducts } from './products/display.js';

// Modals hub (for now we use modals.js as central manager)
import { initModals } from './modals/modals.js';

console.log('Love Mon Bijou - start');

async function initApp() {
    console.log('DOM ready - init');

    const container = document.getElementById('products-container');
    if (!container) {
        console.error("Container 'products-container' not found");
        return;
    }

    // Init global state (cart etc.)
    const state = initState?.() || {};
    console.log('State initialized:', state);

    // Loading message
    container.innerHTML = `
        <div style="text-align:center; padding:40px; color:#666;">
            <p>Chargement des bijoux...</p>
        </div>
    `;

    try {
        showNotification('Chargement du catalogue...', 'info');

        // 1) Load CSV
        const products = await loadProductsCSV();

        console.log('Products loaded:', products.length);

        // 2) Display grid
        displayProducts(products, container);

        // 3) Init modals on these products (product modal, fabrication, etc.)
        initModals(products);

        showNotification(products.length + ' bijoux disponibles', 'success');
    } catch (error) {
        console.error('Critical error in initApp:', error);

        container.innerHTML = `
            <div style="color:red; padding:20px; text-align:center;">
                <h3>Erreur de chargement</h3>
                <p><strong>${error.message}</strong></p>
                <p>Verifiez la console pour plus de details</p>
                <button onclick="location.reload()" 
                        style="padding:10px 20px; margin-top:20px; cursor:pointer;">
                    Reessayer
                </button>
            </div>
        `;

        showNotification('Erreur chargement du catalogue', 'error');
    }
}

// DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}