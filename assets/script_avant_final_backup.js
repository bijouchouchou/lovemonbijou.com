/* ======================================
   💍 BIJOUX CHOUCHOU - SCRIPT CORRIGÉ
   Version avec bons noms de colonnes
   ====================================== */

// Configuration
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
const STRIPE_SERVER_URL = "http://localhost:4242";
const FRAIS_LIVRAISON = 5.90;

// Fonction pour normaliser les noms de colonnes (enlève les espaces)
function normalizeColumnName(name) {
    return name.replace(/\s+/g, '_').toLowerCase();
}

// Fonctions existantes
function getCart() {
    const cart = localStorage.getItem("bijouxCart");
    return cart ? JSON.parse(cart) : [];
}

function addToCart(productId, quantite = 1, taille = "Unique") {
    const cart = getCart();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id === productId && item.taille === taille);
        
        if (existingItem) {
            existingItem.quantite += quantite;
        } else {
            cart.push({
                id: productId,
                titre: product.TITRE || product.titre,
                prix: product.prix,
                image: product.image,
                quantite: quantite,
                taille: taille
            });
        }
        
        localStorage.setItem("bijouxCart", JSON.stringify(cart));
        updateCartCount();
        return true;
    }
    return false;
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

function clearCart() {
    if (confirm("Vider le panier ?")) {
        localStorage.removeItem("bijouxCart");
        updatePanierPage();
        updateCartCount();
    }
}

// Affichage détaillé produit avec bons noms de colonnes
function showProductDetails(productId) {
    console.log("Affichage détaillé produit:", productId);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;";
    
    // Récupérer les valeurs avec les bons noms de colonnes
    const couleur = product.couleur || product.COULEUR || "Or jaune";
    const titre = product.TITRE || product.titre || "Produit";
    const poidsOr = product["POIDS OR"] || product.poids_or || "1.40";
    const typePierres = product["type de pierres"] || product.type_pierres || "Diamant";
    const poidsPierre = product["Poids pierre"] || product.poids_pierre || "0.080";
    const description = product.description || "Bijou de qualité artisanale";
    const taillesDisponibles = product["tailles disponibles"] || product.tailles || "48,50,52";
    
    const tailles = taillesDisponibles.split(',').map(t => t.trim());
    const tailleOptions = tailles.map(taille => `<option value="${taille}">${taille}</option>`).join('');
    
    const content = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto; position: relative;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 15px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold;">×</button>
            
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">${titre}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
                <div>
                    <img src="${product.image}" alt="${titre}" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                </div>
                
                <div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>COULEUR:</strong> ${couleur}</p>
                        <p><strong>POIDS OR:</strong> ${poidsOr} g</p>
                        <p><strong>TYPE DE PIERRES:</strong> ${typePierres}</p>
                        <p><strong>POIDS PIERRE:</strong> ${poidsPierre} ct</p>
                        <p><strong>DESCRIPTION:</strong> ${description}</p>
                    </div>
                    
                    <div style="background: #e9ecef; padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">TAILLES DISPONIBLES:</label>
                            <select id="detail-taille" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                                ${tailleOptions}
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">QUANTITÉ:</label>
                            <input type="number" id="detail-quantite" value="1" min="1" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                        </div>
                        
                        <button onclick="addToCartDetailed('${product.id}')" 
                                style="background: #d4af37; color: white; border: none; padding: 15px; width: 100%; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
                            🛒 AJOUTER AU PANIER - ${product.prix}€
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
}

function addToCartDetailed(productId) {
    const taille = document.getElementById("detail-taille").value;
    const quantite = parseInt(document.getElementById("detail-quantite").value);
    
    if (addToCart(productId, quantite, taille)) {
        document.querySelector("div[style*='position: fixed']").remove();
        alert("✅ Produit ajouté au panier !");
        updateCartCount();
    }
}

// Gestion du panier améliorée
function updateCartDisplay() {
    const cart = getCart();
    if (cart.length === 0) {
        return '<div style="text-align: center; padding: 40px; color: #666;"><p>Votre panier est vide</p></div>';
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.prix) * item.quantite), 0);
    const total = subtotal + FRAIS_LIVRAISON;
    
    let itemsHtml = "";
    cart.forEach((item, index) => {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div>
                    <strong>${item.titre}</strong>
                    <div style="color: #666; font-size: 14px;">Taille: ${item.taille || "Unique"} | Quantité: ${item.quantite}</div>
                </div>
                <div style="text-align: right;">
                    <div>${parseFloat(item.prix).toFixed(2)}€ × ${item.quantite}</div>
                    <strong>${(parseFloat(item.prix) * item.quantite).toFixed(2)}€</strong>
                    <button onclick="removeFromCart(${index})" style="margin-left: 10px; background: #ff4444; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">✕</button>
                </div>
            </div>
        `;
    });
    
    return `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>MON PANIER (${cart.reduce((sum, item) => sum + item.quantite, 0)})</h3>
                <button onclick="clearCart()" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🗑️ VIDER LE PANIER</button>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${itemsHtml}
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Sous-total:</span>
                <span>${subtotal.toFixed(2)}€</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Frais de livraison:</span>
                <span>${FRAIS_LIVRAISON.toFixed(2)}€</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2em; font-weight: bold; padding-top: 10px; border-top: 2px solid #ddd;">
                <span>TOTAL:</span>
                <span style="color: #d4af37;">${total.toFixed(2)}€</span>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">📧 EMAIL POUR CONFIRMATION:</label>
                <input type="email" id="customer-email" placeholder="votre@email.com" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="proceedToStripePayment()" style="background: #635bff; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-weight: bold;">💳 PAYER EN LIGNE</button>
                <button onclick="sendEmailOrder()" style="background: #28a745; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-weight: bold;">📧 COMMANDER PAR EMAIL</button>
            </div>
        </div>
    `;
}

function removeFromCart(index) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        localStorage.setItem("bijouxCart", JSON.stringify(cart));
        updatePanierPage();
        updateCartCount();
    }
}

function updatePanierPage() {
    const cartContent = document.getElementById("cart-content");
    if (cartContent) {
        cartContent.innerHTML = updateCartDisplay();
    }
}

// Initialisation
document.addEventListener("DOMContentLoaded", function() {
    console.log("Script Bijoux ChoucHou initialisé");
    
    if (window.location.pathname.includes("panier.html")) {
        updatePanierPage();
    }
    
    // Rendre les images cliquables
    setTimeout(() => {
        const images = document.querySelectorAll(".product-card img");
        images.forEach(img => {
            img.style.cursor = "pointer";
            img.onclick = function() {
                const card = this.closest(".product-card");
                const productId = card ? card.dataset.productId : null;
                if (productId) showProductDetails(productId);
            };
        });
    }, 1000);
});

// Variables globales
let products = [];

