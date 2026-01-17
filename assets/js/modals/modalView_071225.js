// assets/js/modals/modalView.js
// Product modal (extends ModalBase) - EV1 stable version (no accents)

import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";

// --------------------------------------------
// Helpers
// --------------------------------------------

// Safely read a field, handles undefined values
function safe(obj, key) {
    return obj && obj[key] ? obj[key].toString().trim() : "";
}

// Main image URL based on CSV reference (Cloudinary auto png/jpg)
function getImageUrl(product) {
    const ref = product.reference || product.REFERENCE || "";
    if (!ref) return CONFIG.placeholder;
    return CONFIG.getCloudinaryUrl(ref);
}

// Parse CSV sizes
function parseSizes(raw) {
    if (!raw) return [];
    return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// Parse CSV stock by size
function parseQty(raw) {
    if (!raw) return [];
    return raw.split(",").map(x => x.trim());
}

// Parse product events
function parseEvents(raw) {
    if (!raw) return [];
    return raw.split(",").map(e => e.trim()).filter(Boolean);
}


// --------------------------------------------
// Product Modal (EV1)
// --------------------------------------------

export class ProductModal extends ModalBase {

    constructor() {
        super("product-modal"); // HTML modal id
    }

    // Public API called by modals.js
    open(product) {
        this.openProduct(product);
    }

    // Main rendering function
    openProduct(product) {
        if (!product) {
            console.error("ProductModal: product is null");
            return;
        }

        // Normalized field names (csvLoader EV1)
        const ref = product.reference || "";
        const title = product.titre || product.title || ref;
        const desc = product.description || "";
        const type = product.type_de_bijoux || "";

        const metalColor = product.couleur || "";
        const metalWeight = product.poids_or || "";
        const stoneType = product.type_de_pierres || "";
        const stoneWeight = product.poids_pierre || "";

        const sizes = parseSizes(product.tailles_disponibles);
        const qty = parseQty(product.quantite_par_taille);

        const price = product.price_euros || "";

        const events = parseEvents(product.evenement);

        const imageUrl = getImageUrl(product);

        // HTML
        const html = `
            <div class="modal-product-grid">

                <!-- LEFT SIDE -->
                <div class="modal-left">
                    <img class="modal-main-img"
                         src="${imageUrl}"
                         alt="${title}"
                         onerror="this.src='${CONFIG.placeholder}'">
                </div>

                <!-- RIGHT SIDE -->
                <div class="modal-right">

                    <h2 class="modal-title">${title}</h2>

                    <div class="modal-price">
                        ${price ? price.replace(".", ",") + " €" : ""}
                    </div>

                    <p class="modal-desc">${desc}</p>

                    <ul class="modal-details">
                        <li><strong>Reference:</strong> ${ref}</li>
                        <li><strong>Type:</strong> ${type}</li>
                        <li><strong>Metal:</strong> ${metalColor || ""} ${metalWeight ? metalWeight + " g" : ""}</li>
                        <li><strong>Stone:</strong> ${stoneType || ""} ${stoneWeight ? stoneWeight + " ct" : ""}</li>
                    </ul>

                    <div class="modal-sizes">
                        <label>Select size</label>
                        <select id="modal-size-select">
                            <option value="">-- Choose --</option>
                            ${sizes.map((s, i) => {
                                const q = qty[i] || "";
                                const disabled = (!q || q === "0") ? "disabled" : "";
                                const label = disabled
                                    ? `${s} (out of stock)`
                                    : `${s} (stock ${q})`;
                                return `<option value="${s}" ${disabled}>${label}</option>`;
                            }).join("")}
                        </select>
                    </div>

                    <button class="modal-add-cart" id="modal-add-cart-btn" data-ref="${ref}">
                        Add to cart
                    </button>

                    ${product.fabrication_possible === "OUI" ? `
                        <button class="modal-fabrication-btn" id="modal-open-fabrication" data-ref="${ref}">
                            Custom fabrication
                        </button>
                    ` : ""}

                    ${events.length ? `
                        <div class="modal-events">
                            ${events.map(e => `<span class="modal-event-tag">${e}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
            </div>
        `;

        this.setContent(html);
        this.open();

        this.bindEvents(product);
    }

    // Bind interactions after HTML injection
    bindEvents(product) {

        // Add to cart
        const addBtn = document.getElementById("modal-add-cart-btn");
        const select = document.getElementById("modal-size-select");

        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const size = select ? select.value : "";
                const hasSizes = product.tailles_disponibles && product.tailles_disponibles.length > 0;

                if (hasSizes && !size) {
                    alert("Please select a size");
                    return;
                }

                const ref = addBtn.dataset.ref;

                const key = size ? `${ref}|size:${size}` : `${ref}|item`;
                const copy = { ...product };

                if (size) copy.__size = size;

                if (window.addToCart) {
                    window.addToCart(key, copy);
                }

                if (window.updateCartUI) window.updateCartUI();

                this.close();
            });
        }

        // Custom fabrication modal
        const fab = document.getElementById("modal-open-fabrication");
        if (fab) {
            fab.addEventListener("click", () => {
                if (window.openFabricationModal) {
                    window.openFabricationModal(product);
                    this.close();
                }
            });
        }
    }
}
