// assets/js/modals/modalView.js - EV1 ProductModal complet
import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";

// -------------------------
// Helpers
// -------------------------
function safe(v) {
    return v != null ? String(v).trim() : "";
}

function safeNumber(v) {
    if (v == null || v === "") return 0;
    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
}

// Formats
function formatPriceEUR(p) {
    const n = safeNumber(p);
    return n.toFixed(2).replace(".", ",") + " €";
}

function formatStoneWeightCt(raw) {
    const n = safeNumber(raw);
    if (!n) return "";
    return n.toFixed(3) + " ct";
}

function formatMetalWeight(raw) {
    const n = safeNumber(raw);
    if (!n) return "";
    return n.toFixed(2) + " g";
}

// tailles : on accepte soit chaîne CSV, soit tableau
function parseSizes(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseStockBySize(sizes, rawStocks) {
    const out = {};
    const s = parseSizes(sizes);

    if (!rawStocks) {
        s.forEach((size) => (out[size] = null));
        return out;
    }

    const stocks = String(rawStocks)
        .split(",")
        .map((x) => parseInt(x.trim(), 10) || 0);

    s.forEach((size, i) => {
        out[size] = stocks[i] != null ? stocks[i] : 0;
    });

    return out;
}

// Image Cloudinary
function getImageUrl(product) {
    const ref =
        safe(product.reference) ||
        safe(product.REFERENCE) ||
        safe(product.id);

    if (!ref) return CONFIG.placeholder;
    return CONFIG.getCloudinaryUrl(ref);
}

// -------------------------
// ProductModal
// -------------------------
export class ProductModal extends ModalBase {
    constructor(modalId = "product-modal") {
        super(modalId);
        console.log("ProductModal initialisé pour id =", modalId);
    }

    showProduct(product) {
        if (!product) {
            console.error("ProductModal: product null");
            return;
        }

        const ref = safe(
            product.reference ||
            product.REFERENCE ||
            product.id
        );

        const title =
            safe(product.titre) ||
            safe(product.title) ||
            ref ||
            "Bijou";

        const desc = safe(product.description);
        const type = safe(product.type_de_bijoux || product.type || "");

        const metalColor = safe(product.couleur || product.metal_color || "");
        const metalWeight = formatMetalWeight(product.poids_or);

        const stoneType = safe(product.type_de_pierres || product.stone_type || "");
        const stoneWeight = formatStoneWeightCt(
            product["Poids pierre"] || product.poids_pierre || product.stone_weight
        );

        const price =
            product.price != null
                ? product.price
                : product.price_euros;

        const priceLabel = formatPriceEUR(price);

        const sizesRaw = product.tailles_disponibles || product.available_sizes;
        const sizes = parseSizes(sizesRaw);
        const stockBySize = parseStockBySize(
            sizesRaw,
            product.quantite_par_taille
        );

        const events = (product.events || []).length
            ? product.events
            : (product.evenement || "")
                  .split(",")
                  .map((e) => e.trim())
                  .filter(Boolean);

        const imageUrl = getImageUrl(product);

        // -------------------------
        // HTML du contenu
        // -------------------------
        const html = `
            <div class="modal-product-grid">

                <!-- IMAGE -->
                <div class="modal-left">
                    <img class="modal-main-img"
                         src="${imageUrl}"
                         alt="${title}"
                         onerror="this.src='${CONFIG.placeholder}'">
                </div>

                <!-- INFOS PRODUIT -->
                <div class="modal-right">

                    <h2 class="modal-title">${title}</h2>

                    <div class="modal-price">
                        ${priceLabel}
                    </div>

                    ${type ? `
                        <div class="modal-type">
                            ${type}
                        </div>
                    ` : ""}

                    ${desc ? `
                        <p class="modal-desc">
                            ${desc}
                        </p>
                    ` : ""}

                    <ul class="modal-details">
                        <li><strong>Référence :</strong> ${ref}</li>
                        <li><strong>Métal :</strong> ${metalColor || "Or 9k"} ${metalWeight ? `• ${metalWeight}` : ""}</li>
                        <li><strong>Pierre :</strong> ${stoneType || "Sans pierre"} ${stoneWeight ? `• ${stoneWeight}` : ""}</li>
                    </ul>

                    <!-- TAILLES -->
                    ${
                        sizes.length
                            ? `
                        <div class="modal-sizes">
                            <label for="modal-size-select">Choisir une taille</label>
                            <select id="modal-size-select">
                                <option value="">-- Choisir --</option>
                                ${sizes
                                    .map((s) => {
                                        const q = stockBySize[s];
                                        const disabled = !q;
                                        const label = disabled
                                            ? `${s} (épuisé)`
                                            : `${s} (stock ${q})`;
                                        return `<option value="${s}" ${
                                            disabled ? "disabled" : ""
                                        }>${label}</option>`;
                                    })
                                    .join("")}
                            </select>
                        </div>`
                            : `
                        <div class="modal-sizes">
                            <p>Taille unique ou réglable.</p>
                        </div>`
                    }

                    <!-- BOUTONS -->
                    <div class="modal-actions">
                        <button class="modal-add-cart" id="modal-add-cart-btn" data-ref="${ref}">
                            Ajouter au panier
                        </button>

                        ${
                            product.fabrication_possible === "OUI" ||
                            product.custom_made
                                ? `
                            <button class="modal-fabrication-btn"
                                    id="modal-open-fabrication"
                                    data-ref="${ref}">
                                Fabrication sur mesure
                            </button>`
                                : ""
                        }
                    </div>

                    <!-- EVENTS -->
                    ${
                        events && events.length
                            ? `
                        <div class="modal-events">
                            ${events
                                .map(
                                    (e) =>
                                        `<span class="modal-event-tag">${e}</span>`
                                )
                                .join("")}
                        </div>`
                            : ""
                    }

                </div>
            </div>
        `;

        this.setContent(html);
        this.open();

        // Bind des boutons
        this.bindEvents(product);
    }

    bindEvents(product) {
        const addBtn = document.getElementById("modal-add-cart-btn");
        const sizeSelect = document.getElementById("modal-size-select");

        if (addBtn) {
            addBtn.addEventListener("click", () => {
                let chosenSize = "";

                const sizes = parseSizes(
                    product.tailles_disponibles || product.available_sizes
                );

                if (sizes.length && sizeSelect) {
                    chosenSize = sizeSelect.value;
                    if (!chosenSize) {
                        alert("Veuillez choisir une taille.");
                        return;
                    }
                }

                const ref =
                    addBtn.dataset.ref ||
                    product.reference ||
                    product.REFERENCE ||
                    product.id;

                const key = chosenSize
                    ? `${ref}|size:${chosenSize}`
                    : `${ref}|item`;

                const copy = { ...product };
                if (chosenSize) copy.__size = chosenSize;

                if (window.addToCart) {
                    window.addToCart(key, copy);
                } else {
                    console.warn("addToCart global manquant");
                }

                if (window.updateCartUI) {
                    window.updateCartUI();
                }

                this.close();
            });
        }

        const fabBtn = document.getElementById("modal-open-fabrication");
        if (fabBtn) {
            fabBtn.addEventListener("click", () => {
                if (window.openFabricationModal) {
                    window.openFabricationModal(product);
                    this.close();
                } else {
                    console.warn("openFabricationModal global manquant");
                }
            });
        }
    }
}

console.log("modalView.js EV1 chargé");
