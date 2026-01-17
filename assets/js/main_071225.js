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
            <p>Loading products...</p>
        </div>
    `;

    try {
        // -------------------------------------
        // Load cart system
        // -------------------------------------
        console.log("Load cart system");

        const cartCore = await import("./cart/cartCore.js");
        const cartUI = await import("./cart/cartUI.js");
        const cartCheckout = await import("./cart/cartCheckout.js");
        await import("./cart/discountValidator.js");

        if (cartCore.initCart) {
            cartCore.initCart();
        }

        // -------------------------------------
        // Load CSV loader
        // -------------------------------------
        console.log("Load csvLoader");
        const csvModule = await import("./products/csvLoader.js");

        console.log("Load CSV data");
        const products = await csvModule.loadProductsCSV();
        console.log(`Products loaded: ${products.length}`);

        // -------------------------------------
        // Load display
        // -------------------------------------
        console.log("Load display module");
        const displayModule = await import("./products/display.js");

        displayModule.displayProducts(products, container);
        console.log("Products displayed");

        // -------------------------------------
        // Load modal hub (EV1)
        // -------------------------------------
        console.log("Init modal hub");
        const modalsModule = await import("./modals/modals.js");

        modalsModule.initModals(products);
        console.log("Modals initialized");

    } catch (error) {
        console.error("CRITICAL ERROR:", error);

        container.innerHTML = `
            <div style="color:red; padding:20px; text-align:center;">
                <h3>Error loading</h3>
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