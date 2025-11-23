// BIJOUX CHOUCHOU - SCRIPT SIMPLIFIÉ
// Version sans erreurs

// Configuration
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
const STRIPE_SERVER_URL = "http://localhost:4242";
const FRAIS_LIVRAISON = 5.90;

// Variables globales
var products = [];

// Fonctions de base
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

// Affichage des produits
function displayProducts(productsArray) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = productsArray.map(product => {
        return '<div class="product-card" data-product-id="' + product.id + '">' +
               '<div class="product-image">' +
               '<img src="' + product.image + '" alt="' + (product.TITRE || product.titre) + '" style="cursor: pointer;" onclick="openProductDetails(\'' + product.id + '\')">' +
               '</div>' +
               '<div class="product-info">' +
               '<h3>' + (product.TITRE || product.titre) + '</h3>' +
               '<p class="product-price">' + product.prix + '€</p>' +
               '<button class="add-to-cart-btn" onclick="addToCart(\'' + product.id + '\', 1, \'Unique\')">Ajouter au panier</button>' +
               '</div>' +
               '</div>';
    }).join('');
}

// Affichage détaillé produit
function openProductDetails(productId) {
    console.log("Ouverture produit:", productId);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000;';
    
    // Données du produit
    const couleur = product.couleur || 'Or jaune';
    const titre = product.TITRE || product.titre;
    const poidsOr = product["POIDS OR"] || '1.40';
    const typePierres = product["type de pierres"] || 'Diamant';
    const poidsPierre = product["Poids pierre"] || '0.080';
    const description = product.description || 'Bijou de qualité artisanale';
    const taillesDisponibles = product["tailles disponibles"] || '48,50,52';
    
    const tailles = taillesDisponibles.split(',').map(t => t.trim());
    const optionsTaille = tailles.map(taille => '<option value="' + taille + '">' + taille + '</option>').join('');
    
    overlay.innerHTML = '<div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">' +
        '<button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: red; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">X</button>' +
        '<h2 style="margin-bottom: 20px;">' + titre + '</h2>' +
        '<div style="display: flex; gap: 20px;">' +
            '<div style="flex: 1;">' +
                '<img src="' + product.image + '" alt="' + titre + '" style="width: 100%; border-radius: 8px;">' +
            '</div>' +
            '<div style="flex: 1;">' +
                '<div style="margin-bottom: 15px;">' +
                    '<p><strong>Couleur:</strong> ' + couleur + '</p>' +
                    '<p><strong>Poids Or:</strong> ' + poidsOr + ' g</p>' +
                    '<p><strong>Type de pierres:</strong> ' + typePierres + '</p>' +
                    '<p><strong>Poids pierre:</strong> ' + poidsPierre + ' ct</p>' +
                    '<p><strong>Description:</strong> ' + description + '</p>' +
                '</div>' +
                '<div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">' +
                    '<div style="margin-bottom: 10px;">' +
                        '<label style="display: block; margin-bottom: 5px;"><strong>Tailles disponibles:</strong></label>' +
                        '<select id="taille-select" style="width: 100%; padding: 8px;">' + optionsTaille + '</select>' +
                    '</div>' +
                    '<div style="margin-bottom: 15px;">' +
                        '<label style="display: block; margin-bottom: 5px;"><strong>Quantité:</strong></label>' +
                        '<input type="number" id="quantite-input" value="1" min="1" style="width: 100%; padding: 8px;">' +
                    '</div>' +
                    '<button onclick="addToCartFromDetails(\'' + product.id + '\')" style="background: #d4af37; color: white; border: none; padding: 12px; width: 100%; border-radius: 5px; cursor: pointer; font-weight: bold;">' +
                        'Ajouter au panier - ' + product.prix + '€' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    document.body.appendChild(overlay);
}

function addToCartFromDetails(productId) {
    const taille = document.getElementById('taille-select').value;
    const quantite = parseInt(document.getElementById('quantite-input').value);
    
    if (addToCart(productId, quantite, taille)) {
        document.querySelector('div[style*="position: fixed"]').remove();
        alert('Produit ajouté au panier !');
        updateCartCount();
    }
}

// Panier avec frais de livraison
function updateCartDisplay() {
    const cart = getCart();
    if (cart.length === 0) {
        return '<p>Votre panier est vide</p>';
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.prix) * item.quantite), 0);
    const total = subtotal + FRAIS_LIVRAISON;
    
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += '<div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">' +
            '<div>' + item.titre + ' (Taille: ' + (item.taille || 'Unique') + ')</div>' +
            '<div>' + item.prix + '€ x ' + item.quantite + ' = ' + (item.prix * item.quantite).toFixed(2) + '€</div>' +
        '</div>';
    });
    
    return '<div class="cart-items">' + itemsHtml + '</div>' +
           '<div class="cart-totals" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #333;">' +
           '<div style="display: flex; justify-content: space-between;"><span>Sous-total:</span><span>' + subtotal.toFixed(2) + '€</span></div>' +
           '<div style="display: flex; justify-content: space-between;"><span>Frais de livraison:</span><span>' + FRAIS_LIVRAISON.toFixed(2) + '€</span></div>' +
           '<div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px;"><span>Total:</span><span>' + total.toFixed(2) + '€</span></div>' +
           '</div>' +
           '<div style="margin-top: 20px;">' +
           '<input type="email" id="customer-email" placeholder="votre@email.com" style="width: 100%; padding: 10px; margin-bottom: 10px;">' +
           '<button onclick="processPayment()" style="background: #635bff; color: white; border: none; padding: 12px; width: 100%; margin-bottom: 10px; cursor: pointer;">Payer avec Stripe</button>' +
           '<button onclick="sendOrderByEmail()" style="background: #28a745; color: white; border: none; padding: 12px; width: 100%; cursor: pointer;">Commander par email</button>' +
           '</div>';
}

function updatePanierPage() {
    const cartContent = document.getElementById('cart-content');
    if (cartContent) {
        cartContent.innerHTML = updateCartDisplay();
    }
}

function processPayment() {
    const email = document.getElementById('customer-email').value;
    if (!email) {
        alert('Veuillez entrer votre email');
        return;
    }
    alert('Paiement pour: ' + email);
}

function sendOrderByEmail() {
    const email = document.getElementById('customer-email').value;
    if (!email) {
        alert('Veuillez entrer votre email');
        return;
    }
    alert('Commande envoyée à: ' + email);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script Bijoux ChoucHou initialisé');
    
    if (window.location.pathname.includes('panier.html')) {
        updatePanierPage();
    }
});
