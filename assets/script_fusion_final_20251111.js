// ============================================================================
//  BIJOUX CHOUCHOU - SCRIPT FUSION INTELLIGENTE
//  Version finale du 11 novembre 2025
//  Fusion de toutes les versions précédentes
//  Encodage : UTF-8 sans BOM
//  Mode debug activable via DEBUG_MODE = true
// ============================================================================

// === Mode Débogage ===
const DEBUG_MODE = true;
function debugLog(...args) {
    if (DEBUG_MODE) console.log("[DEBUG]", ...args);
}

// === Configuration principale ===
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
const STRIPE_SERVER_URL = "http://localhost:4242";
const FRAIS_LIVRAISON = 5.90;

// === Variables globales ===
let products = [];

// ============================================================================
// 🛒 Gestion du panier (LocalStorage)
// ============================================================================
function getCart() {
    const cart = localStorage.getItem("bijouxCart");
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem("bijouxCart", JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantite, 0);
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? "inline" : "none";
    }
}

function addToCart(productId, quantite = 1, taille = "Unique") {
    const cart = getCart();
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    const existingItem = cart.find(item => item.id === productId && item.taille === taille);
    if (existingItem) {
        existingItem.quantite += quantite;
        debugLog("Quantité mise à jour pour :", productId);
    } else {
        cart.push({
            id: productId,
            titre: product.TITRE || product.titre,
            prix: parseFloat(product.prix),
            image: product.image,
            quantite: quantite,
            taille: taille
        });
        debugLog("Produit ajouté au panier :", productId);
    }
    saveCart(cart);
    updateCartCount();
    return true;
}

function clearCart() {
    if (confirm("Vider le panier ?")) {
        localStorage.removeItem("bijouxCart");
        updateCartCount();
        const cartContent = document.getElementById("cart-content");
        if (cartContent) cartContent.innerHTML = "<p>Votre panier est vide.</p>";
        debugLog("Panier vidé");
    }
}
// ============================================================================
// 💍 Affichage des produits
// ============================================================================
function displayProducts(productsArray) {
    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) return;

    productsGrid.innerHTML = productsArray.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.TITRE || product.titre}" style="cursor: pointer;" onclick="openProductDetails('${product.id}')">
            </div>
            <div class="product-info">
                <h3>${product.TITRE || product.titre}</h3>
                <p class="product-price">${product.prix} €</p>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}', 1, 'Unique')">Ajouter au panier</button>
            </div>
        </div>
    `).join("");

    debugLog("Produits affichés :", productsArray.length);
}

// ============================================================================
// 🪞 Modale produit (détails, tailles, ajout au panier)
// ============================================================================
function openProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex; justify-content: center; align-items: center;
        z-index: 1000;
    `;

    const couleur = product.couleur || "Or jaune";
    const titre = product.TITRE || product.titre;
    const poidsOr = product["POIDS OR"] || "1.40";
    const typePierres = product["type de pierres"] || "Diamant";
    const poidsPierre = product["Poids pierre"] || "0.080";
    const description = product.description || "Bijou de qualité artisanale";
    const taillesDisponibles = product["tailles disponibles"] || "48,50,52";

    const tailles = taillesDisponibles.split(",").map(t => t.trim());
    const optionsTaille = tailles.map(taille => `<option value="${taille}">${taille}</option>`).join("");

    overlay.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: red; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">X</button>
            <h2 style="margin-bottom: 20px;">${titre}</h2>
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <img src="${product.image}" alt="${titre}" style="width: 100%; border-radius: 8px;">
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 15px;">
                        <p><strong>Couleur:</strong> ${couleur}</p>
                        <p><strong>Poids Or:</strong> ${poidsOr} g</p>
                        <p><strong>Type de pierres:</strong> ${typePierres}</p>
                        <p><strong>Poids pierre:</strong> ${poidsPierre} ct</p>
                        <p><strong>Description:</strong> ${description}</p>
                    </div>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                        <div style="margin-bottom: 10px;">
                            <label><strong>Tailles disponibles:</strong></label>
                            <select id="taille-select" style="width: 100%; padding: 8px;">${optionsTaille}</select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label><strong>Quantité:</strong></label>
                            <input type="number" id="quantite-input" value="1" min="1" style="width: 100%; padding: 8px;">
                        </div>
                        <button onclick="addToCartFromDetails('${product.id}')" style="background: #d4af37; color: white; border: none; padding: 12px; width: 100%; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            Ajouter au panier - ${product.prix} €
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    debugLog("Modale ouverte pour :", titre);
}

function addToCartFromDetails(productId) {
    const taille = document.getElementById("taille-select").value;
    const quantite = parseInt(document.getElementById("quantite-input").value);
    if (addToCart(productId, quantite, taille)) {
        document.querySelector('div[style*="position: fixed"]').remove();
        alert("Produit ajouté au panier !");
        updateCartCount();
        debugLog("Ajout via modale :", productId, taille, quantite);
    }
}
// ============================================================================
// 🧾 Affichage et mise à jour du panier
// ============================================================================
function updateCartDisplay() {
    const cart = getCart();
    const cartContent = document.getElementById("cart-content");
    if (!cartContent) return;

    if (cart.length === 0) {
        cartContent.innerHTML = "<p>Votre panier est vide.</p>";
        debugLog("Panier vide");
        return;
    }

    let subtotal = 0;
    let itemsHtml = "";

    cart.forEach(item => {
        const itemTotal = parseFloat(item.prix) * item.quantite;
        subtotal += itemTotal;
        itemsHtml += `
            <div class="cart-item" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                <div>${item.titre} (Taille: ${item.taille || "Unique"})</div>
                <div>${item.prix} € x ${item.quantite} = ${itemTotal.toFixed(2)} €</div>
            </div>
        `;
    });

    const total = subtotal + FRAIS_LIVRAISON;

    cartContent.innerHTML = `
        <div class="cart-items">${itemsHtml}</div>
        <div class="cart-totals" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #333;">
            <div style="display: flex; justify-content: space-between;">
                <span>Sous-total:</span><span>${subtotal.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Frais de livraison:</span><span>${FRAIS_LIVRAISON.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px;">
                <span>Total:</span><span>${total.toFixed(2)} €</span>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <input type="email" id="customer-email" placeholder="votre@email.com" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <button onclick="processPayment()" style="background: #635bff; color: white; border: none; padding: 12px; width: 100%; margin-bottom: 10px; cursor: pointer;">Payer avec Stripe</button>
            <button onclick="sendOrderByEmail()" style="background: #28a745; color: white; border: none; padding: 12px; width: 100%; cursor: pointer;">Commander par email</button>
            <button onclick="clearCart()" style="background: #ff4d4d; color: white; border: none; padding: 12px; width: 100%; cursor: pointer; margin-top: 10px;">Vider le panier</button>
        </div>
    `;

    debugLog("Panier affiché :", cart.length, "articles");
}

function updatePanierPage() {
    const cartContent = document.getElementById("cart-content");
    if (cartContent) updateCartDisplay();
}

// ============================================================================
// 💳 Traitement du paiement (Stripe / Email simulation)
// ============================================================================
function processPayment() {
    const email = document.getElementById("customer-email").value;
    if (!email) {
        alert("Veuillez entrer votre email avant de continuer le paiement.");
        return;
    }
    alert(`Paiement initié pour : ${email}\n(Mode test pour l’instant)`);
    debugLog("Paiement simulé pour :", email);
}

function sendOrderByEmail() {
    const email = document.getElementById("customer-email").value;
    if (!email) {
        alert("Veuillez entrer votre email avant d’envoyer la commande.");
        return;
    }
    alert(`Commande envoyée à : ${email}\n(Vérifiez votre boîte mail)`);
    debugLog("Commande envoyée par email :", email);
}
// ============================================================================
// 📦 Chargement des produits depuis le CSV
// ============================================================================
async function loadProducts() {
    debugLog("Chargement du CSV depuis :", CSV_URL);

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("Erreur de chargement du fichier CSV");

        const data = await response.text();
        const rows = data.split("\n").filter(r => r.trim().length > 0);
        const headers = rows[0].split(",");

        products = rows.slice(1).map(row => {
            const values = row.split(",");
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] ? values[i].trim() : "";
            });
            return obj;
        });

        displayProducts(products);
        debugLog("Produits chargés :", products.length);
    } catch (error) {
        console.error("Erreur lors du chargement des produits :", error);
        const grid = document.getElementById("products-grid");
        if (grid) {
            grid.innerHTML = `<p style="color:red;">Erreur de chargement des produits. Vérifiez le lien CSV.</p>`;
        }
    }
}

// ============================================================================
// ⚙️ Fonctions utilitaires diverses
// ============================================================================
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    debugLog("Défilement vers le haut");
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2) + " €";
}

// ============================================================================
// 🚀 Initialisation au chargement de la page
// ============================================================================
document.addEventListener("DOMContentLoaded", function () {
    console.log("Script Bijoux ChouChou initialisé ✅");

    if (window.location.pathname.includes("panier.html")) {
        updatePanierPage();
    } else {
        loadProducts();
    }

    updateCartCount();

    // Rendre les images cliquables (sécurité double)
    setTimeout(() => {
        const images = document.querySelectorAll(".product-card img");
        images.forEach(img => {
            img.style.cursor = "pointer";
            img.onclick = function () {
                const card = this.closest(".product-card");
                const productId = card ? card.dataset.productId : null;
                if (productId) openProductDetails(productId);
            };
        });
    }, 1000);

    debugLog("Initialisation DOM terminée");
});
// ============================================================================
// 🧩 Fonctions extensibles pour futures évolutions
// ============================================================================

// Exemple : bouton "Fabrication" (à définir selon logique métier)
function handleFabrication(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert("Produit introuvable pour fabrication.");
        return;
    }
    alert(`Commande spéciale lancée pour la fabrication du bijou : ${product.TITRE || product.titre}`);
    debugLog("Fabrication déclenchée pour :", productId);
}

// Exemple : futur filtre produits (par prix, taille, pierre, couleur)
function filterProducts(criteria = {}) {
    let filtered = [...products];

    if (criteria.couleur) {
        filtered = filtered.filter(p => (p.couleur || "").toLowerCase() === criteria.couleur.toLowerCase());
    }

    if (criteria.taille) {
        filtered = filtered.filter(p => (p["tailles disponibles"] || "").includes(criteria.taille));
    }

    if (criteria.prixMin || criteria.prixMax) {
        filtered = filtered.filter(p => {
            const prix = parseFloat(p.prix || 0);
            return prix >= (criteria.prixMin || 0) && prix <= (criteria.prixMax || 99999);
        });
    }

    displayProducts(filtered);
    debugLog("Filtrage appliqué :", criteria);
}

// ============================================================================
// ✅ Fin du script fusionné - BIJOUX CHOUCHOU
// ============================================================================
// Notes pour le développement futur :
//
// 🔹 Étapes recommandées :
// 1. Vérifier l’intégration du script dans index.html → <script src="assets/script.js">
// 2. Contrôler l’encodage UTF-8 de index.html et style.css.
// 3. Tester :
//    - L’affichage des produits
//    - L’ouverture de la modale
//    - L’ajout au panier
//    - La persistance du panier après rechargement
//    - Le panier sur panier.html
//    - Les boutons Stripe / Email
//
// 🔹 Améliorations prévues :
// - Intégration Stripe / PayPal / Alma
// - Filtres dynamiques produits
// - Animations d’apparition (Framer Motion ou CSS)
// - Mode sombre
// - Accessibilité renforcée (a11y)
//
// 🔹 Mode Debug :
//   - Activer/désactiver en modifiant : const DEBUG_MODE = true/false
//
// ============================================================================

