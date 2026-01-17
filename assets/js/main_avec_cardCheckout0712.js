// ============================================
// MAIN.JS - EV1 FINAL VERSION (NO ACCENTS IN COMMENTS)
// ============================================

console.log("Start Love Mon Bijou");

// Init application
async function initApp() {
    console.log("DOM ready - Init");

    const container = document.getElementById("products-container");
    if (!container) {
        console.error("Container products-container not found");
        return;
    }

    // Loading message
    container.innerHTML = `
        <div style="text-align:center; padding:40px; color:#666;">
            <p>Chargement des bijoux...</p>
        </div>
    `;

    try {
        // -------------------------------------
        // Load cart system
        // -------------------------------------
        console.log("Load cart system");

const cartCoreModule = await import("./cart/cartCore.js");
// Checkout temporairement désactive pour debug
// await import("./cart/cartCheckout.js");

if (typeof cartCoreModule.initCart === "function") {
    cartCoreModule.initCart();
}


        // -------------------------------------
        // Load CSV loader
        // -------------------------------------
        console.log("Load csvLoader");
        const csvModule = await import("./products/csvLoader.js");

        const loadFn = csvModule.loadProductsCSV || csvModule.default;
        if (typeof loadFn !== "function") {
            throw new Error("CSV loader function not found in csvLoader.js");
        }

        console.log("Load CSV data");
        const products = await loadFn();
        console.log(`Products loaded: ${products.length}`);

        // -------------------------------------
        // Load display module
        // -------------------------------------
        console.log("Load display module");
        const displayModule = await import("./products/display.js");

        if (typeof displayModule.displayProducts !== "function") {
            throw new Error("displayProducts not found in display.js");
        }

        // Display products grid
        displayModule.displayProducts(products, container);
        console.log("Products displayed");

        // -------------------------------------
        // Load modal hub (EV1)
        // -------------------------------------
        console.log("Init modal hub");
        const modalsModule = await import("./modals/modals.js");

        if (typeof modalsModule.initModals === "function") {
            modalsModule.initModals(products);
            console.log("Modals initialized");
        } else {
            console.warn("initModals not found in modals.js");
        }

    } catch (error) {
        console.error("CRITICAL ERROR:", error);

        container.innerHTML = `
            <div style="color:red; padding:20px; text-align:center;">
                <h3>Erreur de chargement</h3>
                <p><strong>${error.message}</strong></p>
                <button onclick="location.reload()" 
                        style="padding:10px 20px; margin-top:20px; cursor:pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Start on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}