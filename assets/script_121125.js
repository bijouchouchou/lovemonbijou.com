// ======================================================
// 💎 BIJOUX CHOUCHOU - SCRIPT FINAL 2025
// ======================================================

// === 🌍 CONFIGURATION DES SOURCES DE DONNÉES ===
const hostname = window.location.hostname;
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

const CSV_URL = isLocal
  ? "http://localhost:4242/csv"
  : "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";

const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";

// ✅ Log clair pour suivi
if (isLocal) {
  console.log("📦 Mode développement : chargement du CSV via le proxy local →", CSV_URL);
} else {
  console.log("🌍 Mode production : chargement du CSV depuis Google Sheets →", CSV_URL);
}

// === ⚠️ Gestion d’erreur visuelle pour le chargement des produits ===
function showLoadError(message = "Impossible de charger les produits.") {
  console.error("⚠️ " + message);
  const grid = document.getElementById("products-grid");
  if (grid) {
    grid.innerHTML = `
      <div style="
        text-align:center;
        padding:40px;
        font-size:18px;
        color:#b00;
        background:#fff8f8;
        border:1px solid #f5c2c2;
        border-radius:8px;
      ">
        ⚠️ ${message}<br>
        <small>Vérifiez votre connexion ou réessayez plus tard.</small>
      </div>
    `;
  }
}

// (le reste de ton script continue ici 👇)

const FRAIS_LIVRAISON = 7.90;
const LIMITE_LIVRAISON_GRATUITE = 150;
const EMAILJS_SERVICE_ID = "service_xafynxq";
const EMAILJS_TEMPLATE_ID = "template_8xmiwsj";
const EMAILJS_PUBLIC_KEY = "m#Ahx/458aFJ$7Y!";

// ✅ Log clair pour le mode actif
if (window.location.hostname === "localhost") {
  console.log("📦 Mode développement : chargement du CSV via le proxy local →", CSV_URL);
} else {
  console.log("🌍 Mode production : chargement du CSV depuis Google Sheets →", CSV_URL);
}

// === 🛒 GESTION DU PANIER ===
function getCart() {
  const cart = localStorage.getItem("bijouxCart");
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem("bijouxCart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, quantite = 1, taille = "Unique") {
  const cart = getCart();
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id && i.taille === taille);
  if (existing) {
    existing.quantite += quantite;
  } else {
    cart.push({
      id,
      titre: product.titre,
      prix: product.prix,
      image: product.image,
      quantite,
      taille
    });
  }

  saveCart(cart);
  alert(`${product.titre} ajouté au panier !`);
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.quantite, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = total;
}

function clearCart() {
  if (confirm("Vider le panier ?")) {
    localStorage.removeItem("bijouxCart");
    updateCartCount();
    updatePanierPage();
  }
}

// === 💌 ENVOI PAR EMAIL ===
async function sendOrderByEmail() {
  const email = document.getElementById("customer-email").value;
  if (!email) return alert("Veuillez entrer votre email.");

  const cart = getCart();
  if (cart.length === 0) return alert("Votre panier est vide.");

  const total = cart.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const frais = total >= LIMITE_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;

  const details = cart.map(i => `${i.titre} (${i.taille}) x${i.quantite} = ${(i.prix * i.quantite).toFixed(2)}€`).join("\n");

  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      user_email: email,
      order_details: details,
      total: (total + frais).toFixed(2)
    });
    alert("Commande envoyée par email ✅");
    clearCart();
  } catch (e) {
    console.error("Erreur EmailJS:", e);
    alert("⚠️ Erreur lors de l’envoi de la commande.");
  }
}

// === 💳 PAIEMENT (test) ===
function processPayment() {
  const email = document.getElementById("customer-email").value;
  if (!email) return alert("Veuillez entrer votre email.");
  alert(`Paiement simulé pour ${email}. Merci pour votre confiance 💖`);
}

// === 🖼️ PRODUITS ===
let products = [];

async function loadProducts() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("Erreur HTTP lors du chargement du CSV");

    const text = await res.text();
    const rows = text.split("\n").slice(1).filter(r => r.trim() !== "");

    products = rows.map((row, index) => {
      const cols = row.split(",");

      // 🧩 Alignement des colonnes CSV
      const reference = cols[0]?.trim();
      const type = cols[1]?.trim();
      const description = cols[2]?.trim() || "Bijou d’exception";
      const imageCol = cols[3]?.trim(); // colonne "image" souvent vide
      const titre = cols[5]?.trim() || type || reference || "Produit sans nom";
      const prix = parseFloat(cols[12]) || 0; // colonne "price €"

      // 🖼️ Construction de l’URL de l’image
      let imageName = imageCol || `${reference}.png`;
      if (!imageName.match(/\.(png|jpg|jpeg|webp)$/i)) {
        imageName = `${imageName}.png`;
      }
      const imageUrl = imageName.startsWith("http")
        ? imageName
        : `${CLOUDINARY_BASE}${imageName}`;

      console.log(`🖼️ Image du produit [${titre}] → ${imageUrl}`);

      return {
        id: index + 1,
        reference,
        titre,
        type,
        prix,
        description,
        image: imageUrl,
        tailles: cols[9]?.trim() || "Unique",
        couleur: cols[4]?.trim() || "Or jaune"
      };
    });

    displayProducts(products);
    console.log(`🪙 ${products.length} produits chargés avec succès.`);
  } catch (e) {
    console.error("⚠️ Impossible de charger les produits :", e);
    alert("⚠️ Impossible de charger les produits — vérifiez le serveur ou le CSV.");
  }
}


// === 🧾 PANIER PAGE ===
function updatePanierPage() {
  const content = document.getElementById("cart-content");
  if (!content) return;
  const cart = getCart();
  if (cart.length === 0) {
    content.innerHTML = "<p>Votre panier est vide.</p>";
    return;
  }

  const sousTotal = cart.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const frais = sousTotal >= LIMITE_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;
  const total = sousTotal + frais;

  content.innerHTML = `
    <div class="cart-items">
      ${cart
        .map(
          i => `
        <div class="cart-item">
          <img src="${i.image}" alt="${i.titre}">
          <div class="cart-item-info">
            <h4>${i.titre}</h4>
            <p>Taille: ${i.taille}</p>
            <p>${i.prix.toFixed(2)}€ × ${i.quantite}</p>
          </div>
        </div>`
        )
        .join("")}
    </div>

    <div class="cart-footer">
      <p><strong>Sous-total :</strong> ${sousTotal.toFixed(2)}€</p>
      <p><strong>Frais de livraison estimés :</strong> ${
        frais === 0 ? "Offerts 🎁" : frais.toFixed(2) + "€"
      }</p>
      <p><strong>Total :</strong> ${total.toFixed(2)}€</p>

      <div class="cart-email-input">
        <label for="customer-email">Votre email :</label>
        <input type="email" id="customer-email" placeholder="votre@email.com" />
      </div>

      <button class="cart-checkout-btn" onclick="processPayment()">💳 Payer</button>
      <button class="cart-email-btn" onclick="sendOrderByEmail()">📧 Commander par email</button>
      <button class="cart-clear" onclick="clearCart()">🗑️ Vider le panier</button>
    </div>
  `;
}

// === 🚀 INITIALISATION ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Bijoux ChouChou initialisé");
  updateCartCount();

  if (document.getElementById("products-grid")) loadProducts();
  if (document.getElementById("cart-content")) updatePanierPage();
});
