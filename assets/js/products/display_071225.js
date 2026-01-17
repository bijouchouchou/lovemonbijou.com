// ============================================
// DISPLAY.JS — EV1 READY (NO ACCENTS IN COMMENTS)
// Compatible CSV, modals.js, cartCore, Cloudinary
// ============================================

import CONFIG from '../core/config.js';

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format price (international)
function formatPrice(price) {
    let n = parseFloat(
        price.toString().replace(',', '.')
    );
    if (isNaN(n)) n = 0;
    return n.toFixed(2) + ' €';
}

// Build Cloudinary image URL
function getImageUrl(product) {
    const ref =
        product.reference ||
        product.REFERENCE ||
        product.ref ||
        '';
    if (!ref) return CONFIG.placeholder;

    return CONFIG.getCloudinaryUrl(ref);
}

// Build card
function createProductCard(product) {

    // Normalized fields (csvLoader.js must provide these)
    const ref   = product.reference || '';
    const title = product.title || '';
    const type  = product.type || '';
    const desc  = product.description || '';
    const price = product.price || 0;
    const stock = parseInt(product.stock || 0);

    // Arrays
    const sizes  = product.available_sizes || [];
    const events = product.events || [];

    // Main image
    const imageUrl = getImageUrl(product);

    const card = document.createElement('div');
    card.className = 'product-card mobile-card';

    card.innerHTML = `
        <div class="product-card-inner">

            <!-- IMAGE -->
            <div class="product-image-container mobile-img-box">
                <img src="${imageUrl}"
                     alt="${escapeHtml(title)}"
                     class="product-image mobile-img"
                     loading="lazy"
                     onerror="this.src='${CONFIG.placeholder}'">

                ${events.length ? `
                    <div class="event-badges mobile-events">
                        ${events.slice(0,2).map(e =>
                            `<span class="event-badge">${escapeHtml(e)}</span>`
                        ).join('')}
                    </div>
                ` : ''}

                ${product.fabrication_possible === 'OUI' ? `
                    <span class="badge-new mobile-badge">SUR MESURE</span>
                ` : ''}
            </div>

            <div class="product-info mobile-info">

                <h3 class="product-name mobile-title">${escapeHtml(title)}</h3>

                ${ref ? `<div class="product-reference mobile-ref">Ref: ${ref}</div>` : ''}

                ${type ? `
                    <div class="product-type mobile-type">${escapeHtml(type)}</div>
                ` : ''}

                ${desc ? `
                    <p class="product-description mobile-desc">
                        ${escapeHtml(desc.substring(0, 80))}
                        ${desc.length > 80 ? "..." : ""}
                    </p>
                ` : ''}

                <!-- PRICE -->
                <div class="product-price mobile-price">
                    <span>${formatPrice(price)}</span>
                </div>

                <!-- STOCK -->
                <div class="product-stock ${stock > 0 ? 'in-stock' : 'out-of-stock'} mobile-stock">
                    ${stock > 0 ? `En stock (${stock})` : 'Rupture'}
                </div>

                <!-- ACTIONS -->
                <div class="product-actions mobile-actions">

                    <button class="view-btn mobile-btn" data-ref="${ref}">
                        Details
                    </button>

                    ${stock > 0 ? `
                        <button class="add-to-cart-btn mobile-btn" data-ref="${ref}">
                            🛒 Ajouter
                        </button>
                    ` : `
                        <button class="add-to-cart-btn mobile-btn" disabled>
                            Indispo
                        </button>
                    `}

                </div>

            </div>
        </div>
    `;

    // EVENT: add to cart (EV1)
    const addBtn = card.querySelector('.add-to-cart-btn');
    if (addBtn && stock > 0) {
        addBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('productAddedToCart', {
                detail: { product }
            }));
        });
    }

    return card;
}

// MAIN DISPLAY FUNCTION
export function displayProducts(products, container) {

    console.log("Display:", products.length, "products");

    if (!container) {
        console.error("Missing container");
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

    console.log("Products displayed EV1");
}