// ============================================
// MODAL VIEW — EV1 STABLE
// ============================================

export class ProductModal {
    constructor(modalId = "product-modal") {
        this.modal = document.getElementById(modalId);
        this.content = this.modal?.querySelector(".modal-content");

        if (!this.modal || !this.content) {
            console.error("ProductModal: structure HTML manquante");
            return;
        }

        this.bindBaseEvents();
        console.log("ProductModal initialisé :", modalId);
    }

    // -----------------------------------------
    // OPEN / CLOSE
    // -----------------------------------------

    open() {
        this.modal.style.display = "flex";
        this.modal.setAttribute("aria-hidden", "false");
    }

    close() {
        this.modal.style.display = "none";
        this.modal.setAttribute("aria-hidden", "true");
        this.content.innerHTML = "";
    }

    bindBaseEvents() {
        const closeBtn = this.modal.querySelector(".close-modal");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.close());
        }

        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    // -----------------------------------------
    // MAIN ENTRY
    // -----------------------------------------

    showProduct(product) {
    // 🔒 Validation EV1
    if (!product || (!product.id && !product.reference && !product.ref)) {
        console.error("showProduct: produit invalide", product);
        return;
    }

    // 🔑 Identifiant unique garanti
    const productId = product.id || product.reference || product.ref;

    try {
        // Génération HTML
        const html = this.render(product);

        // Injection
        this.content.innerHTML = html;

        // Ouverture modale
        this.open();

        // Bind des événements (panier, sur mesure, fermeture…)
        this.bindProductEvents(product);

        // Debug utile
        console.log("🪟 Modale ouverte pour :", productId);

    } catch (err) {
        console.error("showProduct: erreur rendu modale", err, product);
    }
}


    // -----------------------------------------
    // RENDER
    // -----------------------------------------

    render(p) {
        const sizes = p.available_sizes || [];
        const stockBySize = p.stock_by_size || {};

        const sizeOptions = sizes.map(size => {
            const qty = stockBySize[size] ?? 0;
            const disabled = qty <= 0;
            return `
                <option value="${size}" ${disabled ? "disabled" : ""}>
                    ${size}${disabled ? " (épuisé)" : ""}
                </option>
            `;
        }).join("");

        return `
            <div class="modal-grid">

                <div class="modal-images">
                    <img class="main-img"
                         src="${p.image}"
                         alt="${p.titleLabel || "Bijou"}"
                         onerror="this.src='assets/images/placeholder.png'">
                </div>

                <div class="modal-info">
                    <h2>${p.titleLabel || "Bijou"}</h2>

                    <div class="price">${p.price} €</div>

                    <p><strong>Type :</strong> ${p.type || "—"}</p>
                   <p>
  <strong>Pierre :</strong>
  ${p.stone_type || "Sans pierre"}
  ${Number(p.stone_weight) > 0
      ? ` • ${Number(p.stone_weight).toFixed(3)} ct`
      : ""}
</p>



                    <p><strong>Poids or :</strong> ${p.metal_weight ? p.metal_weight + " g" : "—"}</p>
                    <p><strong>Couleur :</strong> ${p.colorLabel || "—"}</p>

                    ${
                        sizes.length
                            ? `
                                <div class="sizes-area">
                                    <label for="modal-size-select">Taille</label>
                                    <select id="modal-size-select">
                                        <option value="">Choisir</option>
                                        ${sizeOptions}
                                    </select>
                                </div>
                              `
                            : `<p>Taille unique</p>`
                    }

                    <div class="modal-actions">
                        <button id="modal-add-cart-btn">
                            Ajouter au panier
                        </button>

                        ${
                            p.fabrication_possible
                                ? `<button id="modal-custom-btn">Sur mesure</button>`
                                : ""
                        }
                    </div>
                </div>

            </div>
        `;
    }

    // -----------------------------------------
    // EVENTS
    // -----------------------------------------

    bindProductEvents(product) {
        const addBtn = document.getElementById("modal-add-cart-btn");
        const sizeSelect = document.getElementById("modal-size-select");
        const customBtn = document.getElementById("modal-custom-btn");

        if (addBtn) {
            addBtn.addEventListener("click", () => {
                let chosenSize = null;

                if (sizeSelect) {
                    chosenSize = sizeSelect.value;
                    if (!chosenSize) {
                        alert("Veuillez choisir une taille");
                        return;
                    }
                }

                const item = { ...product };
                if (chosenSize) item.__size = chosenSize;

                if (window.addToCart) {
                    window.addToCart(product.id, item);
                }

                this.close();
            });
        }

        if (customBtn) {
            customBtn.addEventListener("click", () => {
                if (window.openFabricationModal) {
                    window.openFabricationModal(product);
                }
                this.close();
            }