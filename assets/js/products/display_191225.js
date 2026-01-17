// ============================================
// DISPLAY.JS — VERSION MOBILE-FRIENDLY & EV1 COMPATIBLE
// ============================================
import CONFIG from "../core/config.js";

window.__productStore = new Map(); // <<< CENTRALISATION PRODUITS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return num.toFixed(2).replace('.', ',') + '€';
}

function createProductCard(product) {
    const ref = product.reference || product.id;
    if (!ref) return document.createElement("div");

    // Centralisation produit (modales)
    window.__productStore.set(ref, product);

    const imageUrl = product.image || CONFIG.getCloudinaryUrl(ref);

    // ✅ CHAMPS NORMALISÉS
    const titrage = product.carat
        ? `Or ${product.carat}k`
        : "Or";

    const typeBijou = product.type || "";
    const pierre = product.stone_type || "Sans pierre";
    const price = product.price ?? "0";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
        <div class="product-img-wrapper">
            <img src="${imageUrl}"
                 class="product-img"
                 alt="${titrage}"
                 onerror="this.src='${CONFIG.placeholder}'">
        </div>

        <div class="product-info">

            <h3 class="product-title">${titrage}</h3>

            <div class="product-subtitle">
                ${typeBijou}
            </div>

            <div class="product-stone">
                ${pierre}
            </div>

            <div class="product-price">
                ${price} €
            </div>

            <div class="product-actions">
                <button class="view-btn" data-ref="${ref}">
                    Détails
                </button>
                <button class="add-btn" data-ref="${ref}">
                    Ajouter
                </button>
            </div>

        </div>
    `;

    return card;
}

export function displayProducts(products, container) {

    console.log("📱 Affichage mobile :", products.length, "produits");

    if (!container) {
        console.error("Conteneur manquant !");
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products-message mobile-empty">
                <p>Aucun produit disponible</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    container.className = "products-grid mobile-grid";

    const fragment = document.createDocumentFragment();
    products.forEach(p => fragment.appendChild(createProductCard(p)));
    container.appendChild(fragment);

    const counter = document.createElement("div");
    counter.className = "product-counter mobile-counter";
    counter.textContent = `${products.length} bijoux`;

    container.parentNode.insertBefore(counter, container.nextSibling);

    console.log("✨ Produits affichés (mobile optimisé)");
}
console.log("📦 Produits enregistrés dans productStore :", window.__productStore.size);