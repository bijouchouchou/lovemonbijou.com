// assets/js/modals/modalView.js
import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";

/* ======================================================
   HELPERS
====================================================== */

function safe(v) {
    return v != null ? String(v).trim() : "";
}

function safeNumber(v) {
    if (v == null || v === "") return 0;
    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
}

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

function parseSizes(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseStockBySize(sizesRaw, stocksRaw) {
    const sizes = parseSizes(sizesRaw);
    const out = {};

    if (!stocksRaw) {
        sizes.forEach((s) => (out[s] = null));
        return out;
    }

    const stocks = String(stocksRaw)
        .split(",")
        .map((x) => parseInt(x.trim(), 10) || 0);

    sizes.forEach((s, i) => {
        out[s] = stocks[i] ?? 0;
    });

    return out;
}

function getImageUrl(product) {
    const ref =
        safe(product.reference) ||
        safe(product.REFERENCE) ||
        safe(product.id);

    return ref ? CONFIG.getCloudinaryUrl(ref) : CONFIG.placeholder;
}

/* ======================================================
   PRODUCT MODAL
====================================================== */

export class ProductModal extends ModalBase {
    constructor(modalId = "product-modal") {
        super(modalId);
        console.log("ProductModal initialisé :", modalId);
    }

    /* -----------------------------
       PUBLIC
    ----------------------------- */

    showProduct(product) {
        if (!product) {
            console.error("ProductModal: produit null");
            return;
        }

        try {
            const data = this.extractProductData(product);
            const html = this.generateProductHTML(data);

            this.setContent(html);
            this.open();
            this.bindEvents(product);

        } catch (err) {
            console.error("Erreur ProductModal:", err);
            this.showError();
        }
    }

    /* -----------------------------
       DATA
    ----------------------------- */
extractProductData(product) {
    const ref = product["REFERENCE"];

    const title = "Bijou en or";

    const titrage = product["TITRE"]; // 9, 18, etc.

    const metalWeightRaw = product["POIDS OR"];
    const stoneWeightRaw = product["Poids pierre"];

    const sizesRaw = product["tailles disponibles"];
    const stockRaw = product["quantité_ par_ taille"];

    return {
        ref,
        title,

        // Titrage
        titrage,

        // Poids
        metalWeight: formatMetalWeight(metalWeightRaw),
        stoneWeight: formatStoneWeightCt(stoneWeightRaw),

        // Pierre
        stoneType: product["type de pierres"] || "",

        // Description
        desc: product["description"] || "",
        type: product["type de bijoux"] || "",

        // Couleur (YG, WG → à styliser plus tard)
        colorLabel: product["couleur"] || "",

        // Prix
        priceLabel: formatPriceEUR(product.price_euros),

        // Tailles
        sizes: parseSizes(sizesRaw),
        stockBySize: parseStockBySize(sizesRaw, stockRaw),

        // Events
        events: (product.evenement || "")
            .split(",")
            .map(e => e.trim())
            .filter(Boolean),

        imageUrl: getImageUrl(product),

        canBeCustomMade: product.fabrication_possible === "OUI"
    };
}

    /* -----------------------------
       HTML
    ----------------------------- */

    generateProductHTML(d) {
        const sizeOptions = (d.sizes || [])
            .map((s) => {
                const q = d.stockBySize?.[s];
                const disabled = !q;
                const label = disabled
                    ? `${s} (épuisé)`
                    : `${s} (stock ${q})`;
                return `<option value="${s}" ${disabled ? "disabled" : ""}>${label}</option>`;
            })
            .join("");

        return `
            <div class="modal-product-grid">

                <div class="modal-left">
                    <img src="${d.imageUrl}"
                         alt="${d.title}"
                         onerror="this.src='${CONFIG.placeholder}'">
                </div>

                <div class="modal-right">

                    <h2 class="modal-title">${d.title}</h2>
                    <div class="modal-price">${d.priceLabel}</div>

                    ${d.type ? `<div class="modal-type">${d.type}</div>` : ""}
                    ${d.desc ? `<p class="modal-desc">${d.desc}</p>` : ""}

                    <ul class="modal-details">
    <li><strong>Titrage :</strong> ${d.titrage ? d.titrage + "k" : "—"}</li>
    <li><strong>Poids or :</strong> ${d.metalWeight || "Non communiqué"}</li>
    <li>
        <strong>Pierre :</strong>
        ${d.stoneType || "Sans pierre"}
        ${d.stoneWeight || ""}
    </li>
    <li><strong>Couleur :</strong> ${d.colorLabel || "—"}</li>
</ul>


                    ${
                        d.sizes.length
                            ? `
                            <div class="modal-sizes">
                                <label for="modal-size-select">Choisir une taille</label>
                                <select id="modal-size-select">
                                    <option value="">-- Choisir --</option>
                                    ${sizeOptions}
                                </select>
                            </div>
                            `
                            : `<p>Taille unique ou réglable.</p>`
                    }

                    <div class="modal-actions">
                        <button id="modal-add-cart-btn" class="modal-add-cart">
                            Ajouter au panier
                        </button>

                        ${
                            d.canBeCustomMade
                                ? `<button id="modal-open-fabrication"
                                          class="modal-fabrication-btn">
                                      Fabrication sur mesure
                                   </button>`
                                : ""
                        }
                    </div>

                </div>
            </div>
        `;
    }

    /* -----------------------------
       EVENTS
    ----------------------------- */

    bindEvents(product) {
        const addBtn = document.getElementById("modal-add-cart-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => this.handleAddToCart(product));
        }

        const fabBtn = document.getElementById("modal-open-fabrication");
        if (fabBtn) {
            fabBtn.addEventListener("click", () => {
                if (window.openFabricationModal) {
                    window.openFabricationModal(product);
                    this.close();
                }
            });
        }
    }

    handleAddToCart(product) {
        if (window.addToCart) {
            window.addToCart(
                product.reference || product.id,
                product
            );
        }
        this.close();
    }

    showError() {
        this.setContent("<p>Produit indisponible.</p>");
        this.open();
    }
}

console.log("modalView.js chargé (EV1 stable)");
