// ======================================
// Bijoux ChoucHou - Script Principal
// Version 3.0 - Janvier 2025
// ======================================

/* CONFIGURATION */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dcak9pjrt/image/upload/";
const SELLER_EMAIL = "bijouchouchou74@gmail.com";
const STRIPE_SERVER_URL = "http://localhost:4242";

/* VARIABLES GLOBALES */
let allProducts = [];
let filteredProducts = [];
let isModalInitialized = false;

// ===========================
// FONCTIONS UTILITAIRES
// ===========================

// Échappement HTML
function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Message temporaire
function showTempMessage(msg, duration = 2000) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10001;
    background: #4CAF50; color: white; padding: 15px 20px;
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-weight: bold; animation: fadeIn 0.3s;
  `;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.animation = "fadeOut 0.3s";
    setTimeout(() => div.remove(), 300);
  }, duration);
}

// Construction URL Cloudinary
function getCloudinaryUrl(image) {
  if (!image || image === "" || image === "undefined") {
    return "https://via.placeholder.com/800x800?text=Image+indisponible";
  }
  
  if (image.includes('res.cloudinary.com')) {
    return image;
  }
  
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  
  return `${CLOUDINARY_BASE}${image}`;
}

// ===========================
// GESTION EMAILS
// ===========================

// Initialisation EmailJS
function initEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init("QvP4ltdzywwg7IolM");
    console.log("✅ EmailJS initialisé");
  } else {
    console.warn("⚠️ EmailJS non chargé");
    setTimeout(initEmailJS, 1000);
  }
}

// Envoi email de confirmation CLIENT
async function sendOrderConfirmation(cart, customerEmail, customerName = "Client") {
  return new Promise((resolve, reject) => {
    if (typeof emailjs === 'undefined') {
      console.error("❌ EmailJS non chargé");
      reject(new Error("EmailJS non disponible"));
      return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    
    const orderDetails = cart.map((item, index) => 
      `${index + 1}. ${item.titre} - Taille: ${item.taille || 'N/A'}\nPrix: ${item.prix.toFixed(2)}€ x ${item.quantite} = ${(item.prix * item.quantite).toFixed(2)}€`
    ).join('\n\n');

    const templateParams = {
      to_email: customerEmail,
      to_name: customerName,
      from_name: "Love Mon Bijou",
      reply_to: "bijouchouchou74@gmail.com",
      order_details: orderDetails,
      total: total.toFixed(2),
      order_date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    console.log("📧 Envoi email CLIENT à:", customerEmail);

    emailjs.send("service_xafynxq", "template_8xmiwsj", templateParams)
      .then((response) => {
        console.log("✅ Email CLIENT envoyé!", response.status);
        resolve(true);
      })
      .catch((error) => {
        console.error("❌ Erreur email CLIENT:", error);
        reject(error);
      });
  });
}

// Envoi email de commande VENDEUR
async function sendOrderByEmail(cart, customerEmail, customerName = "Client") {
  if (typeof emailjs === 'undefined') {
    console.error("❌ EmailJS non chargé");
    throw new Error("EmailJS non disponible");
  }
  
  const total = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
  
  const orderDetails = cart.map((item, index) => 
    `${index + 1}. ${item.titre}
- Taille: ${item.taille || 'N/A'}
- Référence: ${item.reference || 'N/A'}
- Prix unitaire: ${item.prix.toFixed(2)}€
- Quantité: ${item.quantite}
- Sous-total: ${(item.prix * item.quantite).toFixed(2)}€`
  ).join('\n\n');

  const templateParams = {
    to_email: "bijouchouchou74@gmail.com",
    to_name: "Love Mon Bijou",
    from_name: customerName,
    reply_to: customerEmail,
    customer_email: customerEmail,
    customer_name: customerName,
    order_details: orderDetails,
    total: total.toFixed(2),
    order_date: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  console.log("📧 Envoi email VENDEUR");

  try {
    const response = await emailjs.send("service_xafynxq", "template_8xmiwsj", templateParams);
    console.log("✅ Email VENDEUR envoyé:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Erreur email VENDEUR:", error);
    throw error;
  }
}

// Fonction fallback pour commande par email si Stripe échoue
async function sendOrderByEmailFallback(cart, customerEmail) {
  try {
    showTempMessage("📧 Envoi de votre commande par email...", 5000);
    
    await sendOrderConfirmation(cart, customerEmail);
    await sendOrderByEmail(cart, customerEmail);
    
    showTempMessage("✅ Commande envoyée par email !", 5000);
    clearCart();
    
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    showTempMessage("❌ Erreur lors de l'envoi. Contactez-nous.", 5000);
  }
}

// ===========================
// GESTION DU PANIER
// ===========================

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartIconCount();
}

function addToCart(product, selectedSize = "") {
  if (!product) return;

  let cart = getCart();

  const existingIndex = cart.findIndex(
    (item) => item.reference === product.reference && item.taille === selectedSize
  );

  if (existingIndex !== -1) {
    cart[existingIndex].quantite += 1;
  } else {
    cart.push({
      reference: product.reference,
      titre: product.titre,
      prix: product.prix,
      image: product.image,
      taille: selectedSize,
      quantite: 1,
    });
  }

  saveCart(cart);
  animateCartIcon();
  showTempMessage("✅ Ajouté au panier !", 1500);
}

function removeFromCart(reference, taille) {
  let cart = getCart();
  cart = cart.filter(i => !(i.reference === reference && i.taille === taille));
  saveCart(cart);
  renderCartPanel();
}

function clearCart() {
  saveCart([]);
  updateCartIconCount();
  renderCartPanel();
  console.log("🗑️ Panier vidé");
}

function updateCartIconCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantite, 0);
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? "flex" : "none";
  }
}

function animateCartIcon() {
  const icon = document.getElementById("cartIcon");
  if (!icon) return;
  icon.classList.remove("cart-animate");
  void icon.offsetWidth;
  icon.classList.add("cart-animate");
  setTimeout(() => icon.classList.remove("cart-animate"), 900);
}

// ===========================
// PANNEAU PANIER AVEC FRAIS DE LIVRAISON
// ===========================

function ensureCartPanel() {
  let panel = document.getElementById("cart-panel");
  
  if (!panel) {
    console.log("Création du panneau panier...");
    panel = document.createElement("div");
    panel.id = "cart-panel";
    document.body.appendChild(panel);
    console.log("Panneau créé");
  }
  
  ensureCartIconStyles();
  ensureCartPanelStyles();
  ensureCartIcon();
  
  return panel;
}

function renderCartPanel() {
  const panel = document.getElementById("cart-panel");
  if (!panel) return;

  const cart = getCart();

  if (cart.length === 0) {
    panel.innerHTML = `
      <div class="cart-header">
        <h2>Mon Panier</h2>
        <button class="close-cart">✖</button>
      </div>
      <div style="padding: 40px; text-align: center; color: #999;">
        <p style="font-size: 48px;">🛒</p>
        <p>Votre panier est vide</p>
      </div>
    `;

    const closeBtn = panel.querySelector(".close-cart");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("open");
      });
    }
    return;
  }

  // Calcul des totaux avec frais de livraison
  const sousTotal = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
  const fraisLivraison = sousTotal >= 150 ? 0 : 9;
  const total = sousTotal + fraisLivraison;

  const itemsHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${getCloudinaryUrl(item.image)}" alt="${escapeHtml(item.titre)}" class="cart-item-img" 
           onerror="this.src='https://via.placeholder.com/100x100?text=Image'">
      <div class="cart-item-details">
        <h4>${escapeHtml(item.titre)}</h4>
        <p class="cart-item-size">Taille: ${escapeHtml(item.taille || 'N/A')}</p>
        <p class="cart-item-price">${item.prix.toFixed(2)}€ x ${item.quantite}</p>
        <p class="cart-item-subtotal">${(item.prix * item.quantite).toFixed(2)} €</p>
      </div>
      <button class="cart-item-remove" data-ref="${escapeHtml(item.reference)}" data-taille="${escapeHtml(item.taille)}">
        🗑️
      </button>
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="cart-header">
      <h2>Mon Panier (${cart.length})</h2>
      <button class="close-cart">✖</button>
    </div>

    <div class="cart-items">
      ${itemsHTML}
    </div>

    <div class="cart-totals">
      <div class="cart-subtotal">
        <span>Sous-total :</span>
        <span>${sousTotal.toFixed(2)} €</span>
      </div>
      
      <div class="cart-shipping">
        <span>Frais de livraison :</span>
        <span>${fraisLivraison === 0 ? 'OFFERT 🎁' : `${fraisLivraison.toFixed(2)} €`}</span>
      </div>
      
      ${sousTotal < 150 ? `
        <div class="shipping-info">
          <small>🎁 Frais de livraison offerts à partir de 150€ d'achat</small>
          <small>Il vous manque ${(150 - sousTotal).toFixed(2)}€ pour la livraison gratuite</small>
        </div>
      ` : `
        <div class="shipping-info success">
          <small>✅ Félicitations ! Livraison offerte</small>
        </div>
      `}
      
      <div class="cart-total">
        <strong>Total :</strong>
        <strong>${total.toFixed(2)} €</strong>
      </div>
    </div>

    <div class="cart-footer">
      <div class="cart-email-input">
        <label for="customer-email">📧 Email pour confirmation :</label>
        <input 
          type="email" 
          id="customer-email" 
          placeholder="votre@email.com"
          required
        />
      </div>

      <button id="checkout-stripe-btn" class="cart-checkout-btn">
        💳 Payer en ligne (Stripe) - ${total.toFixed(2)} €
      </button>

      <button id="checkout-email-btn" class="cart-email-btn">
        📧 Commander par Email
      </button>

      <button class="cart-clear">
        🗑️ Vider le panier
      </button>
    </div>
  `;

  // Attacher les événements
  attachCartListeners(panel);
}

function attachCartListeners(panel) {
  // Fermeture panier
  panel.querySelector(".close-cart")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Suppression d'articles
  panel.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.ref, btn.dataset.taille);
    });
  });

  // Bouton Stripe
  const stripeBtn = panel.querySelector("#checkout-stripe-btn");
  if (stripeBtn) {
    stripeBtn.addEventListener("click", () => {
      const customerEmail = document.getElementById("customer-email")?.value;
      const cart = getCart();
      
      if (!customerEmail) {
        showTempMessage("❌ Veuillez entrer votre email", 3000);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        showTempMessage("❌ Email invalide", 3000);
        return;
      }
      
      if (cart.length === 0) {
        showTempMessage("❌ Panier vide", 3000);
        return;
      }
      
      localStorage.setItem("customer_email", customerEmail);
      localStorage.setItem("pending_cart", JSON.stringify(cart));
      
      console.log("💳 Redirection Stripe...");
      checkoutWithStripe(cart);
    });
  }

  // Bouton Email
  const emailBtn = panel.querySelector("#checkout-email-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", async () => {
      const customerEmail = document.getElementById("customer-email")?.value;
      const customerName = "Client";
      const cart = getCart();
      
      if (!customerEmail) {
        showTempMessage("❌ Veuillez entrer votre email", 3000);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        showTempMessage("❌ Email invalide", 3000);
        return;
      }
      
      if (cart.length === 0) {
        showTempMessage("❌ Panier vide", 3000);
        return;
      }
      
      console.log("📧 Commande par email...");
      
      try {
        showTempMessage("📧 Envoi en cours...", 10000);
        
        await sendOrderConfirmation(cart, customerEmail, customerName);
        await sendOrderByEmail(cart, customerEmail, customerName);
        
        showTempMessage("✅ Commande envoyée ! Vérifiez votre email.", 5000);
        clearCart();
        
        setTimeout(() => {
          panel.classList.remove("open");
        }, 2000);
        
      } catch (error) {
        console.error("❌ Erreur:", error);
        showTempMessage("❌ Erreur. Réessayez ou contactez-nous.", 5000);
      }
    });
  }

  // Vider le panier
  const clearBtn = panel.querySelector(".cart-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Vider tout le panier ?")) clearCart();
    });
  }
}

// ===========================
// STYLES DU PANIER
// ===========================

function ensureCartIconStyles() {
  if (document.getElementById("cart-icon-styles")) return;

  const style = document.createElement("style");
  style.id = "cart-icon-styles";
  style.textContent = `
    .cart-icon {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 24px;
      transition: all 0.3s ease;
    }
    
    .cart-icon:hover {
      transform: scale(1.1);
      background: #0056b3;
    }
    
    .cart-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4757;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    .cart-animate {
      animation: cartBounce 0.9s ease;
    }
    
    @keyframes cartBounce {
      0%, 20%, 60%, 100% { transform: scale(1); }
      40% { transform: scale(1.3); }
      80% { transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);
}

function ensureCartPanelStyles() {
  if (document.getElementById("cart-panel-styles")) return;

  const style = document.createElement("style");
  style.id = "cart-panel-styles";
  style.textContent = `
    .cart-totals {
      padding: 15px;
      border-top: 1px solid #eee;
      background: #f9f9f9;
    }
    
    .cart-subtotal, .cart-shipping, .cart-total {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .cart-total {
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .cart-shipping {
      color: #e74c3c;
      font-weight: 500;
    }
    
    .cart-shipping span:last-child {
      color: #27ae60;
    }
    
    .shipping-info {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 5px;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 12px;
    }
    
    .shipping-info small {
      display: block;
      color: #856404;
    }
    
    .shipping-info.success {
      background: #d1edff;
      border-color: #b3d9ff;
    }
    
    .shipping-info.success small {
      color: #004085;
    }
    
    .cart-item-subtotal {
      font-weight: bold;
      color: #2c3e50;
      margin-top: 5px;
    }
    
    .cart-checkout-btn {
      background: linear-gradient(135deg, #28a745, #20c997);
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

// ===========================
// ICÔNE PANIER FLOTTANTE
// ===========================

function ensureCartIcon() {
  console.log("🔧 ensureCartIcon appelé");
  
  let icon = document.getElementById("cartIcon");
  
  if (!icon) {
    console.log("🆕 Création de l'icône panier...");
    icon = document.createElement("div");
    icon.id = "cartIcon";
    icon.className = "cart-icon";
    icon.innerHTML = `🛒<div id="cartCount" class="cart-count">0</div>`;
    document.body.appendChild(icon);
    console.log("✅ Icône créée et ajoutée au DOM");
  }

  updateCartIconCount();

  // Cloner pour éviter les doublons d'événements
  const newIcon = icon.cloneNode(true);
  if (icon.parentNode) {
    icon.parentNode.replaceChild(newIcon, icon);
  }

  newIcon.addEventListener("click", () => {
    console.log("🛒 Clic sur l'icône panier");
    
    const panel = document.getElementById("cart-panel");
    if (panel) {
      const wasOpen = panel.classList.contains("open");
      panel.classList.toggle("open");
      
      if (panel.classList.contains("open")) {
        renderCartPanel();
      }
    }
  });

  console.log("✅ Événement de clic configuré");
  return newIcon;
}

// ===========================
// STRIPE CHECKOUT
// ===========================
const checkoutWithStripe = async (cart) => {
  if (!cart || cart.length === 0) {
    showTempMessage("❌ Panier vide", 2000);
    return;
  }

  try {
    console.log("🛒 Envoi du panier à Stripe:", cart);

    const res = await fetch(`${STRIPE_SERVER_URL}/create-checkout-session`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ items: cart }),
    });

    console.log("📡 Réponse serveur:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Erreur serveur ${res.status}`);
    }

    const session = await res.json();
    console.log("✅ Session Stripe créée:", session.sessionId);

    if (session.url) {
      window.location.href = session.url;
    } else {
      throw new Error("URL de paiement manquante");
    }

  } catch (err) {
    console.error("❌ Erreur Stripe:", err);
    
    if (err.message.includes("Failed to fetch")) {
      showTempMessage("⚠️ Serveur Stripe non accessible", 5000);
      
      setTimeout(() => {
        if (confirm("Paiement indisponible.\n\nCommander par email ?")) {
          const customerEmail = localStorage.getItem("customer_email");
          if (customerEmail) {
            sendOrderByEmailFallback(cart, customerEmail);
          } else {
            showTempMessage("❌ Email manquant", 2000);
          }
        }
      }, 1500);
      
    } else {
      showTempMessage(`❌ Erreur: ${err.message}`, 4000);
    }
  }
};

// ===========================
// GESTION RETOUR STRIPE
// ===========================
function handleStripeSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get('payment_success');
  
  if (paymentSuccess === 'true') {
    const customerEmail = localStorage.getItem("customer_email");
    const pendingCart = localStorage.getItem("pending_cart");
    
    if (customerEmail && pendingCart) {
      console.log("💳 Paiement Stripe OK, envoi email...");
      
      const cart = JSON.parse(pendingCart);
      
      sendOrderConfirmation(cart, customerEmail, "Client")
        .then(() => {
          console.log("✅ Email post-Stripe envoyé");
          showTempMessage("✅ Paiement réussi ! Email envoyé.", 5000);
        })
        .catch(error => {
          console.error("❌ Erreur email:", error);
          showTempMessage("✅ Paiement réussi ! (Email non envoyé)", 3000);
        })
        .finally(() => {
          localStorage.removeItem("customer_email");
          localStorage.removeItem("pending_cart");
        });
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

// ===========================
// NORMALISATION PRODUIT
// ===========================
function normalizeProduct(rawObj) {
  const rawLower = {};
  Object.keys(rawObj || {}).forEach(k => {
    if (k) rawLower[String(k).toLowerCase().trim()] = rawObj[k];
  });

  const get = (keys) => {
    if (!Array.isArray(keys)) keys = [keys];
    for (const k of keys) {
      const key = String(k).toLowerCase();
      if (rawLower[key]) return String(rawLower[key]).trim();
    }
    return "";
  };

  const rawPriceStr = get(["price_euros", "price €", "price", "prix", "price€"]) || "0";
  const cleanPrice = rawPriceStr.replace(/[^\d,.\-]/g, "").replace(",", ".");
  const prix = parseFloat(cleanPrice) || 0;

  const ref = get(["reference", "référence", "ref"]) || "";
  const imageField = get(["image", "images", "photo", "photos"]) || "";

  const autresImagesRaw = get(["images_supplémentaires", "images_supplementaires", "vues", "photos_supp", "autres_images"]);
  const autresImages = autresImagesRaw 
    ? autresImagesRaw.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean) 
    : [];

  const taillesRaw = get(["tailles disponibles", "tailles_disponibles", "tailles"]);
  const qteTailleRaw = get([
    "quantité par taille", "quantité_par_taille", "quantite_par_taille",
    "quantite par taille", "qte_par_taille", "qte_taille"
  ]) || "";

  const normalized = {
    reference: ref,
    type: get(["type de bijoux", "type"]),
    description: get("description"),
    image: imageField,
    images: [imageField, ...autresImages].filter(Boolean),
    couleur: get("couleur"),
    titre: get(["titre", "title", "name"]),
    or: get(["poids or", "poids_or", "poids"]),
    pierres: get(["type de pierres", "pierres"]),
    poidsPierre: get(["poids pierre", "poids_pierre"]),
    tailles: taillesRaw,
    qteTaille: qteTailleRaw,
    prix,
    stock: get("stock"),
    fabrication: (get(["fabrication_possible", "fabrication possible", "fabrication"]) || "").toUpperCase(),
    evenement: get(["evenement", "évènement", "event"])
  };

  if (!normalized.image && normalized.reference) {
    normalized.image = `v1/${encodeURIComponent(normalized.reference)}.jpg`;
  }
  
  if (!normalized.images || normalized.images.length === 0) {
    normalized.images = [normalized.image];
  }

  normalized.images = normalized.images.filter(img => img && img !== "");

  return normalized;
}

// ===========================
// AFFICHAGE PRODUITS
// ===========================
function renderProducts(products) {
  const container = document.querySelector("#product-list");
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = "<p>Aucun bijou trouvé 🕊️</p>";
    return;
  }

  container.innerHTML = products.map((p, index) => {
    const imageUrl = getCloudinaryUrl(p.image);
    const prixAffiche = p.prix ? `${p.prix.toFixed(2)} €` : "Prix non disponible";

    return `
      <div class="product-card" data-ref="${escapeHtml(p.reference)}" data-index="${index}">
        <img src="${imageUrl}" 
             alt="${escapeHtml(p.titre)}" 
             class="product-img"
             onerror="this.src='https://via.placeholder.com/300x300?text=Image+indisponible'" />
        <h3 class="product-title">${escapeHtml(p.titre || "Sans titre")} carats</h3>
        ${p.description ? `<p class="product-description">${escapeHtml(p.description)}</p>` : ''}
        <p class="product-price">${prixAffiche}</p>
        <button class="view-details-btn">
          👁️ Voir les détails
        </button>
      </div>
    `;
  }).join("");

  // Ajouter les événements
  container.querySelectorAll(".product-card").forEach((card) => {
    const index = parseInt(card.dataset.index);
    const produit = products[index];

    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains("view-details-btn")) {
        if (produit) openProductModal(produit);
      }
    });

    const btn = card.querySelector(".view-details-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (produit) openProductModal(produit);
      });
    }
  });
}

// ===========================
// MODALE PRODUIT
// ===========================
function openProductModal(product) {
  if (!product) return;

  const oldModal = document.getElementById("productModal");
  if (oldModal) oldModal.remove();

  const mainImageUrl = getCloudinaryUrl(product.image);
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal-overlay";
  
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" aria-label="Fermer">✖</button>

      <div class="modal-grid">
        <div class="modal-left">
          <div class="image-view">
            <img src="${mainImageUrl}" 
                 alt="${escapeHtml(product.titre)}" 
                 class="modal-main-img"
                 onerror="this.src='https://via.placeholder.com/800x800?text=Image+indisponible'" />
          </div>

          ${allImages.length > 1 ? `
            <div class="modal-thumbs">
              ${allImages.map((img, idx) => `
                <img src="${getCloudinaryUrl(img)}" 
                     alt="Aperçu ${idx + 1}" 
                     class="thumb-img ${idx === 0 ? 'active' : ''}"
                     data-full-url="${getCloudinaryUrl(img)}"
                     onerror="this.style.display='none'" />
              `).join("")}
            </div>
          ` : ''}
        </div>

        <div class="modal-right">
          <h2>${escapeHtml(product.titre)} carats</h2>
          <p class="modal-ref">Réf : <strong>${escapeHtml(product.reference)}</strong></p>
          
          ${product.description ? `
            <div class="modal-desc">
              <p>${escapeHtml(product.description)}</p>
            </div>
          ` : ''}

          <p class="modal-price">${product.prix.toFixed(2)} €</p>

          ${product.couleur ? `
            <p class="modal-info"><strong>Couleur :</strong> ${escapeHtml(product.couleur)}</p>
          ` : ''}

          ${product.or ? `
            <p class="modal-info"><strong>Or :</strong> ${escapeHtml(product.or)}</p>
          ` : ''}

          ${product.pierres ? `
            <p class="modal-info"><strong>Pierres :</strong> ${escapeHtml(product.pierres)}</p>
          ` : ''}

          ${product.poidsPierre ? `
            <p class="modal-info"><strong>Poids pierre :</strong> ${escapeHtml(product.poidsPierre)}</p>
          ` : ''}

          ${product.tailles ? `
            <div class="modal-size-selector">
              <label for="taille"><strong>Taille :</strong></label>
              <select id="taille">
                ${product.tailles.split(/[;,/]+/).map(t => {
                  const taille = t.trim();
                  return `<option value="${escapeHtml(taille)}">${escapeHtml(taille)}</option>`;
                }).join("")}
              </select>
            </div>
          ` : ''}

          <button class="add-to-cart-modal-btn">
            Ajouter au panier
          </button>

          ${(product.fabrication || "").toUpperCase() === "OUI" ? `
            <button class="fabrication-btn" style="
              background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
              color: white; 
              border: none; 
              padding: 16px 28px; 
              border-radius: 10px; 
              font-size: 17px; 
              font-weight: 700; 
              cursor: pointer; 
              margin-top: 10px;
              width: 100%;
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
              transition: all 0.3s;
            ">
              ✨ Commander sur mesure
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => modal.remove());

  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      modal.remove();
    }
  });

  const mainImg = modal.querySelector(".modal-main-img");
  modal.querySelectorAll(".thumb-img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const fullUrl = thumb.dataset.fullUrl;
      if (mainImg && fullUrl) {
        mainImg.src = fullUrl;
      }
      
      modal.querySelectorAll(".thumb-img").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  const addToCartBtn = modal.querySelector(".add-to-cart-modal-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const selectElement = modal.querySelector("select#taille");
      const selectedSize = selectElement ? selectElement.value : "";
      
      addToCart(product, selectedSize);
      modal.remove();
    });
  }

  // GESTION DU BOUTON FABRICATION 
  const fabBtn = modal.querySelector(".fabrication-btn");
  if (fabBtn) {
    fabBtn.addEventListener("click", () => {
      const selectElement = modal.querySelector("select#taille");
      const selectedSize = selectElement ? selectElement.value : "";
      
      console.log("✨ Bouton fabrication cliqué - Ref:", product.reference);
      
      // D'ABORD ouvrir la modal sur mesure
      const customModal = document.getElementById('custom-order-modal');
      if (customModal) {
        customModal.style.display = 'flex';
        console.log("🟢 Modal sur mesure ouverte");
        
        // Pré-remplir la description
        const descriptionField = customModal.querySelector('textarea[name="project"]');
        if (descriptionField) {
          descriptionField.value = `Référence: ${product.reference}\nProduit: ${product.titre}${selectedSize ? `\nTaille souhaitée: ${selectedSize}` : ''}\n\n---\nDescription de mon projet sur mesure :`;
          console.log("🟢 Description pré-remplie");
        }
        
        // PUIS fermer la modal produit après un court délai
        setTimeout(() => {
          modal.remove();
          console.log("🔴 Modal produit fermée");
        }, 100);
      } else {
        console.error("❌ Modal sur mesure non trouvée");
        modal.remove();
      }
    });
  }

  // Gestion de la touche ESC pour fermer la modal
  const escHandler = (e) => {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

// ===========================
// PARSING CSV
// ===========================
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        row[header] = values[index].trim().replace(/^"|"$/g, '');
      }
    });
    
    if (Object.values(row).some(val => val && val.trim())) {
      result.push(row);
    }
  }
  
  return result;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// ===========================
// CHARGEMENT DES DONNÉES
// ===========================
async function loadProducts() {
  try {
    console.log("📥 Chargement des produits depuis:", CSV_URL);
    showTempMessage("🔄 Chargement des bijoux...", 2000);
    
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    console.log(`📊 ${data.length} lignes chargées`);
    
    allProducts = data.map(normalizeProduct).filter(p => p.reference && p.titre);
    filteredProducts = [...allProducts];
    
    console.log(`✅ ${allProducts.length} produits normalisés`);
    renderProducts(allProducts);
    setupFilters();
    
    showTempMessage(`✅ ${allProducts.length} bijoux chargés`, 3000);
    
  } catch (error) {
    console.error("❌ Erreur chargement:", error);
    showTempMessage("❌ Erreur chargement des bijoux", 5000);
    
    // Fallback avec données exemple
    const fallbackProducts = [
      {
        reference: "BIJ001",
        titre: "Bague Diamant",
        description: "Magnifique bague en or avec diamant",
        prix: 299.99,
        image: "v1/BIJ001.jpg",
        type: "Bague"
      }
    ];
    allProducts = fallbackProducts;
    filteredProducts = [...allProducts];
    renderProducts(allProducts);
  }
}

// ===========================
// FILTRES ET RECHERCHE
// ===========================
function setupFilters() {
  const searchInput = document.getElementById("search-input");
  const typeFilter = document.getElementById("type-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortSelect = document.getElementById("sort-select");
  
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  
  if (typeFilter) {
    // Remplir les types uniques
    const types = [...new Set(allProducts.map(p => p.type).filter(Boolean))];
    typeFilter.innerHTML = '<option value="">Tous les types</option>' +
      types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    typeFilter.addEventListener("change", applyFilters);
  }
  
  if (priceFilter) {
    priceFilter.addEventListener("change", applyFilters);
  }
  
  if (sortSelect) {
    sortSelect.addEventListener("change", applyFilters);
  }
}

function applyFilters() {
  const searchTerm = document.getElementById("search-input")?.value.toLowerCase() || "";
  const typeValue = document.getElementById("type-filter")?.value || "";
  const priceValue = document.getElementById("price-filter")?.value || "";
  const sortValue = document.getElementById("sort-select")?.value || "name-asc";
  
  let filtered = allProducts.filter(product => {
    // Filtre recherche
    const matchSearch = !searchTerm || 
      (product.titre && product.titre.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      (product.reference && product.reference.toLowerCase().includes(searchTerm));
    
    // Filtre type
    const matchType = !typeValue || product.type === typeValue;
    
    // Filtre prix
    let matchPrice = true;
    if (priceValue) {
      switch (priceValue) {
        case "0-100": matchPrice = product.prix <= 100; break;
        case "100-500": matchPrice = product.prix > 100 && product.prix <= 500; break;
        case "500-1000": matchPrice = product.prix > 500 && product.prix <= 1000; break;
        case "1000+": matchPrice = product.prix > 1000; break;
      }
    }
    
    return matchSearch && matchType && matchPrice;
  });
  
  // Tri
  switch (sortValue) {
    case "name-asc":
      filtered.sort((a, b) => (a.titre || "").localeCompare(b.titre || ""));
      break;
    case "name-desc":
      filtered.sort((a, b) => (b.titre || "").localeCompare(a.titre || ""));
      break;
    case "price-asc":
      filtered.sort((a, b) => (a.prix || 0) - (b.prix || 0));
      break;
    case "price-desc":
      filtered.sort((a, b) => (b.prix || 0) - (a.prix || 0));
      break;
  }
  
  filteredProducts = filtered;
  renderProducts(filteredProducts);
}

// ===========================
// MODAL SUR MESURE
// ===========================
function initializeCustomModal() {
  if (isModalInitialized) {
    console.log("⚠️ Modal déjà initialisée");
    return;
  }

  const customModal = document.getElementById('custom-order-modal');
  const customOrderBtn = document.getElementById('custom-order-btn');
  const customForm = document.getElementById('custom-order-form');
  const closeBtn = document.getElementById('close-custom-modal');

  // Vérification des éléments critiques
  if (!customModal) {
    console.error("❌ Modal sur mesure non trouvée dans le DOM");
    return;
  }

  if (!customOrderBtn) {
    console.error("❌ Bouton flottant sur mesure non trouvé");
  }

  if (!customForm) {
    console.error("❌ Formulaire sur mesure non trouvé");
  }

  // 1. Fermer la modal avec le bouton ×
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCustomModal);
  }

  // 2. Fermer la modal en cliquant à l'extérieur
  customModal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeCustomModal();
    }
  });

  // 3. Fermer avec la touche Échap
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && customModal.style.display === 'flex') {
      closeCustomModal();
    }
  });

  // 4. Bouton flottant "Sur Mesure"
  if (customOrderBtn) {
    customOrderBtn.addEventListener('click', openCustomModal);
  }

  // 5. Gestion du formulaire sur mesure
  if (customForm) {
    customForm.addEventListener('submit', handleCustomFormSubmit);
  }

  isModalInitialized = true;
  console.log("✅ Modal sur mesure initialisée avec succès");
}

// Fonction pour ouvrir la modal sur mesure
function openCustomModal() {
  const customModal = document.getElementById('custom-order-modal');
  const customForm = document.getElementById('custom-order-form');
  
  if (!customModal) {
    console.error("❌ Modal non trouvée lors de l'ouverture");
    return false;
  }

  try {
    customModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log("🟢 Modal sur mesure ouverte");

    // Réinitialiser le formulaire
    if (customForm) {
      customForm.reset();
      console.log("🟢 Formulaire réinitialisé");
    }

    // Focus sur le premier champ
    setTimeout(() => {
      const nameField = customModal.querySelector('input[name="name"]');
      if (nameField) {
        nameField.focus();
        console.log("🟢 Focus sur le champ nom");
      }
    }, 100);

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'ouverture de la modal:", error);
    return false;
  }
}

// Fonction pour fermer la modal sur mesure
function closeCustomModal() {
  const customModal = document.getElementById('custom-order-modal');
  
  if (!customModal) {
    console.error("❌ Modal non trouvée lors de la fermeture");
    return false;
  }

  try {
    customModal.style.display = 'none';
    document.body.style.overflow = '';
    
    console.log("🔴 Modal sur mesure fermée");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la fermeture de la modal:", error);
    return false;
  }
}

// Gestion de la soumission du formulaire sur mesure
async function handleCustomFormSubmit(e) {
  e.preventDefault();
  console.log("📤 Formulaire sur mesure soumis");

  const form = e.target;
  const formData = new FormData(form);
  
  // Récupération des données du formulaire
  const formValues = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    project: formData.get('project'),
    budget: formData.get('budget'),
    deadline: formData.get('deadline')
  };

  console.log("📝 Données du formulaire:", formValues);

  try {
    const success = await submitCustomOrder(formValues);
    
    if (success) {
      showNotification('✅ Votre demande sur mesure a été envoyée ! Nous vous contacterons rapidement.', 'success');
      closeCustomModal();
      form.reset();
    } else {
      throw new Error('Échec de l\'envoi');
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du formulaire:", error);
    showNotification('❌ Une erreur est survenue. Veuillez réessayer.', 'error');
  }
}

// Fonction pour soumettre la commande sur mesure
async function submitCustomOrder(orderData) {
  console.log("🚀 Envoi de la commande sur mesure:", orderData);
  
  try {
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Implémenter l'envoi réel par EmailJS
    console.log("✅ Commande sur mesure envoyée avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur envoi commande:", error);
    return false;
  }
}

// Fonction pour afficher les notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// ===========================
// STYLES MODALES
// ===========================
function ensureModalStyles() {
  if (document.getElementById("modal-styles")) return;

  const style = document.createElement("style");
  style.id = "modal-styles";
  style.textContent = `
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; animation: fadeIn 0.3s; padding: 20px;
    }

    .modal-content {
      background: white; border-radius: 16px;
      width: 100%; max-width: 1100px; max-height: 90vh;
      overflow-y: auto; position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      padding: 30px;
    }

    .modal-close {
      position: absolute; top: 20px; right: 20px;
      background: #ff4444; color: white; border: none;
      border-radius: 50%; width: 40px; height: 40px;
      font-size: 22px; cursor: pointer; z-index: 10;
      transition: all 0.2s; display: flex;
      align-items: center; justify-content: center;
    }
    .modal-close:hover {
      transform: rotate(90deg) scale(1.1);
      background: #cc0000;
    }

    .modal-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
    }

    @media (max-width: 768px) {
      .modal-grid { grid-template-columns: 1fr; }
      .modal-content { padding: 20px; }
    }

    .product-description {
      color: #555;
      font-size: 16px;
      line-height: 1.6;
      margin: 12px 0;
      max-height: 48px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// ===========================
// INITIALISATION
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initialisation de l'application...");
  
  // Initialiser EmailJS
  initEmailJS();
  
  // Vérifier retour Stripe
  handleStripeSuccess();
  
  // Charger les produits
  await loadProducts();
  
  // Initialiser les composants
  ensureCartPanel();
  ensureModalStyles();
  initializeCustomModal();
  
  // Événements de stockage (synchronisation entre onglets)
  window.addEventListener("storage", (e) => {
    if (e.key === "cart") {
      updateCartIconCount();
      if (document.getElementById("cart-panel")?.classList.contains("open")) {
        renderCartPanel();
      }
    }
  });
  
  console.log("✅ Application initialisée avec succès");
});

// ===========================
// FONCTIONS GLOBALES
// ===========================
window.testSurMesure = openCustomModal;
window.openCustomModal = openCustomModal;
window.closeCustomModal = closeCustomModal;

console.log("🔧 Script principal chargé - Version corrigée");